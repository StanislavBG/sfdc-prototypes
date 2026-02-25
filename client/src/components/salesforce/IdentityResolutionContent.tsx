import { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  GripVertical,
  Clock,
  Fingerprint,
  Check,
  Pencil,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

interface MatchCriterion {
  id: string;
  dataModelObject: string;
  field: string;
  matchMethod: string;
  // Advanced settings
  crossFieldDMO: string;
  crossFieldMatchField: string;
  matchOnBlank: boolean;
  caseSensitive: boolean;
}

interface MatchRule {
  id: string;
  ruleName: string;
  criteria: MatchCriterion[];
  priority: number;
}

interface ReconciliationField {
  id: string;
  fieldName: string;
  reconciliationRule: string;
  usingDefault: boolean;
}

interface ReconciliationGroup {
  dmoName: string;
  defaultRule: string;
  fields: ReconciliationField[];
}

interface ProcessingHistoryEntry {
  id: string;
  rowNum: number;
  date: string;
  totalSourceProfiles: number;
  totalUnifiedProfiles: number;
  totalKnownProfiles: number;
  consolidationRate: string;
  totalUnknown: number;
  processedRecords: number;
  aggregateStatus: 'Succeeded' | 'Failed';
}

interface IdentityRuleset {
  id: string;
  rulesetName: string;
  rulesetId: string;
  dataSpace: string;
  primaryDataModelObject: string;
  secondaryDataModelObject: string;
  rulesetStatus: 'Published' | 'Active' | 'Inactive' | 'Draft';
  lastJobStatus: 'Completed' | 'Failed' | 'Running' | 'Not Run';
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
  matchRules: MatchRule[];
  reconciliationGroups: ReconciliationGroup[];
  processingHistory: ProcessingHistoryEntry[];
}

// ── Data Model Objects / Fields for dropdowns ────────────────────────
const dataModelObjects = ['Individual', 'Contact Point Email', 'Contact Point Phone', 'Contact Point Address', 'Contact Point App', 'Party Identification', 'Account'];

const dmoFields: Record<string, string[]> = {
  Individual: ['First Name', 'Last Name', 'Date of Birth', 'Gender', 'Person Name'],
  'Contact Point Email': ['Email Address', 'Email Domain', 'Email Local Part'],
  'Contact Point Phone': ['Phone Number', 'Phone Type', 'Country Code'],
  'Contact Point Address': ['Address Line 1', 'Address Line 2', 'City', 'State', 'Postal Code', 'Country'],
  'Contact Point App': ['App Id', 'App Type', 'App Name'],
  'Party Identification': ['Identification Number', 'Identification Type', 'Issuing Authority'],
  Account: ['Account Name', 'Website Domain', 'Phone', 'Industry'],
};

const matchMethods = ['Exact', 'Fuzzy: First Name', 'Fuzzy: Last Name', 'Fuzzy: Company Name', 'Normalized', 'Standardized'];

// ── Mock Data ────────────────────────────────────────────────────────
function generateProcessingHistory(): ProcessingHistoryEntry[] {
  const entries: ProcessingHistoryEntry[] = [];
  const baseDate = new Date(2026, 0, 13); // 2026-01-13
  for (let i = 0; i < 20; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i * 7);
    const isRecent = i < 2;
    entries.push({
      id: `ph-${i}`,
      rowNum: i + 1,
      date: date.toISOString().split('T')[0],
      totalSourceProfiles: isRecent ? 12061 : 12047,
      totalUnifiedProfiles: isRecent ? 10594 : 10570,
      totalKnownProfiles: isRecent ? 10586 : 10566,
      consolidationRate: '12%',
      totalUnknown: isRecent ? 8 : 4,
      processedRecords: i === 0 ? 14 : i === 1 ? 10641 : i === 15 ? 64 : i === 17 ? 10641 : i === 19 ? 10650 : 0,
      aggregateStatus: 'Succeeded',
    });
  }
  return entries;
}

