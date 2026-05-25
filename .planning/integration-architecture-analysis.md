# Integration Architecture Analysis

## Overview
This document analyzes the integration architecture for the HospitiumRIS system, documenting external system integrations, integration methods, and technical implementation details.

---

## v. Integration Architecture

### 1. External Systems Integration Status

#### Current State
**No external integrations are currently implemented.**

#### Applicable External Systems for HospitiumRIS

Based on the system's focus on **research proposal management and institutional review**, the following integrations are highly applicable:

##### Research & Academic Systems (HIGH PRIORITY)

1. **ORCID (Open Researcher and Contributor ID)**
   - **Purpose**: Researcher identification and authentication
   - **Use Cases**:
     - Auto-populate researcher profiles
     - Verify researcher credentials
     - Link proposals to researcher publications
     - Prevent duplicate researcher records
   - **Integration criticality**: High
   - **API**: RESTful API with OAuth 2.0
   - **Data**: Researcher profiles, affiliations, publications

2. **PubMed / PubMed Central**
   - **Purpose**: Medical and life sciences literature database
   - **Use Cases**:
     - Literature review for proposals
     - Citation validation
     - Research background verification
     - Prior art searches
   - **Integration criticality**: Medium-High
   - **API**: E-utilities API (REST/SOAP)
   - **Data**: Publications, abstracts, citations, MeSH terms

3. **OpenAlex**
   - **Purpose**: Open catalog of scholarly works and authors
   - **Use Cases**:
     - Comprehensive publication tracking
     - Research impact metrics
     - Author disambiguation
     - Institution publication analytics
     - Research trend analysis
   - **Integration criticality**: Medium-High
   - **API**: RESTful API (free, no authentication required)
   - **Data**: Publications, authors, institutions, concepts, citations

4. **Crossref**
   - **Purpose**: DOI registration and metadata for scholarly content
   - **Use Cases**:
     - Citation validation and formatting
     - DOI resolution
     - Publication metadata retrieval
     - Reference verification
   - **Integration criticality**: Medium
   - **API**: RESTful API (free, rate-limited)
   - **Data**: DOIs, citations, publication metadata

##### Reference Management Systems (MEDIUM-HIGH PRIORITY)

5. **Zotero**
   - **Purpose**: Open-source reference management and bibliography tool
   - **Use Cases**:
     - Import researcher's bibliography from Zotero library
     - Export proposal references to Zotero format
     - Sync citations between HospitiumRIS and Zotero
     - Collaborative reference management for research teams
   - **Integration criticality**: Medium-High
   - **API**: Zotero Web API (RESTful, OAuth 2.0)
   - **Data**: Personal/group libraries, collections, items, tags, attachments
   - **Rate Limits**: 120 requests/minute per API key

6. **Mendeley**
   - **Purpose**: Academic reference manager and social network
   - **Use Cases**:
     - Import publications from Mendeley library
     - Sync researcher profile and publications
     - Access Mendeley catalog for literature search
     - Export citations in various formats
   - **Integration criticality**: Medium
   - **API**: Mendeley API (RESTful, OAuth 2.0)
   - **Data**: Documents, folders, profiles, groups, catalog search
   - **Rate Limits**: 150 requests/hour per user
   - **Note**: Mendeley API access requires application approval

7. **EndNote**
   - **Purpose**: Commercial reference management software (Clarivate)
   - **Use Cases**:
     - Import/export citations in EndNote format (.enl, .xml)
     - EndNote XML format for bibliography exchange
     - Integration with EndNote Online (formerly EndNote Web)
   - **Integration criticality**: Medium
   - **API**: Limited API access; primarily file-based integration
   - **Data**: EndNote XML format, RIS format
   - **Note**: EndNote Online API requires institutional subscription

##### Additional Applicable Systems (MEDIUM PRIORITY)

8. **Institutional Repository Systems**
   - **Examples**: DSpace, EPrints, Fedora
   - **Purpose**: Store and manage research outputs
   - **Integration criticality**: Medium

9. **Grant Management Systems**
   - **Examples**: InfoReady, Cayuse, Click
   - **Purpose**: Grant application and funding tracking
   - **Integration criticality**: Medium

10. **Ethics Committee Management Systems**
   - **Purpose**: IRB/Ethics review workflow integration
   - **Integration criticality**: Medium-High

##### NOT Applicable Systems

The following traditional healthcare integrations are **NOT applicable** to HospitiumRIS:
- ❌ Laboratory Information Systems (LIS)
- ❌ Billing Systems
- ❌ Electronic Medical Records (EMR)
- ❌ PACS/Radiology Systems
- ❌ Pharmacy Systems

**Rationale**: HospitiumRIS is a research proposal and institutional review system, not a clinical/hospital information system.

---

## 2. Integration Methods

### Current State
**No integration methods are currently implemented.**

### Recommended Integration Protocols for Research Systems

#### Primary Methods (For ORCID, PubMed, OpenAlex, Crossref, Zotero, Mendeley)

