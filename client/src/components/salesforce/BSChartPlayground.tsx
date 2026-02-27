import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Table2,
  Diamond,
  RectangleHorizontal,
  Type,
  MoreVertical,
  GripVertical,
  X,
  Copy,
  Pencil,
} from 'lucide-react';
import {
  useBSCharts,
  useBSChart,
  useCreateBSChart,
  useUpdateBSChart,
  useDeleteBSChart,
  type ChartNode,
  type ChartEdge,
  type ChartData,
  type BSChartSummary,
} from '@/hooks/use-bs-charts';

// ─── Constants ────────────────────────────────────────────────────────
const GRID_SIZE = 20;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ANCHOR_SIZE = 10;
const DEFAULT_NODE_COLORS: Record<ChartNode['type'], string> = {
  'data-table': '#1B96FF',
  diamond: '#F59E0B',
  process: '#8B5CF6',
  'text-label': 'transparent',
};

const DEFAULT_NODE_SIZES: Record<ChartNode['type'], { w: number; h: number }> = {
  'data-table': { w: 220, h: 160 },
  diamond: { w: 180, h: 120 },
  process: { w: 200, h: 80 },
  'text-label': { w: 160, h: 40 },
};

// ─── Helpers ──────────────────────────────────────────────────────────
let idCounter = 0;
function genId() {
  return `n${Date.now()}-${++idCounter}`;
}

function snapToGrid(val: number) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

function getAnchorPos(node: ChartNode, anchor: 'top' | 'right' | 'bottom' | 'left') {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  switch (anchor) {
    case 'top': return { x: cx, y: node.y };
    case 'bottom': return { x: cx, y: node.y + node.height };
    case 'left': return { x: node.x, y: cy };
    case 'right': return { x: node.x + node.width, y: cy };
  }
}

