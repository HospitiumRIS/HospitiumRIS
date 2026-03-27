export const processNetworkData = (rawData) => {
  if (!rawData || !rawData.authors) {
    return { nodes: [], links: [] };
  }

  const nodes = rawData.authors.map(author => ({
    id: author.author_id,
    name: author.name,
    specialization: author.specialization,
    institution: author.institution,
    role: author.role,
    publicationsCount: author.publications_count || 0,
    manuscriptsCount: author.manuscripts_count || 0,
    proposalsCount: author.proposals_count || 0,
    totalCollaborations: author.total_collaborations || 0,
    collaborations: author.collaborations || [],
    collaborationTypes: author.collaboration_types || {},
    globalCitations: author.globalCitations || 0,
    hospitiumCitations: author.hospitiumCitations || 0,
    hIndex: author.hIndex || 0,
    isPending: author.isPending || false,
    isLead: author.isLead || false,
    orcidId: author.orcidId || null,
    val: Math.max(10, (author.publications_count || 0) + (author.manuscripts_count || 0))
  }));

  const links = [];
  const leadId = rawData.lead_investigator_id;

  nodes.forEach(node => {
    if (node.id !== leadId && node.collaborations.includes(leadId)) {
      links.push({
        source: leadId,
        target: node.id,
        strength: node.totalCollaborations || 1,
        isPending: node.isPending
      });
    }
  });

  return { nodes, links };
};

export const filterNodes = (nodes, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return nodes;
  }

  return nodes.filter(node => {
    if (filters.collaborationTypes && filters.collaborationTypes.length > 0) {
      if (node.isPending && !filters.collaborationTypes.includes('pending')) {
        return false;
      }
      if (!node.isLead && !node.isPending && !filters.collaborationTypes.includes('direct')) {
        return false;
      }
      if (node.isLead && !filters.collaborationTypes.includes('lead')) {
        return false;
      }
    }

    if (filters.institutions && filters.institutions.length > 0) {
      if (!filters.institutions.includes(node.institution)) {
        return false;
      }
    }

    if (filters.specializations && filters.specializations.length > 0) {
      const nodeSpecs = node.specialization.split(',').map(s => s.trim());
      const hasMatch = nodeSpecs.some(spec => 
        filters.specializations.some(filter => spec.toLowerCase().includes(filter.toLowerCase()))
      );
      if (!hasMatch) {
        return false;
      }
    }

    if (filters.publicationRange) {
      const [min, max] = filters.publicationRange;
      if (node.publicationsCount < min || node.publicationsCount > max) {
        return false;
      }
    }

    return true;
  });
};

export const searchNodes = (nodes, query) => {
  if (!query || query.trim() === '') {
    return nodes;
  }

  const lowerQuery = query.toLowerCase();
  return nodes.filter(node => 
    node.name.toLowerCase().includes(lowerQuery) ||
    node.institution.toLowerCase().includes(lowerQuery) ||
    node.specialization.toLowerCase().includes(lowerQuery) ||
    (node.role && node.role.toLowerCase().includes(lowerQuery))
  );
};

export const getNodeColor = (node, theme) => {
  if (node.isLead) return theme.lead;
  if (node.isPending) return theme.pending;
  return theme.directCollab;
};

export const calculateNetworkStats = (nodes, links) => {
  const stats = {
    totalNodes: nodes.length,
    totalLinks: links.length,
    directCollaborators: nodes.filter(n => !n.isLead && !n.isPending).length,
    pendingInvitations: nodes.filter(n => n.isPending).length,
    totalPublications: nodes.reduce((sum, n) => sum + n.publicationsCount, 0),
    totalManuscripts: nodes.reduce((sum, n) => sum + n.manuscriptsCount, 0),
    totalProposals: nodes.reduce((sum, n) => sum + (n.proposalsCount || 0), 0)
  };

  return stats;
};
