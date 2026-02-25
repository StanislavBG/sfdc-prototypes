import { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  GripVertical,
  ChevronDown,
  Clock,
  Fingerprint,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
interface MatchRule {
  id: string;
  ruleName: string;
  matchFields: string[];
  matchType: 'Exact' | 'Fuzzy' | 'Normalized';
  priority: number;
}

interface ReconciliationRule {
  id: string;
  field: string;
  source: string;
  strategy: 'Most Recent' | 'Source Priority' | 'Most Frequent' | 'Manual Override';
}

interface ProcessingHistoryEntry {
  id: string;
  jobId: string;
  startTime: string;
  endTime: string;
  status: 'Completed' | 'Failed' | 'Running';
  sourceProfiles: number;
  matchedProfiles: number;
  unifiedProfiles: number;
}

interface IdentityRuleset {
  id: string;
  rulesetName: string;
  rulesetId: string;
  dataSpace: string;
  primaryDataModelObject: string;
  rulesetStatus: 'Active' | 'Inactive' | 'Draft';
  lastJobStatus: 'Completed' | 'Failed' | 'Running' | 'Not Run';
  lastJobCompleted: string;
  sourceProfiles: number;
  matchedSourceProfiles: number;
  totalUnifiedProfiles: number;
  consolidationRate: number;
  matchRules: MatchRule[];
  reconciliationRules: ReconciliationRule[];
  processingHistory: ProcessingHistoryEntry[];
}

// ── Mock Data ────────────────────────────────────────────────────────
const mockRulesets: IdentityRuleset[] = [
  {
    id: 'rs-001',
    rulesetName: 'Individual (Main)',
    rulesetId: 'IDR-2024-001',
    dataSpace: 'default',
    primaryDataModelObject: 'Individual',
    rulesetStatus: 'Active',
    lastJobStatus: 'Completed',
    lastJobCompleted: '02/24/2026, 3:45 PM',
    sourceProfiles: 1847293,
    matchedSourceProfiles: 1203847,
    totalUnifiedProfiles: 892451,
    consolidationRate: 48.3,
    matchRules: [
      { id: 'mr-1', ruleName: 'Exact Email Match', matchFields: ['Email Address'], matchType: 'Exact', priority: 1 },
      { id: 'mr-2', ruleName: 'Phone + Last Name', matchFields: ['Phone Number', 'Last Name'], matchType: 'Exact', priority: 2 },
      { id: 'mr-3', ruleName: 'Fuzzy Name + Address', matchFields: ['First Name', 'Last Name', 'Mailing Address'], matchType: 'Fuzzy', priority: 3 },
      { id: 'mr-4', ruleName: 'Normalized Email Domain', matchFields: ['Email Domain', 'Last Name'], matchType: 'Normalized', priority: 4 },
    ],
    reconciliationRules: [
      { id: 'rr-1', field: 'Email Address', source: 'CRM', strategy: 'Most Recent' },
      { id: 'rr-2', field: 'Phone Number', source: 'All Sources', strategy: 'Source Priority' },
      { id: 'rr-3', field: 'Mailing Address', source: 'Commerce Cloud', strategy: 'Most Recent' },
      { id: 'rr-4', field: 'First Name', source: 'CRM', strategy: 'Source Priority' },
      { id: 'rr-5', field: 'Last Name', source: 'CRM', strategy: 'Source Priority' },
    ],
    processingHistory: [
      { id: 'ph-1', jobId: 'JOB-20260224-001', startTime: '02/24/2026, 3:00 PM', endTime: '02/24/2026, 3:45 PM', status: 'Completed', sourceProfiles: 1847293, matchedProfiles: 1203847, unifiedProfiles: 892451 },
      { id: 'ph-2', jobId: 'JOB-20260223-001', startTime: '02/23/2026, 3:00 PM', endTime: '02/23/2026, 3:42 PM', status: 'Completed', sourceProfiles: 1845102, matchedProfiles: 1201932, unifiedProfiles: 891203 },
      { id: 'ph-3', jobId: 'JOB-20260222-001', startTime: '02/22/2026, 3:00 PM', endTime: '02/22/2026, 3:38 PM', status: 'Completed', sourceProfiles: 1842891, matchedProfiles: 1199847, unifiedProfiles: 889102 },
      { id: 'ph-4', jobId: 'JOB-20260221-001', startTime: '02/21/2026, 3:00 PM', endTime: '02/21/2026, 3:15 PM', status: 'Failed', sourceProfiles: 1840102, matchedProfiles: 0, unifiedProfiles: 0 },
    ],
  },
  {
    id: 'rs-002',
    rulesetName: 'Account (B2B)',
    rulesetId: 'IDR-2024-002',
    dataSpace: 'default',
    primaryDataModelObject: 'Account',
    rulesetStatus: 'Active',
    lastJobStatus: 'Completed',
    lastJobCompleted: '02/24/2026, 4:12 PM',
    sourceProfiles: 324891,
    matchedSourceProfiles: 198234,
    totalUnifiedProfiles: 145672,
    consolidationRate: 55.2,
    matchRules: [
      { id: 'mr-5', ruleName: 'Exact Company Name', matchFields: ['Company Name'], matchType: 'Exact', priority: 1 },
      { id: 'mr-6', ruleName: 'Domain + City', matchFields: ['Website Domain', 'City'], matchType: 'Exact', priority: 2 },
      { id: 'mr-7', ruleName: 'Fuzzy Company Name', matchFields: ['Company Name'], matchType: 'Fuzzy', priority: 3 },
    ],
    reconciliationRules: [
      { id: 'rr-6', field: 'Company Name', source: 'CRM', strategy: 'Source Priority' },
      { id: 'rr-7', field: 'Website', source: 'All Sources', strategy: 'Most Recent' },
      { id: 'rr-8', field: 'Phone', source: 'CRM', strategy: 'Source Priority' },
    ],
    processingHistory: [
      { id: 'ph-5', jobId: 'JOB-20260224-002', startTime: '02/24/2026, 4:00 PM', endTime: '02/24/2026, 4:12 PM', status: 'Completed', sourceProfiles: 324891, matchedProfiles: 198234, unifiedProfiles: 145672 },
      { id: 'ph-6', jobId: 'JOB-20260223-002', startTime: '02/23/2026, 4:00 PM', endTime: '02/23/2026, 4:10 PM', status: 'Completed', sourceProfiles: 323102, matchedProfiles: 197102, unifiedProfiles: 145201 },
    ],
  },
  {
    id: 'rs-003',
    rulesetName: 'Household',
    rulesetId: 'IDR-2024-003',
    dataSpace: 'default',
    primaryDataModelObject: 'Household',
    rulesetStatus: 'Draft',
    lastJobStatus: 'Not Run',
    lastJobCompleted: '—',
    sourceProfiles: 0,
    matchedSourceProfiles: 0,
    totalUnifiedProfiles: 0,
    consolidationRate: 0,
    matchRules: [
      { id: 'mr-8', ruleName: 'Address + Last Name', matchFields: ['Mailing Address', 'Last Name'], matchType: 'Exact', priority: 1 },
    ],
    reconciliationRules: [
      { id: 'rr-9', field: 'Address', source: 'CRM', strategy: 'Most Recent' },
    ],
    processingHistory: [],
  },
  {
    id: 'rs-004',
    rulesetName: 'Lead Dedup',
    rulesetId: 'IDR-2024-004',
    dataSpace: 'marketing',
    primaryDataModelObject: 'Lead',
    rulesetStatus: 'Inactive',
    lastJobStatus: 'Completed',
    lastJobCompleted: '02/10/2026, 8:00 AM',
    sourceProfiles: 89234,
    matchedSourceProfiles: 34521,
    totalUnifiedProfiles: 67891,
    consolidationRate: 23.9,
    matchRules: [
      { id: 'mr-9', ruleName: 'Exact Email', matchFields: ['Email Address'], matchType: 'Exact', priority: 1 },
      { id: 'mr-10', ruleName: 'Fuzzy Name + Company', matchFields: ['First Name', 'Last Name', 'Company'], matchType: 'Fuzzy', priority: 2 },
    ],
    reconciliationRules: [
      { id: 'rr-10', field: 'Email', source: 'Most Recent', strategy: 'Most Recent' },
      { id: 'rr-11', field: 'Company', source: 'CRM', strategy: 'Source Priority' },
    ],
    processingHistory: [
      { id: 'ph-7', jobId: 'JOB-20260210-001', startTime: '02/10/2026, 7:30 AM', endTime: '02/10/2026, 8:00 AM', status: 'Completed', sourceProfiles: 89234, matchedProfiles: 34521, unifiedProfiles: 67891 },
    ],
  },
];

// ── Available match field options ────────────────────────────────────
const availableFields = [
  'Email Address',
  'Phone Number',
  'First Name',
  'Last Name',
  'Mailing Address',
  'Email Domain',
  'City',
  'State',
  'Zip Code',
  'Company Name',
  'Website Domain',
  'Date of Birth',
  'SSN Last 4',
  'Loyalty ID',
  'Customer ID',
];

// ── Component ────────────────────────────────────────────────────────
export default function IdentityResolutionContent() {
  const [selectedRuleset, setSelectedRuleset] = useState<IdentityRuleset | null>(null);
  const [detailTab, setDetailTab] = useState<'properties' | 'details' | 'history'>('details');
  const [editMatchRulesOpen, setEditMatchRulesOpen] = useState(false);
  const [matchRulesStep, setMatchRulesStep] = useState<'instructions' | 'rules'>('instructions');
  const [localMatchRules, setLocalMatchRules] = useState<MatchRule[]>([]);
  const [editingRule, setEditingRule] = useState<MatchRule | null>(null);
  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false);
  const [addingNewRule, setAddingNewRule] = useState(false);

  // -- Open Edit Match Rules flow --
  const handleOpenEditMatchRules = () => {
    if (!selectedRuleset) return;
    setLocalMatchRules([...selectedRuleset.matchRules]);
    setMatchRulesStep('instructions');
    setEditMatchRulesOpen(true);
  };

  // -- Save match rules back --
  const handleSaveMatchRules = () => {
    if (!selectedRuleset) return;
    setSelectedRuleset({ ...selectedRuleset, matchRules: localMatchRules });
    setEditMatchRulesOpen(false);
  };

  // -- Delete a match rule --
  const handleDeleteRule = (ruleId: string) => {
    setLocalMatchRules((prev) => prev.filter((r) => r.id !== ruleId).map((r, i) => ({ ...r, priority: i + 1 })));
  };

  // -- Open new rule form --
  const handleAddNewRule = () => {
    setEditingRule({
      id: `mr-new-${Date.now()}`,
      ruleName: '',
      matchFields: [],
      matchType: 'Exact',
      priority: localMatchRules.length + 1,
    });
    setAddingNewRule(true);
    setEditRuleModalOpen(true);
  };

  // -- Open edit rule form --
  const handleEditRule = (rule: MatchRule) => {
    setEditingRule({ ...rule });
    setAddingNewRule(false);
    setEditRuleModalOpen(true);
  };

  // -- Save individual rule --
  const handleSaveRule = () => {
    if (!editingRule || !editingRule.ruleName.trim()) return;
    if (addingNewRule) {
      setLocalMatchRules((prev) => [...prev, editingRule]);
    } else {
      setLocalMatchRules((prev) => prev.map((r) => (r.id === editingRule.id ? editingRule : r)));
    }
    setEditRuleModalOpen(false);
    setEditingRule(null);
  };

  // -- Toggle field in editing rule --
  const toggleField = (field: string) => {
    if (!editingRule) return;
    const fields = editingRule.matchFields.includes(field)
      ? editingRule.matchFields.filter((f) => f !== field)
      : [...editingRule.matchFields, field];
    setEditingRule({ ...editingRule, matchFields: fields });
  };

  // ── Helper renderers ──────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Active: 'sf-badge-success',
      Inactive: 'sf-badge-neutral',
      Draft: 'sf-badge-warning',
      Completed: 'sf-badge-success',
      Failed: 'sf-badge-error',
      Running: 'sf-badge-info',
      'Not Run': 'sf-badge-neutral',
    };
    return <span className={`sf-badge ${map[status] || 'sf-badge-neutral'}`}>{status}</span>;
  };

  const formatNumber = (n: number) => n.toLocaleString();

  // ──────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ──────────────────────────────────────────────────────────────────
  if (selectedRuleset) {
    return (
      <div className="h-full flex flex-col">
        {/* Back bar */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-2 flex items-center gap-2">
          <button
            onClick={() => setSelectedRuleset(null)}
            className="flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Identity Resolutions
          </button>
          <ChevronRight className="w-3 h-3 text-[var(--sf-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--sf-text-primary)]">{selectedRuleset.rulesetName}</span>
        </div>

        {/* Header section */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#032D60] flex items-center justify-center flex-shrink-0">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">{selectedRuleset.rulesetName}</h1>
              <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Identity Resolution Ruleset</p>
            </div>
          </div>
          {/* Key fields row */}
          <div className="grid grid-cols-6 gap-4 mt-4">
            {[
              ['Data Space', selectedRuleset.dataSpace],
              ['Primary Data Model Object', selectedRuleset.primaryDataModelObject],
              ['Ruleset ID', selectedRuleset.rulesetId],
              ['Ruleset Status', null, selectedRuleset.rulesetStatus],
              ['Last Job Status', null, selectedRuleset.lastJobStatus],
              ['Last Job Completed', selectedRuleset.lastJobCompleted],
            ].map(([label, value, badgeVal]) => (
              <div key={label as string}>
                <div className="sf-detail-label">{label}</div>
                <div className="sf-detail-value text-sm">
                  {badgeVal ? statusBadge(badgeVal as string) : (value as string)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="sf-tabs">
          {(['properties', 'details', 'history'] as const).map((tab) => {
            const labels: Record<string, string> = { properties: 'Ruleset Properties', details: 'Details', history: 'Processing History' };
            return (
              <button
                key={tab}
                className={`sf-tab ${detailTab === tab ? 'active' : ''}`}
                onClick={() => setDetailTab(tab)}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">
          {detailTab === 'properties' && (
            <div className="p-6">
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Ruleset Configuration</h2>
                </div>
                <div className="sf-detail-grid">
                  {[
                    ['Ruleset Name', selectedRuleset.rulesetName],
                    ['Ruleset ID', selectedRuleset.rulesetId],
                    ['Data Space', selectedRuleset.dataSpace],
                    ['Primary Data Model Object', selectedRuleset.primaryDataModelObject],
                    ['Ruleset Status', selectedRuleset.rulesetStatus],
                    ['Number of Match Rules', String(selectedRuleset.matchRules.length)],
                    ['Number of Reconciliation Rules', String(selectedRuleset.reconciliationRules.length)],
                    ['Last Job Completed', selectedRuleset.lastJobCompleted],
                  ].map(([label, value]) => (
                    <div key={label} className="sf-detail-field">
                      <div className="sf-detail-label">{label}</div>
                      <div className="sf-detail-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {detailTab === 'details' && (
            <div className="p-6">
              <div className="flex gap-6">
                {/* Main content - 2/3 */}
                <div className="flex-1 space-y-6 min-w-0">
                  {/* Match Rules card */}
                  <div className="sf-card">
                    <div className="sf-card-header">
                      <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                        Match Rules
                        <span className="ml-2 text-xs font-normal text-[var(--sf-text-tertiary)]">
                          ({selectedRuleset.matchRules.length})
                        </span>
                      </h2>
                      <button
                        onClick={handleOpenEditMatchRules}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th>Priority</th>
                          <th>Rule Name</th>
                          <th>Match Fields</th>
                          <th>Match Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRuleset.matchRules.map((rule) => (
                          <tr key={rule.id}>
                            <td className="font-medium">{rule.priority}</td>
                            <td className="sf-link">{rule.ruleName}</td>
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {rule.matchFields.map((f) => (
                                  <span key={f} className="sf-badge sf-badge-info">{f}</span>
                                ))}
                              </div>
                            </td>
                            <td>{statusBadge(rule.matchType === 'Exact' ? 'Active' : rule.matchType === 'Fuzzy' ? 'Draft' : 'Inactive').props.children ? rule.matchType : rule.matchType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Reconciliation Rules card */}
                  <div className="sf-card">
                    <div className="sf-card-header">
                      <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                        Reconciliation Rules
                        <span className="ml-2 text-xs font-normal text-[var(--sf-text-tertiary)]">
                          ({selectedRuleset.reconciliationRules.length})
                        </span>
                      </h2>
                    </div>
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Source</th>
                          <th>Strategy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRuleset.reconciliationRules.map((rule) => (
                          <tr key={rule.id}>
                            <td className="font-medium">{rule.field}</td>
                            <td>{rule.source}</td>
                            <td>{rule.strategy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Warnings */}
                  {selectedRuleset.lastJobStatus === 'Failed' && (
                    <div className="sf-card border-l-4 border-l-[var(--sf-warning)]">
                      <div className="sf-card-body flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[var(--sf-warning)] flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">Last Job Failed</h3>
                          <p className="text-xs text-[var(--sf-text-tertiary)] mt-1">
                            The most recent identity resolution job did not complete successfully. Check processing history for details.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar - Resolution Summary */}
                <div className="w-72 flex-shrink-0 space-y-4">
                  <div className="sf-card">
                    <div className="sf-card-header">
                      <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Resolution Summary</h2>
                    </div>
                    <div className="sf-card-body space-y-4">
                      {[
                        ['Source Profiles', formatNumber(selectedRuleset.sourceProfiles)],
                        ['Matched Source Profiles', formatNumber(selectedRuleset.matchedSourceProfiles)],
                        ['Total Unified Profiles', formatNumber(selectedRuleset.totalUnifiedProfiles)],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div className="text-xs text-[var(--sf-text-tertiary)] mb-0.5">{label}</div>
                          <div className="text-lg font-bold text-[var(--sf-text-primary)]">{val}</div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-[var(--sf-border-light)]">
                        <div className="text-xs text-[var(--sf-text-tertiary)] mb-1">Consolidation Rate</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#ECEBEA] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--sf-blue)] rounded-full transition-all"
                              style={{ width: `${selectedRuleset.consolidationRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-[var(--sf-text-primary)]">
                            {selectedRuleset.consolidationRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick info card */}
                  <div className="sf-card">
                    <div className="sf-card-header">
                      <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Quick Info</h2>
                    </div>
                    <div className="sf-card-body space-y-3">
                      <div className="flex items-center gap-2 text-xs text-[var(--sf-text-secondary)]">
                        <Clock className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
                        <span>Last run: {selectedRuleset.lastJobCompleted}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--sf-text-secondary)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sf-success)]" />
                        <span>{selectedRuleset.matchRules.length} match rules configured</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--sf-text-secondary)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sf-success)]" />
                        <span>{selectedRuleset.reconciliationRules.length} reconciliation rules configured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'history' && (
            <div className="p-6">
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Processing History</h2>
                </div>
                {selectedRuleset.processingHistory.length === 0 ? (
                  <div className="sf-card-body text-center py-12">
                    <Clock className="w-8 h-8 text-[var(--sf-text-tertiary)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--sf-text-tertiary)]">No processing history available</p>
                    <p className="text-xs text-[var(--sf-text-tertiary)] mt-1">Run an identity resolution job to see results here.</p>
                  </div>
                ) : (
                  <table className="sf-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Status</th>
                        <th>Source Profiles</th>
                        <th>Matched Profiles</th>
                        <th>Unified Profiles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRuleset.processingHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td className="sf-link">{entry.jobId}</td>
                          <td>{entry.startTime}</td>
                          <td>{entry.endTime}</td>
                          <td>{statusBadge(entry.status)}</td>
                          <td>{formatNumber(entry.sourceProfiles)}</td>
                          <td>{formatNumber(entry.matchedProfiles)}</td>
                          <td>{formatNumber(entry.unifiedProfiles)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── EDIT MATCH RULES MODAL ─────────────────────────────── */}
        {editMatchRulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditMatchRulesOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[760px] max-h-[85vh] flex flex-col">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">
                  {matchRulesStep === 'instructions' ? 'Match Rule Instructions' : 'Edit Match Rules'}
                </h2>
                <button
                  onClick={() => setEditMatchRulesOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {matchRulesStep === 'instructions' ? (
                  /* ── Instructions step ── */
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-[#E1F5FE] rounded-lg">
                      <Info className="w-5 h-5 text-[var(--sf-blue)] flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-[var(--sf-text-secondary)] leading-relaxed space-y-3">
                        <p className="font-semibold text-[var(--sf-text-primary)]">How Match Rules Work</p>
                        <p>
                          Match rules define how source profiles are compared and grouped into unified profiles. Rules are
                          evaluated in priority order — higher priority rules are applied first.
                        </p>
                        <p>Each match rule specifies:</p>
                        <ul className="list-disc ml-4 space-y-1">
                          <li><strong>Match Fields</strong> — The fields used to compare source profiles (e.g., Email, Phone, Name).</li>
                          <li><strong>Match Type</strong> — Whether the comparison is Exact, Fuzzy (approximate), or Normalized (cleaned and standardized before comparing).</li>
                          <li><strong>Priority</strong> — The order in which rules are evaluated. Higher-priority rules take precedence when conflicts arise.</li>
                        </ul>
                        <p>
                          When a match rule finds that two or more source profiles share the same values for the specified
                          fields (within the match type tolerance), those profiles are grouped into a single unified profile.
                        </p>
                        <div className="mt-2 p-3 bg-white rounded border border-[var(--sf-border-light)]">
                          <p className="text-xs font-semibold text-[var(--sf-text-primary)] mb-1">Best Practices</p>
                          <ul className="text-xs space-y-1 text-[var(--sf-text-secondary)]">
                            <li>• Start with strict (Exact) rules at high priority and add fuzzy rules at lower priority.</li>
                            <li>• Use multiple fields in a single rule for more precise matching.</li>
                            <li>• Test your rules with a sample batch before running a full job.</li>
                            <li>• Review match results regularly and adjust thresholds as needed.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Rules editing step ── */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--sf-text-secondary)]">
                        {localMatchRules.length} match rule{localMatchRules.length !== 1 ? 's' : ''} configured. Drag to reorder priority.
                      </p>
                      <button
                        onClick={handleAddNewRule}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Rule
                      </button>
                    </div>

                    {localMatchRules.length === 0 ? (
                      <div className="text-center py-12 text-sm text-[var(--sf-text-tertiary)]">
                        No match rules configured yet. Click "Add Rule" to create your first rule.
                      </div>
                    ) : (
                      <table className="sf-table">
                        <thead>
                          <tr>
                            <th className="w-8"></th>
                            <th>Priority</th>
                            <th>Rule Name</th>
                            <th>Match Fields</th>
                            <th>Match Type</th>
                            <th className="w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localMatchRules.map((rule) => (
                            <tr key={rule.id}>
                              <td>
                                <GripVertical className="w-4 h-4 text-[var(--sf-text-tertiary)] cursor-grab" />
                              </td>
                              <td className="font-medium">{rule.priority}</td>
                              <td className="sf-link cursor-pointer" onClick={() => handleEditRule(rule)}>{rule.ruleName}</td>
                              <td>
                                <div className="flex flex-wrap gap-1">
                                  {rule.matchFields.map((f) => (
                                    <span key={f} className="sf-badge sf-badge-info">{f}</span>
                                  ))}
                                </div>
                              </td>
                              <td>{rule.matchType}</td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditRule(rule)}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-blue)]"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FDE8E8] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-error)]"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--sf-border)]">
                {matchRulesStep === 'instructions' ? (
                  <>
                    <button
                      onClick={() => setEditMatchRulesOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setMatchRulesStep('rules')}
                      className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors"
                    >
                      Continue
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setMatchRulesStep('instructions')}
                      className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSaveMatchRules}
                      className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors"
                    >
                      Save Match Rules
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT INDIVIDUAL RULE MODAL ──────────────────────────── */}
        {editRuleModalOpen && editingRule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditRuleModalOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[540px] max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">
                  {addingNewRule ? 'Add Match Rule' : 'Edit Match Rule'}
                </h2>
                <button
                  onClick={() => setEditRuleModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Rule Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={editingRule.ruleName}
                    onChange={(e) => setEditingRule({ ...editingRule, ruleName: e.target.value })}
                    placeholder="e.g., Exact Email Match"
                    className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                  />
                </div>

                {/* Match Type */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                    Match Type
                  </label>
                  <div className="relative">
                    <select
                      value={editingRule.matchType}
                      onChange={(e) => setEditingRule({ ...editingRule, matchType: e.target.value as MatchRule['matchType'] })}
                      className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded appearance-none bg-white focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                    >
                      <option value="Exact">Exact — Fields must match exactly</option>
                      <option value="Fuzzy">Fuzzy — Approximate matching using algorithms</option>
                      <option value="Normalized">Normalized — Clean and standardize before comparing</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sf-text-tertiary)] pointer-events-none" />
                  </div>
                </div>

                {/* Match Fields */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-2">
                    Match Fields
                    <span className="ml-1 normal-case font-normal">
                      ({editingRule.matchFields.length} selected)
                    </span>
                  </label>
                  <div className="border border-[var(--sf-border)] rounded max-h-48 overflow-y-auto">
                    {availableFields.map((field) => {
                      const selected = editingRule.matchFields.includes(field);
                      return (
                        <label
                          key={field}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F3F3F3] transition-colors ${
                            selected ? 'bg-[#EEF4FF]' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleField(field)}
                            className="w-4 h-4 rounded border-[var(--sf-border)] text-[var(--sf-blue)] focus:ring-[var(--sf-blue)]"
                          />
                          <span className="text-sm text-[var(--sf-text-primary)]">{field}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 1 })}
                    className="w-24 px-3 py-2 text-sm border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                  />
                  <p className="text-xs text-[var(--sf-text-tertiary)] mt-1">Lower numbers = higher priority. Rule 1 is evaluated first.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--sf-border)]">
                <button
                  onClick={() => setEditRuleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={!editingRule.ruleName.trim() || editingRule.matchFields.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingNewRule ? 'Add Rule' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">Identity Resolutions</h1>
          <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
            Manage rulesets that match and unify source profiles into unified profiles.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors">
          <Plus className="w-4 h-4" />
          New Ruleset
        </button>
      </div>

      {/* Rulesets table */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
            All Identity Resolution Rulesets
            <span className="ml-2 text-xs font-normal text-[var(--sf-text-tertiary)]">
              ({mockRulesets.length})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="sf-table">
            <thead>
              <tr>
                <th>Ruleset Name</th>
                <th>Ruleset ID</th>
                <th>Data Space</th>
                <th>Primary Data Model Object</th>
                <th>Ruleset Status</th>
                <th>Last Job Status</th>
                <th>Source Profiles</th>
                <th>Matched Source Profiles</th>
                <th>Total Unified Profiles</th>
                <th>Consolidation Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockRulesets.map((rs) => (
                <tr key={rs.id}>
                  <td>
                    <button
                      onClick={() => { setSelectedRuleset(rs); setDetailTab('details'); }}
                      className="sf-link font-medium"
                    >
                      {rs.rulesetName}
                    </button>
                  </td>
                  <td>{rs.rulesetId}</td>
                  <td>{rs.dataSpace}</td>
                  <td>{rs.primaryDataModelObject}</td>
                  <td>{statusBadge(rs.rulesetStatus)}</td>
                  <td>{statusBadge(rs.lastJobStatus)}</td>
                  <td>{formatNumber(rs.sourceProfiles)}</td>
                  <td>{formatNumber(rs.matchedSourceProfiles)}</td>
                  <td>{formatNumber(rs.totalUnifiedProfiles)}</td>
                  <td>{rs.consolidationRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
