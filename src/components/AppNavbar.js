'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import Navbar from './Navbar';
import TopBar from './TopBar';

const AppNavbar = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  
  // Don't show navbar on activation-only pages
  const hiddenRoutes = ['/activate', '/resend-activation'];
  // The manuscript editor is a full-screen workspace with its own document chrome
  const isDocumentEditor = pathname.includes('/publications/collaborate/edit/');
  const shouldHideNavbar =
    isDocumentEditor || hiddenRoutes.some(route => pathname.startsWith(route));
  
  // Don't render anything while auth is loading
  if (isLoading) {
    return null;
  }
  
  // Don't show navbar on hidden routes
  if (shouldHideNavbar) {
    return null;
  }
  
  // Show navbar for both authenticated and non-authenticated users
  // The Navbar component itself will handle the different states
  return (
    <>
      <TopBar />
      <Navbar />
    </>
  );
};

export default AppNavbar;