1. **RESTful APIs**
   - **Primary integration method** for all research systems
   - **Format**: JSON (standard for all systems)
   - **Authentication**: 
     - ORCID: OAuth 2.0
     - PubMed: API key (optional, higher rate limits)
     - OpenAlex: No authentication required
     - Crossref: No authentication required (polite pool with email)
     - Zotero: OAuth 2.0 or API key
     - Mendeley: OAuth 2.0
     - EndNote Online: API key (requires subscription)
   - **Rate Limiting**:
     - ORCID: 24 requests/second
     - PubMed: 3 requests/second (10 with API key)
     - OpenAlex: 10 requests/second (100k/day)
     - Crossref: 50 requests/second (polite pool)
     - Zotero: 120 requests/minute per API key
     - Mendeley: 150 requests/hour per user
     - EndNote Online: Varies by subscription

2. **File-Based Integration (Reference Management)**
   - **Use Cases**:
     - Import/export citations in standard formats
     - Bibliography file uploads
     - Batch citation processing
   - **Formats**:
     - **RIS** (Research Information Systems) - Universal format
     - **BibTeX** - LaTeX bibliography format
     - **EndNote XML** - EndNote native format
     - **CSL JSON** - Citation Style Language JSON
     - **Zotero RDF** - Zotero export format
   - **Implementation**: File upload/download endpoints
   - **Priority**: Medium (enables EndNote integration without API)

3. **Batch Processing / ETL**
   - **Use Cases**:
     - Bulk researcher profile imports
     - Nightly publication updates
     - Citation database synchronization
     - Research metrics calculations
     - Sync with reference management libraries
   - **Technology**: Node.js scheduled jobs, cron
   - **Frequency**: Daily or weekly for bulk updates

4. **Webhook Integration (Future)**
   - **ORCID**: Supports webhooks for profile updates
   - **Zotero**: Webhooks for library changes
   - **Use Case**: Real-time notification when data changes
   - **Priority**: Low (implement after basic API integration)

#### NOT Needed for HospitiumRIS

The following integration methods are **NOT applicable** for a research management system:

- ❌ **HL7 (Health Level 7)** - Clinical messaging protocol, not needed
- ❌ **FHIR** - Healthcare data exchange, not applicable
- ❌ **DICOM** - Medical imaging, not relevant
- ❌ **Message Queues** - Not needed for current integration scope (may be useful for scaling later)

---

## 3. API Gateway Usage

### Current State
**No API Gateway is currently implemented.**

### Recommendation: NOT NEEDED Initially

For the current scope of HospitiumRIS integrations (ORCID, PubMed, OpenAlex, Crossref), an API Gateway is **not necessary** because:

1. **Simple Integration Pattern**: Direct API calls from backend to external services
2. **Low Volume**: Research system APIs have generous rate limits
3. **No Complex Routing**: Each integration is independent
4. **Minimal Overhead**: Adding gateway would increase complexity without significant benefit

### Alternative Approach: Service Layer Pattern

Instead of an API Gateway, implement a **service layer** in the application:

```javascript
// src/services/integrations/orcid.service.js
// src/services/integrations/pubmed.service.js
// src/services/integrations/openalex.service.js
// src/services/integrations/crossref.service.js
```

**Benefits:**
- Simpler architecture
- Easier to maintain
- Lower operational overhead
- Direct control over rate limiting and caching

### When to Consider API Gateway (Future)

Implement an API Gateway **only if** the system scales to:
- 10+ external integrations
- High-volume API traffic (millions of requests/day)
- Need for complex request routing
- Multiple microservices architecture
- External third-party access to HospitiumRIS APIs

---

## 4. Authentication Methods

### Current State
**No external integration authentication is currently implemented.**

### Required Authentication for Research Systems

#### 1. OAuth 2.0 (ORCID, Zotero, Mendeley)

**ORCID API**
- **Flow Type**: Authorization Code Flow with PKCE
- **Use Case**: 
  - User authenticates with ORCID
  - HospitiumRIS receives access token
  - Can read/write user's ORCID profile (with permission)
- **Implementation**:
  - Register application with ORCID
  - Obtain Client ID and Client Secret
  - Store tokens securely in database
  - Implement token refresh mechanism
- **Scopes Needed**:
  - `/authenticate` - Basic authentication
  - `/read-limited` - Read ORCID profile
  - `/activities/update` - Add works to ORCID (optional)

**Zotero API**
- **Flow Type**: OAuth 1.0a (legacy) or API Key (simpler)
- **Use Case**:
  - Access user's Zotero library
  - Import/export citations
  - Sync bibliographies
- **Implementation**:
  - Option 1: OAuth 1.0a for user authorization
  - Option 2: API key for read-only access (simpler)
  - Store API keys encrypted in database
- **Permissions**:
  - Read library items
  - Write library items (optional)
  - Access group libraries

**Mendeley API**
- **Flow Type**: OAuth 2.0 Authorization Code Flow
- **Use Case**:
  - Access user's Mendeley library
  - Import publications and annotations
  - Sync with Mendeley catalog
- **Implementation**:
  - Register application with Mendeley
  - Obtain Client ID and Client Secret
  - Requires application approval from Mendeley
  - Store tokens encrypted in database
- **Scopes Needed**:
  - `all` - Full access to user's library
  - Or specific scopes: `library.read`, `library.write`
