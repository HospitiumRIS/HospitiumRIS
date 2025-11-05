'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as d3 from 'd3';

// Dynamic import for ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div>Loading network visualization...</div>
});
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  Chip,
  Card,
  CardContent,
  Fade,
  Slide,
  Avatar,
  Badge
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Info,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  Refresh,
  Fullscreen,
  PersonPin,
  Groups,
  Article
} from '@mui/icons-material';
import { useAuth } from './AuthProvider';

// Enhanced Kenya theme colors with better gradients and contrast
const KENYA_COLORS = {
  lead: '#FFD700', // Gold for lead investigator
  leadGradient: ['#FFD700', '#FFA500'], // Gold gradient
  direct: '#8b6cbc', // Purple for direct collaborators  
  directGradient: ['#9575cd', '#7e57c2'], // Purple gradient
  secondary: '#e53935', // Red for secondary collaborators
  secondaryGradient: ['#ef5350', '#e53935'], // Red gradient
  neutral: '#78909c', // Blue grey for unrelated nodes
  neutralGradient: ['#90a4ae', '#78909c'], // Blue grey gradient
  background: '#fafbfc',
  surface: 'rgba(255, 255, 255, 0.95)',
  surfaceElevated: 'rgba(255, 255, 255, 0.98)',
  highlight: '#4fc3f7', // Light blue for highlights
  text: {
    primary: '#263238',
    secondary: '#546e7a',
    disabled: '#90a4ae'
  },
  shadow: 'rgba(0, 0, 0, 0.12)'
};

// Helper function to get node color based on relationship to lead
const getNodeColor = (node, state = 'normal') => {
  if (node.isLead) {
    return state === 'selected' ? KENYA_COLORS.leadGradient[1] : KENYA_COLORS.lead;
  }
  
  switch (node.collaborationLevel) {
    case 'direct':
      return state === 'selected' ? KENYA_COLORS.directGradient[1] : KENYA_COLORS.direct;
    case 'secondary':
      return state === 'selected' ? KENYA_COLORS.secondaryGradient[1] : KENYA_COLORS.secondary;
    default:
      return state === 'selected' ? KENYA_COLORS.neutralGradient[1] : KENYA_COLORS.neutral;
  }
};

// Helper function to get node gradient colors
const getNodeGradient = (node) => {
  if (node.isLead) return KENYA_COLORS.leadGradient;
  
  switch (node.collaborationLevel) {
    case 'direct':
      return KENYA_COLORS.directGradient;
    case 'secondary':
      return KENYA_COLORS.secondaryGradient;
    default:
      return KENYA_COLORS.neutralGradient;
  }
};

