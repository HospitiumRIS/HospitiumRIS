# ImaChek API Documentation

Welcome to the ImaChek API documentation. ImaChek is an automated image integrity detection system designed to identify manipulated and duplicated images in scientific publications.

## Base URL

```
{api_url}
```

### Regional Endpoints

The ImaChek API is available in multiple regions. Use the appropriate base URL for your region to ensure optimal performance.

All requests require the header:

```
X-API-Key: {api_key}
```

---

## API Usage Workflow

Follow this recommended workflow to effectively use the ImaChek API for image integrity analysis.

### Typical User Journey

This section outlines the standard workflow for analyzing scientific images using the ImaChek API. Whether you're analyzing a single paper or conducting cross-paper comparisons, this guide will help you navigate the API endpoints efficiently.

### Step 1: Upload Files for Analysis

Start by uploading your files (images, PDF, or ZIP) using the Upload File endpoint. Upon successful upload, you'll receive a `case_id` which is essential for all subsequent operations.

**Example**

```
POST /v1/external/analysis
→ Response: { "case_id": "a422d8ac59ce456b83d7f46e0e458179" }
```

### Step 2: Monitor Analysis Status

Use the `case_id` to check the analysis progress via the Get Analysis Status endpoint. The analysis runs automatically after upload, and you can poll this endpoint to track completion.

**Example**

```
GET /v1/external/analysis/{case_id}
→ Check: case_analysis_status ("completed" or "processing")
→ Check: case_analysis_progress (0-100)
```

### Step 3: Retrieve Detailed Analysis Results

Once the analysis is complete (`case_analysis_status` = `"completed"`), retrieve comprehensive case information using the Get Single Case Info endpoint. This provides detailed results including manipulation counts, similarity detections, and image classifications.

**Example**

```
GET /v1/external/case/{case_id}
→ Returns: Full analysis results, timestamps, and metadata
```

### Step 4: Generate Visual Report

Create a shareable, web-based visualization of the analysis results using the Generate Analysis Report endpoint. The report URL is temporary (5-minute TTL) and perfect for sharing with stakeholders.

**Example**

```
POST /v1/external/report/{case_id}
→ Response: { "report_url": "https://..." }
→ Note: URL expires in 300 seconds
```

### Step 5: Cross-Case Analysis (Optional)

For advanced investigations, you can compare multiple cases to identify image reuse across different papers or by the same author:

1. **List Your Cases:** Use Get Case Lists to view all uploaded cases and identify suspicious ones.
2. **Compare Cases:** Select up to 10 cases and run a Case Compare Analysis to detect shared images across multiple papers.

**Example**

```
GET /v1/external/case/lists
→ Review cases and select suspicious ones

POST /v1/external/analysis/{case_id}
→ Body: { "case": ["case_id_1", "case_id_2", ...] }
→ Performs cross-comparison analysis
```

### Best Practices

- **Polling Interval:** When checking analysis status, poll every 5–10 seconds to avoid excessive API calls.
- **Report Generation:** Generate reports only when needed, as they have a short TTL and consume resources.
- **Case Management:** Use meaningful `title` and `contributor` values during upload to easily identify cases later.
- **Batch Analysis:** For multiple papers, upload all files first, then monitor their status collectively.

---

## Endpoints

### Upload File

Upload a file for processing.

`POST /v1/external/analysis`

**Content-Type:** `multipart/form-data`

#### Process Overview

This endpoint initiates the image integrity analysis process. The workflow is as follows:

1. **Upload:** You upload files (images, PDF, or ZIP).
2. **Validation:** The system validates file formats and sizes.
3. **Processing:** Upon success, a new "Case" is created, and analysis starts immediately.
4. **Tracking:** The response returns a `case_id`. Use this ID to check status or retrieve reports.

#### Headers

| Header     | Value       | Description    |
| ---------- | ----------- | -------------- |
| `X-API-Key` | `{api_key}` | Your API Key. |

#### Request Body

