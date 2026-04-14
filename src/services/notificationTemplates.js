/**
 * Notification Templates
 * Defines templates for all notification types with dynamic content generation
 */

export const notificationTemplates = {
  // ==================== MANUSCRIPT & COLLABORATION ====================
  
  COLLABORATION_INVITATION: {
    type: 'COLLABORATION_INVITATION',
    category: 'COLLABORATION',
    priority: 'HIGH',
    actionRequired: true,
    generate: ({ inviterName, manuscriptTitle, role }) => ({
      title: 'New Collaboration Invitation',
      message: `${inviterName} invited you to collaborate on "${manuscriptTitle}" as ${role}`,
      actionLabel: 'View Invitation',
      category: 'COLLABORATION',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  COLLABORATION_ACCEPTED: {
    type: 'COLLABORATION_ACCEPTED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ collaboratorName, manuscriptTitle }) => ({
      title: 'Invitation Accepted',
      message: `${collaboratorName} accepted your invitation to collaborate on "${manuscriptTitle}"`,
      actionLabel: 'View Manuscript',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  COLLABORATION_DECLINED: {
    type: 'COLLABORATION_DECLINED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ collaboratorName, manuscriptTitle }) => ({
      title: 'Invitation Declined',
      message: `${collaboratorName} declined your invitation to collaborate on "${manuscriptTitle}"`,
      actionLabel: null,
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  COLLABORATOR_ROLE_CHANGED: {
    type: 'COLLABORATOR_ROLE_CHANGED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, oldRole, newRole, changedBy }) => ({
      title: 'Role Updated',
      message: `Your role on "${manuscriptTitle}" was changed from ${oldRole} to ${newRole} by ${changedBy}`,
      actionLabel: 'View Manuscript',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  COLLABORATOR_REMOVED: {
    type: 'COLLABORATOR_REMOVED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, removedBy }) => ({
      title: 'Removed from Collaboration',
      message: `You were removed from the collaboration on "${manuscriptTitle}" by ${removedBy}`,
      actionLabel: null,
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  MANUSCRIPT_VERSION_CREATED: {
    type: 'MANUSCRIPT_VERSION_CREATED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, versionNumber, createdBy }) => ({
      title: 'New Version Created',
      message: `${createdBy} created version ${versionNumber} of "${manuscriptTitle}"`,
      actionLabel: 'View Version',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  MANUSCRIPT_STATUS_CHANGED: {
    type: 'MANUSCRIPT_STATUS_CHANGED',
    category: 'COLLABORATION',
    priority: 'HIGH',
    generate: ({ manuscriptTitle, oldStatus, newStatus, changedBy }) => ({
      title: 'Manuscript Status Updated',
      message: `"${manuscriptTitle}" status changed from ${oldStatus} to ${newStatus} by ${changedBy}`,
      actionLabel: 'View Manuscript',
      category: 'COLLABORATION',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  COMMENT_ADDED: {
    type: 'COMMENT_ADDED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, commenterName, commentPreview }) => ({
      title: 'New Comment',
      message: `${commenterName} commented on "${manuscriptTitle}": ${commentPreview}`,
      actionLabel: 'View Comment',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  COMMENT_REPLY: {
    type: 'COMMENT_REPLY',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, replierName, replyPreview }) => ({
      title: 'Comment Reply',
      message: `${replierName} replied to your comment on "${manuscriptTitle}": ${replyPreview}`,
      actionLabel: 'View Reply',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  COMMENT_MENTION: {
    type: 'COMMENT_MENTION',
    category: 'COLLABORATION',
    priority: 'HIGH',
    generate: ({ manuscriptTitle, mentionerName, commentPreview }) => ({
      title: 'You Were Mentioned',
      message: `${mentionerName} mentioned you in a comment on "${manuscriptTitle}": ${commentPreview}`,
      actionLabel: 'View Comment',
      category: 'COLLABORATION',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  TRACKED_CHANGE_ADDED: {
    type: 'TRACKED_CHANGE_ADDED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, authorName, changeType }) => ({
      title: 'New Tracked Change',
      message: `${authorName} made a ${changeType} change to "${manuscriptTitle}"`,
      actionLabel: 'Review Change',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  TRACKED_CHANGE_ACCEPTED: {
    type: 'TRACKED_CHANGE_ACCEPTED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, reviewerName }) => ({
      title: 'Change Accepted',
      message: `${reviewerName} accepted your change to "${manuscriptTitle}"`,
      actionLabel: 'View Manuscript',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  TRACKED_CHANGE_REJECTED: {
    type: 'TRACKED_CHANGE_REJECTED',
    category: 'COLLABORATION',
    priority: 'NORMAL',
    generate: ({ manuscriptTitle, reviewerName }) => ({
      title: 'Change Rejected',
      message: `${reviewerName} rejected your change to "${manuscriptTitle}"`,
      actionLabel: 'View Manuscript',
      category: 'COLLABORATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  // ==================== PROPOSALS ====================

  PROPOSAL_SUBMITTED: {
    type: 'PROPOSAL_SUBMITTED',
    category: 'PROPOSAL',
    priority: 'HIGH',
    generate: ({ proposalTitle, submitterName }) => ({
      title: 'Proposal Submitted',
      message: `Your proposal "${proposalTitle}" has been submitted for review`,
      actionLabel: 'View Proposal',
      category: 'PROPOSAL',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  PROPOSAL_REVIEW_ASSIGNED: {
    type: 'PROPOSAL_REVIEW_ASSIGNED',
    category: 'PROPOSAL',
    priority: 'HIGH',
    generate: ({ proposalTitle, submitterName }) => ({
      title: 'New Proposal to Review',
      message: `You have been assigned to review "${proposalTitle}" by ${submitterName}`,
      actionLabel: 'Review Proposal',
      category: 'PROPOSAL',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  PROPOSAL_REVIEWED: {
    type: 'PROPOSAL_REVIEWED',
    category: 'PROPOSAL',
    priority: 'HIGH',
    generate: ({ proposalTitle, reviewerName, decision }) => ({
      title: 'Proposal Reviewed',
      message: `${reviewerName} reviewed your proposal "${proposalTitle}" - Decision: ${decision}`,
      actionLabel: 'View Review',
      category: 'PROPOSAL',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  PROPOSAL_APPROVED: {
    type: 'PROPOSAL_APPROVED',
    category: 'PROPOSAL',
    priority: 'URGENT',
    generate: ({ proposalTitle }) => ({
      title: '🎉 Proposal Approved!',
      message: `Congratulations! Your proposal "${proposalTitle}" has been approved`,
      actionLabel: 'View Proposal',
      category: 'PROPOSAL',
      priority: 'URGENT',
      actionRequired: false
    })
  },

  PROPOSAL_REJECTED: {
    type: 'PROPOSAL_REJECTED',
    category: 'PROPOSAL',
    priority: 'HIGH',
    generate: ({ proposalTitle, reason }) => ({
      title: 'Proposal Not Approved',
      message: `Your proposal "${proposalTitle}" was not approved. ${reason ? `Reason: ${reason}` : ''}`,
      actionLabel: 'View Details',
      category: 'PROPOSAL',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  PROPOSAL_REVISION_REQUESTED: {
    type: 'PROPOSAL_REVISION_REQUESTED',
    category: 'PROPOSAL',
    priority: 'HIGH',
    generate: ({ proposalTitle, requirements }) => ({
      title: 'Revision Requested',
      message: `Revisions are requested for "${proposalTitle}". Please review the requirements.`,
      actionLabel: 'View Requirements',
      category: 'PROPOSAL',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  PROPOSAL_DEADLINE_APPROACHING: {
    type: 'PROPOSAL_DEADLINE_APPROACHING',
    category: 'PROPOSAL',
    priority: 'URGENT',
    generate: ({ proposalTitle, daysRemaining }) => ({
      title: '⏰ Proposal Deadline Approaching',
      message: `"${proposalTitle}" deadline is in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      actionLabel: 'View Proposal',
      category: 'PROPOSAL',
      priority: 'URGENT',
      actionRequired: true
    })
  },

  // ==================== ETHICS ====================

  ETHICS_SUBMITTED: {
    type: 'ETHICS_SUBMITTED',
    category: 'ETHICS',
    priority: 'HIGH',
    generate: ({ applicationTitle, referenceNumber }) => ({
      title: 'Ethics Application Submitted',
      message: `Your ethics application "${applicationTitle}" has been submitted. Reference: ${referenceNumber}`,
      actionLabel: 'View Application',
      category: 'ETHICS',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  ETHICS_REVIEW_ASSIGNED: {
    type: 'ETHICS_REVIEW_ASSIGNED',
    category: 'ETHICS',
    priority: 'HIGH',
    generate: ({ applicationTitle, applicantName }) => ({
      title: 'Ethics Review Assignment',
      message: `You have been assigned to review ethics application "${applicationTitle}" by ${applicantName}`,
      actionLabel: 'Review Application',
      category: 'ETHICS',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  ETHICS_APPROVED: {
    type: 'ETHICS_APPROVED',
    category: 'ETHICS',
    priority: 'URGENT',
    generate: ({ applicationTitle, referenceNumber, expiryDate }) => ({
      title: '✅ Ethics Approval Granted',
      message: `Your ethics application "${applicationTitle}" (${referenceNumber}) has been approved. Valid until ${expiryDate}`,
      actionLabel: 'View Approval',
      category: 'ETHICS',
      priority: 'URGENT',
      actionRequired: false
    })
  },

  ETHICS_CONDITIONAL_APPROVAL: {
    type: 'ETHICS_CONDITIONAL_APPROVAL',
    category: 'ETHICS',
    priority: 'HIGH',
    generate: ({ applicationTitle, conditionsCount }) => ({
      title: 'Conditional Ethics Approval',
      message: `Your ethics application "${applicationTitle}" received conditional approval with ${conditionsCount} condition(s)`,
      actionLabel: 'View Conditions',
      category: 'ETHICS',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  ETHICS_REJECTED: {
    type: 'ETHICS_REJECTED',
    category: 'ETHICS',
    priority: 'HIGH',
    generate: ({ applicationTitle, concerns }) => ({
      title: 'Ethics Application Not Approved',
      message: `Your ethics application "${applicationTitle}" was not approved. Please review the ethical concerns.`,
      actionLabel: 'View Feedback',
      category: 'ETHICS',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  ETHICS_EXPIRING_SOON: {
    type: 'ETHICS_EXPIRING_SOON',
    category: 'ETHICS',
    priority: 'URGENT',
    generate: ({ applicationTitle, referenceNumber, daysRemaining }) => ({
      title: '⚠️ Ethics Approval Expiring',
      message: `Ethics approval for "${applicationTitle}" (${referenceNumber}) expires in ${daysRemaining} days`,
      actionLabel: 'Renew Approval',
      category: 'ETHICS',
      priority: 'URGENT',
      actionRequired: true
    })
  },

  // ==================== GRANTS ====================

  GRANT_AWARDED: {
    type: 'GRANT_AWARDED',
    category: 'GRANT',
    priority: 'URGENT',
    generate: ({ grantTitle, awardedAmount, grantorName }) => ({
      title: '🎉 Grant Awarded!',
      message: `Congratulations! You have been awarded ${awardedAmount} for "${grantTitle}" from ${grantorName}`,
      actionLabel: 'View Grant',
      category: 'GRANT',
      priority: 'URGENT',
      actionRequired: false
    })
  },

  GRANT_REJECTED: {
    type: 'GRANT_REJECTED',
    category: 'GRANT',
    priority: 'HIGH',
    generate: ({ grantTitle, grantorName }) => ({
      title: 'Grant Application Update',
      message: `Your grant application "${grantTitle}" to ${grantorName} was not successful`,
      actionLabel: 'View Details',
      category: 'GRANT',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  GRANT_DEADLINE_APPROACHING: {
    type: 'GRANT_DEADLINE_APPROACHING',
    category: 'GRANT',
    priority: 'URGENT',
    generate: ({ grantTitle, daysRemaining }) => ({
      title: '⏰ Grant Deadline Approaching',
      message: `Grant application "${grantTitle}" deadline is in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      actionLabel: 'View Application',
      category: 'GRANT',
      priority: 'URGENT',
      actionRequired: true
    })
  },

  GRANT_MILESTONE_DUE: {
    type: 'GRANT_MILESTONE_DUE',
    category: 'GRANT',
    priority: 'HIGH',
    generate: ({ grantTitle, milestoneName, dueDate }) => ({
      title: 'Grant Milestone Due',
      message: `Milestone "${milestoneName}" for grant "${grantTitle}" is due on ${dueDate}`,
      actionLabel: 'View Milestone',
      category: 'GRANT',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  GRANT_REPORT_DUE: {
    type: 'GRANT_REPORT_DUE',
    category: 'GRANT',
    priority: 'HIGH',
    generate: ({ grantTitle, reportType, dueDate }) => ({
      title: 'Grant Report Due',
      message: `${reportType} report for grant "${grantTitle}" is due on ${dueDate}`,
      actionLabel: 'Submit Report',
      category: 'GRANT',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  GRANT_COMMUNICATION_RECEIVED: {
    type: 'GRANT_COMMUNICATION_RECEIVED',
    category: 'GRANT',
    priority: 'HIGH',
    generate: ({ grantTitle, grantorName, subject }) => ({
      title: 'New Grant Communication',
      message: `New message from ${grantorName} regarding "${grantTitle}": ${subject}`,
      actionLabel: 'View Message',
      category: 'GRANT',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  // ==================== TRAINING ====================

  TRAINING_AVAILABLE: {
    type: 'TRAINING_AVAILABLE',
    category: 'TRAINING',
    priority: 'NORMAL',
    generate: ({ trainingTitle, startDate, department }) => ({
      title: 'New Training Available',
      message: `New training "${trainingTitle}" is available starting ${startDate} (${department})`,
      actionLabel: 'Register',
      category: 'TRAINING',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  TRAINING_REGISTERED: {
    type: 'TRAINING_REGISTERED',
    category: 'TRAINING',
    priority: 'NORMAL',
    generate: ({ trainingTitle, startDate }) => ({
      title: 'Training Registration Confirmed',
      message: `You are registered for "${trainingTitle}" starting ${startDate}`,
      actionLabel: 'View Details',
      category: 'TRAINING',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  TRAINING_STARTING_SOON: {
    type: 'TRAINING_STARTING_SOON',
    category: 'TRAINING',
    priority: 'HIGH',
    generate: ({ trainingTitle, startTime, location }) => ({
      title: '⏰ Training Starting Soon',
      message: `"${trainingTitle}" starts ${startTime}${location ? ` at ${location}` : ''}`,
      actionLabel: 'View Details',
      category: 'TRAINING',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  TRAINING_CERTIFICATE_ISSUED: {
    type: 'TRAINING_CERTIFICATE_ISSUED',
    category: 'TRAINING',
    priority: 'NORMAL',
    generate: ({ trainingTitle }) => ({
      title: '🎓 Certificate Issued',
      message: `Your certificate for "${trainingTitle}" is now available`,
      actionLabel: 'Download Certificate',
      category: 'TRAINING',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  TRAINING_NEW_REGISTRATION: {
    type: 'TRAINING_NEW_REGISTRATION',
    category: 'TRAINING',
    priority: 'NORMAL',
    generate: ({ trainingTitle, participantName, currentCount, maxParticipants }) => ({
      title: 'New Training Registration',
      message: `${participantName} registered for "${trainingTitle}" (${currentCount}/${maxParticipants})`,
      actionLabel: 'View Registrations',
      category: 'TRAINING',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  // ==================== PUBLICATIONS ====================

  PUBLICATION_IMPORTED: {
    type: 'PUBLICATION_IMPORTED',
    category: 'PUBLICATION',
    priority: 'NORMAL',
    generate: ({ publicationTitle, source, count }) => ({
      title: 'Publications Imported',
      message: count > 1 
        ? `${count} publications imported from ${source}`
        : `"${publicationTitle}" imported from ${source}`,
      actionLabel: 'View Publications',
      category: 'PUBLICATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  COAUTHOR_PUBLICATION_DETECTED: {
    type: 'COAUTHOR_PUBLICATION_DETECTED',
    category: 'PUBLICATION',
    priority: 'NORMAL',
    generate: ({ publicationTitle, coauthorName }) => ({
      title: 'Co-author Publication Found',
      message: `New publication detected with co-author ${coauthorName}: "${publicationTitle}"`,
      actionLabel: 'View Publication',
      category: 'PUBLICATION',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  // ==================== PREPRINTS ====================

  PREPRINT_ACCEPTED: {
    type: 'PREPRINT_ACCEPTED',
    category: 'PREPRINT',
    priority: 'HIGH',
    generate: ({ preprintTitle, serverName }) => ({
      title: '✅ Preprint Accepted',
      message: `Your preprint "${preprintTitle}" has been accepted by ${serverName}`,
      actionLabel: 'View Preprint',
      category: 'PREPRINT',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  PREPRINT_PUBLISHED: {
    type: 'PREPRINT_PUBLISHED',
    category: 'PREPRINT',
    priority: 'HIGH',
    generate: ({ preprintTitle, serverName, doi }) => ({
      title: '🎉 Preprint Published!',
      message: `Your preprint "${preprintTitle}" is now published on ${serverName}${doi ? ` (DOI: ${doi})` : ''}`,
      actionLabel: 'View Preprint',
      category: 'PREPRINT',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  PREPRINT_REJECTED: {
    type: 'PREPRINT_REJECTED',
    category: 'PREPRINT',
    priority: 'NORMAL',
    generate: ({ preprintTitle, serverName }) => ({
      title: 'Preprint Submission Update',
      message: `Your preprint "${preprintTitle}" was not accepted by ${serverName}`,
      actionLabel: 'View Details',
      category: 'PREPRINT',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  // ==================== USER & ACCOUNT ====================

  ACCOUNT_ACTIVATED: {
    type: 'ACCOUNT_ACTIVATED',
    category: 'ACCOUNT',
    priority: 'HIGH',
    generate: ({ userName }) => ({
      title: '🎉 Account Activated!',
      message: `Welcome to HospitiumRIS! Your account has been activated and you can now access all features.`,
      actionLabel: 'Get Started',
      category: 'ACCOUNT',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  ACCOUNT_TYPE_CHANGED: {
    type: 'ACCOUNT_TYPE_CHANGED',
    category: 'ACCOUNT',
    priority: 'HIGH',
    generate: ({ oldType, newType, changedBy }) => ({
      title: 'Account Type Updated',
      message: `Your account type has been changed from ${oldType} to ${newType} by ${changedBy}`,
      actionLabel: 'View Profile',
      category: 'ACCOUNT',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  NEW_USER_REGISTRATION: {
    type: 'NEW_USER_REGISTRATION',
    category: 'ACCOUNT',
    priority: 'NORMAL',
    generate: ({ userName, userEmail, accountType }) => ({
      title: 'New User Registration',
      message: `${userName} (${userEmail}) registered as ${accountType}`,
      actionLabel: 'Review User',
      category: 'ACCOUNT',
      priority: 'NORMAL',
      actionRequired: true
    })
  },

  // ==================== CAMPAIGNS & DONATIONS ====================

  DONATION_RECEIVED: {
    type: 'DONATION_RECEIVED',
    category: 'CAMPAIGN',
    priority: 'NORMAL',
    generate: ({ donorName, amount, campaignName }) => ({
      title: '💝 New Donation Received',
      message: `${donorName} donated ${amount}${campaignName ? ` to "${campaignName}"` : ''}`,
      actionLabel: 'View Donation',
      category: 'CAMPAIGN',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  CAMPAIGN_MILESTONE_REACHED: {
    type: 'CAMPAIGN_MILESTONE_REACHED',
    category: 'CAMPAIGN',
    priority: 'HIGH',
    generate: ({ campaignName, milestone, currentAmount }) => ({
      title: '🎯 Campaign Milestone Reached!',
      message: `"${campaignName}" reached ${milestone}! Current total: ${currentAmount}`,
      actionLabel: 'View Campaign',
      category: 'CAMPAIGN',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  // ==================== INTERNAL GRANTS ====================

  INTERNAL_GRANT_APPROVED: {
    type: 'INTERNAL_GRANT_APPROVED',
    category: 'INTERNAL_GRANT',
    priority: 'URGENT',
    generate: ({ grantTitle, approvedAmount }) => ({
      title: '🎉 Internal Grant Approved!',
      message: `Your internal grant request "${grantTitle}" has been approved for ${approvedAmount}`,
      actionLabel: 'View Grant',
      category: 'INTERNAL_GRANT',
      priority: 'URGENT',
      actionRequired: false
    })
  },

  INTERNAL_GRANT_REVIEW_ASSIGNED: {
    type: 'INTERNAL_GRANT_REVIEW_ASSIGNED',
    category: 'INTERNAL_GRANT',
    priority: 'HIGH',
    generate: ({ grantTitle, applicantName, requestedAmount }) => ({
      title: 'Internal Grant Review Assignment',
      message: `Review requested for "${grantTitle}" by ${applicantName} (${requestedAmount})`,
      actionLabel: 'Review Grant',
      category: 'INTERNAL_GRANT',
      priority: 'HIGH',
      actionRequired: true
    })
  },

  // ==================== SYSTEM ====================

  SYSTEM_MAINTENANCE: {
    type: 'SYSTEM_MAINTENANCE',
    category: 'SYSTEM',
    priority: 'HIGH',
    generate: ({ scheduledTime, duration, description }) => ({
      title: '🔧 Scheduled Maintenance',
      message: `System maintenance scheduled for ${scheduledTime} (${duration}). ${description}`,
      actionLabel: null,
      category: 'SYSTEM',
      priority: 'HIGH',
      actionRequired: false
    })
  },

  SYSTEM_ANNOUNCEMENT: {
    type: 'SYSTEM_ANNOUNCEMENT',
    category: 'SYSTEM',
    priority: 'NORMAL',
    generate: ({ title, message }) => ({
      title: `📢 ${title}`,
      message,
      actionLabel: null,
      category: 'SYSTEM',
      priority: 'NORMAL',
      actionRequired: false
    })
  },

  SECURITY_ALERT: {
    type: 'SECURITY_ALERT',
    category: 'SYSTEM',
    priority: 'URGENT',
    generate: ({ alertType, description }) => ({
      title: `🔒 Security Alert: ${alertType}`,
      message: description,
      actionLabel: 'Review Alert',
      category: 'SYSTEM',
      priority: 'URGENT',
      actionRequired: true
    })
  }
};

/**
 * Get template by notification type
 * @param {string} type - Notification type
 * @returns {Object|null} Template or null if not found
 */
export function getTemplate(type) {
  return notificationTemplates[type] || null;
}

/**
 * Get all templates for a category
 * @param {string} category - Notification category
 * @returns {Array} Array of templates
 */
export function getTemplatesByCategory(category) {
  return Object.entries(notificationTemplates)
    .filter(([_, template]) => template.category === category)
    .map(([key, template]) => ({ key, ...template }));
}

export default notificationTemplates;
