'use client';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import SubmitPublication from '../../../../components/Publications/SubmitPublication.jsx';

export default function SubmitPublicationPage() {
    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress sx={{ color: '#8b6cbc' }} />
            </Box>
        }>
            <SubmitPublication />
        </Suspense>
    );
}