- **Note**: Mendeley API access requires approval; may take time

#### 2. API Keys (PubMed)
- **System**: PubMed E-utilities API
- **Use Case**: Higher rate limits (10 req/sec vs 3 req/sec)
- **Implementation**:
  - Register for NCBI API key
  - Store in environment variables
  - Include in all API requests as query parameter
- **Security**: 
  - Never commit to version control
  - Use `.env` file
  - Rotate periodically

#### 3. No Authentication Required
- **OpenAlex**: Completely open, no authentication
- **Crossref**: No authentication, but recommended to include email in User-Agent for "polite pool" (higher rate limits)

#### 4. File-Based (No Authentication)
- **EndNote**: Import/export via file formats (RIS, EndNote XML, BibTeX)
  - No API authentication needed for file-based integration
  - Users upload/download citation files
  - Parse and process locally
- **Universal Citation Formats**: RIS, BibTeX, CSL JSON
  - Standard formats supported by all reference managers
  - No authentication required

### NOT Needed for Research Integrations

The following authentication methods are **NOT required** for current integrations:
- ❌ **JWT for external APIs** - Not used by research systems
- ❌ **SSO/SAML** - Not applicable for API integrations
- ❌ **mTLS** - Overkill for public research APIs
- ❌ **API Gateway authentication** - No gateway needed

### Security Best Practices
- Store OAuth tokens encrypted in database (ORCID, Zotero, Mendeley)
- Use environment variables for API keys (PubMed, Zotero)
- Implement token refresh for OAuth 2.0 (ORCID, Mendeley)
- Validate and sanitize uploaded citation files (prevent XSS, injection)
- Log all external API calls for audit trail
- Rate limit internal requests to prevent abuse
- Handle authentication failures gracefully
- Secure file upload/download endpoints (virus scanning, file type validation)

---

## 5. Data Exchange Frequency

### Current State
**No scheduled data exchange is currently implemented.**

### Recommended Exchange Patterns for Research Systems

#### 1. On-Demand / Real-Time (User-Triggered)
- **Use Cases**:
  - Researcher searches PubMed for publications
  - User links their ORCID account
  - Validate DOI via Crossref
  - Search OpenAlex for author publications
- **Technology**: REST API calls triggered by user actions
- **Latency**: 1-3 seconds (acceptable for user-initiated actions)
- **Frequency**: As needed, user-driven
- **Systems**: All four (ORCID, PubMed, OpenAlex, Crossref)

#### 2. Batch Processing (Background Jobs)
- **Use Cases**:
  - Nightly update of researcher publication counts
  - Weekly refresh of citation metrics
  - Monthly institution research analytics
  - Bulk import of researcher profiles
- **Technology**: Node.js cron jobs, scheduled tasks
- **Frequency**: 
  - Daily: Publication updates for active researchers
  - Weekly: Citation metrics refresh
  - Monthly: Full analytics recalculation
- **Volume**: Moderate (hundreds to thousands of API calls per batch)
- **Systems**: Primarily OpenAlex, PubMed

#### 3. Cached Data Strategy
- **Use Cases**:
  - Cache researcher profiles for 24 hours
  - Cache publication lists for 7 days
  - Cache citation counts for 30 days
- **Technology**: Redis or database caching
- **Refresh**: Background jobs update cache before expiration
- **Benefit**: Reduce API calls, improve response time

#### NOT Applicable
- ❌ **Real-time critical updates** - Research data doesn't change minute-to-minute
- ❌ **High-frequency polling** - Unnecessary for publication data
- ❌ **Webhook subscriptions** - Not critical for MVP (ORCID webhooks can be added later)

### Data Volume Considerations
- **Low to moderate volume**: Research APIs handle hundreds of requests easily
- **Rate limiting awareness**: Respect API limits (see Section 2)
- **Caching strategy**: Minimize redundant API calls
- **Off-peak batch jobs**: Run heavy processing during low-traffic hours (2-6 AM)

---

## 6. Error Handling

### Current State
**No error handling for external integrations is currently implemented.**

### Recommended Error Management for Research APIs

#### 1. Retry Logic with Exponential Backoff
- **Implementation**: Use libraries like `axios-retry` or custom retry logic
- **Max Retry Attempts**: 3 attempts
- **Retry Conditions**: 
  - Network timeouts (ETIMEDOUT, ECONNRESET)
  - Rate limiting (429 Too Many Requests)
  - Temporary service unavailability (503 Service Unavailable)
  - Server errors (500, 502, 504)
- **Backoff Strategy**: 
  - 1st retry: 1 second delay
  - 2nd retry: 2 seconds delay
  - 3rd retry: 4 seconds delay
