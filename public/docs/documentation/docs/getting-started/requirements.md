---
sidebar_position: 1
title: System Requirements
---

# System Requirements

Before installing HospitiumRIS, ensure your environment meets the following minimum requirements.

## Hardware Requirements

### Minimum (Development/Testing)

| Component | Requirement |
|-----------|-------------|
| **CPU** | 2 cores |
| **RAM** | 4 GB |
| **Storage** | 20 GB SSD |
| **Network** | Stable internet connection |

### Recommended (Production)

| Component | Requirement |
|-----------|-------------|
| **CPU** | 4+ cores |
| **RAM** | 8 GB or more |
| **Storage** | 50+ GB SSD |
| **Network** | 1 Gbps connection |

:::info Scaling Considerations
For large institutions with 100+ active researchers, consider:
- 8+ CPU cores
- 16+ GB RAM
- Load balancing for high availability
- Dedicated database server
:::

## Software Requirements

### Operating System

HospitiumRIS is compatible with:

- **Windows** 10/11 or Windows Server 2019+
- **Linux** Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+
- **macOS** 12 (Monterey) or later

### Runtime Environment

| Software | Version | Notes |
|----------|---------|-------|
| **Node.js** | 18.x or 20.x LTS | Required - [Download](https://nodejs.org) |
| **npm** | 9.x or later | Comes with Node.js |
| **PostgreSQL** | 14 or later | Primary database |

### Node.js Installation

**Windows:**
```bash
# Using winget
winget install OpenJS.NodeJS.LTS

# Or download from nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**
```bash
# Using Homebrew
brew install node@20
```

### PostgreSQL Installation

**Windows:**
```bash
# Using winget
winget install PostgreSQL.PostgreSQL

# Or download from postgresql.org
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

## Browser Compatibility

HospitiumRIS is tested and supported on:

| Browser | Minimum Version |
|---------|-----------------|
| **Google Chrome** | 100+ |
| **Mozilla Firefox** | 100+ |
| **Microsoft Edge** | 100+ |
| **Safari** | 15+ |

:::warning Internet Explorer
Internet Explorer is **not supported**. Please use a modern browser.
:::

## Network Requirements

### Ports

| Port | Service | Required |
|------|---------|----------|
| **3000** | Next.js Development Server | Development only |
| **5432** | PostgreSQL Database | Yes |
| **80** | HTTP (Production) | Production only |
| **443** | HTTPS (Production) | Production only |

### External Services

HospitiumRIS integrates with external services that require internet access:

| Service | Purpose | Required |
|---------|---------|----------|
| **ORCID API** | Researcher authentication & profile sync | Optional but recommended |
| **PubMed/CrossRef/OpenAlex** | Publication import | Optional |
| **Zotero** | Reference management integration | Optional |

## ORCID API Setup (Optional)

For ORCID integration, you'll need:

1. Register for an ORCID Member API account at [orcid.org](https://orcid.org)
2. Create an API application to obtain:
   - Client ID
   - Client Secret
3. Configure redirect URIs for your deployment

:::tip Sandbox vs Production
Use ORCID Sandbox credentials for development/testing and Production credentials for live deployments.
:::

## Email Service (Optional)

For email notifications (activation emails, invitations), configure one of:

- SMTP server credentials
- SendGrid API
- Amazon SES
- Other transactional email service

## Pre-Installation Checklist

Before proceeding to installation, verify:

- [ ] Node.js 18+ is installed (`node --version`)
- [ ] npm 9+ is installed (`npm --version`)
- [ ] PostgreSQL 14+ is running
- [ ] You have database admin credentials
- [ ] Ports 3000 (dev) or 80/443 (prod) are available
- [ ] (Optional) ORCID API credentials are ready
- [ ] (Optional) SMTP/Email service credentials are ready

---

Ready to install? Continue to the [Installation Guide](/docs/getting-started/installation).

