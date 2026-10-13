'use client';

/**
 * Shared layout for /login and /register.
 * The brand panel stays mounted when switching between the two pages,
 * so only the form column animates in.
 */
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import AuthShell from '@/components/Auth/AuthShell';

const enter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`;

export default function AuthLayout({ children }) {
  const pathname = usePathname();

  return (
    <AuthShell>
      <Box
        key={pathname}
        sx={{
          animation: `${enter} 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {children}
      </Box>
    </AuthShell>
  );
}
