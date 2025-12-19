---
sidebar_position: 4
title: Super Admin Portal
---

# Super Admin Portal

The Super Admin Portal provides system-wide administrative capabilities for managing users, database operations, and platform configuration.

## Dashboard Overview

The super admin dashboard displays:

- **System Health** - Server status, database connectivity
- **User Statistics** - Total users by type and status
- **Recent Registrations** - New user signups
- **System Alerts** - Warnings and critical notifications
- **Quick Actions** - Common administrative tasks

## User Management

### User Directory

Comprehensive view of all system users:

| Column | Description |
|--------|-------------|
| **Name** | User's full name |
| **Email** | Email address |
| **Account Type** | RESEARCHER, RESEARCH_ADMIN, FOUNDATION_ADMIN, SUPER_ADMIN |
| **Status** | PENDING, ACTIVE, INACTIVE, SUSPENDED |
| **ORCID** | ORCID iD if linked |
| **Institution** | Primary affiliation |
| **Created** | Registration date |
| **Last Active** | Last login timestamp |

### User Filtering

Filter users by:

- Account type
- Status
- Institution
- Registration date range
- ORCID verification status

### User Actions

| Action | Description |
|--------|-------------|
| **View Details** | Full user profile |
| **Edit User** | Modify user information |
| **Change Status** | Activate, deactivate, suspend |
| **Reset Password** | Send password reset |
| **Impersonate** | Login as user (audit logged) |
| **Delete User** | Permanently remove (with confirmation) |

### Account Types

