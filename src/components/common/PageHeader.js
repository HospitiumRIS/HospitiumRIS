import React from 'react';
import {
    Box,
    Typography,
    Avatar,
    Button,
    Breadcrumbs,
    Link
} from '@mui/material';
import { useRouter } from 'next/navigation';

const PageHeader = ({
    title,
    description,
    icon,
    breadcrumbs = [],
    actionButton = null,
    gradient = 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)'
}) => {
    const router = useRouter();

    const handleBreadcrumbClick = (path) => {
        if (path) {
            router.push(path);
        }
    };

    return (
        <Box sx={{ 
            background: gradient,
            color: 'white',
            py: 4,
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
                transform: 'translate(100px, -100px)'
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
                transform: 'translate(-50px, 50px)'
            }
        }}>
            <Box sx={{ 
                position: 'relative', 
                zIndex: 1,
                maxWidth: '1600px',
                mx: 'auto',
                width: '100%'
            }}>
                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
                    <Breadcrumbs 
                        sx={{ 
                            mb: 3,
                            '& .MuiBreadcrumbs-separator': { color: 'rgba(255,255,255,0.7)' },
                            '& .MuiLink-root': { color: 'rgba(255,255,255,0.9)' }
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
                                    '&:hover': { color: breadcrumb.path ? 'white' : 'inherit' }
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
                            {title}
                        </Typography>
                    </Breadcrumbs>
                )}

                {/* Header Content */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {icon && (
                            <Avatar sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)', 
                                width: 64, 
                                height: 64,
                                backdropFilter: 'blur(10px)'
                            }}>
                                {icon}
                            </Avatar>
                        )}
                        <Box>
                            <Typography variant="h4" sx={{ 
                                fontWeight: 700, 
                                fontSize: { xs: '1.5rem', md: '2rem' },
                                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                mb: 1
                            }}>
                                {title}
                            </Typography>
                            {description && (
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                    {description}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {actionButton && actionButton}
                </Box>
            </Box>
        </Box>
    );
};

export default PageHeader; 