const mockRulesets: IdentityRuleset[] = [
  {
    id: 'rs-001',
    rulesetName: 'Individual (Main)',
    rulesetId: 'IDR-2024-001',
    dataSpace: 'default',
    primaryDataModelObject: 'Individual',
    secondaryDataModelObject: 'Individual',
    rulesetStatus: 'Published',
    lastJobStatus: 'Completed',
    lastJobCompleted: '02/24/2026, 3:45 PM',
    description: '',
    createdBy: 'Data Cloud',
    createdDate: '5/1/2025, 9:10 PM',
    lastModifiedBy: 'Automated Process',
    isScheduled: false,
    sourceProfiles: 12061,
    matchedSourceProfiles: 93,
    totalUnifiedProfiles: 10594,
    consolidationRate: 12,
    matchRules: [
      {
        id: 'mr-1', ruleName: 'Exact Email Match', priority: 1,
        criteria: [
          { id: 'mc-1', dataModelObject: 'Contact Point Email', field: 'Email Address', matchMethod: 'Exact', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        ],
      },
      {
        id: 'mr-2', ruleName: 'Fuzzy Name and Normalized Email', priority: 2,
        criteria: [
          { id: 'mc-2', dataModelObject: 'Individual', field: 'First Name', matchMethod: 'Fuzzy: First Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
          { id: 'mc-3', dataModelObject: 'Individual', field: 'Last Name', matchMethod: 'Fuzzy: Last Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
          { id: 'mc-4', dataModelObject: 'Contact Point Email', field: 'Email Address', matchMethod: 'Normalized', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        ],
      },
      {
        id: 'mr-3', ruleName: 'Phone + Last Name', priority: 3,
        criteria: [
          { id: 'mc-5', dataModelObject: 'Contact Point Phone', field: 'Phone Number', matchMethod: 'Exact', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
          { id: 'mc-6', dataModelObject: 'Individual', field: 'Last Name', matchMethod: 'Exact', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        ],
      },
    ],
    reconciliationGroups: [
      {
        dmoName: 'Contact Point Address',
        defaultRule: 'Most Recent',
        fields: [
          { id: 'rf-1', fieldName: 'Address Line 1', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-2', fieldName: 'Address Line 2', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-3', fieldName: 'City', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-4', fieldName: 'State', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-5', fieldName: 'Postal Code', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-6', fieldName: 'Country', reconciliationRule: 'Most Recent', usingDefault: true },
        ],
      },
      {
        dmoName: 'Contact Point App',
        defaultRule: 'Most Recent',
        fields: [
          { id: 'rf-7', fieldName: 'App Id', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-8', fieldName: 'App Type', reconciliationRule: 'Most Recent', usingDefault: true },
        ],
      },
      {
        dmoName: 'Contact Point Email',
        defaultRule: 'Most Recent',
        fields: [
          { id: 'rf-9', fieldName: 'Email Address', reconciliationRule: 'Source Priority', usingDefault: false },
          { id: 'rf-10', fieldName: 'Email Domain', reconciliationRule: 'Most Recent', usingDefault: true },
        ],
      },
      {
        dmoName: 'Contact Point Phone',
        defaultRule: 'Most Recent',
        fields: [
          { id: 'rf-11', fieldName: 'Phone Number', reconciliationRule: 'Source Priority', usingDefault: false },
          { id: 'rf-12', fieldName: 'Phone Type', reconciliationRule: 'Most Recent', usingDefault: true },
        ],
      },
      {
        dmoName: 'Individual',
        defaultRule: 'Source Priority',
        fields: [
          { id: 'rf-13', fieldName: 'First Name', reconciliationRule: 'Source Priority', usingDefault: true },
          { id: 'rf-14', fieldName: 'Last Name', reconciliationRule: 'Source Priority', usingDefault: true },
          { id: 'rf-15', fieldName: 'Date of Birth', reconciliationRule: 'Most Recent', usingDefault: false },
          { id: 'rf-16', fieldName: 'Gender', reconciliationRule: 'Source Priority', usingDefault: true },
        ],
      },
    ],
    processingHistory: generateProcessingHistory(),
  },
  {
    id: 'rs-002',
    rulesetName: 'Account (B2B)',
    rulesetId: 'IDR-2024-002',
    dataSpace: 'default',
    primaryDataModelObject: 'Account',
    secondaryDataModelObject: 'Account',
    rulesetStatus: 'Published',
    lastJobStatus: 'Completed',
    lastJobCompleted: '02/24/2026, 4:12 PM',
    description: 'B2B account deduplication ruleset',
    createdBy: 'Data Cloud',
    createdDate: '6/15/2025, 10:30 AM',
    lastModifiedBy: 'Automated Process',
    isScheduled: true,
    sourceProfiles: 324891,
    matchedSourceProfiles: 198234,
    totalUnifiedProfiles: 145672,
    consolidationRate: 55,
    matchRules: [
      {
        id: 'mr-5', ruleName: 'Exact Company Name', priority: 1,
        criteria: [
          { id: 'mc-10', dataModelObject: 'Account', field: 'Account Name', matchMethod: 'Exact', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        ],
      },
    ],
    reconciliationGroups: [
      {
        dmoName: 'Account',
        defaultRule: 'Source Priority',
        fields: [
          { id: 'rf-20', fieldName: 'Account Name', reconciliationRule: 'Source Priority', usingDefault: true },
          { id: 'rf-21', fieldName: 'Website Domain', reconciliationRule: 'Most Recent', usingDefault: false },
          { id: 'rf-22', fieldName: 'Phone', reconciliationRule: 'Source Priority', usingDefault: true },
        ],
      },
    ],
    processingHistory: [],
  },
  {
    id: 'rs-003',
    rulesetName: 'Household',
    rulesetId: 'IDR-2024-003',
    dataSpace: 'default',
    primaryDataModelObject: 'Individual',
    secondaryDataModelObject: 'Individual',
    rulesetStatus: 'Draft',
    lastJobStatus: 'Not Run',
    lastJobCompleted: '—',
    description: '',
    createdBy: 'Data Cloud',
    createdDate: '7/1/2025, 2:00 PM',
    lastModifiedBy: 'Data Cloud',
    isScheduled: false,
    sourceProfiles: 0,
    matchedSourceProfiles: 0,
    totalUnifiedProfiles: 0,
    consolidationRate: 0,
    matchRules: [],
    reconciliationGroups: [],
    processingHistory: [],
  },
];

// ── Component ────────────────────────────────────────────────────────
export default function IdentityResolutionContent() {
  // Navigation state
  const [selectedRuleset, setSelectedRuleset] = useState<IdentityRuleset | null>(null);
  const [detailTab, setDetailTab] = useState<'properties' | 'details' | 'history'>('details');

  // Collapsible sections
  const [resolutionSummaryOpen, setResolutionSummaryOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  // Match rules editing
  const [editMatchRulesOpen, setEditMatchRulesOpen] = useState(false);
  const [matchRulesStep, setMatchRulesStep] = useState<'instructions' | 'rules'>('instructions');
  const [localMatchRules, setLocalMatchRules] = useState<MatchRule[]>([]);

  // Configure match criteria modal
  const [configureRuleOpen, setConfigureRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchRule | null>(null);
  const [addingNewRule, setAddingNewRule] = useState(false);

  // Advanced settings modal
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [advancedCriterionId, setAdvancedCriterionId] = useState<string | null>(null);

  // Reconciliation editing
  const [reconGroupsOpen, setReconGroupsOpen] = useState<Record<string, boolean>>({});
  const [selectedReconFields, setSelectedReconFields] = useState<Set<string>>(new Set());
  const [editReconRuleOpen, setEditReconRuleOpen] = useState(false);
  const [editingReconField, setEditingReconField] = useState<ReconciliationField | null>(null);
  const [editReconUseDefault, setEditReconUseDefault] = useState(false);
  const [editReconRuleValue, setEditReconRuleValue] = useState('');
  const [editReconIgnoreEmpty, setEditReconIgnoreEmpty] = useState(false);

  // ── Match Rules handlers ────────────────────────────────────────
  const handleOpenEditMatchRules = () => {
    if (!selectedRuleset) return;
    setLocalMatchRules(selectedRuleset.matchRules.map((r) => ({ ...r, criteria: r.criteria.map((c) => ({ ...c })) })));
    setMatchRulesStep('instructions');
    setEditMatchRulesOpen(true);
  };

  const handleSaveMatchRules = () => {
    if (!selectedRuleset) return;
    setSelectedRuleset({ ...selectedRuleset, matchRules: localMatchRules });
    setEditMatchRulesOpen(false);
  };

  const handleDeleteMatchRule = (ruleId: string) => {
    setLocalMatchRules((prev) => prev.filter((r) => r.id !== ruleId).map((r, i) => ({ ...r, priority: i + 1 })));
  };

  // Open configure modal for new rule
  const handleAddNewMatchRule = () => {
    setEditingRule({
      id: `mr-new-${Date.now()}`,
      ruleName: '',
      criteria: [{ id: `mc-new-${Date.now()}`, dataModelObject: '', field: '', matchMethod: '', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false }],
      priority: localMatchRules.length + 1,
    });
    setAddingNewRule(true);
    setConfigureRuleOpen(true);
  };

  // Open configure modal for existing rule
  const handleConfigureRule = (rule: MatchRule) => {
    setEditingRule({ ...rule, criteria: rule.criteria.map((c) => ({ ...c })) });
    setAddingNewRule(false);
    setConfigureRuleOpen(true);
  };

  // Add criterion row
  const handleAddCriterion = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      criteria: [...editingRule.criteria, { id: `mc-new-${Date.now()}`, dataModelObject: '', field: '', matchMethod: '', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false }],
    });
  };

  // Delete criterion row
  const handleDeleteCriterion = (criterionId: string) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      criteria: editingRule.criteria.filter((c) => c.id !== criterionId),
    });
  };

  // Update criterion field
  const updateCriterion = (criterionId: string, updates: Partial<MatchCriterion>) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      criteria: editingRule.criteria.map((c) => (c.id === criterionId ? { ...c, ...updates } : c)),
    });
  };

  // Save configure rule
  const handleSaveConfiguredRule = () => {
    if (!editingRule || !editingRule.ruleName.trim()) return;
    if (addingNewRule) {
      setLocalMatchRules((prev) => [...prev, editingRule]);
    } else {
      setLocalMatchRules((prev) => prev.map((r) => (r.id === editingRule.id ? editingRule : r)));
    }
    setConfigureRuleOpen(false);
    setEditingRule(null);
  };

  // ── Advanced Settings handlers ──────────────────────────────────
  const handleOpenAdvanced = (criterionId: string) => {
    setAdvancedCriterionId(criterionId);
    setAdvancedSettingsOpen(true);
  };

  const handleSaveAdvanced = () => {
    setAdvancedSettingsOpen(false);
    setAdvancedCriterionId(null);
  };

  // ── Reconciliation handlers ─────────────────────────────────────
  const toggleReconGroup = (dmoName: string) => {
    setReconGroupsOpen((prev) => ({ ...prev, [dmoName]: !prev[dmoName] }));
  };

  const toggleReconFieldSelection = (fieldId: string) => {
    setSelectedReconFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  };

  const handleOpenEditReconRule = (field: ReconciliationField) => {
    setEditingReconField(field);
    setEditReconUseDefault(field.usingDefault);
    setEditReconRuleValue(field.reconciliationRule);
    setEditReconIgnoreEmpty(false);
    setEditReconRuleOpen(true);
  };

  const handleSaveReconRule = () => {
    if (!selectedRuleset || !editingReconField) return;
    const updatedGroups = selectedRuleset.reconciliationGroups.map((g) => ({
      ...g,
      fields: g.fields.map((f) =>
        f.id === editingReconField.id
          ? { ...f, reconciliationRule: editReconUseDefault ? g.defaultRule : editReconRuleValue, usingDefault: editReconUseDefault }
          : f
      ),
    }));
    setSelectedRuleset({ ...selectedRuleset, reconciliationGroups: updatedGroups });
    setEditReconRuleOpen(false);
    setEditingReconField(null);
    setSelectedReconFields(new Set());
  };

  const handleUpdateSelected = () => {
    // Find first selected field and open edit modal for it
    if (!selectedRuleset) return;
    for (const group of selectedRuleset.reconciliationGroups) {
      for (const field of group.fields) {
        if (selectedReconFields.has(field.id)) {
          handleOpenEditReconRule(field);
          return;
        }
      }
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Published: 'sf-badge-success',
      Active: 'sf-badge-success',
      Inactive: 'sf-badge-neutral',
      Draft: 'sf-badge-warning',
      Completed: 'sf-badge-success',
      Succeeded: 'sf-badge-success',
      Failed: 'sf-badge-error',
      Running: 'sf-badge-info',
      'Not Run': 'sf-badge-neutral',
    };
    return <span className={`sf-badge ${map[status] || 'sf-badge-neutral'}`}>{status}</span>;
  };

  const fmt = (n: number) => n.toLocaleString();

  const advancedCriterion = editingRule?.criteria.find((c) => c.id === advancedCriterionId) || null;

  // ──────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ──────────────────────────────────────────────────────────────────
  if (selectedRuleset) {
    return (
      <div className="h-full flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-2 flex items-center gap-2">
          <button onClick={() => setSelectedRuleset(null)} className="flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Identity Resolutions
          </button>
          <ChevronRight className="w-3 h-3 text-[var(--sf-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--sf-text-primary)]">{selectedRuleset.rulesetName}</span>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#032D60] flex items-center justify-center flex-shrink-0">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">{selectedRuleset.rulesetName}</h1>
              <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Identity Resolution Ruleset</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sf-tabs">
          {(['properties', 'details', 'history'] as const).map((tab) => {
            const labels = { properties: 'Ruleset Properties', details: 'Details', history: 'Processing History' };
            return (
              <button key={tab} className={`sf-tab ${detailTab === tab ? 'active' : ''}`} onClick={() => setDetailTab(tab)}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">

          {/* ── DETAILS TAB ── */}
          {detailTab === 'details' && (
            <div className="p-6 space-y-4">
              {/* Resolution Summary collapsible */}
              <div className="sf-card">
                <button onClick={() => setResolutionSummaryOpen(!resolutionSummaryOpen)} className="w-full sf-card-header cursor-pointer hover:bg-[#FAFAF9]">
                  <div className="flex items-center gap-2">
                    {resolutionSummaryOpen ? <ChevronDown className="w-4 h-4 text-[var(--sf-text-tertiary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--sf-text-tertiary)]" />}
                    <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Resolution Summary</h2>
                  </div>
                </button>
                {resolutionSummaryOpen && (
                  <div className="sf-detail-grid">
                    <div className="sf-detail-field"><div className="sf-detail-label">Total Unified Profiles</div><div className="sf-detail-value font-semibold">{fmt(selectedRuleset.totalUnifiedProfiles)}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Source Profiles</div><div className="sf-detail-value font-semibold">{fmt(selectedRuleset.sourceProfiles)}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Consolidation Rate</div><div className="sf-detail-value font-semibold">{selectedRuleset.consolidationRate}%</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Matched Source Profiles</div><div className="sf-detail-value font-semibold">{fmt(selectedRuleset.matchedSourceProfiles)}</div></div>
                  </div>
                )}
              </div>

              {/* Properties collapsible */}
              <div className="sf-card">
                <button onClick={() => setPropertiesOpen(!propertiesOpen)} className="w-full sf-card-header cursor-pointer hover:bg-[#FAFAF9]">
                  <div className="flex items-center gap-2">
                    {propertiesOpen ? <ChevronDown className="w-4 h-4 text-[var(--sf-text-tertiary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--sf-text-tertiary)]" />}
                    <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Properties</h2>
                  </div>
                </button>
                {propertiesOpen && (
                  <div className="sf-detail-grid">
                    <div className="sf-detail-field"><div className="sf-detail-label">Ruleset Name</div><div className="sf-detail-value">{selectedRuleset.rulesetName}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Ruleset Status</div><div className="sf-detail-value">{selectedRuleset.rulesetStatus}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Data Space</div><div className="sf-detail-value sf-link">{selectedRuleset.dataSpace}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Description</div><div className="sf-detail-value text-[var(--sf-text-tertiary)]">{selectedRuleset.description || '—'}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Primary Data Model Object</div><div className="sf-detail-value">{selectedRuleset.primaryDataModelObject}</div></div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Secondary Data Model Object</div><div className="sf-detail-value">{selectedRuleset.secondaryDataModelObject}</div></div>
                    <div className="sf-detail-field">
                      <div className="sf-detail-label">Created By</div>
                      <div className="sf-detail-value flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#706E6B] flex items-center justify-center flex-shrink-0"><Fingerprint className="w-3 h-3 text-white" /></div>
                        <span className="sf-link">{selectedRuleset.createdBy}</span><span className="text-[var(--sf-text-tertiary)]">, {selectedRuleset.createdDate}</span>
                      </div>
                    </div>
                    <div className="sf-detail-field"><div className="sf-detail-label">Created Date</div><div className="sf-detail-value">{selectedRuleset.createdDate}</div></div>
                    <div className="sf-detail-field">
                      <div className="sf-detail-label">Last Modified By</div>
                      <div className="sf-detail-value flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#706E6B] flex items-center justify-center flex-shrink-0"><Fingerprint className="w-3 h-3 text-white" /></div>
                        <span className="sf-link">{selectedRuleset.lastModifiedBy}</span><span className="text-[var(--sf-text-tertiary)]">, 1/13/2026, 11:38 PM</span>
                      </div>
                    </div>
                    <div className="sf-detail-field">
                      <div className="sf-detail-label">Is Scheduled</div>
                      <div className="sf-detail-value">
                        <input type="checkbox" checked={selectedRuleset.isScheduled} readOnly className="w-4 h-4 rounded border-[var(--sf-border)]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Rules card */}
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                    Match Rules <span className="text-xs font-normal text-[var(--sf-text-tertiary)]">({selectedRuleset.matchRules.length})</span>
                  </h2>
                  <button onClick={handleOpenEditMatchRules} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
                {selectedRuleset.matchRules.length === 0 ? (
                  <div className="sf-card-body text-center py-8 text-sm text-[var(--sf-text-tertiary)]">No match rules configured.</div>
                ) : (
                  <table className="sf-table">
                    <thead><tr><th>Priority</th><th>Rule Name</th><th>Match Criteria</th></tr></thead>
                    <tbody>
                      {selectedRuleset.matchRules.map((rule) => (
                        <tr key={rule.id}>
                          <td className="font-medium">{rule.priority}</td>
                          <td className="sf-link">{rule.ruleName}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {rule.criteria.map((c) => (
                                <span key={c.id} className="sf-badge sf-badge-info">{c.field} ({c.matchMethod})</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Reconciliation Rules card */}
              <div className="sf-card">
                <div className="sf-card-header">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Reconciliation Rules</h2>
                    <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Reconciliation rules determine which field value to keep when source profiles are merged into a unified profile.</p>
                  </div>
                  {selectedReconFields.size > 0 && (
                    <button onClick={handleUpdateSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors">
                      Update Selected ({selectedReconFields.size})
                    </button>
                  )}
                </div>
                <div>
                  {selectedRuleset.reconciliationGroups.map((group) => {
                    const isOpen = reconGroupsOpen[group.dmoName] !== false; // default open
                    return (
                      <div key={group.dmoName} className="border-b border-[var(--sf-border-light)] last:border-b-0">
                        {/* Group header */}
                        <button onClick={() => toggleReconGroup(group.dmoName)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FAFAF9] transition-colors">
                          <div className="flex items-center gap-2">
                            {isOpen ? <ChevronDown className="w-4 h-4 text-[var(--sf-text-tertiary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--sf-text-tertiary)]" />}
                            <span className="text-sm font-semibold text-[var(--sf-text-primary)]">{group.dmoName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--sf-text-tertiary)]">
                            <span>Default Reconciliation Rule:</span>
                            <span className="font-medium text-[var(--sf-text-secondary)]">{group.defaultRule}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); }}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#E5E5E5] text-[var(--sf-text-tertiary)]"
                              title="Edit Default Reconciliation Rule"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </button>
                        {/* Group fields */}
                        {isOpen && (
                          <table className="sf-table">
                            <thead>
                              <tr>
                                <th className="w-10"></th>
                                <th>Field</th>
                                <th>Reconciliation Rule</th>
                                <th className="w-24 text-center">Using Default?</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.fields.map((field) => (
                                <tr key={field.id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={selectedReconFields.has(field.id)}
                                      onChange={() => toggleReconFieldSelection(field.id)}
                                      className="w-4 h-4 rounded border-[var(--sf-border)]"
                                    />
                                  </td>
                                  <td>
                                    <button onClick={() => handleOpenEditReconRule(field)} className="sf-link">
                                      {field.fieldName}
                                    </button>
                                  </td>
                                  <td>{field.reconciliationRule}</td>
                                  <td className="text-center">
                                    {field.usingDefault && <Check className="w-4 h-4 text-[var(--sf-success)] mx-auto" />}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── RULESET PROPERTIES TAB ── */}
          {detailTab === 'properties' && (
            <div className="p-6">
              <div className="sf-card">
                <div className="sf-card-header"><h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Ruleset Configuration</h2></div>
                <div className="sf-detail-grid">
                  {[
                    ['Ruleset Name', selectedRuleset.rulesetName],
                    ['Ruleset ID', selectedRuleset.rulesetId],
                    ['Data Space', selectedRuleset.dataSpace],
                    ['Primary Data Model Object', selectedRuleset.primaryDataModelObject],
                    ['Ruleset Status', selectedRuleset.rulesetStatus],
                    ['Number of Match Rules', String(selectedRuleset.matchRules.length)],
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

          {/* ── PROCESSING HISTORY TAB ── */}
          {detailTab === 'history' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-[var(--sf-text-secondary)]">
                Daily summaries contain the aggregate results of all runs of this ruleset from a single date.
              </p>
              <div className="flex items-center justify-end gap-2 text-xs text-[var(--sf-text-tertiary)]">
                <Info className="w-3.5 h-3.5" />
                <span>Automatic runs:</span>
                <span className="font-medium text-[var(--sf-text-secondary)]">{selectedRuleset.isScheduled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Daily Processing Summary</h2>
                </div>
                {selectedRuleset.processingHistory.length === 0 ? (
                  <div className="sf-card-body text-center py-12">
                    <Clock className="w-8 h-8 text-[var(--sf-text-tertiary)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--sf-text-tertiary)]">No processing history available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th className="w-12"></th>
                          <th><div className="flex items-center gap-1">Date <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Total Source P... <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Total Unified P... <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Total Known P... <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Consolidation ... <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Total Unknow... <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Processed Re... <ChevronDown className="w-3 h-3" /></div></th>
                          <th><div className="flex items-center gap-1">Aggregate Sta... <ChevronDown className="w-3 h-3" /></div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRuleset.processingHistory.map((entry) => (
                          <tr key={entry.id}>
                            <td className="text-center text-[var(--sf-text-tertiary)]">{entry.rowNum}</td>
                            <td>{entry.date}</td>
                            <td>{fmt(entry.totalSourceProfiles)}</td>
                            <td>{fmt(entry.totalUnifiedProfiles)}</td>
                            <td>{fmt(entry.totalKnownProfiles)}</td>
                            <td>{entry.consolidationRate}</td>
                            <td>{entry.totalUnknown}</td>
                            <td>{fmt(entry.processedRecords)}</td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#B7791F]" />
                                <span>{entry.aggregateStatus}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MODAL: Edit Match Rules (Instructions → Rules list)
           ═══════════════════════════════════════════════════════════ */}
        {editMatchRulesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditMatchRulesOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[760px] max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">
                  {matchRulesStep === 'instructions' ? 'Match Rule Instructions' : 'Edit Match Rules'}
                </h2>
                <button onClick={() => setEditMatchRulesOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {matchRulesStep === 'instructions' ? (
                  <div className="flex items-start gap-3 p-4 bg-[#E1F5FE] rounded-lg">
                    <Info className="w-5 h-5 text-[var(--sf-blue)] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[var(--sf-text-secondary)] leading-relaxed space-y-3">
                      <p className="font-semibold text-[var(--sf-text-primary)]">How Match Rules Work</p>
                      <p>Match rules define how source profiles are compared and grouped into unified profiles. Rules are evaluated in priority order.</p>
                      <p>Each match rule specifies:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>Match Fields</strong> — The fields used to compare source profiles.</li>
                        <li><strong>Match Type</strong> — Whether the comparison is Exact, Fuzzy, or Normalized.</li>
                        <li><strong>Priority</strong> — The order in which rules are evaluated.</li>
                      </ul>
                      <div className="mt-2 p-3 bg-white rounded border border-[var(--sf-border-light)]">
                        <p className="text-xs font-semibold text-[var(--sf-text-primary)] mb-1">Best Practices</p>
                        <ul className="text-xs space-y-1 text-[var(--sf-text-secondary)]">
                          <li>Start with strict (Exact) rules at high priority and add fuzzy rules at lower priority.</li>
                          <li>Use multiple fields in a single rule for more precise matching.</li>
                          <li>Test your rules with a sample batch before running a full job.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--sf-text-secondary)]">{localMatchRules.length} match rule{localMatchRules.length !== 1 ? 's' : ''} configured.</p>
                      <button onClick={handleAddNewMatchRule} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Rule
                      </button>
                    </div>
                    {localMatchRules.length === 0 ? (
                      <div className="text-center py-12 text-sm text-[var(--sf-text-tertiary)]">No match rules configured yet.</div>
                    ) : (
                      <table className="sf-table">
                        <thead><tr><th className="w-8"></th><th>Priority</th><th>Rule Name</th><th>Criteria</th><th className="w-28">Actions</th></tr></thead>
                        <tbody>
                          {localMatchRules.map((rule) => (
                            <tr key={rule.id}>
                              <td><GripVertical className="w-4 h-4 text-[var(--sf-text-tertiary)] cursor-grab" /></td>
                              <td className="font-medium">{rule.priority}</td>
                              <td className="sf-link cursor-pointer" onClick={() => handleConfigureRule(rule)}>{rule.ruleName}</td>
                              <td>
                                <div className="flex flex-wrap gap-1">
                                  {rule.criteria.map((c) => (
                                    <span key={c.id} className="sf-badge sf-badge-info">{c.field || 'Unconfigured'}</span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleConfigureRule(rule)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-blue)]" title="Configure">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteMatchRule(rule.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FDE8E8] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-error)]" title="Delete">
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
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--sf-border)]">
                {matchRulesStep === 'instructions' ? (
                  <>
                    <button onClick={() => setEditMatchRulesOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                    <button onClick={() => setMatchRulesStep('rules')} className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">Continue</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setMatchRulesStep('instructions')} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Back</button>
                    <button onClick={handleSaveMatchRules} className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">Save Match Rules</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MODAL: Configure Match Criteria
           ═══════════════════════════════════════════════════════════ */}
        {configureRuleOpen && editingRule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfigureRuleOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[820px] max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">Configure Match Criteria</h2>
                <button onClick={() => setConfigureRuleOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <p className="text-sm text-[var(--sf-text-secondary)]">
                  Configure at least one match criterion. Values in the specified fields will be compared for matches.
                </p>
                {/* Rule Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Match Rule Name</label>
                  <input
                    type="text"
                    value={editingRule.ruleName}
                    onChange={(e) => setEditingRule({ ...editingRule, ruleName: e.target.value })}
                    placeholder="e.g., Fuzzy Name and Normalized Email"
                    className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                  />
                </div>
                {/* Match Criteria table */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-2">Match Criteria</label>
                  <div className="border border-[var(--sf-border)] rounded overflow-hidden">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th>Data Model Object</th>
                          <th>Field</th>
                          <th>Match Method</th>
                          <th className="w-28">Advanced Settings</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingRule.criteria.map((criterion) => (
                          <tr key={criterion.id}>
                            <td>
                              <select
                                value={criterion.dataModelObject}
                                onChange={(e) => updateCriterion(criterion.id, { dataModelObject: e.target.value, field: '' })}
                                className="w-full px-2 py-1.5 text-xs border border-[var(--sf-border)] rounded bg-white focus:outline-none focus:border-[var(--sf-blue-light)]"
                              >
                                <option value="">Select...</option>
                                {dataModelObjects.map((dmo) => (
                                  <option key={dmo} value={dmo}>{dmo}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                value={criterion.field}
                                onChange={(e) => updateCriterion(criterion.id, { field: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs border border-[var(--sf-border)] rounded bg-white focus:outline-none focus:border-[var(--sf-blue-light)]"
                                disabled={!criterion.dataModelObject}
                              >
                                <option value="">Select...</option>
                                {(dmoFields[criterion.dataModelObject] || []).map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                value={criterion.matchMethod}
                                onChange={(e) => updateCriterion(criterion.id, { matchMethod: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs border border-[var(--sf-border)] rounded bg-white focus:outline-none focus:border-[var(--sf-blue-light)]"
                              >
                                <option value="">Select...</option>
                                {matchMethods.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </td>
                            <td className="text-center">
                              <button
                                onClick={() => handleOpenAdvanced(criterion.id)}
                                className="text-xs text-[var(--sf-link)] hover:underline"
                              >
                                Configure
                              </button>
                            </td>
                            <td>
                              {editingRule.criteria.length > 1 && (
                                <button onClick={() => handleDeleteCriterion(criterion.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#FDE8E8] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-error)]">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={handleAddCriterion} className="flex items-center gap-1 mt-3 text-xs font-medium text-[var(--sf-link)] hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Criteria
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--sf-border)]">
                <button onClick={() => setConfigureRuleOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                <button
                  onClick={handleSaveConfiguredRule}
                  disabled={!editingRule.ruleName.trim() || editingRule.criteria.every((c) => !c.field)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MODAL: Advanced Match Criteria Settings
           ═══════════════════════════════════════════════════════════ */}
        {advancedSettingsOpen && advancedCriterion && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAdvancedSettingsOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[640px] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">Advanced Match Criteria Settings</h2>
                <button onClick={() => setAdvancedSettingsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Cross-Field Match Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-3">Cross-Field Match Settings</h3>
                  <div className="border border-[var(--sf-border)] rounded overflow-hidden">
                    <table className="sf-table">
                      <thead>
                        <tr><th></th><th>Data Model Object</th><th>Match Field</th><th>Scheduled Match Method</th></tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-xs font-medium text-[var(--sf-text-tertiary)]">Primary DMO</td>
                          <td className="text-xs text-[var(--sf-text-secondary)]">{advancedCriterion.dataModelObject || '—'}</td>
                          <td className="text-xs text-[var(--sf-text-secondary)]">{advancedCriterion.field || '—'}</td>
                          <td className="text-xs text-[var(--sf-text-secondary)]">{advancedCriterion.matchMethod || '—'}</td>
                        </tr>
                        <tr>
                          <td className="text-xs font-medium text-[var(--sf-text-tertiary)]">Match to Individual</td>
                          <td>
                            <select
                              value={advancedCriterion.crossFieldDMO}
                              onChange={(e) => updateCriterion(advancedCriterion.id, { crossFieldDMO: e.target.value, crossFieldMatchField: '' })}
                              className="w-full px-2 py-1.5 text-xs border border-[var(--sf-border)] rounded bg-white"
                            >
                              <option value="">Select...</option>
                              {dataModelObjects.map((dmo) => (
                                <option key={dmo} value={dmo}>{dmo}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={advancedCriterion.crossFieldMatchField}
                              onChange={(e) => updateCriterion(advancedCriterion.id, { crossFieldMatchField: e.target.value })}
                              className="w-full px-2 py-1.5 text-xs border border-[var(--sf-border)] rounded bg-white"
                              disabled={!advancedCriterion.crossFieldDMO}
                            >
                              <option value="">Select...</option>
                              {(dmoFields[advancedCriterion.crossFieldDMO] || []).map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Match Method Refinements */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-3">Match Method Refinements</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedCriterion.matchOnBlank}
                        onChange={(e) => updateCriterion(advancedCriterion.id, { matchOnBlank: e.target.checked })}
                        className="w-4 h-4 rounded border-[var(--sf-border)]"
                      />
                      <span className="text-sm text-[var(--sf-text-primary)]">Match on Blank</span>
                      <Info className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedCriterion.caseSensitive}
                        onChange={(e) => updateCriterion(advancedCriterion.id, { caseSensitive: e.target.checked })}
                        className="w-4 h-4 rounded border-[var(--sf-border)]"
                      />
                      <span className="text-sm text-[var(--sf-text-primary)]">Case Sensitive</span>
                      <Info className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--sf-border)]">
                <button onClick={() => setAdvancedSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                <button onClick={handleSaveAdvanced} className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">Back To Basic Setting</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MODAL: Edit Reconciliation Rule
           ═══════════════════════════════════════════════════════════ */}
        {editReconRuleOpen && editingReconField && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditReconRuleOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[520px] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">
                  Edit Reconciliation Rule for {editingReconField.fieldName}
                </h2>
                <button onClick={() => setEditReconRuleOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <p className="text-sm text-[var(--sf-text-secondary)]">
                  When the default reconciliation rule is enabled, this field inherits the rule set at the DMO level.
                </p>
                {/* Default toggle */}
                <div>
                  <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-2">Default Reconciliation Rule</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditReconUseDefault(!editReconUseDefault)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${editReconUseDefault ? 'bg-[var(--sf-blue)]' : 'bg-[#DDDBDA]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editReconUseDefault ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                    <span className="text-sm text-[var(--sf-text-primary)]">{editReconUseDefault ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                {/* Field Reconciliation Rule dropdown */}
                {!editReconUseDefault && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Field Reconciliation Rule</label>
                    <div className="relative">
                      <select
                        value={editReconRuleValue}
                        onChange={(e) => setEditReconRuleValue(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded appearance-none bg-white focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                      >
                        <option value="Most Recent">Last Updated</option>
                        <option value="Most Frequent">Most Frequent</option>
                        <option value="Source Priority">Source Priority</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sf-text-tertiary)] pointer-events-none" />
                    </div>
                  </div>
                )}
                {/* Ignore Empty Values */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editReconIgnoreEmpty}
                    onChange={(e) => setEditReconIgnoreEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--sf-border)]"
                  />
                  <span className="text-sm text-[var(--sf-text-primary)]">Ignore Empty Values</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--sf-border)]">
                <button onClick={() => setEditReconRuleOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                <button onClick={handleSaveReconRule} className="px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">Save</button>
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">Identity Resolutions</h1>
          <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Manage rulesets that match and unify source profiles into unified profiles.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors">
          <Plus className="w-4 h-4" /> New Ruleset
        </button>
      </div>
      <div className="sf-card">
        <div className="sf-card-header">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
            All Identity Resolution Rulesets <span className="text-xs font-normal text-[var(--sf-text-tertiary)]">({mockRulesets.length})</span>
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
                  <td><button onClick={() => { setSelectedRuleset(rs); setDetailTab('details'); }} className="sf-link font-medium">{rs.rulesetName}</button></td>
                  <td>{rs.rulesetId}</td>
                  <td>{rs.dataSpace}</td>
                  <td>{rs.primaryDataModelObject}</td>
                  <td>{statusBadge(rs.rulesetStatus)}</td>
                  <td>{statusBadge(rs.lastJobStatus)}</td>
                  <td>{fmt(rs.sourceProfiles)}</td>
                  <td>{fmt(rs.matchedSourceProfiles)}</td>
                  <td>{fmt(rs.totalUnifiedProfiles)}</td>
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
