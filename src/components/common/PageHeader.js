'use client';

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useRouter } from 'next/navigation';

const PageHeader = ({
  title,
  description,
  icon,
  breadcrumbs = [],
  actionButton = null,
  gradient = 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
  // Optional: short text for the last breadcrumb (long titles), a row of chips or
  // facts under the description, a 2-line clamp for long titles, and a compact height.
  crumbLabel = null,
  meta = null,
  clampTitle = false,
  compact = false,
}) => {
  const router = useRouter();

  const handleBreadcrumbClick = (path) => {
    if (path) {
      router.push(path);
    }
  };

  return (
    <Box
      sx={{
        background: gradient,
        color: 'white',
        py: compact ? 2.5 : 4,
        px: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          transform: 'translate(100px, -100px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          transform: 'translate(-50px, 50px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1600px',
          mx: 'auto',
          width: '100%',
        }}
      >
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            sx={{
              mb: compact ? 1.5 : 3,
              '& .MuiBreadcrumbs-separator': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiLink-root': { color: 'rgba(255,255,255,0.9)' },
            }}
          >
            {breadcrumbs.map((breadcrumb, index) => (
              <Link
                key={index}
                underline="hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: breadcrumb.path ? 'pointer' : 'default',
                  '&:hover': { color: breadcrumb.path ? 'white' : 'inherit' },
                }}
                onClick={() => handleBreadcrumbClick(breadcrumb.path)}
              >
                {breadcrumb.icon && (
                  <Box sx={{ mr: 0.5, fontSize: 16, display: 'flex' }}>
                    {breadcrumb.icon}
                  </Box>
                )}
                {breadcrumb.label}
              </Link>
            ))}
            <Typography sx={{ color: 'white', fontWeight: 500 }}>
              {crumbLabel || title}
            </Typography>
          </Breadcrumbs>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '1 1 480px' }}>
            {icon && (
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: compact ? 52 : 64,
                  height: compact ? 52 : 64,
                  flexShrink: 0,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {icon}
              </Avatar>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h4"
                title={clampTitle && typeof title === 'string' ? title : undefined}
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: clampTitle ? '1.35rem' : '1.5rem' },
                  lineHeight: clampTitle ? 1.3 : undefined,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1,
                  ...(clampTitle ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' } : {}),
                }}
              >
                {title}
              </Typography>
              {description && (
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {description}
                </Typography>
              )}
              {meta ? <Box sx={{ mt: 1.25 }}>{meta}</Box> : null}
            </Box>
          </Box>

          {actionButton && actionButton}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