| Parameter      | Type   | Description                                                                                                                                 |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`        | string | Title of the analysis. Used for identification in the dashboard.                                                                            |
| `contributor`  | string | Name of the contributor. Useful for organizing cases.                                                                                       |
| `file[]`       | file   | File(s) to upload. Supported types: Images (JPG, PNG, TIFF, etc.), PDF, ZIP.                                                                |
| `repository[]` | string | Optional. Set to `global` to compare against the global repository. Leave empty to skip comparison.                                         |

**Upload Rules:**

- **Images:** Can upload single or multiple image files.
- **PDF:** Only one PDF file per upload.
- **ZIP:** Only one ZIP file per upload.
- **Important:** Cannot mix different file types in a single upload.
- Each file must be less than 25MB.

#### Example Request

```bash
# Example 1: Upload multiple images
curl --location '{api_url}/v1/external/analysis' \
  --header 'X-API-Key: YOUR_API_KEY' \
  --form 'title="Cell Growth Analysis"' \
  --form 'contributor="Dr. Smith"' \
  --form 'file[]=@"/path/to/image1.png"' \
  --form 'file[]=@"/path/to/image2.png"' \
  --form 'file[]=@"/path/to/image3.png"' \
  --form 'repository[]="global"'

# Example 2: Upload single PDF
curl --location '{api_url}/v1/external/analysis' \
  --header 'X-API-Key: YOUR_API_KEY' \
  --form 'title="Research Paper Review"' \
  --form 'contributor="Jane Doe"' \
  --form 'file[]=@"/path/to/document.pdf"' \
  --form 'repository[]="global"'

# Example 3: Upload single ZIP
curl --location '{api_url}/v1/external/analysis' \
  --header 'X-API-Key: YOUR_API_KEY' \
  --form 'title="Image Archive"' \
  --form 'contributor="John Smith"' \
  --form 'file[]=@"/path/to/images.zip"' \
  --form 'repository[]="global"'
```

#### Response Example

**201 Created**

```json
{
  "status": "success",
  "message": "Analysis started",
  "record": {
    "case_id": "a422d8ac59ce456b83d7f46e0e458179",
    "analysis_status": true
  }
}
```

---

### Case Compare Analysis

Run a comparison analysis between cases.

`POST /v1/external/analysis/{external_case_id}`

**Content-Type:** `application/json`

#### Use Case

This endpoint is designed for cross-comparison analysis. It is particularly useful when investigating a batch of suspicious literature. Common scenarios include:

- **Same Author Analysis:** Checking for image reuse across multiple articles by the same author.
- **Cross-Paper Analysis:** Identifying shared image assets across multiple papers suspected to have similar images.

#### Headers

| Header     | Value       | Description    |
| ---------- | ----------- | -------------- |
| `X-API-Key` | `{api_key}` | Your API Key. |

#### Request Body

| Parameter    | Type           | Description                                                                  |
| ------------ | -------------- | ---------------------------------------------------------------------------- |
| `repository` | array[string]  | Target repository. Example: `["global"]`.                                    |
| `case`       | array[string]  | List of case IDs to compare against. Maximum 10 cases can be compared at once. |

#### Example Request

```bash
curl --location '{api_url}/v1/external/analysis/6b9222a0797394209b6cc04e4e80bc10' \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: YOUR_API_KEY' \
  --data '{
    "repository": ["global"],
    "case": [
      "33cc8e1f0d21d9258b81e2373d2654cd",
      "4b0762cc5d7f4d3799c31e1f07928058",
      "4e3d76d35985a09d0579a21d3a376970",
      "6b9222a0797394209b6cc04e4e80bc10"
    ]
  }'
```

#### Response Example

**201 Created**

```json
{
  "status": "success",
  "message": "Analysis started",
  "data": {
    "case_id": "6b9222a0797394209b6cc04e4e80bc10",
    "analysis_status": true,
    "compare_case_id": [
      "33cc8e1f0d21d9258b81e2373d2654cd",
      "4b0762cc5d7f4d3799c31e1f07928058",
      "4e3d76d35985a09d0579a21d3a376970",
      "6b9222a0797394209b6cc04e4e80bc10"
    ]
  }
}
```

---

### Get Case Lists

Retrieve a list of all cases.

`GET /v1/external/case/lists`

#### Data Inspection

This endpoint provides a comprehensive list of all your cases, allowing for effective data inspection and management. Key metadata such as `title` and `contributor` are included to help you quickly identify and organize your analysis records.

#### Headers

| Header     | Value       | Description    |
| ---------- | ----------- | -------------- |
| `X-API-Key` | `{api_key}` | Your API Key. |

#### Query Parameters

| Parameter            | Type    | Description                                                                                                                                 |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `start_date`         | string  | Optional. Filter cases created after this date. Format: `YYYY-MM-DD` (e.g., `"2025-01-01"`).                                                |
| `end_date`           | string  | Optional. Filter cases created before this date. Format: `YYYY-MM-DD` (e.g., `"2025-12-30"`).                                               |
| `rows`               | integer | Optional. Number of items to return per page. Use this for pagination to limit the number of results returned in a single request.          |
| `last_evaluated_key` | string  | Optional. Token for retrieving the next page of results. Use the value returned in the previous response's `last_evaluated_key` field.      |

#### Example Request

```bash
# Without filters
curl --location '{api_url}/v1/external/case/lists' \
  --header 'X-API-Key: YOUR_API_KEY'