```
┌─────────────────────────────────────────────────────────────┐
│                     ACCOUNT HIERARCHY                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐                                        │
│  │   SUPER_ADMIN   │  ← Full system access                  │
│  └────────┬────────┘                                        │
│           │                                                  │
│  ┌────────┴────────────────────────────────────┐            │
│  │                                             │            │
│  ▼                                             ▼            │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │ RESEARCH_ADMIN  │              │FOUNDATION_ADMIN │       │
│  │ (Institution)   │              │  (Foundation)   │       │
│  └────────┬────────┘              └────────┬────────┘       │
│           │                                │                 │
│           ▼                                ▼                 │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │   RESEARCHER    │              │   (Donors, etc) │       │
│  └─────────────────┘              └─────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Bulk Operations

Perform actions on multiple users:

- Bulk status change
- Bulk email notification
- Export user list
- Bulk delete (with safeguards)

## Database Management

### Database Statistics

View database health and metrics:

| Metric | Description |
|--------|-------------|
| **Total Tables** | Number of database tables |
| **Total Records** | Sum of all records |
| **Database Size** | Storage utilization |
| **Connection Pool** | Active connections |

### Table-Level Stats

Per-table information:

| Table | Records | Size | Last Modified |
|-------|---------|------|---------------|
| users | 1,234 | 5.2 MB | 2 hours ago |
| manuscripts | 567 | 45.1 MB | 10 minutes ago |
| publications | 8,901 | 12.3 MB | 1 hour ago |
| proposals | 234 | 8.7 MB | 3 hours ago |

### Database Backup

Create and manage backups:

1. **Manual Backup**
   - On-demand full backup
   - Table-specific backups
   - Download backup files

2. **Scheduled Backups**
   - Daily automatic backups
   - Weekly full backups
   - Retention policy configuration

3. **Backup Storage**
   - Local storage
   - Cloud storage integration
   - Off-site replication

### Backup History

| Backup | Date | Size | Type | Status |
|--------|------|------|------|--------|
| backup_20241217_0300.sql | Dec 17, 2024 | 125 MB | Scheduled | Complete |
| backup_20241216_0300.sql | Dec 16, 2024 | 124 MB | Scheduled | Complete |
| backup_manual_20241215.sql | Dec 15, 2024 | 123 MB | Manual | Complete |

### Data Export

Export data for analysis or migration:

- **Format Options**: SQL, CSV, JSON
- **Scope Options**: Full database, selected tables, filtered data
- **Compression**: Gzip, Zip, None

### Database Maintenance

Routine maintenance operations:

| Operation | Description | Frequency |
|-----------|-------------|-----------|
| **Vacuum** | Reclaim storage | Weekly |
| **Analyze** | Update statistics | Daily |
| **Reindex** | Rebuild indexes | Monthly |
| **Health Check** | Verify integrity | Daily |

:::warning Maintenance Windows
Schedule maintenance during low-usage periods to minimize disruption.
:::

## System Configuration

### Application Settings

Configure system-wide settings:

| Setting | Description |
|---------|-------------|
| **Site Name** | Application display name |
| **Site URL** | Base URL for links |
| **Admin Email** | System admin contact |
| **Session Timeout** | Auto-logout duration |
| **Max Upload Size** | File upload limit |

### Email Configuration

SMTP and notification settings:

```
SMTP Host: smtp.example.com
SMTP Port: 587
SMTP User: notifications@hospitiumris.com
From Name: HospitiumRIS
From Email: noreply@hospitiumris.com
```

### ORCID Integration

Manage ORCID API settings:

| Setting | Description |
|---------|-------------|
| **Client ID** | ORCID API client identifier |
| **Client Secret** | API secret (masked) |
| **Redirect URI** | OAuth callback URL |
| **Environment** | Sandbox or Production |

### Security Settings

| Setting | Description |
|---------|-------------|
| **Password Policy** | Minimum requirements |
| **Session Duration** | Login session length |
| **2FA Requirement** | Two-factor authentication |
| **IP Whitelist** | Allowed admin IPs |
| **Rate Limiting** | API request limits |

## Audit Logs

### Activity Logging

Track all administrative actions:

| Log Entry | Details |
|-----------|---------|
| **Timestamp** | When the action occurred |
| **User** | Who performed the action |
| **Action** | What was done |
| **Target** | Affected resource |
| **IP Address** | Origin IP |
| **Details** | Additional context |

### Log Types

| Type | Examples |
|------|----------|
| **Authentication** | Login, logout, failed attempts |
| **User Management** | Create, update, delete users |
| **Data Access** | View, export, download |
| **Configuration** | Settings changes |
| **Database** | Backup, restore, maintenance |

### Log Search & Filter

Query logs by:

- Date range
- User
- Action type
- Target resource
- IP address

### Log Retention

- **Default**: 90 days
- **Extended**: 1 year (configurable)
- **Archived**: Compressed long-term storage

## System Monitoring

### Health Dashboard

Real-time system monitoring:

| Indicator | Status | Details |
|-----------|--------|---------|
| 🟢 **Application** | Healthy | v0.1.0 running |
| 🟢 **Database** | Connected | PostgreSQL 14 |
| 🟢 **Email Service** | Available | SMTP connected |
| 🟡 **Storage** | Warning | 75% utilized |

### Performance Metrics

- Request response times
- API endpoint latency
- Database query performance
- Memory utilization
- CPU usage

### Alerts & Notifications

Configure alerts for:

- Server downtime
- Database connection failures
- High error rates
- Storage thresholds
- Unusual activity patterns

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Monitor    │────>│   Manage     │────>│   Configure  │     │
│  │   System     │     │    Users     │     │   Settings   │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│          │                    │                    │             │
│          ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │    Check     │     │   Review     │     │   Perform    │     │
│  │    Health    │     │    Logs      │     │  Maintenance │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│          │                    │                    │             │
│          ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Respond    │     │   Backup     │     │   Update     │     │
│  │  to Alerts   │     │   Database   │     │   System     │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Best Practices

### Access Control

1. Limit super admin accounts
2. Use strong, unique passwords
3. Enable two-factor authentication
4. Review access regularly
5. Revoke unused accounts promptly

### Data Protection

1. Regular backup verification
2. Encrypt sensitive data
3. Secure backup storage
4. Test restore procedures
5. Document recovery plans

### Monitoring

1. Review audit logs daily
2. Set up automated alerts
3. Monitor for unusual patterns
4. Track failed login attempts
5. Regular security audits

### Incident Response

1. Documented response procedures
2. Escalation paths defined
3. Communication templates ready
4. Regular drills conducted
5. Post-incident reviews

## Emergency Procedures

### Database Recovery

```bash
# Stop the application
npm run stop

# Restore from backup
pg_restore -U hospitiumuser -d hospitiumris backup_file.sql

# Restart the application
npm start
```

### User Lockout Recovery

1. Access database directly
2. Reset user status to ACTIVE
3. Clear failed login attempts
4. Reset password if needed
5. Notify user of restoration

### System Recovery

1. Check server status
2. Verify database connectivity
3. Review error logs
4. Restart services if needed
5. Verify functionality
6. Communicate status to users

