import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/bs-charts';

export interface ChartNode {
  id: string;
  type: 'data-table' | 'diamond' | 'process' | 'text-label';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  headerColor: string;
  rows?: string[];
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
}

export interface ChartEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceAnchor: 'top' | 'right' | 'bottom' | 'left';
  targetAnchor: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
}

export interface ChartData {
  nodes: ChartNode[];
  edges: ChartEdge[];
}

export interface BSChartSummary {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BSChart extends BSChartSummary {
  data: ChartData;
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useBSCharts() {
  return useQuery<BSChartSummary[]>({
    queryKey: ['bs-charts'],
    queryFn: () => fetchJson<BSChartSummary[]>(API_BASE),
  });
}

export function useBSChart(id: number | null) {
  return useQuery<BSChart>({
    queryKey: ['bs-charts', id],
    queryFn: () => fetchJson<BSChart>(`${API_BASE}/${id}`),
    enabled: !!id,
  });
}

export function useCreateBSChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; data?: ChartData }) =>
      fetchJson<BSChart>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bs-charts'] }),
  });
}

export function useUpdateBSChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; name?: string; data?: ChartData }) =>
      fetchJson<BSChart>(`${API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['bs-charts'] });
      qc.invalidateQueries({ queryKey: ['bs-charts', vars.id] });
    },
  });
}

export function useDeleteBSChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJson<{ deleted: boolean }>(`${API_BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bs-charts'] }),
  });
}