# With date filters
curl --location '{api_url}/v1/external/case/lists?start_date=2025-01-01&end_date=2025-12-30' \
  --header 'X-API-Key: YOUR_API_KEY'

# With pagination (2 items per page)
curl --location '{api_url}/v1/external/case/lists?rows=2' \
  --header 'X-API-Key: YOUR_API_KEY'

# Get next page using last_evaluated_key
curl --location '{api_url}/v1/external/case/lists?rows=2&last_evaluated_key=eyJNa3Y1cC...' \
  --header 'X-API-Key: YOUR_API_KEY'
```

#### Response Example

**Response without pagination (all results)** — **200 OK**

```json
{
  "status": "success",
  "count": 4,
  "data": [
    {
      "created_at": "2025-11-28T08:46:10.195234",
      "case_processed_at": "2025-11-28T08:46:23.035067",
      "case_status": "processed",
      "case_id": "a3f8d9e2b7c4a1d5e9f3b8c2d7e4a1f6",
      "case_format": "jpg",
      "case_title": "Future Assurance Producer",
      "case_contributor": "Marvin, Berge"
    },
    {
      "created_at": "2025-11-28T08:03:06.422471",
      "case_processed_at": "2025-11-28T08:03:19.936005",
      "case_status": "processed",
      "case_id": "b2e7c9f3d8a5e1f4b9c6d3e8a2f7b5c9",
      "case_format": "jpg",
      "case_title": "Investor Branding Administrator",
      "case_contributor": "Celia, Bartoletti"
    },
    {
      "created_at": "2025-11-28T03:45:23.190883",
      "case_processed_at": "2025-11-28T03:45:36.142946",
      "case_status": "processed",
      "case_id": "c7d9e4a2f8b3c6d1e5a9f4b7c2e8d5a3",
      "case_format": "jpg",
      "case_title": "Dynamic Paradigm Associate",
      "case_contributor": "Zion, Keebler"
    },
    {
      "created_at": "2025-11-28T08:06:19.904989",
      "case_processed_at": "2025-11-28T08:06:31.246462",
      "case_status": "processed",
      "case_id": "d5e8a3f9b4c7d2e6a1f5b8c3d9e7a4f2",
      "case_format": "jpg",
      "case_title": "International Data Representative",
      "case_contributor": "Clovis, Cole"
    }
  ],
  "filters": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-30",
    "total_matched": 4
  },
  "has_more": false
}
```

**Response with pagination (has more results)** — **200 OK**

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "created_at": "2025-11-28T08:46:10.195234",
      "case_processed_at": "2025-11-28T08:46:23.035067",
      "case_status": "processed",
      "case_id": "a3f8d9e2b7c4a1d5e9f3b8c2d7e4a1f6",
      "case_format": "jpg",
      "case_title": "Future Assurance Producer",
      "case_contributor": "Marvin, Berge"
    },
    {
      "created_at": "2025-11-28T08:03:06.422471",
      "case_processed_at": "2025-11-28T08:03:19.936005",
      "case_status": "processed",
      "case_id": "b2e7c9f3d8a5e1f4b9c6d3e8a2f7b5c9",
      "case_format": "jpg",
      "case_title": "Investor Branding Administrator",
      "case_contributor": "Celia, Bartoletti"
    }
  ],
  "last_evaluated_key": "eyJNa3Y1cCJBQ0NPTlBVLSU1Zi2zOGVr7TM4MzpzN0Rz2VWViM...",
  "has_more": true
}
```

