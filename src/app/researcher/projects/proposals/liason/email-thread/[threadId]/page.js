'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Launch as LaunchIcon,
  Star as StarIcon,
  Star as StarFilledIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Send as SendIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import PageHeader from '../../../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../../../components/AuthProvider';

export default function EmailThreadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const threadId = params.threadId;

  // State management
  const [quickReplyText, setQuickReplyText] = useState('');
  const [starredMessages, setStarredMessages] = useState(new Set());
  const [isImportant, setIsImportant] = useState(false);

  // Mock data - same as in the modal
  const getMockMessages = (threadId) => {
    const baseMessages = {
      'thread-1': {
        subject: 'NSF Grant Application - Follow Up',
        participants: ['sarah.johnson@nsf.gov', 'researcher@university.edu'],
        messages: [
          {
            id: 1,
            from: 'researcher@university.edu',
            fromName: 'Dr. John Researcher',
            to: 'sarah.johnson@nsf.gov',
            toName: 'Dr. Sarah Johnson',
            subject: 'NSF Grant Application - Follow Up',
            body: `Dear Dr. Johnson,

I hope this email finds you well. I wanted to follow up on our grant application submitted on September 15th for the "AI-Driven Cardiovascular Risk Assessment Platform" project.

Could you please provide an update on the current status of our application? We are particularly interested to know if there are any additional materials or clarifications needed from our end.

Thank you for your time and consideration.

Best regards,
Dr. John Researcher
Principal Investigator
University Research Department`,
            timestamp: new Date('2024-10-01T10:30:00'),
            isFromUser: true
          },
          {
            id: 2,
            from: 'sarah.johnson@nsf.gov',
            fromName: 'Dr. Sarah Johnson',
            to: 'researcher@university.edu',
            toName: 'Dr. John Researcher',
            subject: 'Re: NSF Grant Application - Follow Up',
            body: `Dear Dr. Researcher,

Thank you for your inquiry regarding your grant application for the AI-Driven Cardiovascular Risk Assessment Platform.

I'm pleased to inform you that your application has successfully passed the initial review phase and is currently being evaluated by our expert panel. The review process typically takes 6-8 weeks from this stage.

We were particularly impressed with the innovation in your machine learning approach and the potential clinical impact of your proposed platform.

I will keep you updated on any developments. Please don't hesitate to reach out if you have any questions.

Best regards,
Dr. Sarah Johnson
Program Officer
National Science Foundation`,
            timestamp: new Date('2024-10-03T14:20:00'),
            isFromUser: false
          },
          {
            id: 3,
            from: 'researcher@university.edu',
            fromName: 'Dr. John Researcher',
            to: 'sarah.johnson@nsf.gov',
            toName: 'Dr. Sarah Johnson',
            subject: 'Re: NSF Grant Application - Follow Up',
            body: `Dear Dr. Johnson,

Thank you so much for the positive update! We are thrilled to hear that our application has progressed to the expert panel review stage.

I wanted to let you know that we have recently published a related paper in the Journal of Medical AI that further validates our approach. Would it be appropriate to submit this as supplementary material?

Also, we have received additional institutional support that we'd like to document if it would strengthen our application.

Looking forward to hearing from you.

Best regards,
Dr. John Researcher`,
            timestamp: new Date('2024-10-05T09:15:00'),
            isFromUser: true
          },
          {
            id: 4,
            from: 'sarah.johnson@nsf.gov',
            fromName: 'Dr. Sarah Johnson',
            to: 'researcher@university.edu',
            toName: 'Dr. John Researcher',
            subject: 'Re: NSF Grant Application - Follow Up',
            body: `Dear Dr. Researcher,

That's excellent news about your recent publication! Yes, please do submit it as supplementary material. You can upload it through our grants portal using reference number NSF-2024-AI-CV-789.

The additional institutional support documentation would also be valuable. Please submit both items by October 20th to ensure they are included in the final review.

The expert panel review is progressing well, and we expect to have preliminary feedback by early November.

Best regards,
Dr. Sarah Johnson`,
            timestamp: new Date('2024-10-08T11:45:00'),
            isFromUser: false
          },
          {
            id: 5,
            from: 'researcher@university.edu',
            fromName: 'Dr. John Researcher',
            to: 'sarah.johnson@nsf.gov',
            toName: 'Dr. Sarah Johnson',
            subject: 'Re: NSF Grant Application - Supplementary Materials Submitted',
            body: `Dear Dr. Johnson,

I have successfully submitted both the recent publication and the institutional support documentation through the grants portal. The confirmation numbers are:

- Publication: SUP-2024-789-PUB-001
- Institutional Support: SUP-2024-789-INST-002

Thank you for accommodating these additional materials. We're excited about the potential opportunity to contribute to NSF's mission in advancing AI applications in healthcare.

Please let me know if you need anything else from our team.

Best regards,
Dr. John Researcher`,
            timestamp: new Date('2024-10-15T16:20:00'),
            isFromUser: true
          }
        ]
      },
      'thread-2': {
        subject: 'Grant Approval - Next Steps',
        participants: ['michael.chen@gatesfoundation.org', 'researcher@university.edu'],
        messages: [
          {
            id: 1,
            from: 'michael.chen@gatesfoundation.org',
            fromName: 'Michael Chen',
            to: 'researcher@university.edu',
            toName: 'Dr. John Researcher',
            subject: 'Grant Approval - Congratulations!',
            body: `Dear Dr. Researcher,

I am delighted to inform you that your grant application for "Telemedicine Solutions for Rural Healthcare Access" has been approved by the Gates Foundation review board!

Your proposal impressed our panel with its innovative approach to addressing healthcare disparities in underserved communities. The total approved funding amount is $750,000 over 3 years.

Next steps:
1. Contract finalization (expected 2-3 weeks)
2. Milestone agreement setup
3. Initial funding disbursement

I will be your primary contact throughout the project lifecycle. Congratulations on this significant achievement!

Best regards,
Michael Chen
Senior Program Officer
Bill & Melinda Gates Foundation`,
            timestamp: new Date('2024-10-20T13:30:00'),
            isFromUser: false
          }
        ]
      },
      'thread-3': {
        subject: 'Grant Application Status Update',
        participants: ['lisa.park@hhmi.org', 'researcher@university.edu'],
        messages: [
          {
            id: 1,
            from: 'lisa.park@hhmi.org',
            fromName: 'Dr. Lisa Park',
            to: 'researcher@university.edu',
            toName: 'Dr. John Researcher',
            subject: 'Grant Application Status - Update Required',
            body: `Dear Dr. Researcher,

Thank you for your application to the Howard Hughes Medical Institute for the "Machine Learning for Cancer Diagnostics" project.

After careful review by our scientific advisory board, we regret to inform you that your application was not selected for funding in this cycle. The competition was exceptionally strong this year, with over 400 applications for 25 available slots.

Feedback from reviewers:
- Strong technical approach but needs more clinical validation data
- Budget justification could be more detailed
- Consider partnering with a clinical institution for future applications

We encourage you to reapply in the next cycle with these considerations addressed.

Best regards,
Dr. Lisa Park
Program Director
Howard Hughes Medical Institute`,
            timestamp: new Date('2024-09-25T15:45:00'),
            isFromUser: false
          }
        ]
      }
    };
    
    return baseMessages[threadId] || null;
  };

  const threadData = getMockMessages(threadId);

  // Handlers
  const handleStarMessage = (messageId) => {
    const newStarredMessages = new Set(starredMessages);
    if (newStarredMessages.has(messageId)) {
      newStarredMessages.delete(messageId);
    } else {
      newStarredMessages.add(messageId);
    }
    setStarredMessages(newStarredMessages);
  };

  const handleReplyToMessage = (message) => {
    const replySubject = message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`;
    const replyBody = `\n\n--- Original Message ---\nFrom: ${message.fromName} <${message.from}>\nDate: ${format(message.timestamp, 'MMM dd, yyyy \'at\' HH:mm')}\nSubject: ${message.subject}\n\n${message.body}`;
    
    // In a real app, this would open compose dialog or navigate to compose page
    alert(`Reply functionality would open with:\nSubject: ${replySubject}\n\nThis would integrate with email compose system.`);
  };

  const handleForwardMessage = (message) => {
    const forwardSubject = `Fwd: ${message.subject}`;
    const forwardBody = `\n\n--- Forwarded Message ---\nFrom: ${message.fromName} <${message.from}>\nTo: ${message.toName} <${message.to}>\nDate: ${format(message.timestamp, 'MMM dd, yyyy \'at\' HH:mm')}\nSubject: ${message.subject}\n\n${message.body}`;
    
    // In a real app, this would open compose dialog or navigate to compose page
    alert(`Forward functionality would open with:\nSubject: ${forwardSubject}\n\nThis would integrate with email compose system.`);
  };

  const handleSendQuickReply = () => {
    if (!quickReplyText.trim()) return;

    // In a real app, this would send the email
    alert('Reply sent successfully!');
    setQuickReplyText('');
  };

  const handleOpenInEmailClient = () => {
    const emailClient = `mailto:${threadData?.participants.join(';')}?subject=${encodeURIComponent(threadData?.subject || '')}`;
    window.open(emailClient);
  };

  if (!threadData) {
    return (
      <Box sx={{ minHeight: '100vh', mt: 8 }}>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">Thread not found</Typography>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Back to CRM
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', mt: 8 }}>
      <PageHeader
        title={threadData.subject}
        description={`Email conversation with ${threadData.participants.length} participants`}
        icon={<EmailIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher' },
          { label: 'Projects', path: '/researcher/projects' },
          { label: 'Proposals', path: '/researcher/projects/proposals' },
          { label: 'Grant Liaison', path: '/researcher/projects/proposals/liason' },
        ]}
        actionButton={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/researcher/projects/proposals/liason')}
              sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Back to CRM
            </Button>
            <Button
              variant="contained"
              startIcon={<LaunchIcon />}
              onClick={handleOpenInEmailClient}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Open in Email Client
            </Button>
          </Box>
        }
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Thread Info Bar */}
        <Box sx={{ 
          bgcolor: 'white', 
          borderRadius: 2, 
          p: 3, 
          mb: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Participants: {threadData.participants.join(', ')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {threadData.messages.length} messages in this conversation
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title={isImportant ? "Remove from Important" : "Mark as Important"}>
              <IconButton 
                onClick={() => setIsImportant(!isImportant)}
                sx={{ color: isImportant ? '#ffc107' : 'inherit' }}
              >
                {isImportant ? <StarFilledIcon /> : <StarIcon />}
              </IconButton>
            </Tooltip>
            <Chip 
              label={`${threadData.messages.length} messages`} 
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ 
          bgcolor: '#f8f9fa',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Stack spacing={0}>
            {threadData.messages.map((message, index) => (
              <Box key={message.id}>
                <Box sx={{
                  p: 4,
                  bgcolor: message.isFromUser ? '#e3f2fd' : 'white',
                  borderLeft: message.isFromUser ? '4px solid #2196f3' : '4px solid #4caf50',
                }}>
                  {/* Message Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: message.isFromUser ? 'primary.main' : 'success.main',
                        fontSize: '1rem'
                      }}>
                        {message.fromName.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {message.fromName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {message.from}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="textSecondary">
                        {format(message.timestamp, 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {format(message.timestamp, 'HH:mm')}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Message Subject */}
                  {(index === 0 || message.subject !== threadData.subject) && (
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>
                      Subject: {message.subject}
                    </Typography>
                  )}

                  {/* Message Body */}
                  <Typography variant="body1" sx={{ 
                    whiteSpace: 'pre-line',
                    lineHeight: 1.7,
                    mb: 3
                  }}>
                    {message.body}
                  </Typography>

                  {/* Message Actions */}
                  <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <Button 
                      size="small" 
                      startIcon={<ReplyIcon />}
                      onClick={() => handleReplyToMessage(message)}
                      variant="outlined"
                    >
                      Reply
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<ForwardIcon />}
                      onClick={() => handleForwardMessage(message)}
                      variant="outlined"
                    >
                      Forward
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={starredMessages.has(message.id) ? <StarFilledIcon /> : <StarIcon />}
                      onClick={() => handleStarMessage(message.id)}
                      variant="outlined"
                      sx={{ 
                        color: starredMessages.has(message.id) ? '#ffc107' : 'inherit',
                        borderColor: starredMessages.has(message.id) ? '#ffc107' : 'inherit'
                      }}
                    >
                      {starredMessages.has(message.id) ? 'Starred' : 'Star'}
                    </Button>
                  </Box>
                </Box>
                
                {/* Message Separator */}
                {index < threadData.messages.length - 1 && (
                  <Divider />
                )}
              </Box>
            ))}
          </Stack>

          {/* Quick Reply Section */}
          <Box sx={{ 
            p: 4, 
            bgcolor: 'white',
            borderTop: '2px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReplyIcon /> Quick Reply
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                multiline
                rows={3}
                placeholder="Type your reply..."
                variant="outlined"
                fullWidth
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                sx={{ bgcolor: 'white' }}
              />
              <Button 
                variant="contained" 
                startIcon={<SendIcon />}
                onClick={handleSendQuickReply}
                disabled={!quickReplyText.trim()}
                sx={{ 
                  whiteSpace: 'nowrap',
                  minHeight: 56
                }}
                size="large"
              >
                Send Reply
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
