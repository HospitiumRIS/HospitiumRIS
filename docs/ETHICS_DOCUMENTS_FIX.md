# Ethics Application Documents Display - Fix Documentation

## Issue

Documents uploaded during ethics application creation were not being displayed on the view page (`/researcher/ethics/applications/view/[id]`). The page showed "No documents uploaded yet" even though files were selected during the form submission.

---

## Root Cause

The issue had two parts:

### 1. **File Object Serialization**
   - The `FileUploadZone` component stores JavaScript `File` objects in state
   - `File` objects cannot be serialized to JSON for API transmission
   - When the form tried to send `File` objects to the API, they were lost

### 2. **Document Structure Mismatch**
   - The form stored documents in separate arrays:
     - `participantInfoSheet`
     - `consentForm`
     - `researchProtocol`
     - `recruitmentMaterials`
     - `dataCollectionTools`
     - `lettersOfSupport`
     - `investigatorCVs`
   - The API expected a single `documents` array
   - The create route wasn't consolidating these separate arrays

---

## Solution Implemented

### 1. **File Metadata Conversion** (`create/page.js`)

Added helper functions to convert `File` objects to serializable metadata:

```javascript
const convertFilesToMetadata = (files) => {
  return files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    uploadedAt: new Date().toISOString(),
    url: null,  // Placeholder for future file storage
    path: null  // Placeholder for future file storage
  }));
};

const prepareFormDataForSubmission = () => {
  return {
    ...formData,
    participantInfoSheet: convertFilesToMetadata(formData.participantInfoSheet),
    consentForm: convertFilesToMetadata(formData.consentForm),
    researchProtocol: convertFilesToMetadata(formData.researchProtocol),
    recruitmentMaterials: convertFilesToMetadata(formData.recruitmentMaterials),
    dataCollectionTools: convertFilesToMetadata(formData.dataCollectionTools),
    lettersOfSupport: convertFilesToMetadata(formData.lettersOfSupport),
    investigatorCVs: convertFilesToMetadata(formData.investigatorCVs),
    userId: user?.id
  };
};
```

### 2. **Document Consolidation** (`api/ethics/applications/route.js`)

Updated the create route to consolidate all document arrays into a single `documents` array with type labels:

```javascript
documents: [
  ...(data.participantInfoSheet || []).map(file => ({ ...file, type: 'Participant Information Sheet' })),
  ...(data.consentForm || []).map(file => ({ ...file, type: 'Consent Form' })),
  ...(data.researchProtocol || []).map(file => ({ ...file, type: 'Research Protocol' })),
  ...(data.recruitmentMaterials || []).map(file => ({ ...file, type: 'Recruitment Materials' })),
  ...(data.dataCollectionTools || []).map(file => ({ ...file, type: 'Data Collection Tools' })),
  ...(data.lettersOfSupport || []).map(file => ({ ...file, type: 'Letters of Support' })),
  ...(data.investigatorCVs || []).map(file => ({ ...file, type: 'Investigator CVs' })),
]
```

### 3. **Download Button Enhancement** (`view/[id]/page.js`)

Updated the download button to handle missing file URLs gracefully:

```javascript
secondaryAction={
  doc.url || doc.path ? (
    <IconButton
      edge="end"
      onClick={() => window.open(doc.url || doc.path, '_blank')}
      sx={{ color: '#8b6cbc' }}
    >
      <DownloadIcon />
    </IconButton>
  ) : (
    <Tooltip title="File storage not yet implemented">
      <IconButton
        edge="end"
        disabled
        sx={{ color: '#999' }}
      >
        <DownloadIcon />
      </IconButton>
    </Tooltip>
  )
}
```

---

## Current Status

### ✅ **What Works Now:**

1. **Document Metadata Display**
   - All uploaded documents now appear in the Documents tab
   - Shows document name, type, size, and upload date
   - Properly categorized by document type (Participant Info Sheet, Consent Form, etc.)

2. **Document List UI**
   - Clean, organized list with file icons
   - Type badges for easy identification
   - File size display
   - Upload timestamp

3. **Data Persistence**
   - Document metadata is saved to the database
   - Retrieved correctly when viewing the application
   - Survives page refreshes and navigation

### ⚠️ **What Still Needs Implementation:**

1. **Actual File Storage**
   - Files are not actually uploaded to a storage service
   - Only metadata (name, size, type) is stored
   - `url` and `path` fields are currently `null`

2. **File Download**
   - Download button is disabled (no file URL available)
   - Shows tooltip: "File storage not yet implemented"

3. **File Preview**
   - No preview functionality for PDFs or images
   - No inline viewing of documents

---

## Next Steps for Full Implementation

### Phase 1: File Storage Service

Choose and implement a file storage solution:

**Option A: AWS S3**
```javascript
// Install AWS SDK
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

// Upload implementation
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const uploadToS3 = async (file) => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const key = `ethics-documents/${Date.now()}-${file.name}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: file.type
  }));
  
  return {
    url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
    key: key
  };
};
```

**Option B: Local File System** (Development only)
```javascript
// Create uploads directory
const uploadDir = path.join(process.cwd(), 'uploads', 'ethics');

