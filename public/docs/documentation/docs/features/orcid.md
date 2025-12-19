---
sidebar_position: 4
title: ORCID Integration
---

# ORCID Integration

HospitiumRIS provides deep integration with ORCID (Open Researcher and Contributor ID) for researcher authentication, profile enrichment, and collaborator discovery.

## What is ORCID?

ORCID provides a persistent digital identifier that distinguishes researchers from every other researcher. It connects research to researchers by linking ORCID iDs to professional information, affiliations, grants, publications, and more.

:::info ORCID Benefits
- 🆔 Unique researcher identification
- 📊 Automatic profile data sync
- 🔍 Easy collaborator discovery
- ✅ Verified credentials
- 🌐 Global research community
:::

## Registration with ORCID

### Creating an Account

During registration, researchers can:

1. **Connect ORCID** - Link existing ORCID iD
2. **Create ORCID** - Register new ORCID iD
3. **Skip** - Register without ORCID (limited features)

### OAuth Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ HospitiumRIS │────>│    ORCID     │────>│   User       │
│  Registration │     │   OAuth      │     │  Authorizes  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
       ┌──────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Profile    │<────│   Callback   │<────│   ORCID      │
│   Created    │     │   Handler    │     │   Response   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Permissions Requested

HospitiumRIS requests:

| Scope | Purpose |
|-------|---------|
| `/read-public` | Access public ORCID data |
| `/read-limited` | Access limited visibility data |
| `/authenticate` | Verify identity |

## Profile Data Sync

### Automatic Sync

When connecting ORCID, the following data is imported:

| Data | Description |
|------|-------------|
| **Given Names** | First/middle names |
| **Family Name** | Surname |
| **Biography** | Researcher bio |
| **Employments** | Work history |
| **Education** | Academic degrees |
| **Works** | Publications |
| **Keywords** | Research keywords |

### Synced Fields

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCID → HospitiumRIS Sync                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ORCID Profile                    HospitiumRIS Profile          │
│  ─────────────                    ────────────────────          │
│  Given Names        →             Given Name                    │
│  Family Name        →             Family Name                   │
│  Biography          →             Biography                     │
│  Employments        →             Work History                  │
│  Education          →             Education History             │
│  Keywords           →             Research Keywords             │
│  Works (DOIs)       →             Publication Links             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Manual Refresh

Refresh ORCID data anytime:

1. Go to **Settings → ORCID**
2. Click **Refresh Data**
3. New data imported from ORCID
4. Profile updated

## Public Profile Display

### ORCID Verification Badge

Verified researchers display:

- ✅ Green ORCID badge
- 🔗 Clickable ORCID link
- 📋 Full ORCID profile access

### Profile Elements

On public researcher profiles:

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Dr. Jane Smith                                    ✅ ORCID   │
├─────────────────────────────────────────────────────────────────┤
│ 🆔 ORCID: 0000-0002-1234-5678                                   │
│ 🏛️ Harvard Medical School                                       │
│ 📅 Member since January 2024                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📚 Employment History (from ORCID)                             │
│  ─────────────────────────────────                              │
│  • Professor, Harvard Medical School (2020-present)            │
│  • Associate Professor, MIT (2015-2020)                        │
│  • Postdoc Fellow, Stanford (2012-2015)                        │
│                                                                  │
│  🎓 Education (from ORCID)                                      │
│  ────────────────────────                                       │
│  • PhD, Biomedical Engineering, Stanford (2012)                │
│  • MS, Biomedical Engineering, UCLA (2008)                     │
│  • BS, Biology, UC Berkeley (2006)                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Collaborator Discovery

### ORCID Search

Find researchers by ORCID:

1. Go to **Search Researchers**
2. Enter name or ORCID iD
3. View matching researchers
4. See profile details