**Response with pagination (last page)** — **200 OK**

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "created_at": "2025-11-28T03:45:23.190883",
      "case_processed_at": "2025-11-28T03:45:36.142946",
      "case_status": "processed",
      "case_id": "c7d9e4a2f8b3c6d1e5a9f4b7c2e8d5a3",
      "case_format": "jpg",
      "case_title": "Dynamic Paradigm Associate",
      "case_contributor": "Zion, Keebler"
    },
    {
      "created_at": "2025-11-28T08:06:19.904989",
      "case_processed_at": "2025-11-28T08:06:31.246462",
      "case_status": "processed",
      "case_id": "d5e8a3f9b4c7d2e6a1f5b8c3d9e7a4f2",
      "case_format": "jpg",
      "case_title": "International Data Representative",
      "case_contributor": "Clovis, Cole"
    }
  ],
  "has_more": false
}
```

---

### Get Single Case Info

Get detailed information for a specific case.

`GET /v1/external/case/{case_id}`

#### Headers

| Header     | Value       | Description    |
| ---------- | ----------- | -------------- |
| `X-API-Key` | `{api_key}` | Your API Key. |

#### Response Fields

| Field                        | Type    | Description                                                                                                      |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `case_id`                    | string  | Unique identifier for the case.                                                                                  |
| `case_status`                | string  | Current status of the case (e.g., `"processed"`, `"processing"`).                                                |
| `case_title`                 | string  | Title of the case.                                                                                               |
| `case_contributor`           | string  | Name of the contributor.                                                                                         |
| `case_format`                | string  | Format of the uploaded file (e.g., `"pdf"`, `"png"`).                                                            |
| `case_size`                  | integer | File size in bytes.                                                                                              |
| `case_original_amount`       | integer | Number of original pages/images in the file.                                                                     |
| `case_page_amount`           | integer | Total number of pages processed.                                                                                 |
| `case_index_cropped_amount`  | integer | Total number of cropped image regions extracted.                                                                 |
| `case_analysis_progress`     | integer | Analysis progress percentage (0–100).                                                                            |
| `case_analysis_status`       | string  | Status of the analysis (e.g., `"completed"`, `"processing"`).                                                    |
| `case_analysis_result`       | string  | JSON string containing analysis results including manipulation count, similarity count, and detection levels.    |
| `case_classification`        | string  | JSON string categorizing detected images by type (e.g., chart, microscopy, macroscopy).                          |
| `created_at`                 | string  | Timestamp when the case was created.                                                                             |
| `case_processed_at`          | string  | Timestamp when the case was processed.                                                                           |
| `case_analysis_started_at`   | string  | Timestamp when analysis started.                                                                                 |
| `case_analysis_completed_at` | string  | Timestamp when analysis completed.                                                                               |

#### Example Request

```bash
curl --location '{api_url}/v1/external/case/8e3f9a2b7c4d1e6f5a9b3c7d2e8f4a1b' \
  --header 'X-API-Key: YOUR_API_KEY'
