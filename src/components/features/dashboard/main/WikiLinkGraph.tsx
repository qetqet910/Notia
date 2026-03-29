import React, { useMemo, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { type Note } from '@/types';
import { parseObsidianLinks } from '@/utils/obsidianLinks';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import ZoomIn from 'lucide-react/dist/esm/icons/zoom-in';
import ZoomOut from 'lucide-react/dist/esm/icons/zoom-out';
import LocateFixed from 'lucide-react/dist/esm/icons/locate-fixed';
import { Button } from '@/components/ui/button';

// D3 Node & Link types
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  radius: number;
  connectionCount: number;
  isImportant: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface WikiLinkGraphProps {
  notes: Note[];
  onWikiLinkClick: (title: string) => void;
}

export const WikiLinkGraph: React.FC<WikiLinkGraphProps> = ({ notes, onWikiLinkClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [showIsolated, setShowIsolated] = useState(true);
  
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const transformRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // ResizeObserver limits trigger
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Data processing
  const { allNodes, allLinks } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const titleToId = new Map<string, string>();

    notes.forEach((note) => {
      const id = note.id;
      if (note.title) titleToId.set(note.title.toLowerCase(), id);
      nodeMap.set(id, {
        id,
        title: note.title || 'Untitled',
        radius: 4,
        connectionCount: 0,
        isImportant: false,
      });
    });

    const graphLinks: GraphLink[] = [];
    const connectionCounts = new Map<string, number>();

    notes.forEach((note) => {
      const obsidianLinks = parseObsidianLinks(note.content || '');
      const uniqueTargets = new Set(obsidianLinks.map(l => l.target.toLowerCase()));
      
      uniqueTargets.forEach((targetTitle) => {
        const targetId = titleToId.get(targetTitle);
        if (targetId && targetId !== note.id) {
          graphLinks.push({
            source: note.id,
            target: targetId,
          });
          connectionCounts.set(note.id, (connectionCounts.get(note.id) || 0) + 1);
          connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
        }
      });
    });

    const graphNodes = Array.from(nodeMap.values()).map(node => {
      const count = connectionCounts.get(node.id) || 0;
      return {
        ...node,
        radius: Math.min(4 + Math.sqrt(count) * 2.5, 18), // Logarithmic scale for radius
        connectionCount: count,
        isImportant: count >= 3
      };
    });

    return { allNodes: graphNodes, allLinks: graphLinks };
  }, [notes]);

  const { nodes, links } = useMemo(() => {
    if (showIsolated) return { nodes: allNodes, links: allLinks };
    
    const connectedNodes = allNodes.filter(n => n.connectionCount > 0);
    const connectedIds = new Set(connectedNodes.map(n => n.id));
    const connectedLinks = allLinks.filter(l => 
        connectedIds.has(typeof l.source === 'string' ? l.source : l.source.id) && 
        connectedIds.has(typeof l.target === 'string' ? l.target : l.target.id)
    );
    
    return { nodes: connectedNodes, links: connectedLinks };
  }, [allNodes, allLinks, showIsolated]);

  // Handle D3 simulation
  useEffect(() => {
    if (!svgRef.current || !dimensions || nodes.length === 0) return;
    const { width, height } = dimensions;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Define gradients and filters
    const defs = svg.append("defs");
    
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "blur");
      
    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    const container = svg.append('g');

    // Setup zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    transformRef.current = zoom;
    svg.call(zoom);

    // Initial transform to center
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1));

    // D3 Forces
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(60).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200).distanceMax(300))
      .force('collide', d3.forceCollide().radius(d => (d as GraphNode).radius + 8).iterations(2))
      .force('x', d3.forceX(0).strength(0.05))
      .force('y', d3.forceY(0).strength(0.05));

    simulationRef.current = simulation;

    // Links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'hsl(var(--muted-foreground))')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 1.5);

    // Nodes
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'graph-node')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('mouseenter', (_, d) => setHoveredNode(d.id))
      .on('mouseleave', () => setHoveredNode(null))
      .on('click', (event, d) => {
        if (!event.defaultPrevented) {
          onWikiLinkClick(d.title);
        }
      });

    // Node circles
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.isImportant ? '#68C7C1' : 'hsl(var(--primary))')
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 1.5)
      .style('opacity', 0.8)
      .attr('filter', d => d.isImportant ? 'url(#glow)' : null);

    // Node labels
    node.append('text')
      .text(d => d.title)
      .attr('x', d => d.radius + 6)
      .attr('y', 4)
      .attr('class', 'select-none pointer-events-none')
      .style('font-size', d => d.isImportant ? '12px' : '10px')
      .style('font-weight', d => d.isImportant ? '600' : '400')
      .style('fill', 'hsl(var(--foreground))')
      .style('opacity', d => d.isImportant ? 0.7 : 0);

    // Save references to container for hover effect
    svg.node()!.setAttribute('data-initialized', 'true');

    // Simulation tick update
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodes, links, dimensions, onWikiLinkClick]);

  // Handle Hover Effects
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    if (!hoveredNode) {
      // Revert to normal state
      svg.selectAll('line')
        .transition().duration(250)
        .attr('stroke', 'hsl(var(--muted-foreground))')
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', 1.5);

      svg.selectAll('.graph-node circle')
        .transition().duration(250)
        .style('opacity', 0.8)
        .attr('fill', (d: unknown) => (d as GraphNode).isImportant ? '#68C7C1' : 'hsl(var(--primary))');

      svg.selectAll('.graph-node text')
        .transition().duration(250)
        .style('opacity', (d: unknown) => (d as GraphNode).isImportant ? 0.7 : 0)
        .style('fill', 'hsl(var(--foreground))');
        
      return;
    }

    // Hover state
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(hoveredNode);

    svg.selectAll('line').each((d: unknown) => {
      const link = d as GraphLink;
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      if (sourceId === hoveredNode || targetId === hoveredNode) {
        connectedNodeIds.add(sourceId);
        connectedNodeIds.add(targetId);
      }
    });

    svg.selectAll('line')
      .transition().duration(250)
      .attr('stroke', (d: unknown) => {
        const link = d as GraphLink;
        const sId = typeof link.source === 'string' ? link.source : link.source.id;
        const tId = typeof link.target === 'string' ? link.target : link.target.id;
        return (sId === hoveredNode || tId === hoveredNode) ? '#68C7C1' : 'hsl(var(--muted-foreground))';
      })
      .attr('stroke-opacity', (d: unknown) => {
        const link = d as GraphLink;
        const sId = typeof link.source === 'string' ? link.source : link.source.id;
        const tId = typeof link.target === 'string' ? link.target : link.target.id;
        return (sId === hoveredNode || tId === hoveredNode) ? 0.8 : 0.05;
      })
      .attr('stroke-width', (d: unknown) => {
        const link = d as GraphLink;
        const sId = typeof link.source === 'string' ? link.source : link.source.id;
        const tId = typeof link.target === 'string' ? link.target : link.target.id;
        return (sId === hoveredNode || tId === hoveredNode) ? 2 : 1;
      });

    svg.selectAll('.graph-node circle')
      .transition().duration(250)
      .style('opacity', (d: unknown) => connectedNodeIds.has((d as GraphNode).id) ? 1 : 0.2)
      .attr('fill', (d: unknown) => 
        (d as GraphNode).id === hoveredNode ? '#8b5cf6' : 
        connectedNodeIds.has((d as GraphNode).id) ? '#68C7C1' : 
        'hsl(var(--primary))'
      );

    svg.selectAll('.graph-node text')
      .transition().duration(250)
      .style('opacity', (d: unknown) => connectedNodeIds.has((d as GraphNode).id) ? 1 : 0)
      .style('fill', (d: unknown) => 
        (d as GraphNode).id === hoveredNode ? '#8b5cf6' : 
        connectedNodeIds.has((d as GraphNode).id) ? 'hsl(var(--foreground))' : 
        'hsl(var(--muted-foreground))'
      );

  }, [hoveredNode, showIsolated]);

  const handleZoomIn = () => {
    if (!svgRef.current || !transformRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(transformRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !transformRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(transformRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !transformRef.current || !dimensions) return;
    d3.select(svgRef.current).transition().duration(500)
      .call(transformRef.current.transform, d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(1));
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[500px] overflow-hidden bg-background border border-border/50 rounded-xl relative shadow-inner"
    >
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          Knowledge Graph
        </h3>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          {nodes.length} nodes, {links.length} links
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 bg-background/80 backdrop-blur-sm border shadow-sm"
          onClick={() => setShowIsolated(!showIsolated)}
          title={showIsolated ? "고립 노드 숨기기" : "고립 노드 표시"}
        >
          {showIsolated ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <div className="bg-background/80 backdrop-blur-sm border rounded-md shadow-sm flex items-center p-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={handleZoomIn} title="확대">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-[1px] h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={handleResetZoom} title="가운데 정렬">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <div className="w-[1px] h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={handleZoomOut} title="축소">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!dimensions && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          그래프 로딩 중...
        </div>
      )}
      
      {dimensions && nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
          <span>{allNodes.length > 0 ? "연결된 노트가 없습니다." : "작성된 노트가 없습니다."}</span>
          <span className="text-xs opacity-70">에디터에서 [[노트제목]] 형식으로 위키 링크를 만들어보세요.</span>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default WikiLinkGraph;
