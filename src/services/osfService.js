/**
 * OSF (Open Science Framework) Service - Handles interactions with OSF API v2
 * Used for submitting preprints to AfricArXiv via OSF infrastructure.
 * 
 * OSF API Documentation: https://developer.osf.io/
 * AfricArXiv Provider ID: africarxiv
 */

const OSF_API_BASE = 'https://api.osf.io/v2';
const AFRICARXIV_PROVIDER_ID = 'africarxiv';

/**
 * Get authorization headers for OSF API requests
 * @param {string} token - OSF Personal Access Token
 * @returns {Object} Headers object
 */
const getHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/vnd.api+json',
});

/**
 * Fetch AfricArXiv subjects/disciplines from OSF API
 * @returns {Promise<Array>} Array of subject objects { id, text }
 */
export const fetchAfricArXivSubjects = async () => {
    try {
        const response = await fetch(
            `${OSF_API_BASE}/providers/preprints/${AFRICARXIV_PROVIDER_ID}/subjects/?page[size]=100`,
            { headers: { 'Content-Type': 'application/vnd.api+json' } }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch subjects: ${response.status}`);
        }

        const data = await response.json();
        return data.data.map(subject => ({
            id: subject.id,
            text: subject.attributes.text,
            parent: subject.attributes.parent,
        }));
    } catch (error) {
        console.error('Error fetching AfricArXiv subjects:', error);
        throw error;
    }
};

/**
 * Create an OSF project/node to hold the preprint files
 * @param {string} token - OSF Personal Access Token
 * @param {string} title - Project title
 * @returns {Promise<Object>} Created node data with id
 */
export const createOSFNode = async (token, title) => {
    const response = await fetch(`${OSF_API_BASE}/nodes/`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
            data: {
                type: 'nodes',
                attributes: {
                    title: title,
                    category: 'project',
                    public: true,
                },
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.detail || 'Failed to create OSF project');
    }

    const data = await response.json();
    return {
        id: data.data.id,
        uploadUrl: data.data.relationships.files.links.related.href,
    };
};

/**
 * Upload a file to OSF Storage on a given node
 * @param {string} token - OSF Personal Access Token
 * @param {string} nodeId - OSF Node ID
 * @param {File} file - File object to upload
 * @returns {Promise<Object>} Uploaded file data with id
 */
export const uploadFileToOSF = async (token, nodeId, file) => {
    // OSF uses Waterbutler for file uploads
    const uploadUrl = `https://files.osf.io/v1/resources/${nodeId}/providers/osfstorage/?kind=file&name=${encodeURIComponent(file.name)}`;

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Extract the file ID from the response
    const fileId = data.data?.id || data.id;
    return { id: fileId, name: file.name };
};

/**
 * Create a preprint on AfricArXiv via OSF API
 * @param {string} token - OSF Personal Access Token
 * @param {Object} params - Preprint parameters
 * @param {string} params.nodeId - OSF Node ID
 * @param {string} params.fileId - Uploaded file ID
 * @param {string} params.title - Preprint title
 * @param {string} params.abstract - Preprint abstract
 * @param {string[]} params.subjectIds - Array of subject/discipline IDs
 * @param {string} [params.doi] - Optional existing DOI
 * @param {string} [params.license] - License identifier
 * @param {string[]} [params.tags] - Optional tags/keywords
 * @returns {Promise<Object>} Created preprint data
 */
export const createAfricArXivPreprint = async (token, params) => {
    const {
        nodeId,
        fileId,
        title,
        abstract,
        subjectIds,
        doi,
        license = 'CC-BY-4.0',
        tags = [],
    } = params;

    const payload = {
        data: {
            type: 'preprints',
            attributes: {
                title,
                description: abstract,
                tags,
            },
            relationships: {
                node: { data: { type: 'nodes', id: nodeId } },
                primary_file: { data: { type: 'files', id: fileId } },
                provider: { data: { type: 'preprint_providers', id: AFRICARXIV_PROVIDER_ID } },
                subjects: {
                    data: subjectIds.map(id => ({ type: 'subjects', id })),
                },
            },
        },
    };

    // Add DOI if provided
    if (doi) {
        payload.data.attributes.doi = doi;
    }

    const response = await fetch(`${OSF_API_BASE}/preprints/`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errors?.map(e => e.detail).join('; ') || 'Failed to create preprint';
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
        id: data.data.id,
        title: data.data.attributes.title,
        status: data.data.attributes.reviews_state || 'pending',
        url: data.data.links?.html || `https://osf.io/preprints/africarxiv/${data.data.id}`,
    };
};

/**
 * Full submission workflow: create node → upload file → create preprint
 * @param {string} token - OSF Personal Access Token
 * @param {Object} formData - Submission form data
 * @param {Function} onProgress - Progress callback (stage, message)
 * @returns {Promise<Object>} Submission result
 */
export const submitToAfricArXiv = async (token, formData, onProgress) => {
    try {
        // Step 1: Create OSF project node
        onProgress?.('node', 'Creating OSF project...');
        const node = await createOSFNode(token, formData.title);

        // Step 2: Upload manuscript file
        onProgress?.('upload', 'Uploading manuscript file...');
        const file = await uploadFileToOSF(token, node.id, formData.manuscript);

        // Step 3: Create the preprint record
        onProgress?.('preprint', 'Submitting preprint to AfricArXiv...');
        const preprint = await createAfricArXivPreprint(token, {
            nodeId: node.id,
            fileId: file.id,
            title: formData.title,
            abstract: formData.abstract,
            subjectIds: formData.subjectIds || [],
            doi: formData.doi,
            license: formData.license,
            tags: formData.keywords
                ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
                : [],
        });

        onProgress?.('complete', 'Submission successful!');
        return {
            success: true,
            preprint,
            nodeId: node.id,
        };
    } catch (error) {
        console.error('AfricArXiv submission failed:', error);
        throw error;
    }
};