```

#### Response Example

**200 OK**

```json
{
  "status": "success",
  "message": "Case information retrieved successfully",
  "data": {
    "case_report_ttl": 300,
    "account_id": "2d9f4e8a3b7c1f6e5a9d3c8b2f7e4a1c",
    "case_format": "pdf",
    "case_analysis_target": {
      "case": [
        "8e3f9a2b7c4d1e6f5a9b3c7d2e8f4a1b"
      ]
    },
    "case_contributor": "Gene, Hsiao",
    "case_report_created_at": "2025-11-27T08:48:19.748161",
    "case_report_uuid": "7a3c9f2e8b4d1f6e5a9c3b7d2e8f4a1c",
    "case_index_cropped_amount": 52,
    "case_report_setting": {
      "status": true,
      "account_id": "2d9f4e8a3b7c1f6e5a9d3c8b2f7e4a1c",
      "case_id": "8e3f9a2b7c4d1e6f5a9b3c7d2e8f4a1b",
      "analysis_id": "9f4e2b8a7c3d1f6e5a9b3c7d2e8f4a1c",
      "report_id": "7a3c9f2e8b4d1f6e5a9c3b7d2e8f4a1c",
      "title": "External API Test01",
      "doi": "",
      "contributor": "ImaChek Demo",
      "language": "en",
      "ttl": 300,
      "format": "pdf",
      "size": 2592130,
      "analysis_date": "2025-07-16T03:06:00.187935",
      "expires_at": "2025-11-27T08:53:19.748165",
      "created_at": "2025-11-27 08:48:19.748161"
    },
    "updated_at": "2025-07-16T03:09:12.298910",
    "case_analysis_started_at": "2025-07-16T03:06:00.187935",
    "case_processed_at": "2025-07-16T03:09:39.350851",
    "case_report_expires_at": "2025-11-27T08:53:19.748165",
    "case_size": 2592130,
    "case_original_amount": 9,
    "created_at": "2025-07-16T03:05:59.778405",
    "case_analysis_status": "completed",
    "case_analysis_progress": 100,
    "case_id": "8e3f9a2b7c4d1e6f5a9b3c7d2e8f4a1b",
    "case_title": "20250716_Test01_8",
    "case_analysis_completed_at": "2025-07-16T03:14:06.773331",
    "case_analysis_result": {
      "manipulation_count": 52,
      "similarity_count": 2,
      "similarity_level": {
        "high": 0,
        "medium": 0,
        "low": 2
      }
    },
    "case_classification": {
      "microscopy": 37,
      "blot_gel": 15
    },
    "case_page_amount": 9,
    "case_status": "processed",
    "case_analysis_id": "9f4e2b8a7c3d1f6e5a9b3c7d2e8f4a1c"
  }
}
```

---

### Delete Single Case

Delete a specific case by its case ID.

`DELETE /v1/external/case/{case_id}`

#### Important Note

Cases cannot be deleted while analysis is in progress. You must wait for the analysis to complete before deletion. Attempting to delete a case with an active analysis will result in an error response: `"Cannot delete case while analysis is in progress"`.

#### Headers

| Header     | Value       | Description    |
| ---------- | ----------- | -------------- |
| `X-API-Key` | `{api_key}` | Your API Key. |

#### Example Request

```bash
curl --location --request DELETE '{api_url}/v1/external/case/4k9m2n8p3q7r5s1t6u4v9w2x8y3z5a7b' \
  --header 'X-API-Key: YOUR_API_KEY'
```

#### Response Example

**200 OK**

```json
{
  "status": "success",
  "message": "Case deleted successfully"
}
```

---

### Get Analysis Status

Check the current status of an analysis job.

`GET /v1/external/analysis/{external_case_id}`

#### Use Case

This endpoint retrieves the status and results of all analysis jobs associated with a specific case. It is particularly useful for monitoring analysis progress and retrieving completed analysis results. The response includes detailed information about manipulation detection, similarity analysis, and classification results.

#### Headers

| Header     | Value       | Description    |
| ---------- | ----------- | -------------- |
| `X-API-Key` | `{api_key}` | Your API Key. |

#### Response Fields

| Field                                         | Type    | Description                                                                 |
| --------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `case_analysis_id`                            | string  | Unique identifier for the analysis job.                                     |
| `case_id`                                     | string  | The case ID associated with this analysis.                                  |
| `case_analysis_status`                        | string  | Current status of the analysis (e.g., `"completed"`, `"processing"`, `"pending"`). |
| `case_analysis_progress`                      | integer | Analysis progress percentage (0–100).                                       |
| `case_status`                                 | string  | Overall case status (e.g., `"processed"`, `"processing"`).                  |
| `case_analysis_result`                        | object  | Analysis results including manipulation count, similarity count, and detection levels. |
| `case_analysis_result.manipulation_count`     | integer | Number of manipulated images detected.                                      |
| `case_analysis_result.similarity_count`       | integer | Number of similar images found.                                             |
| `case_analysis_result.similarity_level`       | object  | Breakdown of similarity detections by confidence level (`high`, `medium`, `low`). |
| `case_classification`                         | object  | Classification of detected images by type (e.g., microscopy, chart, macroscopy). |
| `case_analysis_target`                        | object  | Target cases or repositories used for comparison analysis.                  |
| `created_at`                                  | string  | Timestamp when the analysis was created.                                    |
| `case_analysis_started_at`                    | string  | Timestamp when the analysis started.                                        |
| `case_analysis_completed_at`                  | string  | Timestamp when the analysis completed.                                      |

#### Example Request

```bash
curl --location '{api_url}/v1/external/analysis/5n8p2q9r3s7t4u1v6w8x2y5z9a3b7c4d' \
  --header 'X-API-Key: YOUR_API_KEY'