- **Do NOT Retry**: 
  - 400 Bad Request (fix the request)
  - 401 Unauthorized (authentication issue)
  - 404 Not Found (resource doesn't exist)

#### 2. Graceful Degradation
- **Cached Data Fallback**: 
  - If ORCID API fails, show last cached profile
  - If PubMed fails, show "Publications temporarily unavailable"
  - Display warning banner to user
- **Partial Functionality**: 
  - Allow proposal submission even if publication lookup fails
  - Don't block critical workflows due to integration failures
- **User Feedback**: 
  - Clear error messages (not technical jargon)
  - Suggest manual alternatives when possible

#### 3. Rate Limit Handling
- **Detect 429 Responses**: Respect Retry-After header
- **Implement Request Queue**: 
  - Queue requests when approaching rate limit
  - Process queue at safe rate
- **Per-API Rate Limiting**:
  - ORCID: Max 20 req/sec (buffer below 24 limit)
  - PubMed: Max 2 req/sec without key, 8 req/sec with key
  - OpenAlex: Max 8 req/sec (buffer below 10 limit)
  - Crossref: Max 40 req/sec (buffer below 50 limit)

#### 4. Error Logging & Monitoring
- **Log All Integration Errors**:
  ```javascript
  await logApiActivity('GET', 'https://api.orcid.org/...', 500, {
    error: error.message,
    retryAttempt: 3,
    userId: currentUser.id
  });
  ```
- **Track Metrics**:
  - Success rate per API
  - Average response time
  - Rate limit hits
  - Error types and frequency
- **Alerting**: 
  - Email admin if error rate > 5% for any API
  - Slack notification for ORCID OAuth failures

#### NOT Needed
- ❌ **Message Queues/DLQ** - Overkill for simple API integrations
- ❌ **Circuit Breaker** - Not necessary for low-volume research APIs
- ❌ **Complex Failover** - Research APIs are generally reliable
- ❌ **Real-time Incident Management** - Not critical for non-clinical system

### Error Recovery Procedures
1. **Automatic**: Retry logic handles transient errors
2. **User-Initiated**: "Retry" button for failed operations
3. **Admin Tools**: Dashboard to view/retry failed integration calls
4. **Manual Fallback**: Users can manually enter publication data if APIs fail

---

## Integration Architecture Diagram

### Proposed Architecture for Research System Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      External Research Systems                               │
│                                                                               │
│  ┌────────┐  ┌────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  ┌────────┐ │
│  │ ORCID  │  │PubMed  │  │OpenAlex │  │Crossref │  │ Zotero │  │Mendeley│ │
│  │  API   │  │E-utils │  │   API   │  │   API   │  │  API   │  │  API   │ │
│  └───┬────┘  └───┬────┘  └────┬────┘  └────┬────┘  └───┬────┘  └───┬────┘ │
│      │           │            │            │           │            │       │
│   OAuth2      API Key       None         None      OAuth/Key     OAuth2    │
│ (24 req/s)  (10 req/s)  (10 req/s)  (50 req/s)  (120 req/m)  (150 req/h)   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    File-Based Integration                             │   │
│  │  EndNote, BibTeX, RIS, CSL JSON (Upload/Download)                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────┼─────────────┼──────────────┼──────────────┼──────────┼──────┼───────┘
        │             │              │              │          │      │
        │             └──────┬───────┴──────┬───────┴──────────┘      │
        │                    │              │                          │
        │              REST API (JSON)      │                    File Upload
        │                    │              │                          │
┌───────▼────────────────────▼──────────────▼─────────────────────────┐
│              Integration Service Layer (Next.js API Routes)          │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Integration Services (src/services/integrations/)            │  │
│  │                                                                │  │
│  │  • orcid.service.js      - OAuth flow, profile fetch          │  │
│  │  • pubmed.service.js     - Publication search, metadata       │  │
│  │  • openalex.service.js   - Author search, metrics             │  │
│  │  • crossref.service.js   - DOI validation, citations          │  │
│  │  • zotero.service.js     - Library sync, citation import      │  │
│  │  • mendeley.service.js   - Document sync, catalog search      │  │
│  │  • citation.service.js   - File parsing (RIS, BibTeX, XML)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Common Integration Utilities                                 │  │
│  │                                                                │  │
│  │  • Rate Limiter          - Per-API request throttling         │  │
│  │  • Retry Logic           - Exponential backoff (3 attempts)   │  │
│  │  • Cache Manager         - Redis/DB caching layer             │  │
│  │  • Error Handler         - Graceful degradation               │  │
│  │  • Activity Logger       - Audit trail for all API calls      │  │
│  │  • File Parser           - RIS, BibTeX, EndNote XML, CSL JSON │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────┬───────────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────────────┐
│                     HospitiumRIS Core System                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Database   │  │  Cache Layer │  │  Background  │            │
│  │  (Prisma)    │  │   (Redis)    │  │     Jobs     │            │
│  │              │  │              │  │  (node-cron) │            │
│  │ • Users      │  │ • Profiles   │  │              │            │
│  │ • Proposals  │  │ • Pubs       │  │ • Daily sync │            │
│  │ • Reviews    │  │ • Citations  │  │ • Metrics    │            │
│  │ • ORCID      │  │              │  │   refresh    │            │
│  │   Tokens     │  │              │  │              │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Frontend Components                          │ │
│  │                                                                │ │
│  │  • ORCID Login Button       • Publication Search              │ │
│  │  • Zotero/Mendeley Connect  • Citation Validator              │ │
│  │  • Researcher Profile       • DOI Lookup                      │ │
│  │  • Metrics Dashboard        • File Upload (RIS/BibTeX)        │ │
│  │  • Bibliography Manager     • Citation Export                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

User Actions (On-Demand)          Background Jobs (Scheduled)
─────────────────────────         ──────────────────────────
• Link ORCID account              • Daily: Update publication counts
• Connect Zotero/Mendeley         • Daily: Sync Zotero libraries
• Search publications             • Weekly: Refresh citation metrics  
• Upload citation file            • Weekly: Sync Mendeley data
• Validate DOI                    • Monthly: Generate analytics
• Import researcher profile       • Cache warming
• Export bibliography
```

### Key Architecture Decisions

1. **No API Gateway**: Direct service-to-service calls via integration service layer
2. **Service Layer Pattern**: Dedicated service files for each external API
3. **Caching Strategy**: Redis for frequently accessed data (profiles, publications, citations)
4. **Rate Limiting**: Per-API throttling to respect external limits
5. **Error Handling**: Retry logic with exponential backoff, graceful degradation
6. **Authentication**: 
   - OAuth 2.0 for ORCID, Mendeley
   - OAuth 1.0a/API Key for Zotero
   - API keys for PubMed
   - None for OpenAlex, Crossref
   - File-based for EndNote (no auth)
7. **Data Flow**: User-triggered (real-time) + scheduled batch jobs (background)
8. **File Support**: RIS, BibTeX, EndNote XML, CSL JSON for universal compatibility

---

## Implementation Recommendations

### 1. Phased Rollout (Research System Integrations)

#### Phase 1: ORCID Integration (Weeks 1-2)
- **Priority**: HIGH - Core researcher identification
- **Tasks**:
  - Register application with ORCID
  - Implement OAuth 2.0 flow
  - Create ORCID login button
  - Store tokens in database (encrypted)
  - Display researcher profile from ORCID
- **Success Criteria**: Users can link ORCID and see their profile

#### Phase 2: OpenAlex Integration (Weeks 3-4)
- **Priority**: HIGH - Publication tracking
- **Tasks**:
  - Create OpenAlex service layer
  - Implement author search by ORCID
  - Fetch publication list
  - Display publications on researcher profile
  - Implement caching (7-day TTL)
- **Success Criteria**: Automatic publication import from OpenAlex

#### Phase 3: PubMed Integration (Week 5)
- **Priority**: MEDIUM - Medical literature search
- **Tasks**:
  - Register for NCBI API key
  - Create PubMed service layer
  - Implement publication search
  - Add literature review tool for proposals
- **Success Criteria**: Users can search PubMed from proposal form

#### Phase 4: Crossref Integration (Week 6)
- **Priority**: MEDIUM - Citation validation
- **Tasks**:
  - Create Crossref service layer
  - Implement DOI validation
  - Add citation formatter
  - Metadata enrichment for references
- **Success Criteria**: DOI validation and metadata retrieval working

#### Phase 5: Zotero Integration (Week 7)
- **Priority**: MEDIUM-HIGH - Reference management
- **Tasks**:
  - Implement Zotero OAuth or API key authentication
  - Create Zotero service layer
  - Fetch user's library items
  - Import citations to HospitiumRIS
  - Export HospitiumRIS citations to Zotero format
- **Success Criteria**: Users can sync their Zotero library

#### Phase 6: Mendeley Integration (Week 8)
- **Priority**: MEDIUM - Alternative reference manager
- **Tasks**:
  - Apply for Mendeley API access (may take time)
  - Implement OAuth 2.0 flow
  - Create Mendeley service layer
  - Import documents from Mendeley library
  - Catalog search integration
- **Success Criteria**: Users can import from Mendeley

#### Phase 7: File-Based Citation Import/Export (Week 9)
- **Priority**: MEDIUM - Universal compatibility
- **Tasks**:
  - Implement RIS parser
  - Implement BibTeX parser
  - Implement EndNote XML parser
  - Implement CSL JSON parser
  - Create file upload/download endpoints
  - Add citation format converter
- **Success Criteria**: Users can upload/download citations in multiple formats

#### Phase 8: Background Jobs & Analytics (Week 10-11)
- **Priority**: LOW - Optimization
- **Tasks**:
  - Set up node-cron for scheduled jobs
  - Daily publication count updates
  - Daily Zotero library sync (for connected users)
  - Weekly citation metrics refresh
  - Weekly Mendeley sync
  - Monthly analytics generation
- **Success Criteria**: Automated data refresh without user action

### 2. Testing Strategy

#### Unit Tests
- Each integration service (orcid.service.js, zotero.service.js, etc.)
- File parsers (RIS, BibTeX, EndNote XML, CSL JSON)
- Citation format converters
- Rate limiter utility
- Retry logic
- Cache manager
- Mock external API responses

#### Integration Tests
- End-to-end ORCID OAuth flow
- Zotero/Mendeley OAuth flows
- Publication search and display
- DOI validation
- File upload/download and parsing
- Citation import/export workflows
- Error handling scenarios
- Rate limit handling

#### Manual Testing
- Test with real ORCID, Zotero, Mendeley accounts
- Upload various citation file formats
- Verify publication data accuracy
- Test citation format conversions
- Test error messages and fallbacks
- Cross-browser compatibility
- File upload security (malformed files, large files)

### 3. Documentation Requirements

#### Developer Documentation
- Integration service API reference
- How to add new external integrations
- File parser implementation guide
- Citation format specifications
- Rate limiting configuration
- Caching strategy guide
- Error handling patterns

#### User Documentation
- How to link ORCID account
- How to connect Zotero/Mendeley
- Publication import guide (API and file-based)
- Citation file format guide (RIS, BibTeX, EndNote XML)
- How to export citations
- Troubleshooting common issues
- Privacy and data usage policy

#### Admin Documentation
- Monitoring integration health
- Managing API keys and credentials (ORCID, Zotero, Mendeley, PubMed)
- Troubleshooting failed integrations
- File upload security and limits
- Analytics and reporting

### 4. Monitoring & Observability

#### Metrics to Track
- **API Success Rate**: % of successful calls per API (ORCID, PubMed, OpenAlex, Crossref, Zotero, Mendeley)
- **Response Time**: Average latency for each API
- **Rate Limit Usage**: % of rate limit consumed per API
- **Cache Hit Rate**: % of requests served from cache
- **Error Rate**: Errors per 1000 requests
- **File Upload Success Rate**: % of successfully parsed citation files
- **File Format Distribution**: Usage of RIS, BibTeX, EndNote XML, CSL JSON
- **Integration Adoption**: % of users with connected accounts (ORCID, Zotero, Mendeley)

#### Logging
- All external API calls (using activityLogger)
- Authentication events (ORCID, Zotero, Mendeley OAuth)
- File uploads/downloads (format, size, success/failure)
- Citation parsing errors
- Rate limit hits
- Errors with full context
- Performance metrics

#### Dashboards
- Integration health status (green/yellow/red) per system
- API call volume over time (by integration)
- Error trends
- Cache performance
- File upload statistics (format distribution, success rate)
- User adoption metrics:
  - % with ORCID linked
  - % with Zotero connected
  - % with Mendeley connected
  - % using file-based import

### 5. Security Considerations

#### Data Protection
- **OAuth Tokens**: Encrypt at rest in database (ORCID, Zotero, Mendeley)
- **API Keys**: Store in environment variables, never commit (PubMed, Zotero)
- **User Data**: Comply with GDPR/privacy regulations
- **HTTPS Only**: All API calls over TLS 1.3
- **File Upload Security**:
  - Validate file types (whitelist: .ris, .bib, .xml, .json)
  - Scan for malware/viruses
  - Limit file size (max 10MB)
  - Sanitize parsed content (prevent XSS, SQL injection)
  - Store uploaded files temporarily, delete after processing

#### Access Control
- Only authenticated users can trigger integrations
- Only authenticated users can upload/download files
- Rate limiting per user to prevent abuse
- Admin-only access to integration logs
- Audit trail for all integration activities
- User can only access their own connected accounts (Zotero, Mendeley)

#### Compliance
- **ORCID Terms**: Comply with ORCID API terms of use
- **PubMed Terms**: Follow NCBI E-utilities guidelines
- **Zotero Terms**: Respect Zotero API usage guidelines
- **Mendeley Terms**: Comply with Mendeley API terms (requires approval)
- **Data Retention**: Clear policy for cached external data
- **User Consent**: Explicit consent for linking external accounts (ORCID, Zotero, Mendeley)
- **File Privacy**: Uploaded citation files are private to the user

---

## Technology Stack Recommendations

### HTTP Client Library
- **Recommended**: `axios` with `axios-retry`
- **Why**: 
  - Built-in retry logic support
  - Interceptors for rate limiting
  - Promise-based
  - Wide adoption and support
- **Alternative**: `node-fetch` (simpler, but manual retry logic)

### Caching Layer
- **Option 1**: Redis (Recommended for production)
  - Fast in-memory caching
  - TTL support
  - Pub/sub for cache invalidation
- **Option 2**: Database caching (Good for MVP)
  - Use existing Prisma database
  - Add `cachedAt` timestamp fields
  - Simpler setup, no additional infrastructure

### Rate Limiting
- **Recommended**: `bottleneck` npm package
- **Why**:
  - Per-API rate limit configuration
  - Request queuing
  - Clustering support
  - Retry integration
- **Alternative**: Custom implementation with Redis

### Background Jobs
- **Recommended**: `node-cron` (simple) or `bull` (advanced)
- **node-cron**: 
  - Simple cron-like scheduling
  - Good for basic daily/weekly jobs
  - No external dependencies
- **bull**:
  - Redis-based job queue
  - Retry logic, priority queues
  - Better for complex workflows

### OAuth 2.0 (ORCID, Mendeley)
- **Recommended**: `next-auth` with custom providers
- **Why**:
  - Built for Next.js
  - Session management
  - Token refresh handling
  - Support for multiple OAuth providers
- **Alternative**: Manual OAuth implementation with `simple-oauth2`

### File Parsing Libraries
- **RIS Parser**: `ris-parser` or custom implementation
- **BibTeX Parser**: `bibtex-parse-js` or `@retorquere/bibtex-parser`
- **EndNote XML Parser**: Custom XML parser with `fast-xml-parser`
- **CSL JSON**: Native JSON parsing (no library needed)
- **File Upload**: `multer` for handling multipart/form-data
- **File Validation**: `file-type` for MIME type detection
- **Virus Scanning**: `clamscan` (optional, for production)

### Monitoring & Logging
- **Current**: File-based logging (activityLogger)
- **Enhancement**: Add structured logging with `winston`
- **Future**: Consider Sentry for error tracking
- **Metrics**: Custom dashboard in admin panel (no external tools needed initially)

---

## Compliance & Standards

### Research & Academic Standards
- **ORCID**: Researcher identification standard (ISO 27729)
- **DOI**: Digital Object Identifier for publications
- **OpenAlex Schema**: Open scholarly data format
- **PubMed/MEDLINE**: NLM citation standards
- **Crossref Metadata**: Scholarly metadata standards

### Data Privacy & Security
- **GDPR**: European data privacy (if applicable)
  - User consent for ORCID linking
  - Right to delete cached publication data
  - Data portability
- **Privacy Policy**: Clear disclosure of external data usage
- **Data Retention**: Define retention period for cached data

### API Usage Compliance
- **ORCID Public API Terms**: 
  - Proper attribution
  - Respect rate limits
  - Secure token storage
- **NCBI E-utilities Guidelines**:
  - Include email in User-Agent
  - Respect rate limits (3 req/s, 10 with key)
  - No systematic downloading
- **OpenAlex Polite Pool**:
  - Include email in User-Agent for higher limits
  - Attribution in UI
- **Crossref Terms**:
  - Polite pool etiquette
  - Proper attribution

### Integration Standards
- **REST**: RESTful API design principles
- **OAuth 2.0**: Authorization framework (ORCID)
- **JSON**: Primary data format
- **HTTPS/TLS 1.3**: Secure communication

### NOT Applicable
- ❌ **HIPAA**: Not a clinical system, no PHI
- ❌ **HL7/FHIR**: Not applicable for research management
- ❌ **DICOM**: No medical imaging
- ❌ **ICD-10/CPT**: No clinical coding

---

## Risk Assessment

### Risk Areas for Research Integrations

#### Medium-Risk Areas
1. **ORCID OAuth Failure**
   - **Impact**: Users cannot link ORCID accounts
   - **Likelihood**: Low (ORCID has high uptime)
   - **Mitigation**: 
     - Allow manual profile entry as fallback
     - Cache ORCID data for 24 hours
     - Clear error messages with retry option

2. **Rate Limit Exceeded**
   - **Impact**: Temporary inability to fetch new data
   - **Likelihood**: Medium (if not properly managed)
   - **Mitigation**:
     - Implement request queuing
     - Cache aggressively
     - Monitor rate limit usage
     - Use API keys where available (PubMed)

3. **API Deprecation/Changes**
   - **Impact**: Integration breaks unexpectedly
   - **Likelihood**: Low-Medium
   - **Mitigation**:
     - Subscribe to API change notifications
     - Version API calls where possible
     - Regular integration health checks
     - Comprehensive error logging

4. **Stale Cached Data**
   - **Impact**: Users see outdated publication information
   - **Likelihood**: Medium
   - **Mitigation**:
     - Appropriate TTL settings (7-30 days)
     - Manual refresh option for users
     - Background jobs to update active researchers
     - Display "last updated" timestamp

#### Low-Risk Areas
5. **External API Downtime**
   - **Impact**: Temporary feature unavailability
   - **Likelihood**: Low (research APIs are reliable)
   - **Mitigation**:
     - Graceful degradation
     - Cached data fallback
     - User-friendly error messages
     - Non-blocking for core workflows

### Mitigation Strategies
- **Caching**: Reduce dependency on external APIs
- **Graceful Degradation**: Core features work even if integrations fail
- **Monitoring**: Track integration health and error rates
- **User Communication**: Clear messaging when features unavailable
- **Manual Fallbacks**: Allow manual data entry when APIs fail
- **Regular Testing**: Periodic integration health checks

---

## Success Metrics

### Performance KPIs
- **API Response Time**: < 2 seconds for user-triggered requests (95th percentile)
- **Integration Uptime**: > 99% (acceptable for non-critical research data)
- **Error Rate**: < 1% of requests
- **Cache Hit Rate**: > 70% for publication data

### User Adoption KPIs
- **ORCID Linking Rate**: % of researchers who link ORCID account
  - Target: 60% within 6 months
- **Publication Import Usage**: % of proposals with imported publications
  - Target: 40% within 3 months
- **User Satisfaction**: Positive feedback on integration features
  - Target: > 4.0/5.0 rating

### Technical KPIs
- **Rate Limit Headroom**: Stay below 80% of API limits
- **Background Job Success Rate**: > 95% for scheduled syncs
- **Integration Coverage**: All 4 systems (ORCID, PubMed, OpenAlex, Crossref) operational
- **Time to Add New Integration**: < 1 week for similar research APIs

### Cost Efficiency
- **API Costs**: $0 (all free APIs)
- **Infrastructure Costs**: Minimal (optional Redis for caching)
- **Maintenance Time**: < 4 hours/month for monitoring and updates

---

## Conclusion

This integration architecture analysis has been **updated to reflect the actual needs** of HospitiumRIS as a **research proposal and institutional review system**, not a clinical healthcare system.

### Current State
- **No external integrations implemented**
- **No clinical system integrations needed** (LIS, EMR, billing, etc.)

### Recommended Integrations
The following **research-focused integrations** are highly applicable:

**Publication & Researcher Systems:**
1. ✅ **ORCID** - Researcher identification and authentication (HIGH PRIORITY)
2. ✅ **OpenAlex** - Publication tracking and metrics (HIGH PRIORITY)
3. ✅ **PubMed** - Medical literature search (MEDIUM PRIORITY)
4. ✅ **Crossref** - DOI validation and citations (MEDIUM PRIORITY)

**Reference Management Systems:**
5. ✅ **Zotero** - Open-source reference manager integration (MEDIUM-HIGH PRIORITY)
6. ✅ **Mendeley** - Academic reference manager (MEDIUM PRIORITY)
7. ✅ **EndNote** - File-based integration via RIS/XML (MEDIUM PRIORITY)

**Universal Citation Formats:**
8. ✅ **RIS, BibTeX, EndNote XML, CSL JSON** - File-based import/export (MEDIUM PRIORITY)

### Key Architecture Decisions

**Simplified Approach:**
- ❌ **No API Gateway needed** - Direct service layer integration
- ❌ **No message queues needed** - Simple request/response pattern
- ❌ **No HL7/FHIR** - Not applicable for research systems
- ✅ **Service layer pattern** - Clean, maintainable integration services
- ✅ **Caching strategy** - Reduce API calls, improve performance
- ✅ **Graceful degradation** - Core features work even if integrations fail

**Authentication:**
- OAuth 2.0 for ORCID, Mendeley
- OAuth 1.0a/API Key for Zotero
- API keys for PubMed (optional, for higher limits)
- No authentication for OpenAlex and Crossref
- File-based (no auth) for EndNote and universal formats

**Data Exchange:**
- User-triggered (on-demand) for searches, lookups, and file uploads
- Background jobs (daily/weekly) for metrics, analytics, and library syncs
- Caching with appropriate TTLs (7-30 days)
- File import/export for universal compatibility

### Implementation Timeline
- **11 weeks** to implement all integrations
- **Phase 1-2** (4 weeks): ORCID + OpenAlex (core functionality)
- **Phase 3-4** (2 weeks): PubMed + Crossref (enhanced features)
- **Phase 5-6** (2 weeks): Zotero + Mendeley (reference management)
- **Phase 7** (1 week): File-based citation import/export
- **Phase 8** (2 weeks): Background jobs and optimization

### Next Steps

#### Immediate (Week 1)
1. ✅ Review and approve this integration architecture
2. Register for ORCID API credentials (Client ID/Secret)
3. Register for NCBI API key (PubMed)
4. Register for Zotero API key
5. Apply for Mendeley API access (requires approval - may take time)
6. Set up development environment variables

#### Short-term (Weeks 2-6)
1. Implement ORCID OAuth integration
2. Create integration service layer structure
3. Implement OpenAlex publication fetching
4. Add caching layer (database or Redis)
5. Add PubMed search functionality
6. Implement Crossref DOI validation

#### Medium-term (Weeks 7-11)
1. Implement Zotero integration (OAuth/API key)
2. Implement Mendeley integration (if API access approved)
3. Build file parsers (RIS, BibTeX, EndNote XML, CSL JSON)
4. Create file upload/download endpoints
5. Set up background jobs for data refresh and library syncs
6. Create admin dashboard for integration monitoring

#### Long-term (Post-MVP)
1. Add ORCID webhooks for real-time profile updates
2. Add Zotero webhooks for library change notifications
3. Implement advanced analytics and metrics
4. Consider additional integrations (Scopus, Web of Science, etc.)
5. Add citation style formatting (APA, MLA, Chicago, etc.)
6. Optimize caching and performance

### Benefits of This Approach

**For Users:**
- Automatic researcher profile population from ORCID
- Easy publication import from multiple sources (OpenAlex, PubMed, Zotero, Mendeley)
- Seamless bibliography management (sync with Zotero/Mendeley)
- Universal file format support (RIS, BibTeX, EndNote XML)
- Citation validation and DOI lookup
- Research metrics and analytics
- One-click export to reference managers

**For Administrators:**
- Reduced manual data entry
- Better data quality through automated imports
- Research output tracking across institution
- Institutional analytics and reporting
- Support for researchers' preferred tools (Zotero, Mendeley, EndNote)

**For Developers:**
- Simple, maintainable architecture
- Reusable integration patterns
- Clear error handling
- Comprehensive logging
- Well-documented file parsers
- Modular service design (easy to add new integrations)

---

*Document Version: 3.0 (Added Reference Management Systems)*  
*Last Updated: 2026-05-20*  
*Author: System Architecture Team*  
*Status: Ready for Implementation*

**Changelog:**
- v3.0: Added Zotero, Mendeley, EndNote integrations; file-based citation import/export
- v2.0: Updated for research system focus (ORCID, PubMed, OpenAlex, Crossref)
- v1.0: Initial analysis (clinical systems - not applicable)
