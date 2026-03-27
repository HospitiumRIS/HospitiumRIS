import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3';
import { THEME_COLORS, NODE_SIZES, FORCE_CONFIG } from './styles/theme';
import { getNodeColor } from './utils/networkDataProcessor';

const NetworkGraph = ({ 
  nodes, 
  links, 
  selectedNode, 
  onNodeClick, 
  onNodeHover,
  highlightNodes,
  highlightLinks,
  dimensions,
  onGraphReady
}) => {
  const fgRef = useRef();

  useEffect(() => {
    if (fgRef.current && onGraphReady) {
      onGraphReady(fgRef.current);
    }
  }, [onGraphReady]);

  const graphData = useMemo(() => ({
    nodes: nodes || [],
    links: links || []
  }), [nodes, links]);

  useEffect(() => {
    if (!fgRef.current) return;

    const fg = fgRef.current;

    fg.d3Force('charge', d3.forceManyBody()
      .strength(FORCE_CONFIG.charge.strength)
      .distanceMin(FORCE_CONFIG.charge.distanceMin)
      .distanceMax(FORCE_CONFIG.charge.distanceMax)
    );

    fg.d3Force('collision', d3.forceCollide()
      .radius(node => {
        const baseSize = node.isLead ? NODE_SIZES.lead : 
                        Math.max(NODE_SIZES.min, Math.min(NODE_SIZES.max, node.val));
        return baseSize + FORCE_CONFIG.collision.padding;
      })
      .strength(FORCE_CONFIG.collision.strength)
      .iterations(FORCE_CONFIG.collision.iterations)
    );

    fg.d3Force('link', d3.forceLink()
      .distance(FORCE_CONFIG.link.distance)
      .strength(FORCE_CONFIG.link.strength)
    );

    fg.d3Force('center', d3.forceCenter()
      .strength(FORCE_CONFIG.center.strength)
    );
  }, []);

  const paintNode = useCallback((node, ctx, globalScale) => {
    // Skip rendering if node position is not yet defined
    if (typeof node.x !== 'number' || typeof node.y !== 'number' || 
        !isFinite(node.x) || !isFinite(node.y)) {
      return;
    }

    const isHighlighted = highlightNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    
    const size = node.isLead ? NODE_SIZES.lead : 
                 Math.max(NODE_SIZES.min, Math.min(NODE_SIZES.max, node.val));
    
    const nodeColor = getNodeColor(node, THEME_COLORS);

    ctx.save();
    
    // Draw node name label below the node
    const fontSize = Math.max(10, 12 / globalScale);
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = THEME_COLORS.textPrimary;
    
    // Add white background for better readability
    const textMetrics = ctx.measureText(node.name);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    const padding = 4 / globalScale;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      node.x - textWidth / 2 - padding,
      node.y + size + 4 / globalScale,
      textWidth + padding * 2,
      textHeight + padding * 2
    );
    
    ctx.fillStyle = THEME_COLORS.textPrimary;
    ctx.fillText(node.name, node.x, node.y + size + 6 / globalScale);

    ctx.restore();
    ctx.save();

    if (isSelected || isHighlighted) {
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size + 8);
      gradient.addColorStop(0, nodeColor + '40');
      gradient.addColorStop(1, nodeColor + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (isSelected) {
      ctx.strokeStyle = THEME_COLORS.primary;
      ctx.lineWidth = 3 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(
      node.x - size / 3,
      node.y - size / 3,
      0,
      node.x,
      node.y,
      size
    );
    gradient.addColorStop(0, nodeColor);
    gradient.addColorStop(1, d3.color(nodeColor).darker(0.5));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 / globalScale;
    ctx.stroke();

    if (node.isPending) {
      ctx.strokeStyle = THEME_COLORS.warning;
      ctx.lineWidth = 2 / globalScale;
      ctx.setLineDash([5 / globalScale, 3 / globalScale]);
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (globalScale > 1.5) {
      ctx.font = `${12 / globalScale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      const initials = node.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      ctx.fillText(initials, node.x, node.y);
    }

    ctx.restore();
  }, [selectedNode, highlightNodes]);

  const paintLink = useCallback((link, ctx, globalScale) => {
    // Skip rendering if link endpoints are not yet defined
    if (!link.source || !link.target || 
        typeof link.source.x !== 'number' || typeof link.source.y !== 'number' ||
        typeof link.target.x !== 'number' || typeof link.target.y !== 'number' ||
        !isFinite(link.source.x) || !isFinite(link.source.y) ||
        !isFinite(link.target.x) || !isFinite(link.target.y)) {
      return;
    }

    const isHighlighted = highlightLinks.has(link);
    
    ctx.save();
    
    const linkColor = isHighlighted ? THEME_COLORS.linkHighlight : THEME_COLORS.linkDefault;
    const linkWidth = isHighlighted ? 2 / globalScale : 1 / globalScale;
    
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = linkWidth;
    
    if (link.isPending) {
      ctx.setLineDash([5 / globalScale, 3 / globalScale]);
    }
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
    
    if (link.isPending) {
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }, [highlightLinks]);

  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node) => {
    if (onNodeHover) {
      onNodeHover(node);
    }
  }, [onNodeHover]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={dimensions.width}
      height={dimensions.height}
      nodeCanvasObject={paintNode}
      linkCanvasObject={paintLink}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      nodeRelSize={NODE_SIZES.direct}
      linkDirectionalParticles={0}
      linkDirectionalParticleWidth={0}
      enableNodeDrag={true}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      cooldownTicks={100}
      onEngineStop={() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 80);
        }
      }}
      backgroundColor={THEME_COLORS.background}
      d3VelocityDecay={0.3}
    />
  );
};

export default NetworkGraph;