// Save file
const filePath = path.join(uploadDir, `${Date.now()}-${file.name}`);
await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

return {
  path: filePath,
  url: `/uploads/ethics/${Date.now()}-${file.name}`
};
```

**Option C: Cloudinary**
```javascript
// Install Cloudinary SDK
npm install cloudinary

// Upload implementation
import { v2 as cloudinary } from 'cloudinary';

const uploadToCloudinary = async (file) => {
  const result = await cloudinary.uploader.upload(file, {
    folder: 'ethics-documents',
    resource_type: 'auto'
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id
  };
};
```

### Phase 2: Update File Upload Flow

1. **Create Upload API Endpoint**
   ```
   POST /api/ethics/applications/upload
   ```

2. **Update FileUploadZone Component**
   - Add upload progress indicator
   - Upload files immediately when selected
   - Store returned URLs in form state
   - Show upload success/failure feedback

3. **Update Form Submission**
   - Remove file conversion (files already uploaded)
   - Send file URLs instead of metadata
   - Handle upload errors gracefully

### Phase 3: Download & Preview

1. **Implement Secure Downloads**
   - Generate signed URLs for private files
   - Add download tracking/logging
   - Implement access control

2. **Add File Preview**
   - PDF viewer for protocols and forms
   - Image preview for recruitment materials
   - Document viewer modal

### Phase 4: File Management

1. **File Deletion**
   - Remove files from storage when application deleted
   - Clean up orphaned files

2. **File Versioning**
   - Track document revisions
   - Allow replacing documents
   - Maintain audit trail

3. **File Validation**
   - Virus scanning
   - File type verification
   - Size limits enforcement

---

## Testing the Current Implementation

### 1. Create a New Ethics Application

1. Navigate to: `http://localhost:3000/researcher/ethics/applications/create`
2. Fill out all required fields
3. In Step 7 (Documentation), upload files for each category
4. Submit the application

### 2. View the Application

1. Navigate to the applications list
2. Click on the newly created application
3. Go to the "Documents" tab
4. **Expected Result:** All uploaded documents should now be listed with:
   - Document name
   - Document type badge
   - File size
   - Upload timestamp
   - Disabled download button (with tooltip)

### 3. Verify Database

Check the database to see the stored document metadata:

```sql
SELECT id, title, documents 
FROM "EthicsApplication" 
WHERE id = 'your-application-id';
```

The `documents` field should contain a JSON array like:

```json
[
  {
    "name": "consent-form.pdf",
    "size": 245760,
    "type": "application/pdf",
    "lastModified": 1704672000000,
    "uploadedAt": "2026-05-04T16:10:00.000Z",
    "url": null,
    "path": null,
    "type": "Consent Form"
  },
  {
    "name": "participant-info.docx",
    "size": 123456,
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "lastModified": 1704672000000,
    "uploadedAt": "2026-05-04T16:10:00.000Z",
    "url": null,
    "path": null,
    "type": "Participant Information Sheet"
  }
]
```

---

## Files Modified

1. **`src/app/researcher/ethics/applications/create/page.js`**
   - Added `convertFilesToMetadata()` function
   - Added `prepareFormDataForSubmission()` function
   - Updated `handleSaveDraft()` to use metadata conversion
   - Updated `handleSubmit()` to use metadata conversion

2. **`src/app/api/ethics/applications/route.js`**
   - Updated `documents` field creation to consolidate all document arrays
   - Added type labels to each document

3. **`src/app/researcher/ethics/applications/view/[id]/page.js`**
   - Updated download button to handle missing URLs
   - Added tooltip for disabled download button

4. **`docs/ETHICS_DOCUMENTS_FIX.md`** (New)
   - This documentation file

---

## Important Notes

### Security Considerations

When implementing actual file storage:

1. **Access Control**
   - Only authorized users should access documents
   - Implement role-based permissions
   - Use signed URLs for downloads

2. **File Validation**
   - Validate file types on server-side
   - Scan for malware/viruses
   - Enforce size limits

3. **Data Privacy**
   - Encrypt files at rest
   - Use HTTPS for all transfers
   - Comply with GDPR/HIPAA requirements

4. **Audit Trail**
   - Log all file access
   - Track who uploaded/downloaded files
   - Maintain version history

### Performance Considerations

1. **Large Files**
   - Implement chunked uploads for files > 10MB
   - Show upload progress
   - Handle network interruptions

2. **Storage Costs**
   - Monitor storage usage
   - Implement file retention policies
   - Archive old applications

3. **CDN Integration**
   - Use CDN for faster downloads
   - Cache frequently accessed files
   - Optimize file delivery

---

## Conclusion

The immediate issue of documents not displaying has been resolved. Users can now see the list of uploaded documents with their metadata. However, actual file storage and download functionality requires additional implementation as outlined in the "Next Steps" section above.

For production use, you must implement one of the file storage solutions described in Phase 1 before deploying this feature.
