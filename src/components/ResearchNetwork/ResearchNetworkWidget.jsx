import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import NetworkControls from './NetworkControls';
import ResearcherSidebar from './ResearcherSidebar';
import FilterPanel from './FilterPanel';
import NetworkLegend from './NetworkLegend';
import { useNetworkData } from './hooks/useNetworkData';
import { 
  processNetworkData, 
  filterNodes, 
  searchNodes, 
  calculateNetworkStats 
} from './utils/networkDataProcessor';

const NetworkGraph = dynamic(() => import('./NetworkGraph'), {
  ssr: false,
  loading: () => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: 600,
      backgroundColor: '#f8fafc'
    }}>
      <CircularProgress />
    </Box>
  )
});

const ResearchNetworkWidget = () => {
  const { networkData, isLoading, error, refetch } = useNetworkData();
  const containerRef = useRef();
  const graphRef = useRef();
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    collaborationTypes: [],
    institutions: [],
    specializations: [],
    publicationRange: [0, 100]
  });
  const [dimensions, setDimensions] = useState({ width: 1400, height: 800 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: Math.max(1200, width), 
          height: Math.max(800, height) 
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { nodes, links } = useMemo(() => {
    if (!networkData) return { nodes: [], links: [] };
    return processNetworkData(networkData);
  }, [networkData]);

  const filteredNodes = useMemo(() => {
    return filterNodes(nodes, filters);
  }, [nodes, filters]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(link => 
      nodeIds.has(link.source.id || link.source) && 
      nodeIds.has(link.target.id || link.target)
    );
  }, [links, filteredNodes]);

  const stats = useMemo(() => {
    return calculateNetworkStats(filteredNodes, filteredLinks);
  }, [filteredNodes, filteredLinks]);

  useEffect(() => {
    if (selectedNode) {
      const highlighted = new Set();
      const highlightedLinks = new Set();
      
      highlighted.add(selectedNode.id);
      
      filteredLinks.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        
        if (sourceId === selectedNode.id) {
          highlighted.add(targetId);
          highlightedLinks.add(link);
        } else if (targetId === selectedNode.id) {
          highlighted.add(sourceId);
          highlightedLinks.add(link);
        }
      });
      
      setHighlightNodes(highlighted);
      setHighlightLinks(highlightedLinks);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [selectedNode, filteredLinks]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  };

  const handleNodeHover = (node) => {
    setHoveredNode(node);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    setSelectedNode(null);
  };

  const handleGraphReady = useCallback((graph) => {
    graphRef.current = graph;
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.3, 400);
    }
  };

  const handleCenter = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 80);
    }
  };

  const handleExport = () => {
    if (!graphRef.current) return;

    try {
      // Get the canvas element from the force graph
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `research-network-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting graph:', error);
    }
  };

  const handleFilterClick = () => {
    setFilterPanelOpen(true);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 600,
          backgroundColor: '#f8fafc',
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading research network...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!networkData || nodes.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No collaboration network data available. Start collaborating on publications, manuscripts, or proposals to build your network!
        </Alert>
      </Box>
    );
  }

  if (filteredNodes.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <NetworkControls
          stats={stats}
          nodes={nodes}
          onNodeSelect={handleNodeSelect}
          onFilterClick={handleFilterClick}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCenter={handleCenter}
          onExport={handleExport}
        />
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            No researchers match the current filters. Try adjusting your filter criteria.
          </Alert>
        </Box>
        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          nodes={nodes}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <NetworkControls
        stats={stats}
        nodes={nodes}
        onNodeSelect={handleNodeSelect}
        onFilterClick={handleFilterClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={handleCenter}
        onExport={handleExport}
      />

      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: 'calc(100vh - 250px)',
          minHeight: 800,
          backgroundColor: '#f8fafc',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <NetworkGraph
          nodes={filteredNodes}
          links={filteredLinks}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          highlightNodes={highlightNodes}
          highlightLinks={highlightLinks}
          dimensions={dimensions}
          onGraphReady={handleGraphReady}
        />
        
        <NetworkLegend />
      </Box>

      <ResearcherSidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        researcher={selectedNode}
        publications={networkData?.publications || []}
        manuscripts={networkData?.manuscripts || []}
      />

      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        nodes={nodes}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </Box>
  );
};

export default ResearchNetworkWidget;
