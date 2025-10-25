'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const OrganizationContext = createContext();

const ORGANIZATIONS = [
  {
    _id: '68fcdad063522a9c2c9b990f',
    name: 'Test Organization',
    slug: 'test',
    country: 'UK',
    flagEmoji: '🧪'
  },
  {
    _id: '68fcdad063522a9c2c9b9910',
    name: 'FAN Notting Hill',
    slug: 'notting-hill',
    country: 'UK',
    flagEmoji: '🇬🇧'
  },
  {
    _id: '68fcdad063522a9c2c9b9911',
    name: 'FAN Miraflores',
    slug: 'miraflores',
    country: 'Peru',
    flagEmoji: '🇵🇪'
  }
];

export function OrganizationProvider({ children }) {
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load selected organization from localStorage
    const savedOrgId = localStorage.getItem('selectedOrganizationId');
    if (savedOrgId) {
      const org = ORGANIZATIONS.find(o => o._id === savedOrgId);
      setCurrentOrganization(org || ORGANIZATIONS[0]); // Default to Test if not found
    } else {
      // Default to Test organization on first load
      setCurrentOrganization(ORGANIZATIONS[0]);
      localStorage.setItem('selectedOrganizationId', ORGANIZATIONS[0]._id);
    }
    setLoading(false);
  }, []);

  const switchOrganization = (organizationId) => {
    const org = ORGANIZATIONS.find(o => o._id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('selectedOrganizationId', organizationId);
      // Refresh the page to reload data for new organization
      window.location.reload();
    }
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      allOrganizations: ORGANIZATIONS,
      switchOrganization,
      loading
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}