### Search Results

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Search: "machine learning healthcare"                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Dr. John Chen                                ✅ Verified │ │
│ │    ORCID: 0000-0003-5678-1234                               │ │
│ │    Stanford University | Computer Science                   │ │
│ │    Keywords: machine learning, AI, healthcare               │ │
│ │    Publications: 45 | H-Index: 12                           │ │
│ │                                                              │ │
│ │    [View Profile] [Add to Manuscript] [Send Invitation]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Dr. Sarah Williams                           ✅ Verified │ │
│ │    ORCID: 0000-0001-2345-6789                               │ │
│ │    MIT | Health Informatics                                  │ │
│ │    Keywords: NLP, clinical, machine learning                 │ │
│ │    Publications: 32 | H-Index: 9                            │ │
│ │                                                              │ │
│ │    [View Profile] [Add to Manuscript] [Send Invitation]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Manuscript Invitations

Invite collaborators using ORCID:

1. Open manuscript
2. Click **Add Collaborator**
3. Search by ORCID
4. Select researcher
5. Assign role
6. Send invitation

### Proposal Co-Investigators

Add co-investigators via ORCID:

1. Open proposal editor
2. Click **Add Co-Investigator**
3. Search ORCID registry
4. Select and add to team
5. ORCID data auto-populated

## ORCID API Configuration

### Admin Setup

Super admins configure ORCID integration:

1. Go to **Super Admin → Settings**
2. Configure ORCID settings:

| Setting | Description |
|---------|-------------|
| **Client ID** | ORCID API client identifier |
| **Client Secret** | API secret key |
| **Redirect URI** | OAuth callback URL |
| **Environment** | Sandbox or Production |

### Sandbox vs Production

| Environment | Use Case | Registry |
|-------------|----------|----------|
| **Sandbox** | Development, testing | sandbox.orcid.org |
| **Production** | Live deployment | orcid.org |

### API Endpoints

```
Sandbox:
  - Auth: https://sandbox.orcid.org/oauth/authorize
  - Token: https://sandbox.orcid.org/oauth/token
  - API: https://pub.sandbox.orcid.org/v3.0

Production:
  - Auth: https://orcid.org/oauth/authorize
  - Token: https://orcid.org/oauth/token
  - API: https://pub.orcid.org/v3.0
```

## Troubleshooting

### Common Issues

#### ORCID Connection Failed

**Symptoms:** OAuth flow doesn't complete

**Solutions:**
1. Check ORCID credentials in settings
2. Verify redirect URI matches configuration
3. Ensure ORCID service is available
4. Check browser allows popups

#### Data Not Syncing

**Symptoms:** Profile data outdated

**Solutions:**
1. Use manual refresh
2. Check ORCID profile visibility settings
3. Verify API permissions
4. Check for API rate limits

#### Researcher Not Found

**Symptoms:** ORCID search returns no results

**Solutions:**
1. Verify ORCID iD format (0000-0000-0000-0000)
2. Check researcher has public profile
3. Try alternative search terms
4. Search directly on orcid.org

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid ORCID format` | Malformed ORCID iD | Use format 0000-0000-0000-0000 |
| `ORCID not found` | iD doesn't exist | Verify ORCID on orcid.org |
| `Authorization denied` | User rejected OAuth | User must authorize access |
| `API rate limited` | Too many requests | Wait and retry |

## Privacy Considerations

### Data Visibility

ORCID data visibility levels:

| Level | Description |
|-------|-------------|
| **Everyone** | Public, visible to all |
| **Trusted parties** | Only authorized apps |
| **Only me** | Not accessible via API |

### User Control

Researchers control:

- Which data to sync
- Profile visibility settings
- ORCID connection status
- Data refresh timing

### Disconnecting ORCID

Users can disconnect ORCID:

1. Go to **Settings → ORCID**
2. Click **Disconnect ORCID**
3. Confirm disconnection
4. ORCID data removed (local data retained)

## Best Practices

### For Researchers

1. Keep ORCID profile updated
2. Use public visibility for discoverability
3. Link all publications to ORCID
4. Sync regularly with HospitiumRIS

### For Administrators

1. Use production API for live systems
2. Monitor API usage
3. Handle rate limits gracefully
4. Maintain secure credential storage

### For Organizations

1. Encourage ORCID adoption
2. Integrate ORCID in workflows
3. Validate researcher identities
4. Track ORCID-linked outputs