```

#### Response Example

**200 OK**

```json
{
  "status": "success",
  "message": "Analysis status retrieved successfully",
  "data": [
    {
      "case_analysis_completed_at": "2025-05-23T03:49:43.297689",
      "case_analysis_result": {
        "manipulation_count": 6,
        "similarity_count": 1,
        "similarity_level": {
          "high": 1,
          "medium": 0,
          "low": 0
        }
      },
      "created_at": "2025-05-23T03:44:51.063411",
      "case_analysis_id": "8m3n7p2q6r9s4t1u5v8w3x7y2z6a9b4c",
      "case_analysis_target": {
        "case": [
          "5n8p2q9r3s7t4u1v6w8x2y5z9a3b7c4d",
          "1p4q8r2s6t9u3v7w1x5y9z3a7b1c5d9e"
        ]
      },
      "case_analysis_status": "completed",
      "case_analysis_progress": 100,
      "case_status": "processed",
      "case_classification": {
        "microscopy": 6
      },
      "case_analysis_started_at": "2025-05-23T03:44:54.042637",
      "account_id": "6q9r3s7t2u6v1w5x9y4z8a3b7c2d6e1f",
      "case_id": "5n8p2q9r3s7t4u1v6w8x2y5z9a3b7c4d"
    }
  ]
}
```

---

### Generate Analysis Report

Generate a comprehensive analysis report for a specific case.

`POST /v1/external/report/{external_case_id}`

#### Report Generation

This endpoint generates a temporary, shareable web-based report for a completed analysis. The report includes detailed findings, visualizations, and analysis results. The generated report URL has a limited time-to-live (TTL) of **300 seconds (5 minutes)** and will expire after the specified time. This is ideal for sharing analysis results with stakeholders or for temporary review purposes.

#### Headers

| Header         | Value             | Description                      |
| -------------- | ----------------- | -------------------------------- |
| `Content-Type` | `application/json` | The format of the request body. |
| `X-API-Key`    | `{api_key}`       | Your API Key.                    |

#### Request Body

| Parameter     | Type   | Description                                                                  |
| ------------- | ------ | ---------------------------------------------------------------------------- |
| `title`       | string | The title of the report. This will be displayed at the top of the generated report. |
| `contributor` | string | The name of the contributor. This will be shown in the report metadata.      |

#### Response Fields

| Field         | Type    | Description                                                                                      |
| ------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `account_id`  | string  | Account identifier associated with the report.                                                   |
| `case_id`     | string  | The case ID for which the report was generated.                                                  |
| `analysis_id` | string  | The analysis ID associated with this report.                                                     |
| `report_id`   | string  | Unique identifier for the generated report.                                                      |
| `report_url`  | string  | The URL to access the generated report. This URL is temporary and will expire after the TTL period. |
| `ttl`         | integer | Time-to-live in seconds (default: 300 seconds / 5 minutes). The report URL will be valid for this duration. |
| `created_at`  | string  | Timestamp when the report was created.                                                           |
| `expires_at`  | string  | Timestamp when the report URL will expire and become inaccessible.                               |

#### Example Request

```bash
curl --location --request POST '{api_url}/v1/external/report/3r7s2t9u4v8w1x6y2z5a9b3c7d1e5f8g' \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: YOUR_API_KEY' \
  --data '{
    "title": "External API Test01",
    "contributor": "ImaChek Demo"
  }'
```

#### Response Example

**201 Created**

```json
{
  "status": "success",
  "message": "Report generated successfully",
  "data": {
    "account_id": "external",
    "case_id": "3r7s2t9u4v8w1x6y2z5a9b3c7d1e5f8g",
    "analysis_id": "9t4u8v2w6x1y5z9a3b7c1d5e9f3g7h2i",
    "report_id": "2w6x1y5z9a3b7c1d5e9f3g7h1i5j9k3l",
    "ttl": 300,
    "expires_at": "2025-01-13T01:16:16.357111",
    "created_at": "2025-01-13T01:11:16.357106",
    "report_url": "{report_url}/main/{report_uuid}"
  }
}
```
