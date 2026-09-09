'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const InstitutionAdminContext = createContext({
  institution: null,
  loading: true,
  logoSrc: undefined,
  refresh: async () => {},
});

export function notifyInstitutionProfileUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('institution-profile-updated'));
  }
}

export function institutionLogoSrc(institution) {
  if (!institution?.logo) return undefined;
  const version = institution.updatedAt ? new Date(institution.updatedAt).getTime() : Date.now();
  return `/api/institution-admin/profile/logo?v=${version}`;
}

export function InstitutionAdminProvider({ children }) {
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/institution-admin/profile');
      const data = await response.json();
      if (response.ok) {
        setInstitution(data.institution || null);
      }
    } catch (error) {
      console.error('Failed to load institution profile', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onUpdated = () => {
      refresh();
    };
    window.addEventListener('institution-profile-updated', onUpdated);
    return () => window.removeEventListener('institution-profile-updated', onUpdated);
  }, [refresh]);

  const value = useMemo(
    () => ({
      institution,
      loading,
      logoSrc: institutionLogoSrc(institution),
      refresh,
    }),
    [institution, loading, refresh]
  );

  return (
    <InstitutionAdminContext.Provider value={value}>
      {children}
    </InstitutionAdminContext.Provider>
  );
}

export function useInstitutionAdmin() {
  return useContext(InstitutionAdminContext);
}
