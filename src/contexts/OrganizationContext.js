'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const OrganizationContext = createContext();

// Map organization names to flag emojis
const FLAG_MAP = {
  'Test Organization': '🧪',
  'FAN Notting Hill': '🇬🇧',
  'FAN Miraflores': '🇵🇪'
};

export function OrganizationProvider({ children }) {
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizations() {
      try {
        console.log('OrganizationContext: Fetching organizations from API...');
        // Fetch organizations from API
        const res = await fetch('/api/organizations');
        console.log('OrganizationContext: API response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch organizations');
        const orgs = await res.json();
        console.log('OrganizationContext: Received organizations:', orgs);
        console.log('OrganizationContext: Organizations count:', orgs.length);
        
        // Add flag emojis to organizations
        const orgsWithFlags = orgs.map(org => ({
          ...org,
          flagEmoji: FLAG_MAP[org.name] || org.flagIcon || '🏢'
        }));
        
        console.log('OrganizationContext: Organizations with flags:', orgsWithFlags);
        setAllOrganizations(orgsWithFlags);

        // Load selected organization from localStorage
        const savedOrgId = localStorage.getItem('selectedOrganizationId');
        console.log('OrganizationContext: Saved org ID from localStorage:', savedOrgId);
        if (savedOrgId && orgsWithFlags.length > 0) {
          const org = orgsWithFlags.find(o => o._id === savedOrgId);
          setCurrentOrganization(org || orgsWithFlags[0]);
          console.log('OrganizationContext: Set current org to:', org?.name || orgsWithFlags[0]?.name);
        } else if (orgsWithFlags.length > 0) {
          // Default to first organization on first load
          setCurrentOrganization(orgsWithFlags[0]);
          localStorage.setItem('selectedOrganizationId', orgsWithFlags[0]._id);
          console.log('OrganizationContext: Set default org to:', orgsWithFlags[0]?.name);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrganizations();
  }, []);

  const switchOrganization = (organizationId) => {
    const org = allOrganizations.find(o => o._id === organizationId);
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
      allOrganizations,
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