function buildEdgePath(
  src: { x: number; y: number },
  tgt: { x: number; y: number },
  srcAnchor: string,
  tgtAnchor: string
) {
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.4, 100);

  const controlOffset = (anchor: string, mult: number) => {
    switch (anchor) {
      case 'top': return { x: 0, y: -mult };
      case 'bottom': return { x: 0, y: mult };
      case 'left': return { x: -mult, y: 0 };
      case 'right': return { x: mult, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };
  const c1 = controlOffset(srcAnchor, offset);
  const c2 = controlOffset(tgtAnchor, offset);
  return `M${src.x},${src.y} C${src.x + c1.x},${src.y + c1.y} ${tgt.x + c2.x},${tgt.y + c2.y} ${tgt.x},${tgt.y}`;
}

// ─── Chart List View ──────────────────────────────────────────────────
function ChartListView({
  onOpen,
  onClose,
}: {
  onOpen: (id: number) => void;
  onClose: () => void;
}) {
  const { data: charts = [], isLoading } = useBSCharts();
  const createChart = useCreateBSChart();
  const deleteChart = useDeleteBSChart();
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const handleCreate = () => {
    createChart.mutate({ name: 'Untitled Chart' }, {
      onSuccess: (chart) => onOpen(chart.id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F3F3F3' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4" style={{ background: '#032D60' }}>
        <button onClick={onClose} className="sf-icon-btn" title="Close">
          <X className="slds-icon-size_small" />
        </button>
        <span className="text-white font-semibold text-lg">BS Chart</span>
        <div className="flex-1" />
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: '#1B96FF' }}
        >
          <Plus size={16} />
          New Chart
        </button>
      </div>

      {/* Chart grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading charts...</div>
        ) : charts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Diamond size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg mb-2">No charts yet</p>
            <p className="text-gray-400 text-sm mb-6">Create your first diagram to get started</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: '#1B96FF' }}
            >
              <Plus size={16} />
              Create Chart
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {charts.map((chart: BSChartSummary) => (
              <div
                key={chart.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
                onClick={() => onOpen(chart.id)}
              >
                {/* Thumbnail placeholder */}
                <div className="h-36 bg-gray-50 flex items-center justify-center border-b">
                  <Diamond size={32} className="text-gray-300" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-900 truncate">{chart.name}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(chart.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === chart.id ? null : chart.id); }}
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {menuOpenId === chart.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-10 py-1 w-32">
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChart.mutate(chart.id);
                            setMenuOpenId(null);
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Node Renderer ────────────────────────────────────────────────────
function NodeComponent({
  node,
  selected,
  onMouseDown,
  onDoubleClick,
  onAnchorMouseDown,
}: {
  node: ChartNode;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onAnchorMouseDown: (e: React.MouseEvent, anchor: 'top' | 'right' | 'bottom' | 'left') => void;
}) {
  const anchors: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];

  const anchorPositions = {
    top: { left: '50%', top: 0, transform: 'translate(-50%, -50%)' },
    bottom: { left: '50%', bottom: 0, transform: 'translate(-50%, 50%)' },
    left: { top: '50%', left: 0, transform: 'translate(-50%, -50%)' },
    right: { top: '50%', right: 0, transform: 'translate(50%, -50%)' },
  };

  const renderContent = () => {
    switch (node.type) {
      case 'data-table':
        return (
          <div className="flex flex-col h-full rounded-md overflow-hidden border border-gray-300 bg-white">
            <div
              className="px-3 py-2 text-white text-xs font-semibold truncate"
              style={{ background: node.headerColor }}
            >
              {node.label}
            </div>
            <div className="flex-1 overflow-y-auto">
              {(node.rows || []).map((row, i) => (
                <div
                  key={i}
                  className="px-3 py-1 text-xs border-b border-gray-100 text-gray-700 truncate"
                >
                  {row}
                </div>
              ))}
            </div>
          </div>
        );

      case 'diamond':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <polygon
                points="50,2 98,50 50,98 2,50"
                fill={node.headerColor}
                stroke={selected ? '#1B96FF' : '#94a3b8'}
                strokeWidth="2"
                opacity="0.9"
              />
            </svg>
            <span className="relative z-10 text-xs font-medium text-white text-center px-6 leading-tight">
              {node.label}
            </span>
          </div>
        );

      case 'process':
        return (
          <div
            className="flex items-center justify-center h-full rounded-lg border-2 text-sm font-semibold text-white px-4 text-center"
            style={{ background: node.headerColor, borderColor: selected ? '#1B96FF' : 'transparent' }}
          >
            {node.label}
          </div>
        );

      case 'text-label':
        return (
          <div
            className="flex items-center h-full px-2"
            style={{
              color: node.textColor || '#1e293b',
              fontSize: node.fontSize || 14,
              fontWeight: node.fontWeight || '600',
            }}
          >
            {node.label}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="absolute group"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: selected ? 20 : 10,
        cursor: 'move',
        outline: selected && node.type !== 'diamond' ? '2px solid #1B96FF' : 'none',
        outlineOffset: 2,
        borderRadius: node.type === 'process' ? 8 : node.type === 'data-table' ? 6 : 0,
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {renderContent()}
      {/* Connection anchors */}
      {anchors.map((a) => (
        <div
          key={a}
          className="absolute w-3 h-3 rounded-full border-2 border-white bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair z-30"
          style={{ ...anchorPositions[a], width: ANCHOR_SIZE, height: ANCHOR_SIZE }}
          onMouseDown={(e) => { e.stopPropagation(); onAnchorMouseDown(e, a); }}
        />
      ))}
    </div>
  );
}

// ─── Inline Text Editor ───────────────────────────────────────────────
function InlineEditor({
  node,
  onSave,
  onCancel,
  viewport,
}: {
  node: ChartNode;
  onSave: (updates: Partial<ChartNode>) => void;
  onCancel: () => void;
  viewport: { x: number; y: number; zoom: number };
}) {
  const [label, setLabel] = useState(node.label);
  const [rows, setRows] = useState((node.rows || []).join('\n'));
  const [headerColor, setHeaderColor] = useState(node.headerColor);
  const [textColor, setTextColor] = useState(node.textColor || '#1e293b');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [label, rows, headerColor, textColor]);

  const handleSave = () => {
    const updates: Partial<ChartNode> = { label, headerColor };
    if (node.type === 'data-table') {
      updates.rows = rows.split('\n').filter(Boolean);
    }
    if (node.type === 'text-label') {
      updates.textColor = textColor;
    }
    onSave(updates);
  };

  const colors = ['#1B96FF', '#0B827C', '#2E844A', '#8B5CF6', '#E11D48', '#F59E0B', '#EA580C', '#6B7280', '#1e293b', '#54698D'];

  return (
    <div
      ref={ref}
      className="absolute bg-white rounded-lg shadow-2xl border p-4 z-50"
      style={{
        left: node.x * viewport.zoom + viewport.x,
        top: node.y * viewport.zoom + viewport.y - 10,
        minWidth: 260,
        transform: 'translateY(-100%)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1">Label</label>
        <input
          autoFocus
          className="w-full border rounded px-2 py-1.5 text-sm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSave(); if (e.key === 'Escape') onCancel(); }}
        />
      </div>

      {node.type === 'data-table' && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">Rows (one per line)</label>
          <textarea
            className="w-full border rounded px-2 py-1.5 text-sm font-mono"
            rows={5}
            value={rows}
            onChange={(e) => setRows(e.target.value)}
          />
        </div>
      )}

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1">
          {node.type === 'text-label' ? 'Text Color' : 'Color'}
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {colors.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded-full border-2 transition-transform"
              style={{
                background: c,
                borderColor: (node.type === 'text-label' ? textColor : headerColor) === c ? '#1B96FF' : 'transparent',
                transform: (node.type === 'text-label' ? textColor : headerColor) === c ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => {
                if (node.type === 'text-label') setTextColor(c);
                else setHeaderColor(c);
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1 text-xs rounded border text-gray-600 hover:bg-gray-50" onClick={onCancel}>
          Cancel
        </button>
        <button className="px-3 py-1 text-xs rounded text-white" style={{ background: '#1B96FF' }} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Element Toolbar ──────────────────────────────────────────────────
const TOOLBAR_ITEMS: { type: ChartNode['type']; label: string; icon: typeof Table2 }[] = [
  { type: 'data-table', label: 'Data Table', icon: Table2 },
  { type: 'diamond', label: 'Decision', icon: Diamond },
  { type: 'process', label: 'Process', icon: RectangleHorizontal },
  { type: 'text-label', label: 'Text Label', icon: Type },
];

// ─── Chart Editor ─────────────────────────────────────────────────────
function ChartEditor({
  chartId,
  onBack,
}: {
  chartId: number;
  onBack: () => void;
}) {
  const { data: chart } = useBSChart(chartId);
  const updateChart = useUpdateBSChart();

  const [nodes, setNodes] = useState<ChartNode[]>([]);
  const [edges, setEdges] = useState<ChartEdge[]>([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [chartName, setChartName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Dragging state
  const [dragState, setDragState] = useState<{
    type: 'none' | 'node' | 'pan' | 'connect';
    nodeId?: string;
    startX?: number;
    startY?: number;
    nodeStartX?: number;
    nodeStartY?: number;
    vpStartX?: number;
    vpStartY?: number;
    sourceId?: string;
    sourceAnchor?: 'top' | 'right' | 'bottom' | 'left';
    currentX?: number;
    currentY?: number;
  }>({ type: 'none' });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load chart data
  useEffect(() => {
    if (chart) {
      setNodes(chart.data.nodes || []);
      setEdges(chart.data.edges || []);
      setChartName(chart.name);
      setIsDirty(false);
      setSaveStatus('saved');
    }
  }, [chart]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveStatus('unsaved');
  }, []);

  // Auto-save
  useEffect(() => {
    if (!isDirty || !chartId) return;
    const timer = setTimeout(() => {
      setSaveStatus('saving');
      updateChart.mutate(
        { id: chartId, name: chartName, data: { nodes, edges } },
        { onSuccess: () => { setIsDirty(false); setSaveStatus('saved'); } }
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [isDirty, nodes, edges, chartName, chartId]);

  const handleSave = useCallback(() => {
    if (!chartId) return;
    setSaveStatus('saving');
    updateChart.mutate(
      { id: chartId, name: chartName, data: { nodes, edges } },
      { onSuccess: () => { setIsDirty(false); setSaveStatus('saved'); } }
    );
  }, [chartId, chartName, nodes, edges]);

  // ─── Canvas mouse handlers ─────────────────────────────────────────
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setSelectedNodeId(null);
    setEditingNodeId(null);
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragState({
      type: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      vpStartX: viewport.x,
      vpStartY: viewport.y,
    });
  }, [viewport]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDragState({
      type: 'node',
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    });
  }, [nodes]);

  const handleAnchorMouseDown = useCallback((e: React.MouseEvent, nodeId: string, anchor: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragState({
      type: 'connect',
      sourceId: nodeId,
      sourceAnchor: anchor,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  }, []);

  useEffect(() => {
    if (dragState.type === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.type === 'pan') {
        const dx = e.clientX - dragState.startX!;
        const dy = e.clientY - dragState.startY!;
        setViewport((v) => ({
          ...v,
          x: dragState.vpStartX! + dx,
          y: dragState.vpStartY! + dy,
        }));
      } else if (dragState.type === 'node') {
        const dx = (e.clientX - dragState.startX!) / viewport.zoom;
        const dy = (e.clientY - dragState.startY!) / viewport.zoom;
        const newX = snapToGrid(dragState.nodeStartX! + dx);
        const newY = snapToGrid(dragState.nodeStartY! + dy);
        setNodes((prev) =>
          prev.map((n) => (n.id === dragState.nodeId ? { ...n, x: newX, y: newY } : n))
        );
        markDirty();
      } else if (dragState.type === 'connect') {
        const rect = canvasRef.current!.getBoundingClientRect();
        setDragState((prev) => ({
          ...prev,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragState.type === 'connect') {
        // Find target node/anchor under cursor
        const rect = canvasRef.current!.getBoundingClientRect();
        const canvasPos = {
          x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
          y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
        };

        for (const node of nodes) {
          if (node.id === dragState.sourceId) continue;
          const anchors: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
          for (const anchor of anchors) {
            const pos = getAnchorPos(node, anchor);
            const dx = canvasPos.x - pos.x;
            const dy = canvasPos.y - pos.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
              // Check for duplicate edge
              const exists = edges.some(
                (e) => e.sourceId === dragState.sourceId && e.targetId === node.id &&
                  e.sourceAnchor === dragState.sourceAnchor && e.targetAnchor === anchor
              );
              if (!exists) {
                const newEdge: ChartEdge = {
                  id: genId(),
                  sourceId: dragState.sourceId!,
                  targetId: node.id,
                  sourceAnchor: dragState.sourceAnchor!,
                  targetAnchor: anchor,
                };
                setEdges((prev) => [...prev, newEdge]);
                markDirty();
              }
              break;
            }
          }
        }
      }
      setDragState({ type: 'none' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, viewport, nodes, edges, markDirty]);

  // ─── Zoom ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport((v) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * delta));
      const ratio = newZoom / v.zoom;
      return {
        zoom: newZoom,
        x: mouseX - (mouseX - v.x) * ratio,
        y: mouseY - (mouseY - v.y) * ratio,
      };
    });
  }, []);

  // ─── Drop from toolbar ─────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type') as ChartNode['type'];
    if (!type) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    const size = DEFAULT_NODE_SIZES[type];
    const newNode: ChartNode = {
      id: genId(),
      type,
      x: snapToGrid(pos.x - size.w / 2),
      y: snapToGrid(pos.y - size.h / 2),
      width: size.w,
      height: size.h,
      label: type === 'data-table' ? 'Data Table' : type === 'diamond' ? 'Decision' : type === 'process' ? 'Process' : 'Label',
      headerColor: DEFAULT_NODE_COLORS[type],
      rows: type === 'data-table' ? ['Field 1', 'Field 2', 'Field 3'] : undefined,
      textColor: type === 'text-label' ? '#1e293b' : undefined,
      fontSize: type === 'text-label' ? 14 : undefined,
      fontWeight: type === 'text-label' ? '600' : undefined,
    };
    setNodes((prev) => [...prev, newNode]);
    markDirty();
  }, [screenToCanvas, markDirty]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingNodeId || editingName) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
        setEdges((prev) => prev.filter((e) => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId));
        setSelectedNodeId(null);
        markDirty();
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setEditingNodeId(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedNodeId) {
        e.preventDefault();
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (node) {
          const dup: ChartNode = { ...node, id: genId(), x: node.x + 40, y: node.y + 40 };
          setNodes((prev) => [...prev, dup]);
          setSelectedNodeId(dup.id);
          markDirty();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId, editingNodeId, editingName, nodes, handleSave, markDirty]);

  // ─── Zoom controls ─────────────────────────────────────────────────
  const zoomIn = () => setViewport((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, v.zoom * 1.2) }));
  const zoomOut = () => setViewport((v) => ({ ...v, zoom: Math.max(MIN_ZOOM, v.zoom / 1.2) }));
  const fitView = () => {
    if (nodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + n.width));
    const maxY = Math.max(...nodes.map((n) => n.y + n.height));
    const padding = 60;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const zoom = Math.min(rect.width / contentW, rect.height / contentH, 1.5);
    setViewport({
      zoom,
      x: (rect.width - contentW * zoom) / 2 - (minX - padding) * zoom,
      y: (rect.height - contentH * zoom) / 2 - (minY - padding) * zoom,
    });
  };

  // ─── Update node from editor ───────────────────────────────────────
  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<ChartNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)));
    setEditingNodeId(null);
    markDirty();
  }, [markDirty]);

  // ─── Delete selected edge ──────────────────────────────────────────
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEdgeId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
        markDirty();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedEdgeId, markDirty]);

  // ─── Render ────────────────────────────────────────────────────────
  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null;

  // Connection line being drawn
  const connectLine = useMemo(() => {
    if (dragState.type !== 'connect' || !dragState.sourceId || !dragState.currentX) return null;
    const sourceNode = nodes.find((n) => n.id === dragState.sourceId);
    if (!sourceNode) return null;
    const srcPos = getAnchorPos(sourceNode, dragState.sourceAnchor!);
    return {
      x1: srcPos.x * viewport.zoom + viewport.x,
      y1: srcPos.y * viewport.zoom + viewport.y,
      x2: dragState.currentX,
      y2: dragState.currentY,
    };
  }, [dragState, nodes, viewport]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F3F3F3' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ background: '#032D60' }}>
        <button onClick={onBack} className="sf-icon-btn" title="Back to charts">
          <ArrowLeft className="slds-icon-size_small" />
        </button>

        {/* Chart name */}
        {editingName ? (
          <input
            autoFocus
            className="bg-white/10 text-white border border-white/30 rounded px-2 py-1 text-sm font-medium"
            value={chartName}
            onChange={(e) => { setChartName(e.target.value); markDirty(); }}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false); }}
          />
        ) : (
          <button
            className="text-white font-medium text-sm flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded"
            onClick={() => setEditingName(true)}
          >
            {chartName || 'Untitled'}
            <Pencil size={12} className="opacity-60" />
          </button>
        )}

        <div className="flex-1" />

        {/* Save status */}
        <span className="text-xs text-white/60">
          {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
        </span>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white"
          style={{ background: '#1B96FF' }}
        >
          <Save size={14} />
          Save
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={zoomOut} className="sf-icon-btn" title="Zoom out"><ZoomOut size={16} /></button>
          <span className="text-xs text-white/70 w-10 text-center">{Math.round(viewport.zoom * 100)}%</span>
          <button onClick={zoomIn} className="sf-icon-btn" title="Zoom in"><ZoomIn size={16} /></button>
          <button onClick={fitView} className="sf-icon-btn" title="Fit to view"><Maximize2 size={16} /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar - element palette */}
        <div className="w-48 bg-white border-r flex flex-col p-3 gap-1 shrink-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Elements</div>
          {TOOLBAR_ITEMS.map(({ type, label, icon: Icon }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('node-type', type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md cursor-grab text-sm text-gray-700 hover:bg-gray-100 active:cursor-grabbing border border-transparent hover:border-gray-200"
            >
              <GripVertical size={12} className="text-gray-300" />
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: DEFAULT_NODE_COLORS[type], opacity: type === 'text-label' ? 1 : undefined }}>
                <Icon size={12} className={type === 'text-label' ? 'text-gray-600' : 'text-white'} />
              </div>
              {label}
            </div>
          ))}
          <div className="mt-auto text-xs text-gray-400 leading-relaxed pt-4 border-t">
            <p className="mb-1"><strong>Drag</strong> elements to canvas</p>
            <p className="mb-1"><strong>Double-click</strong> to edit</p>
            <p className="mb-1"><strong>Hover</strong> for connection points</p>
            <p className="mb-1"><strong>Del</strong> to remove selected</p>
            <p><strong>Ctrl+D</strong> to duplicate</p>
          </div>
        </div>

        {/* Canvas area */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{
            background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px',
            cursor: dragState.type === 'pan' ? 'grabbing' : dragState.type === 'connect' ? 'crosshair' : 'grab',
          }}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => setSelectedEdgeId(null)}
        >
          {/* Transform layer */}
          <div
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              inset: 0,
            }}
          >
            {/* Edges (SVG) */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '10000px', height: '10000px', left: '-5000px', top: '-5000px', overflow: 'visible' }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
                <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#1B96FF" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.sourceId);
                const targetNode = nodes.find((n) => n.id === edge.targetId);
                if (!sourceNode || !targetNode) return null;
                const src = getAnchorPos(sourceNode, edge.sourceAnchor);
                const tgt = getAnchorPos(targetNode, edge.targetAnchor);
                const path = buildEdgePath(src, tgt, edge.sourceAnchor, edge.targetAnchor);
                const isSelected = selectedEdgeId === edge.id;
                return (
                  <g key={edge.id}>
                    {/* Invisible wider path for easier click targeting */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={12}
                      style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={isSelected ? '#1B96FF' : edge.color || '#64748b'}
                      strokeWidth={isSelected ? 2.5 : 2}
                      markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                      style={{ pointerEvents: 'none' }}
                    />
                    {edge.label && (
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 - 8}
                        textAnchor="middle"
                        className="text-xs fill-gray-500"
                        style={{ fontSize: 11 }}
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <NodeComponent
                key={node.id}
                node={node}
                selected={selectedNodeId === node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={() => setEditingNodeId(node.id)}
                onAnchorMouseDown={(e, anchor) => handleAnchorMouseDown(e, node.id, anchor)}
              />
            ))}
          </div>

          {/* Connection line being drawn (screen-space SVG) */}
          {connectLine && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              <line
                x1={connectLine.x1}
                y1={connectLine.y1}
                x2={connectLine.x2}
                y2={connectLine.y2}
                stroke="#1B96FF"
                strokeWidth={2}
                strokeDasharray="6 3"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Inline editor */}
      {editingNode && (
        <InlineEditor
          node={editingNode}
          viewport={viewport}
          onSave={(updates) => handleNodeUpdate(editingNode.id, updates)}
          onCancel={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function BSChartPlayground({ onClose }: { onClose: () => void }) {
  const [openChartId, setOpenChartId] = useState<number | null>(null);

  if (openChartId !== null) {
    return (
      <ChartEditor
        chartId={openChartId}
        onBack={() => setOpenChartId(null)}
      />
    );
  }

  return <ChartListView onOpen={setOpenChartId} onClose={onClose} />;
}
