import { NextResponse } from 'next/server';

const OSF_API_BASE = 'https://api.osf.io/v2';
const AFRICARXIV_PROVIDER_ID = 'africarxiv';

function getHeaders(token) {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/vnd.api+json',
    };
}

/**
 * POST /api/publications/submit-africarxiv
 * 
 * Handles the full AfricArXiv submission workflow via OSF API:
 * 1. Create an OSF project node
 * 2. Upload the manuscript file
 * 3. Create the preprint record targeting AfricArXiv
 * 
 * Expects multipart/form-data with:
 * - manuscript (File)
 * - title (string)
 * - abstract (string)
 * - subject (string)
 * - keywords (string, comma-separated)
 * - license (string)
 * - doi (string, optional)
 * - articleType (string)
 */
export async function POST(request) {
    try {
        console.log('=== AfricArXiv Submission Started ===');
        
        const token = process.env.OSF_TOKEN;
        if (!token) {
            console.error('OSF_TOKEN not found in environment');
            return NextResponse.json(
                { success: false, error: 'OSF API token is not configured on the server.' },
                { status: 500 }
            );
        }

        console.log('Token found, parsing form data...');
        const formData = await request.formData();
        const manuscript = formData.get('manuscript');
        const title = formData.get('title');
        const abstract = formData.get('abstract');
        const subject = formData.get('subject');
        const keywords = formData.get('keywords');
        const license = formData.get('license') || 'CC-BY-4.0';
        const doi = formData.get('doi');
        const articleType = formData.get('articleType');

        console.log('Form data parsed:', { 
            title, 
            hasManuscript: !!manuscript, 
            manuscriptName: manuscript?.name,
            subject, 
            keywords 
        });

        // Validate required fields
        if (!title || !abstract || !manuscript) {
            console.error('Validation failed: missing required fields');
            return NextResponse.json(
                { success: false, error: 'Title, abstract, and manuscript file are required.' },
                { status: 400 }
            );
        }

        // Step 1: Create OSF project node
        console.log('Step 1: Creating OSF node...');
        const nodeResponse = await fetch(`${OSF_API_BASE}/nodes/`, {
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
        console.log('Node response status:', nodeResponse.status);

        if (!nodeResponse.ok) {
            const nodeError = await nodeResponse.json();
            const detail = nodeError.errors?.[0]?.detail || 'Failed to create OSF project';
            console.error('OSF Node Creation Error:', {
                status: nodeResponse.status,
                statusText: nodeResponse.statusText,
                error: nodeError,
            });
            return NextResponse.json(
                { success: false, error: `OSF project creation failed: ${detail}`, step: 'node', details: nodeError },
                { status: 502 }
            );
        }

        const nodeData = await nodeResponse.json();
        const nodeId = nodeData.data.id;
        console.log('Node created successfully:', nodeId);

        // Wait a moment for OSF to propagate the node
        console.log('Waiting for OSF node propagation...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify node exists before uploading
        console.log('Verifying node accessibility...');
        const verifyResponse = await fetch(`${OSF_API_BASE}/nodes/${nodeId}/`, {
            headers: getHeaders(token),
        });
        
        if (!verifyResponse.ok) {
            console.error('Node verification failed:', verifyResponse.status);
            return NextResponse.json(
                { success: false, error: 'Node created but not accessible yet. Please try again in a moment.', step: 'verify' },
                { status: 502 }
            );
        }
        console.log('Node verified and accessible');

        // Step 2: Upload manuscript file to OSF Storage via Waterbutler
        console.log('Step 2: Uploading manuscript file...');
        const fileBuffer = Buffer.from(await manuscript.arrayBuffer());
        const fileName = manuscript.name || 'manuscript.pdf';
        console.log('File buffer size:', fileBuffer.length, 'bytes');

        const uploadUrl = `https://files.osf.io/v1/resources/${nodeId}/providers/osfstorage/?kind=file&name=${encodeURIComponent(fileName)}`;

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': manuscript.type || 'application/octet-stream',
            },
            body: fileBuffer,
        });
        console.log('Upload response status:', uploadResponse.status);

        if (!uploadResponse.ok) {
            const uploadText = await uploadResponse.text();
            console.error('File upload failed:', uploadText);
            return NextResponse.json(
                { success: false, error: `File upload failed: ${uploadText}`, step: 'upload' },
                { status: 502 }
            );
        }

        const uploadData = await uploadResponse.json();
        const fileId = uploadData.data?.id;
        console.log('File uploaded successfully:', fileId);

        if (!fileId) {
            console.error('File ID not found in upload response');
            return NextResponse.json(
                { success: false, error: 'File uploaded but could not retrieve file ID.', step: 'upload' },
                { status: 502 }
            );
        }

        // Step 3: Create the preprint record on AfricArXiv
        console.log('Step 3: Creating preprint record...');
        const tags = keywords
            ? keywords.split(',').map(k => k.trim()).filter(Boolean)
            : [];
        console.log('Tags:', tags);

        const preprintPayload = {
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
                },
            },
        };

        // Add subject if provided
        if (subject) {
            preprintPayload.data.relationships.subjects = {
                data: [{ type: 'subjects', id: subject }],
            };
        }

        // Add DOI if provided
        if (doi) {
            preprintPayload.data.attributes.doi = doi;
        }

        console.log('Preprint payload prepared, submitting to OSF...');
        const preprintResponse = await fetch(`${OSF_API_BASE}/preprints/`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(preprintPayload),
        });
        console.log('Preprint response status:', preprintResponse.status);

        if (!preprintResponse.ok) {
            const preprintError = await preprintResponse.json();
            console.error('Preprint creation error:', {
                status: preprintResponse.status,
                statusText: preprintResponse.statusText,
                errors: preprintError.errors,
            });
            const errorMessages = preprintError.errors?.map(e => e.detail).join('; ') || 'Failed to create preprint';
            
            // Handle 409 Conflict specifically
            if (preprintResponse.status === 409) {
                // Check if it's the "AfricArXiv doesn't allow new submissions" error
                const isSubmissionDisabled = preprintError.errors?.some(e => 
                    e.detail?.includes("doesn't allow new submissions")
                );
                
                if (isSubmissionDisabled) {
                    return NextResponse.json(
                        { 
                            success: false, 
                            error: `AfricArXiv has temporarily disabled new submissions through the API. Your manuscript has been uploaded to OSF (Node ID: ${nodeId}). You can complete the submission manually at https://osf.io/${nodeId}/ by clicking "Create Preprint" and selecting AfricArXiv as the provider.`, 
                            step: 'preprint',
                            nodeId,
                            nodeUrl: `https://osf.io/${nodeId}/`,
                            details: preprintError 
                        },
                        { status: 502 }
                    );
                }
                
                return NextResponse.json(
                    { 
                        success: false, 
                        error: `Conflict: ${errorMessages}. This node may already have a preprint associated with it.`, 
                        step: 'preprint',
                        details: preprintError 
                    },
                    { status: 502 }
                );
            }
            
            return NextResponse.json(
                { success: false, error: `Preprint creation failed: ${errorMessages}`, step: 'preprint', details: preprintError },
                { status: 502 }
            );
        }

        const preprintData = await preprintResponse.json();
        console.log('Preprint created successfully:', preprintData.data?.id);
        
        try {
            const attrs = preprintData.data?.attributes || {};
            const links = preprintData.data?.links || {};
            const preprintId = preprintData.data?.id;

            return NextResponse.json({
                success: true,
                preprint: {
                    id: preprintId,
                    title: attrs.title || title,
                    description: attrs.description || abstract,
                    dateCreated: attrs.date_created || null,
                    dateModified: attrs.date_modified || null,
                    datePublished: attrs.date_published || null,
                    originalPublicationDate: attrs.original_publication_date || null,
                    isPublished: attrs.is_published || false,
                    isPreprintOrphan: attrs.is_preprint_orphan || false,
                    licenseRecord: attrs.license_record || null,
                    reviewsState: attrs.reviews_state || null,
                    dateLastTransitioned: attrs.date_last_transitioned || null,
                    hasCoI: attrs.has_coi || false,
                    conflictOfInterestStatement: attrs.conflict_of_interest_statement || null,
                    hasDoi: attrs.has_doi || false,
                    articleDoi: attrs.article_doi || null,
                    preprintDoiCreated: attrs.preprint_doi_created || null,
                    status: attrs.reviews_state || 'pending',
                    url: links.html || `https://osf.io/preprints/africarxiv/${preprintId}`,
                    preprintDoiUrl: links.preprint_doi || null,
                    downloadUrl: links.download || null,
                },
                nodeId,
                rawResponse: preprintData.data,
            });
        } catch (parseError) {
            console.error('Error parsing preprint response:', parseError);
            return NextResponse.json({
                success: true,
                preprint: {
                    id: preprintData.data?.id,
                    title: title,
                    status: 'pending',
                    url: `https://osf.io/preprints/africarxiv/${preprintData.data?.id}`,
                },
                nodeId,
            });
        }
    } catch (error) {
        console.error('AfricArXiv submission error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error', stack: error.stack },
            { status: 500 }
        );
    }
}