const KenyaNetworkVisualization = () => {
  const { user } = useAuth();
  const [networkData, setNetworkData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [publications, setPublications] = useState([]);
  const [sharedPublications, setSharedPublications] = useState([]);
  const [collaborationLevel, setCollaborationLevel] = useState({
    direct: new Set(),
    secondary: new Set()
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [graphStats, setGraphStats] = useState({
    totalNodes: 0,
    totalLinks: 0,
    directCollaborators: 0,
    secondaryCollaborators: 0
  });
  const [showAllPublications, setShowAllPublications] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const fgRef = useRef();

  // Load network data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch network data from API
        const response = await fetch('/api/network', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Authentication required. Please log in to view your research network.");
            return;
          } else if (response.status === 404) {
            setError("User profile not found. Please complete your profile setup.");
            return;
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        
        // Validate data structure
        if (!data.authors || !Array.isArray(data.authors)) {
          throw new Error("Invalid network data structure");
        }
        
        // Store publications and manuscripts separately
        setPublications(data.publications || []);
        const manuscripts = data.manuscripts || [];
        
        // Process network data with enhanced manuscript support
        const processedData = processNetworkData(data, manuscripts);
        setNetworkData(processedData);
        
        // Calculate and set enhanced graph statistics
        const totalPublications = data.metadata?.total_publications || 0;
        const totalManuscripts = data.metadata?.total_manuscripts || 0;
        const stats = {
          totalNodes: processedData.nodes.length,
          totalLinks: processedData.links.length,
          directCollaborators: processedData.nodes.filter(n => n.collaborationLevel === 'direct').length,
          secondaryCollaborators: processedData.nodes.filter(n => n.collaborationLevel === 'secondary').length,
          totalPublications: totalPublications,
          totalManuscripts: totalManuscripts,
          totalOutputs: totalPublications + totalManuscripts
        };
        setGraphStats(stats);
        
      } catch (err) {
        console.error("Error loading network data:", err);
        if (err.message.includes('fetch')) {
          setError("Network error. Please check your internet connection and try again.");
        } else {
          setError("Failed to load research network data. Please try refreshing the page.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only load data if user is authenticated
    if (user) {
    loadData();
    } else {
      setError("Please log in to view your research collaboration network.");
      setIsLoading(false);
    }
  }, [user]);

  // Process network data to create graph structure
  const processNetworkData = (data, manuscripts = []) => {
    if (!data || !data.authors) {
      return { nodes: [], links: [] };
    }

    const nodes = data.authors.map(author => {
      // Check if this is the lead investigator
      const isLead = author.author_id === data.lead_investigator_id;
      
      // Determine collaboration level with the lead investigator
      let collaborationLevel = "none";
      if (isLead) {
        collaborationLevel = "self";
      } else if (data.collaboration_levels?.[data.lead_investigator_id]?.direct.includes(author.author_id)) {
        collaborationLevel = "direct";
      } else if (data.collaboration_levels?.[data.lead_investigator_id]?.secondary.includes(author.author_id)) {
        collaborationLevel = "secondary";
      }
      
      // Find publications with this author
      const authorPublications = data.publications?.filter(pub => 
        pub.co_authors && pub.co_authors.includes(author.author_id)
      ) || [];
      
      // Find manuscripts with this author
      const authorManuscripts = manuscripts?.filter(manuscript => 
        manuscript.collaborators && manuscript.collaborators.includes(author.author_id)
      ) || [];
      
      // Find publications co-authored with lead
      const publicationsWithLead = authorPublications.filter(pub => 
        pub.co_authors && pub.co_authors.includes(data.lead_investigator_id)
      );

      // Find manuscripts co-authored with lead
      const manuscriptsWithLead = authorManuscripts.filter(manuscript => 
        manuscript.collaborators && manuscript.collaborators.includes(data.lead_investigator_id)
      );

      // Enhanced node sizing based on both publications and manuscripts (max 50px radius)
      const totalOutputs = (author.publications_count || 0) + (author.manuscripts_count || 0);
      const nodeSize = Math.max(20, Math.min(50, 20 + totalOutputs * 2)); // Larger nodes, max 50px
      
      return {
        id: author.author_id,
        name: author.name,
        specialization: author.specialization,
        institution: author.institution,
        role: author.role,
        val: nodeSize,
        isLead,
        collaborationLevel,
        publications_count: author.publications_count || 0,
        manuscripts_count: author.manuscripts_count || 0,
        total_collaborations: author.total_collaborations || 0,
        collaborations: author.collaborations || [],
        collaboration_types: author.collaboration_types || { publications: [], manuscripts: [] },
        publicationsWithLead: publicationsWithLead.map(p => p.pub_id),
        manuscriptsWithLead: manuscriptsWithLead.map(m => m.manuscript_id),
        totalOutputs: totalOutputs,
        isPending: author.isPending || false
      };
    });

    const links = [];
    
    // Create links based on collaborations
    data.authors.forEach(author => {
      if (author.collaborations) {
        author.collaborations.forEach(collaboratorId => {
          // Avoid duplicate links
          const linkExists = links.some(link => 
            (link.source === author.author_id && link.target === collaboratorId) ||
            (link.source === collaboratorId && link.target === author.author_id)
          );
          
          if (!linkExists) {
            // Find collaborator to determine link strength
            const collaborator = data.authors.find(a => a.author_id === collaboratorId);
            if (collaborator) {
              // Enhanced link strength calculation
              const authorStrength = Math.log(author.publications_count + 1);
              const collaboratorStrength = Math.log(collaborator.publications_count + 1);
              const strength = Math.min(6, Math.max(1, (authorStrength + collaboratorStrength) / 2));
              
              // Find publications that include both authors
              const sharedPubs = data.publications?.filter(pub => 
                pub.co_authors.includes(author.author_id) && 
                pub.co_authors.includes(collaboratorId)
              ).map(p => p.pub_id) || [];
              
              // Determine if this is a direct link to lead
              const isLeadLink = 
                author.author_id === data.lead_investigator_id || 
                collaboratorId === data.lead_investigator_id;
              
              links.push({
                source: author.author_id,
                target: collaboratorId,
                value: strength,
                isLeadLink,
                sharedPublications: sharedPubs,
                collaborationType: isLeadLink ? 'lead' : 'peer'
              });
            }
          }
        });
      }
    });

    return { nodes, links };
  };

  // Set up the graph after data is loaded
  useEffect(() => {
    if (networkData && fgRef.current) {
      try {
        // Configure forces for structured circular layout with larger 50px nodes
        fgRef.current.d3Force('charge').strength(node => 
          node.isLead ? -1200 : -600 // Even stronger repulsion to prevent clumping
        );
        
        fgRef.current.d3Force('link').distance(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const source = networkData.nodes.find(n => n.id === sourceId);
          const target = networkData.nodes.find(n => n.id === targetId);
          
          if (source?.isLead || target?.isLead) {
            return 450; // Even larger distance from lead for better spacing
          }
          
          // Nodes with the same collaboration level should have more space
          if (source?.collaborationLevel === target?.collaborationLevel) {
            return 500; // Much larger spacing for same level nodes
          }
          
          return 550; // Much larger default distance to prevent clumping
        });
        
        // Add a radial force to maintain the structured circular rings
        fgRef.current.d3Force('radial', d3.forceRadial(node => {
          if (node.isLead) return 0; // Lead at center
          
          // Maintain distinct circular rings with much more space for larger nodes
          switch(node.collaborationLevel) {
            case 'direct': return 450; // Much larger inner ring for 50px nodes
            case 'secondary': return 700; // Much larger middle ring
            default: return 950; // Much larger outer ring
          }
        }, 0, 0).strength(0.3)); // Reduced strength for more natural layout
        
        // Add collision detection adjusted for 50px nodes with more padding
        fgRef.current.d3Force('collision', d3.forceCollide().radius(node => {
          const baseSize = node.isLead ? 50 : Math.max(20, node.val); // Match actual node sizes
          return baseSize + 50; // Much larger padding to prevent overlap
        }).strength(0.7)); // Stronger collision to maintain spacing
        
        // Add a weak centering force to keep network together but allow spacing
        fgRef.current.d3Force('center', d3.forceCenter(0, 0).strength(0.05));
        
        // Restart the simulation with new parameters
        fgRef.current.d3ReheatSimulation();
        
        // Create structured circular layout like the reference image
        const directNodes = networkData.nodes.filter(n => n.collaborationLevel === 'direct');
        const secondaryNodes = networkData.nodes.filter(n => n.collaborationLevel === 'secondary');
        const otherNodes = networkData.nodes.filter(n => n.collaborationLevel === 'none');
        
        networkData.nodes.forEach((node, i) => {
          if (node.isLead) {
            // Lead at center - larger and fixed
            node.x = 0;
            node.y = 0;
            node.fx = 0;
            node.fy = 0;
          } else {
            let radius, angleIndex, totalInRing;
            
            // Position based on collaboration level in distinct rings
            switch(node.collaborationLevel) {
              case 'direct':
                radius = 200; // Inner ring for direct collaborators
                angleIndex = directNodes.indexOf(node);
                totalInRing = directNodes.length;
                break;
              case 'secondary':
                radius = 320; // Middle ring for secondary collaborators  
                angleIndex = secondaryNodes.indexOf(node);
                totalInRing = secondaryNodes.length;
                break;
              default:
                radius = 440; // Outer ring for other connections
                angleIndex = otherNodes.indexOf(node);
                totalInRing = otherNodes.length;
            }
            
            // Calculate evenly spaced angles around the circle
            const angleStep = (2 * Math.PI) / totalInRing;
            const angle = angleStep * angleIndex;
            
            // Position nodes in perfect circles
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
            
            // Fix positions initially for structured layout
            node.fx = node.x;
            node.fy = node.y;
            
            // Keep positions more fixed for cleaner circular structure
            setTimeout(() => {
              if (node && !node.isLead) {
                // Only release after layout is established
                node.fx = undefined;
                node.fy = undefined;
              }
            }, 2000);
          }
        });
        
        // Restart simulation
        if (fgRef.current._simulation) {
          fgRef.current._simulation.alpha(1).restart();
        }
        
        // Initial zoom to perfectly frame the circular layout
        setTimeout(() => {
          if (fgRef.current && typeof fgRef.current.zoomToFit === 'function') {
            fgRef.current.zoomToFit(500, 60); // Optimized for circular structure
          }
        }, 2500); // Let the circular layout establish first
      } catch (err) {
        console.error("Error configuring network layout:", err);
      }
    }
  }, [networkData]);

  // Custom node painting function with enhanced aesthetics
  const paintNode = (node, ctx, globalScale) => {
    try {
      if (!node || !isFinite(node.x) || !isFinite(node.y)) return;
      
      const isSelected = selectedNode && selectedNode.id === node.id;
      const isHighlighted = highlightNodes.has(node.id);
      
      // Larger nodes with max 50px radius
      const baseSize = node.isLead ? 50 : Math.max(20, node.val); // Max 50px radius
      const sizeMultiplier = isSelected ? 1.3 : (isHighlighted ? 1.15 : 1);
      const size = Math.min(50, baseSize * sizeMultiplier); // Ensure max 50px
      
      // Get consistent node color based on relationship to lead (never changes)
      const nodeColor = getNodeColor(node, isSelected ? 'selected' : 'normal');
      const gradientColors = getNodeGradient(node);
      
      // Enhanced opacity logic for better visual hierarchy (including pending status)
      if (selectedNode && !isHighlighted && !isSelected) {
        ctx.globalAlpha = 0.2; // More contrast for non-selected nodes
      } else if (isHighlighted && !isSelected) {
        ctx.globalAlpha = 0.9;
      } else if (node.isPending && !isSelected) {
        ctx.globalAlpha = 0.7; // Slightly transparent for pending collaborators
      } else {
        ctx.globalAlpha = 1;
      }
      
      // Enhanced glow effect with color-specific glows (only for selected or lead)
      if (isSelected || node.isLead || isHighlighted) {
        const glowSize = size * (isSelected ? 2.5 : 1.8); // Larger glow for selected nodes
        const glowIntensity = isSelected ? 0.4 : 0.15; // Stronger glow for selected, remove hover
        
        // Create glow gradient
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, size * 0.3,
          node.x, node.y, glowSize
        );
        
        glowGradient.addColorStop(0, d3.color(nodeColor).copy({opacity: glowIntensity}));
        glowGradient.addColorStop(0.5, d3.color(nodeColor).copy({opacity: glowIntensity * 0.5}));
        glowGradient.addColorStop(1, d3.color(nodeColor).copy({opacity: 0}));
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
      
      // Enhanced shadow for depth (stronger for selected nodes)
      if (globalScale > 0.5) {
        ctx.save();
        ctx.shadowColor = isSelected ? 'rgba(0, 0, 0, 0.3)' : KENYA_COLORS.shadow;
        ctx.shadowBlur = size * (isSelected ? 0.5 : 0.3); // Stronger shadow for selected
        ctx.shadowOffsetX = size * 0.1;
        ctx.shadowOffsetY = size * 0.1;
        
        // Draw shadow circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = 'transparent';
        ctx.fill();
        ctx.restore();
      }
      
      // Main node with enhanced gradient
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      
      try {
        const nodeGradient = ctx.createRadialGradient(
          node.x - size * 0.3, node.y - size * 0.3, 0,
          node.x, node.y, size
        );
        
        // Enhanced gradient with more depth
        nodeGradient.addColorStop(0, d3.color(gradientColors[0]).brighter(0.3));
        nodeGradient.addColorStop(0.7, gradientColors[0]);
        nodeGradient.addColorStop(1, gradientColors[1]);
        
        ctx.fillStyle = nodeGradient;
      } catch (e) {
        ctx.fillStyle = nodeColor;
      }
      
      ctx.fill();
      
      // Selection ring for selected node
      if (isSelected) {
        ctx.save();
        
        // Outer white ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 4 / globalScale;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Inner colored ring
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 2 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.restore();
      }
      
      // Enhanced border with color-specific styling (including pending status)
      if (isSelected || node.isLead || node.isPending) {
        ctx.strokeStyle = isSelected ? 'white' : d3.color(nodeColor).brighter(1);
        ctx.lineWidth = (isSelected ? 3 : 2) / globalScale;
        
        // Dashed border for pending collaborators
        if (node.isPending && !isSelected) {
          ctx.setLineDash([3 / globalScale, 3 / globalScale]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }
      
      // Role indicator for lead investigator
      if (node.isLead && globalScale > 0.8) {
        const iconSize = size * 0.6;
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = `${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', node.x, node.y);
        ctx.restore();
      }
      
      // Enhanced label rendering
      const showLabel = globalScale > 0.6 || isSelected || node.isLead || isHighlighted;
      if (showLabel && node.name) {
        const fontSize = Math.max(12, 15 / globalScale);
        const fontWeight = node.isLead || isSelected ? 'bold' : '500';
        ctx.font = `${fontWeight} ${fontSize}px 'Inter', 'Segoe UI', sans-serif`;
        
        const textWidth = ctx.measureText(node.name).width;
        const padding = fontSize * 0.3;
        const backgroundHeight = fontSize * 1.2;
        const backgroundWidth = textWidth + padding * 2;
        
        const labelY = node.y + size + fontSize * 0.8;
        
        // Enhanced label background
        ctx.save();
        ctx.fillStyle = isSelected || node.isLead 
          ? KENYA_COLORS.surfaceElevated
          : KENYA_COLORS.surface;
        
        // Add subtle shadow to label
        ctx.shadowColor = KENYA_COLORS.shadow;
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        
        ctx.fillRect(
          node.x - backgroundWidth / 2,
          labelY - backgroundHeight / 2,
          backgroundWidth,
          backgroundHeight
        );
        ctx.restore();
        
        // Label text with enhanced styling
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isSelected || node.isLead 
          ? nodeColor 
          : KENYA_COLORS.text.primary;
        ctx.fillText(node.name, node.x, labelY);
      }
      
      // Reset global alpha
      ctx.globalAlpha = 1;
    } catch (error) {
      console.error("Error painting node:", error);
    }
  };
  
  // Custom link painting function
  const paintLink = (link, ctx) => {
    try {
      if (!link.source || !link.target) return;
      if (!isFinite(link.source.x) || !isFinite(link.source.y) || 
          !isFinite(link.target.x) || !isFinite(link.target.y)) return;
      
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const isHighlighted = highlightLinks.has(link) || 
        (highlightNodes.has(sourceId) && highlightNodes.has(targetId));
      
      const isLeadLink = link.isLeadLink || 
        (typeof link.source === 'object' && link.source.isLead) || 
        (typeof link.target === 'object' && link.target.isLead);
        
      // If link is not highlighted when a node is selected, make it transparent
      if (selectedNode && !isHighlighted) {
        ctx.globalAlpha = 0.1;
      } else if (isHighlighted) {
        ctx.globalAlpha = 0.9; // More visible for highlighted links
      } else {
        ctx.globalAlpha = 0.6; // Normal visibility
      }
      
      const sourceColor = typeof link.source === 'object' && link.source.isLead ? 
        KENYA_COLORS.lead : 
        isHighlighted ? KENYA_COLORS.highlight : getNodeColor(link.source, 'normal');
        
      const targetColor = typeof link.target === 'object' && link.target.isLead ? 
        KENYA_COLORS.lead : 
        isHighlighted ? KENYA_COLORS.highlight : getNodeColor(link.target, 'normal');
      
      // Links to lead are thicker
      const thickness = isHighlighted ? 
        Math.max(2, link.value * 1) : 
        isLeadLink ? 
          Math.max(1.5, link.value * 0.8) : 
          Math.max(0.5, link.value * 0.5);
      
      try {
        // Create gradient
        const gradient = ctx.createLinearGradient(
          link.source.x, link.source.y, 
          link.target.x, link.target.y
        );
        
        const sourceOpacity = isHighlighted ? 0.9 : (isLeadLink ? 0.7 : 0.3);
        const targetOpacity = isHighlighted ? 0.9 : (isLeadLink ? 0.7 : 0.3);
        
        gradient.addColorStop(0, d3.color(sourceColor).copy({opacity: sourceOpacity}));
        gradient.addColorStop(1, d3.color(targetColor).copy({opacity: targetOpacity}));
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = thickness;
        ctx.stroke();
      } catch (e) {
        // Fallback
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = d3.color(sourceColor).copy({opacity: 0.5});
        ctx.lineWidth = thickness;
        ctx.stroke();
      }
      
      // Reset global alpha
      ctx.globalAlpha = 1;
    } catch (error) {
      console.error("Error painting link:", error);
    }
  };
  
  // Node click handler
  const handleNodeClick = (node) => {
    try {
      if (!node || !networkData) return;
      
      const { nodes, links } = networkData;
      
      if (selectedNode && selectedNode.id === node.id) {
        // Clear selection if clicking the same node
        setSelectedNode(null);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        setSharedPublications([]);
        setCollaborationLevel({
          direct: new Set(),
          secondary: new Set()
        });
        setShowAllPublications(false);
        setSelectedPublication(null);
        
        // Reset view to center
        handleCenter();
      } else {
        // Select new node
        setSelectedNode(node);
        
        // Center the view on the selected node with animation
        if (fgRef.current && typeof fgRef.current.centerAt === 'function') {
          fgRef.current.centerAt(node.x, node.y, 1000);
          fgRef.current.zoom(1.5, 1000);
        }
        
        // Find all connected nodes (collaborators)
        const connectedNodeIds = new Set();
        connectedNodeIds.add(node.id); // Include the selected node
        
        // Find all links connected to this node
        const connectedLinks = new Set();
        links.forEach(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (sourceId === node.id) {
            connectedNodeIds.add(targetId);
            connectedLinks.add(link);
          } else if (targetId === node.id) {
            connectedNodeIds.add(sourceId);
            connectedLinks.add(link);
          }
        });
        
        setHighlightNodes(connectedNodeIds);
        setHighlightLinks(connectedLinks);
        
        // Find all publications for this author
        const authorPublications = publications.filter(pub => 
          pub.co_authors && pub.co_authors.includes(node.id)
        );
        
        // Set publications with co-author information
        const publicationsWithCoAuthors = authorPublications.map(pub => ({
          ...pub,
          coAuthors: pub.co_authors
            .filter(id => id !== node.id) // Exclude the selected author
            .map(id => nodes.find(n => n.id === id))
            .filter(Boolean) // Remove any undefined entries
        }));
        
        setSharedPublications(publicationsWithCoAuthors);
        
        // Set collaboration levels if lead is clicked
        if (node.isLead) {
          const levels = {
            direct: new Set(),
            secondary: new Set()
          };
          
          nodes.forEach(n => {
            if (n.collaborationLevel === 'direct') levels.direct.add(n.id);
            if (n.collaborationLevel === 'secondary') levels.secondary.add(n.id);
          });
          
          setCollaborationLevel(levels);
        } else {
          setCollaborationLevel({
            direct: new Set(),
            secondary: new Set()
          });
        }
      }
    } catch (err) {
      console.error("Error handling node click:", err);
    }
  };
  
  // Handle background click to clear selection
  const handleBackgroundClick = () => {
    try {
      setSelectedNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setSharedPublications([]);
      setCollaborationLevel({
        direct: new Set(),
        secondary: new Set()
      });
      setHoveredNode(null);
      setShowAllPublications(false);
      setSelectedPublication(null);
      
      // Reset zoom to fit the entire network
      setTimeout(() => {
        if (fgRef.current && typeof fgRef.current.zoomToFit === 'function') {
          fgRef.current.zoomToFit(400, 50);
        }
      }, 100);
    } catch (err) {
      console.error("Error handling background click:", err);
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    try {
      if (fgRef.current && typeof fgRef.current.zoom === 'function') {
        const currentZoom = fgRef.current.zoom();
        if (isFinite(currentZoom)) {
          fgRef.current.zoom(currentZoom * 1.5, 400);
        }
      }
    } catch (err) {
      console.error("Error zooming in:", err);
    }
  };
  
  const handleZoomOut = () => {
    try {
      if (fgRef.current && typeof fgRef.current.zoom === 'function') {
        const currentZoom = fgRef.current.zoom();
        if (isFinite(currentZoom)) {
          fgRef.current.zoom(currentZoom / 1.5, 400);
        }
      }
    } catch (err) {
      console.error("Error zooming out:", err);
    }
  };
  
  const handleCenter = () => {
    try {
      if (fgRef.current) {
        if (typeof fgRef.current.centerAt === 'function') {
          fgRef.current.centerAt(0, 0, 1000);
        }
        if (typeof fgRef.current.zoomToFit === 'function') {
          fgRef.current.zoomToFit(400);
        }
      }
    } catch (err) {
      console.error("Error centering graph:", err);
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      setShowSearchResults(true);
      performSearch(query);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };
  
  // Perform search on nodes
  const performSearch = (query) => {
    if (!networkData?.nodes) return;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    const results = networkData.nodes.filter(node => 
      node.name.toLowerCase().includes(normalizedQuery) ||
      node.institution?.toLowerCase().includes(normalizedQuery) ||
      node.specialization?.toLowerCase().includes(normalizedQuery) ||
      node.role?.toLowerCase().includes(normalizedQuery)
    );
    
    setSearchResults(results);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };
  
  // Handle search result selection
  const handleSearchResultClick = (node) => {
    handleNodeClick(node);
    setShowSearchResults(false);
  };

  // Add event listener to detect clicks outside search results
  useEffect(() => {
    const handleClickAway = (event) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '800px',
        background: `linear-gradient(135deg, ${KENYA_COLORS.background} 0%, #e8f0fe 100%)`,
        gap: 3
      }}>
        <CircularProgress 
          size={60} 
          sx={{ 
            color: KENYA_COLORS.direct,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography variant="h6" sx={{ color: KENYA_COLORS.text.secondary, fontWeight: 500 }}>
          Loading Research Network...
        </Typography>
        <Typography variant="body2" sx={{ color: KENYA_COLORS.text.disabled }}>
          Fetching your research collaboration network from database...
        </Typography>
      </Box>
    );
  }

  // Handle empty network data
  if (!isLoading && !error && networkData && networkData.nodes.length === 0) {
    return (
      <Card sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '500px',
        m: 4,
        backgroundColor: '#f7fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 3
      }}>
        <CardContent sx={{ textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h6" sx={{ color: KENYA_COLORS.text.primary, mb: 2, fontWeight: 600 }}>
            Start Building Your Research Network
          </Typography>
          <Typography variant="body1" sx={{ color: '#2d3748', mb: 3, lineHeight: 1.6 }}>
            Your research collaboration network will appear here once you add publications and collaborate with other researchers.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.href = '/researcher/publications/submit'}
              style={{
                backgroundColor: KENYA_COLORS.direct,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Your First Publication
            </button>
            
            <button 
              onClick={() => window.location.href = '/researcher/publications/collaborate'}
              style={{
                backgroundColor: 'transparent',
                color: KENYA_COLORS.direct,
                border: `2px solid ${KENYA_COLORS.direct}`,
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Find Collaborators
            </button>
          </Box>
          
          <Typography variant="body2" sx={{ color: '#718096', mt: 3, fontStyle: 'italic' }}>
            Connect with researchers, add publications, and watch your collaboration network grow!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '500px',
        m: 4,
        backgroundColor: '#fff5f5',
        border: '1px solid #fed7d7',
        borderRadius: 3
      }}>
        <CardContent sx={{ textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h6" sx={{ color: '#c53030', mb: 2, fontWeight: 600 }}>
            Research Network Unavailable
          </Typography>
          <Typography variant="body1" sx={{ color: '#2d3748', mb: 3, lineHeight: 1.6 }}>
            {error}
          </Typography>
          
          {error.includes("Please log in") ? (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.href = '/login'}
                style={{
                  backgroundColor: KENYA_COLORS.direct,
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Go to Login
              </button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: KENYA_COLORS.direct,
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <Refresh sx={{ mr: 1, fontSize: 16 }} />
                Retry Loading
              </button>
              
              <button 
                onClick={() => window.location.href = '/researcher/publications/submit'}
                style={{
                  backgroundColor: 'transparent',
                  color: KENYA_COLORS.direct,
                  border: `2px solid ${KENYA_COLORS.direct}`,
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add Publications
              </button>
            </Box>
          )}
          
          <Typography variant="body2" sx={{ color: '#718096', mt: 3, fontStyle: 'italic' }}>
            Your research network will be generated automatically as you add publications and collaborate with other researchers.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh',
      background: `linear-gradient(135deg, ${KENYA_COLORS.background} 0%, #f0f4ff 100%)`,
      overflow: 'hidden'
    }}>
      {/* Enhanced Top Navigation Bar */}
      <Slide direction="down" in={true} timeout={800}>
        <Paper elevation={3} sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
          borderRadius: 3,
          background: KENYA_COLORS.surfaceElevated,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ 
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            flexWrap: 'wrap'
          }}>
            {/* Title and Stats */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: KENYA_COLORS.text.primary,
                mb: 0.5,
                background: `linear-gradient(135deg, ${KENYA_COLORS.direct} 0%, ${KENYA_COLORS.secondary} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {user ? `${user.givenName}'s Research Network` : 'Research Collaboration Network'}
              </Typography>
        
              {/* Network Statistics */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Groups fontSize="small" />}
                  label={`${graphStats.totalNodes} Researchers`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(139, 108, 188, 0.1)',
                    color: KENYA_COLORS.direct,
                    fontWeight: 500
                  }}
                />
                <Chip
                  icon={<Article fontSize="small" />}
                  label={`${graphStats.totalOutputs} Outputs (${graphStats.totalPublications}P + ${graphStats.totalManuscripts}M)`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#2e7d32',
                    fontWeight: 500
                  }}
                />
                <Chip
                  label={`${graphStats.directCollaborators} Direct • ${graphStats.secondaryCollaborators} Secondary`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    color: '#f57c00',
                    fontWeight: 500
                  }}
                />
              </Box>
            </Box>
            
            {/* Enhanced Search */}
            <Box 
              id="search-container"
              sx={{ 
                position: 'relative', 
                width: { xs: '100%', md: 350 },
                order: { xs: 3, md: 2 }
              }}
            >
              <TextField
                size="small"
                placeholder="Search researchers, institutions, specializations..."
                fullWidth
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& > fieldset': { 
                        borderColor: KENYA_COLORS.direct,
                        borderWidth: 2
                      }
                    },
                    '&.Mui-focused': {
                      '& > fieldset': { 
                        borderColor: KENYA_COLORS.direct,
                        borderWidth: 2,
                        boxShadow: `0 0 0 4px rgba(139, 108, 188, 0.1)`
                      }
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: KENYA_COLORS.direct }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={handleClearSearch}
                        edge="end"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(139, 108, 188, 0.1)'
                          }
                        }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
          
              {/* Enhanced Search Results */}
              <Collapse in={showSearchResults && (searchResults.length > 0 || searchQuery.trim().length > 0)}>
                <Paper 
                  elevation={8}
                  sx={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    mt: 1, 
                    maxHeight: 320, 
                    overflow: 'auto',
                    zIndex: 1500,
                    borderRadius: 2,
                    border: '1px solid rgba(139, 108, 188, 0.2)',
                    backdropFilter: 'blur(20px)',
                    background: KENYA_COLORS.surfaceElevated
                  }}
                >
                  {searchResults.length > 0 ? (
                    <List dense sx={{ p: 0.5 }}>
                      {searchResults.map((result, index) => (
                        <Box key={result.id}>
                          <ListItem 
                            button 
                            onClick={() => handleSearchResultClick(result)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 1.5,
                              mx: 0.5,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(139, 108, 188, 0.08)',
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            <Avatar 
                              sx={{
                                width: 32, 
                                height: 32, 
                                mr: 1.5,
                                bgcolor: getNodeColor(result),
                                fontSize: '0.9rem',
                                fontWeight: 600
                              }}
                            >
                              {result.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </Avatar>
                            
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: KENYA_COLORS.text.primary }}>
                                    {result.name}
                                  </Typography>
                                  {result.isLead && (
                                    <Chip 
                                      icon={<PersonPin fontSize="small" />}
                                      size="small" 
                                      label="Lead" 
                                      sx={{ 
                                        height: 22, 
                                        bgcolor: 'rgba(255, 215, 0, 0.15)', 
                                        color: KENYA_COLORS.lead,
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                      }} 
                                    />
                                  )}
                                  <Badge
                                    badgeContent={result.publications_count}
                                    color="primary"
                                    sx={{
                                      '& .MuiBadge-badge': {
                                        backgroundColor: KENYA_COLORS.highlight,
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        fontWeight: 600
                                      }
                                    }}
                                  >
                                    <Article fontSize="small" sx={{ color: KENYA_COLORS.text.secondary }} />
                                  </Badge>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary, display: 'block' }}>
                                    {result.institution}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.disabled, fontSize: '0.7rem' }}>
                                    {result.specialization}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < searchResults.length - 1 && <Divider sx={{ mx: 1 }} />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Search sx={{ fontSize: 48, color: KENYA_COLORS.text.disabled, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No researchers found matching "<strong>{searchQuery}</strong>"
                      </Typography>
                      <Typography variant="caption" sx={{ color: KENYA_COLORS.text.disabled, mt: 1, display: 'block' }}>
                        Try searching for names, institutions, or specializations
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Collapse>
            </Box>
        
            {/* Enhanced Controls */}
            <Box sx={{ display: 'flex', gap: 1, order: { xs: 2, md: 3 } }}>
              <Tooltip title="Zoom In" arrow>
                <IconButton 
                  onClick={handleZoomIn} 
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: KENYA_COLORS.direct,
                      color: 'white',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Zoom Out" arrow>
                <IconButton 
                  onClick={handleZoomOut} 
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: KENYA_COLORS.direct,
                      color: 'white',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Center & Fit Network" arrow>
                <IconButton 
                  onClick={handleCenter} 
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: KENYA_COLORS.direct,
                      color: 'white',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CenterFocusStrong fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset Network" arrow>
                <IconButton 
                  onClick={() => window.location.reload()} 
                  size="small"
                  sx={{
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: KENYA_COLORS.secondary,
                      color: 'white',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Slide>

      {/* Enhanced Node Details Panel */}
      {selectedNode && (
        <Fade in={true} timeout={500}>
          <Card elevation={24} sx={{
            position: 'fixed',
            top: 120,
            right: 20,
            zIndex: 2000,
            width: 400,
            maxHeight: 'calc(100vh - 140px)',
            overflow: 'auto',
            borderRadius: 3,
            background: KENYA_COLORS.surfaceElevated,
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.25)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              borderRadius: 3,
              pointerEvents: 'none'
            }
          }}>
            {/* Header with gradient background */}
            <Box sx={{
              background: `linear-gradient(135deg, ${getNodeColor(selectedNode)}25 0%, ${getNodeColor(selectedNode)}15 100%)`,
              p: 3,
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              position: 'relative'
            }}>
              {/* Close button */}
              <IconButton
                onClick={() => setSelectedNode(null)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: KENYA_COLORS.text.secondary,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    color: KENYA_COLORS.text.primary
                  }
                }}
                size="small"
              >
                <Clear fontSize="small" />
              </IconButton>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, pr: 4 }}>
                <Avatar sx={{
                  width: 56,
                  height: 56,
                  bgcolor: getNodeColor(selectedNode),
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
                }}>
                  {selectedNode.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: KENYA_COLORS.text.primary,
                    mb: 0.5,
                    fontSize: '1.1rem'
                  }}>
                    {selectedNode.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedNode.isLead && (
                      <Chip 
                        icon={<PersonPin fontSize="small" />}
                        size="small" 
                        label="Lead Investigator" 
                        sx={{ 
                          bgcolor: 'rgba(255, 215, 0, 0.2)', 
                          color: KENYA_COLORS.lead,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          border: '1px solid rgba(255, 215, 0, 0.3)'
                        }} 
                      />
                    )}
                    
                    {!selectedNode.isLead && (
                      <>
                      <Chip 
                        size="small" 
                        label={`${selectedNode.collaborationLevel?.charAt(0).toUpperCase() + selectedNode.collaborationLevel?.slice(1)} Collaborator`}
                        sx={{ 
                          bgcolor: (() => {
                            switch (selectedNode.collaborationLevel) {
                              case 'direct': return 'rgba(139, 108, 188, 0.2)';
                              case 'secondary': return 'rgba(229, 57, 53, 0.2)';
                              default: return 'rgba(120, 144, 156, 0.2)';
                            }
                          })(),
                          color: getNodeColor(selectedNode),
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          border: `1px solid ${getNodeColor(selectedNode)}30`
                          }} 
                        />
                        {selectedNode.isPending && (
                          <Chip 
                            size="small" 
                            label="Pending Invitation"
                            sx={{ 
                              bgcolor: 'rgba(255, 152, 0, 0.2)',
                              color: '#e65100',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              border: '1px dashed #e65100',
                              ml: 1
                            }} 
                          />
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
              
              {/* Research outputs prominently displayed */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: 1,
                mt: 1,
                flexWrap: 'wrap'
              }}>
                <Chip 
                  icon={<Article fontSize="small" />}
                  label={`${selectedNode.publications_count} Publications`}
                  sx={{ 
                    bgcolor: 'rgba(76, 175, 80, 0.2)', 
                    color: '#1b5e20',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    px: 2,
                    height: 32,
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }} 
                />
                {selectedNode.manuscripts_count > 0 && (
                  <Chip 
                    icon={<PersonPin fontSize="small" />}
                    label={`${selectedNode.manuscripts_count} Manuscripts`}
                    sx={{ 
                      bgcolor: 'rgba(139, 108, 188, 0.2)', 
                      color: '#4a148c',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      px: 2,
                      height: 32,
                      border: '1px solid rgba(139, 108, 188, 0.3)'
                    }} 
                  />
                )}
              </Box>
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              {/* Enhanced Researcher Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  mb: 2.5,
                  color: KENYA_COLORS.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '1rem'
                }}>
                  <Info fontSize="small" />
                  Researcher Information
                </Typography>
                
                {/* Information Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
                  {/* Role */}
                  <Card elevation={1} sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <PersonPin fontSize="small" sx={{ color: KENYA_COLORS.direct }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: KENYA_COLORS.text.secondary,
                        fontSize: '0.85rem'
                      }}>
                        Role
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: KENYA_COLORS.text.primary,
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      {selectedNode.role}
                    </Typography>
                  </Card>
                  
                  {/* Institution */}
                  <Card elevation={1} sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Groups fontSize="small" sx={{ color: KENYA_COLORS.secondary }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: KENYA_COLORS.text.secondary,
                        fontSize: '0.85rem'
                      }}>
                        Institution
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: KENYA_COLORS.text.primary,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      lineHeight: 1.3
                    }}>
                      {selectedNode.institution}
                    </Typography>
                  </Card>
                  
                  {/* Specialization */}
                  <Card elevation={1} sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Article fontSize="small" sx={{ color: KENYA_COLORS.highlight }} />
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: KENYA_COLORS.text.secondary,
                        fontSize: '0.85rem'
                      }}>
                        Specialization
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: KENYA_COLORS.text.primary,
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>
                      {selectedNode.specialization}
                    </Typography>
                  </Card>
                  
                  {/* Statistics Row */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: selectedNode.manuscripts_count > 0 ? 'repeat(3, 1fr)' : '1fr 1fr', 
                    gap: 1.5 
                  }}>
                    {/* Total Publications */}
                    <Card elevation={1} sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: '#2e7d32',
                        mb: 0.5
                      }}>
                        {selectedNode.publications_count}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#2e7d32',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}>
                        Publications
                      </Typography>
                    </Card>
                    
                    {/* Manuscripts */}
                    {selectedNode.manuscripts_count > 0 && (
                    <Card elevation={1} sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(139, 108, 188, 0.08)',
                      border: '1px solid rgba(139, 108, 188, 0.2)',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: KENYA_COLORS.direct,
                        mb: 0.5
                      }}>
                          {selectedNode.manuscripts_count}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: KENYA_COLORS.direct,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          Manuscripts
                        </Typography>
                      </Card>
                    )}
                    
                    {/* Network Connections */}
                    <Card elevation={1} sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(69, 183, 209, 0.08)',
                      border: '1px solid rgba(69, 183, 209, 0.2)',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: '#0277bd',
                        mb: 0.5
                      }}>
                        {highlightNodes.size - 1}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#0277bd',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}>
                        Collaborators
                      </Typography>
                    </Card>
                  </Box>
                </Box>
              </Box>
              
              {/* Publications Section */}
              {sharedPublications.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 700, 
                    mb: 2,
                    color: KENYA_COLORS.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Article fontSize="small" />
                    Publications ({sharedPublications.length})
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(showAllPublications ? sharedPublications : sharedPublications.slice(0, 3)).map((pub, index) => (
                      <Card 
                        key={pub.pub_id} 
                        elevation={2} 
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            elevation: 4,
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                            borderColor: KENYA_COLORS.direct
                          }
                        }}
                        onClick={() => setSelectedPublication(selectedPublication?.pub_id === pub.pub_id ? null : pub)}
                      >
                        <Typography variant="body1" sx={{ 
                          fontWeight: 700, 
                          mb: 2, 
                          lineHeight: 1.4,
                          color: KENYA_COLORS.text.primary,
                          fontSize: '0.95rem'
                        }}>
                          {pub.title}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ 
                          color: '#2e7d32',
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: '0.85rem'
                        }}>
                          {pub.journal}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ 
                          color: '#1976d2',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '0.85rem'
                        }}>
                          {pub.year}
                        </Typography>
                        
                        {/* Co-Authors Section */}
                        {pub.coAuthors && pub.coAuthors.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ 
                              color: KENYA_COLORS.text.secondary, 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}>
                              <PersonPin fontSize="small" />
                              Co-Authors:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {pub.coAuthors.slice(0, 3).map((coAuthor, idx) => (
                                <Chip
                                  key={coAuthor.id}
                                  label={coAuthor.name}
                                  size="small"
                                  avatar={
                                    <Avatar sx={{
                                      width: 20,
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: coAuthor.isLead 
                                        ? KENYA_COLORS.lead
                                        : getNodeColor(coAuthor),
                                      fontWeight: 700
                                    }}>
                                      {coAuthor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </Avatar>
                                  }
                                  sx={{
                                    height: 28,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: coAuthor.isLead 
                                      ? 'rgba(255, 215, 0, 0.15)'
                                      : 'rgba(139, 108, 188, 0.15)',
                                    color: coAuthor.isLead 
                                      ? KENYA_COLORS.lead
                                      : KENYA_COLORS.direct,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: `1px solid ${coAuthor.isLead ? KENYA_COLORS.lead : KENYA_COLORS.direct}30`,
                                    '&:hover': {
                                      bgcolor: coAuthor.isLead 
                                        ? 'rgba(255, 215, 0, 0.25)'
                                        : 'rgba(139, 108, 188, 0.25)',
                                      transform: 'scale(1.05)',
                                      borderColor: coAuthor.isLead ? KENYA_COLORS.lead : KENYA_COLORS.direct
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNodeClick(coAuthor);
                                  }}
                                />
                              ))}
                              {pub.coAuthors.length > 3 && (
                                <Chip
                                  label={`+${pub.coAuthors.length - 3} more`}
                                  size="small"
                                  sx={{
                                    height: 28,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: 'rgba(120, 144, 156, 0.15)',
                                    color: KENYA_COLORS.neutral
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                        
                        {/* Abstract - Show preview */}
                        {pub.abstract && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ 
                              color: KENYA_COLORS.text.secondary,
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                              fontSize: '0.8rem',
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                              p: 1.5,
                              borderRadius: 1,
                              border: '1px solid rgba(0, 0, 0, 0.06)'
                            }}>
                              {selectedPublication?.pub_id === pub.pub_id 
                                ? pub.abstract 
                                : `${pub.abstract.substring(0, 80)}...`
                              }
                            </Typography>
                            
                            {pub.abstract.length > 80 && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: KENYA_COLORS.direct,
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  mt: 0.5,
                                  display: 'block',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPublication(selectedPublication?.pub_id === pub.pub_id ? null : pub);
                                }}
                              >
                                {selectedPublication?.pub_id === pub.pub_id ? 'Show less' : 'Read more'}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Card>
                    ))}
                    
                    {/* Show More/Less Publications Button */}
                    {sharedPublications.length > 3 && (
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Chip
                          icon={showAllPublications ? <ExpandLess /> : <ExpandMore />}
                          label={showAllPublications 
                            ? 'Show fewer publications' 
                            : `Show all ${sharedPublications.length} publications`
                          }
                          onClick={() => setShowAllPublications(!showAllPublications)}
                          sx={{
                            bgcolor: KENYA_COLORS.direct,
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: d3.color(KENYA_COLORS.direct).darker(0.5),
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Collaboration Network Summary for Lead */}
              {selectedNode.isLead && collaborationLevel.direct.size > 0 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 700, 
                    mb: 2,
                    color: KENYA_COLORS.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Groups fontSize="small" />
                    Network Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: KENYA_COLORS.direct }}>
                        {collaborationLevel.direct.size}
                      </Typography>
                      <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                        Direct
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: KENYA_COLORS.secondary }}>
                        {collaborationLevel.secondary.size}
                      </Typography>
                      <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                        Secondary
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: KENYA_COLORS.highlight }}>
                        {highlightLinks.size}
                      </Typography>
                      <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                        Connections
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Enhanced Legend */}
      <Fade in={true} timeout={1000}>
        <Card elevation={6} sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          borderRadius: 3,
          background: KENYA_COLORS.surfaceElevated,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          minWidth: 280
        }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: KENYA_COLORS.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Groups fontSize="small" />
              Network Legend
            </Typography>
        
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Lead Investigator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{ 
                    width: 20,
                    height: 20,
                    borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${KENYA_COLORS.leadGradient[0]}, ${KENYA_COLORS.leadGradient[1]})`,
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    ★
                  </Box>
                  {/* Glow effect */}
                  <Box sx={{
                    position: 'absolute',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${KENYA_COLORS.lead}20 0%, transparent 70%)`,
                    top: -4,
                    left: -4,
                    zIndex: -1
                  }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: KENYA_COLORS.text.primary }}>
                    Lead Investigator
                  </Typography>
                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                    Primary researcher at network center
                  </Typography>
                </Box>
              </Box>
          
              {/* Direct Collaborators */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{ 
                    width: 16,
                    height: 16,
                    borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${KENYA_COLORS.directGradient[0]}, ${KENYA_COLORS.directGradient[1]})`,
                    border: '2px solid rgba(139, 108, 188, 0.3)'
                  }} />
                  {/* Glow effect */}
                  <Box sx={{
                    position: 'absolute',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${KENYA_COLORS.direct}15 0%, transparent 70%)`,
                    top: -4,
                    left: -4,
                    zIndex: -1
                  }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: KENYA_COLORS.text.primary }}>
                    Direct Collaborators
                  </Typography>
                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                    Co-authors with lead investigator
                  </Typography>
                </Box>
              </Box>
              
              {/* Secondary Collaborators */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${KENYA_COLORS.secondaryGradient[0]}, ${KENYA_COLORS.secondaryGradient[1]})`,
                    border: '2px solid rgba(229, 57, 53, 0.3)'
                  }} />
                  {/* Glow effect */}
                  <Box sx={{
                    position: 'absolute',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${KENYA_COLORS.secondary}15 0%, transparent 70%)`,
                    top: -3,
                    left: -3,
                    zIndex: -1
                  }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: KENYA_COLORS.text.primary }}>
                    Secondary Collaborators
                  </Typography>
                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                    Collaborate with direct collaborators
                  </Typography>
                </Box>
              </Box>
              
              {/* Other Researchers */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${KENYA_COLORS.neutralGradient[0]}, ${KENYA_COLORS.neutralGradient[1]})`,
                    border: '2px solid rgba(120, 144, 156, 0.3)',
                    opacity: 0.7
                  }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: KENYA_COLORS.text.primary }}>
                    Other Researchers
                  </Typography>
                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                    No direct collaboration identified
                  </Typography>
                </Box>
              </Box>

              {/* Pending Collaborators */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Box sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${KENYA_COLORS.directGradient[0]}, ${KENYA_COLORS.directGradient[1]})`,
                    border: '2px dashed rgba(255, 152, 0, 0.8)',
                    opacity: 0.7
                  }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: KENYA_COLORS.text.primary }}>
                    Pending Invitations
                  </Typography>
                  <Typography variant="caption" sx={{ color: KENYA_COLORS.text.secondary }}>
                    Collaborators with pending invitations
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Interaction Guide */}
            <Divider sx={{ my: 2, bgcolor: 'rgba(0, 0, 0, 0.08)' }} />
            
            <Typography variant="caption" sx={{ 
              color: KENYA_COLORS.text.secondary,
              fontWeight: 600,
              mb: 1,
              display: 'block'
            }}>
              Interaction Guide:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: KENYA_COLORS.text.disabled, fontSize: '0.7rem' }}>
                • Click nodes to view detailed information
              </Typography>
              <Typography variant="caption" sx={{ color: KENYA_COLORS.text.disabled, fontSize: '0.7rem' }}>
                • Drag nodes to reposition them
              </Typography>
              <Typography variant="caption" sx={{ color: KENYA_COLORS.text.disabled, fontSize: '0.7rem' }}>
                • Search for specific researchers
              </Typography>
              <Typography variant="caption" sx={{ color: KENYA_COLORS.text.disabled, fontSize: '0.7rem' }}>
                • Use controls to zoom and navigate
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Force Graph */}
      <Box sx={{ width: '100%', height: '100%' }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={networkData}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          onNodeClick={(node, event) => {
            if (event) {
              event.stopPropagation();
              event.preventDefault();
            }
            handleNodeClick(node);
          }}
          onNodeHover={(node) => setHoveredNode(node)}
          onBackgroundClick={(event) => {
            if (event && event.target && event.target.tagName === 'CANVAS') {
              handleBackgroundClick();
            }
          }}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          nodeRelSize={8}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.3}
          cooldownTicks={300}
          backgroundColor={KENYA_COLORS.background}
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          nodeLabel={() => ''}
          linkLabel={() => ''}
          nodePointerAreaPaint={(node, color, ctx) => {
            const baseSize = node.isLead ? 50 : Math.max(20, node.val); // Match node size
            const clickableSize = Math.max(50, baseSize * 1.2); // Slightly larger clickable area
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, clickableSize, 0, 2 * Math.PI);
            ctx.fill();
          }}
          nodeColor={getNodeColor}
          linkDirectionalArrowLength={0}
          linkDirectionalArrowRelPos={0}
          linkWidth={(link) => Math.max(0.5, link.value * 0.5)}
          minZoom={0.1}
          maxZoom={8}
        />
      </Box>
    </Box>
  );
};

export default KenyaNetworkVisualization;
