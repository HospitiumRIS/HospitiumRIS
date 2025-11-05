'use client';

import React, { useState, useEffect } from 'react';

/**
 * NoSSR component prevents server-side rendering of its children
 * This helps prevent hydration mismatches for client-only components
 */
const NoSSR = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
};

export default NoSSR;
