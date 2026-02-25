import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/identity-rulesets';

export interface IdentityRulesetData {
  id?: number;
  rulesetId: string;
  rulesetName: string;
  dataSpace: string;
  primaryDataModelObject: string;
  secondaryDataModelObject: string;
  rulesetStatus: string;
  lastJobStatus: string;
  lastJobCompleted: string;
  description: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  isScheduled: boolean;
  sourceProfiles: number;
  matchedSourceProfiles: number;
  totalUnifiedProfiles: number;
  consolidationRate: number;
  matchRules: any[];
  reconciliationGroups: any[];
  processingHistory: any[];
  createdAt?: string;
  updatedAt?: string;
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useIdentityRulesets() {
  return useQuery<IdentityRulesetData[]>({
    queryKey: ['identity-rulesets'],
    queryFn: () => fetchJson<IdentityRulesetData[]>(API_BASE),
  });
}

export function useIdentityRuleset(id: number) {
  return useQuery<IdentityRulesetData>({
    queryKey: ['identity-rulesets', id],
    queryFn: () => fetchJson<IdentityRulesetData>(`${API_BASE}/${id}`),
    enabled: !!id,
  });
}

export function useCreateIdentityRuleset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IdentityRulesetData) =>
      fetchJson<IdentityRulesetData>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity-rulesets'] }),
  });
}

export function useUpdateIdentityRuleset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IdentityRulesetData }) =>
      fetchJson<IdentityRulesetData>(`${API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity-rulesets'] }),
  });
}

export function useDeleteIdentityRuleset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchJson<{ deleted: boolean }>(`${API_BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['identity-rulesets'] }),
  });
}
