import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
  Loader2,
  Download,
  Eye,
  Camera,
  Search,
  RefreshCw,
} from 'lucide-react';
import {
  useIdentityRulesets,
  useCreateIdentityRuleset,
  useUpdateIdentityRuleset,
  type IdentityRulesetData,
} from '@/hooks/use-identity-rulesets';

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
  _dbId?: number; // database primary key for API calls
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
  isBYOM?: boolean; // "Bring Your Own MDM" mode — installed from datakit
  byomSource?: string; // datakit source name e.g. "Informatica MDM"
  isCX?: boolean; // Customer 360 / Real Time — uses standard IR detail view
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
    rulesetName: 'Individual (Customer-360)',
    rulesetId: 'INFA-C360',
    dataSpace: 'default',
    primaryDataModelObject: 'Individual',
    secondaryDataModelObject: 'Individual',
    rulesetStatus: 'Published',
    lastJobStatus: 'Completed',
    lastJobCompleted: '02/24/2026, 3:45 PM',
    description: 'Installed from Informatica MDM datakit (CX)',
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
          { id: 'rf-2', fieldName: 'City', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-3', fieldName: 'State', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-4', fieldName: 'Postal Code', reconciliationRule: 'Most Recent', usingDefault: true },
          { id: 'rf-5', fieldName: 'Country', reconciliationRule: 'Most Recent', usingDefault: true },
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
];

// ── Helper: convert API data to local IdentityRuleset ──────────────
function apiToLocal(d: IdentityRulesetData): IdentityRuleset {
  return {
    id: String(d.id ?? ''),
    _dbId: d.id,
    rulesetName: d.rulesetName,
    rulesetId: d.rulesetId,
    dataSpace: d.dataSpace,
    primaryDataModelObject: d.primaryDataModelObject,
    secondaryDataModelObject: d.secondaryDataModelObject,
    rulesetStatus: d.rulesetStatus as IdentityRuleset['rulesetStatus'],
    lastJobStatus: d.lastJobStatus as IdentityRuleset['lastJobStatus'],
    lastJobCompleted: d.lastJobCompleted,
    description: d.description,
    createdBy: d.createdBy,
    createdDate: d.createdDate,
    lastModifiedBy: d.lastModifiedBy,
    isScheduled: d.isScheduled,
    sourceProfiles: d.sourceProfiles,
    matchedSourceProfiles: d.matchedSourceProfiles,
    totalUnifiedProfiles: d.totalUnifiedProfiles,
    consolidationRate: d.consolidationRate,
    matchRules: d.matchRules ?? [],
    reconciliationGroups: d.reconciliationGroups ?? [],
    processingHistory: d.processingHistory ?? [],
    isBYOM: d.description?.startsWith('Installed from ') || false,
    byomSource: d.description?.startsWith('Installed from ') ? d.description.replace('Installed from ', '').replace(' datakit', '').replace(' (CX)', '') : undefined,
    isCX: d.description?.includes('(CX)') || false,
  };
}

function localToApi(rs: IdentityRuleset): IdentityRulesetData {
  return {
    rulesetId: rs.rulesetId,
    rulesetName: rs.rulesetName,
    dataSpace: rs.dataSpace,
    primaryDataModelObject: rs.primaryDataModelObject,
    secondaryDataModelObject: rs.secondaryDataModelObject,
    rulesetStatus: rs.rulesetStatus,
    lastJobStatus: rs.lastJobStatus,
    lastJobCompleted: rs.lastJobCompleted,
    description: rs.description,
    createdBy: rs.createdBy,
    createdDate: rs.createdDate,
    lastModifiedBy: rs.lastModifiedBy,
    isScheduled: rs.isScheduled,
    sourceProfiles: rs.sourceProfiles,
    matchedSourceProfiles: rs.matchedSourceProfiles,
    totalUnifiedProfiles: rs.totalUnifiedProfiles,
    consolidationRate: rs.consolidationRate,
    matchRules: rs.matchRules,
    reconciliationGroups: rs.reconciliationGroups,
    processingHistory: rs.processingHistory,
  };
}

// ── Component ────────────────────────────────────────────────────────
interface DemoSessionState {
  informaticaConnections: { name: string; alias: string; orgId: string }[];
  selectedBundles: string[];
  installedDatakits: string[];
}

interface IdentityResolutionContentProps {
  demoSession?: DemoSessionState;
  onDemoSessionChange?: (session: DemoSessionState) => void;
  currentTimeline?: string;
}

export default function IdentityResolutionContent({ demoSession, onDemoSessionChange, currentTimeline }: IdentityResolutionContentProps) {
  // ── API hooks ─────────────────────────────────────────────────────
  const { data: apiRulesets, isLoading, isError } = useIdentityRulesets();
  const createMutation = useCreateIdentityRuleset();
  const updateMutation = useUpdateIdentityRuleset();

  // Auto-seed: when DB is empty, insert mock data once
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || isLoading || isError) return;
    if (apiRulesets && apiRulesets.length === 0) {
      seeded.current = true;
      mockRulesets.forEach((rs) => {
        createMutation.mutate(localToApi(rs));
      });
    }
  }, [apiRulesets, isLoading, isError]);

  // Convert API data → local typed rulesets
  const rulesets: IdentityRuleset[] = (apiRulesets ?? []).map(apiToLocal);

  // Navigation state
  const [selectedRuleset, setSelectedRuleset] = useState<IdentityRuleset | null>(null);
  const [detailTab, setDetailTab] = useState<'properties' | 'details' | 'history'>('details');

  // Keep selectedRuleset in sync with API data after mutations
  useEffect(() => {
    if (selectedRuleset && rulesets.length > 0) {
      const fresh = rulesets.find((r) => r._dbId === selectedRuleset._dbId);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedRuleset)) {
        setSelectedRuleset(fresh);
      }
    }
  }, [rulesets]);

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

  // BYOM detail view
  const [byomDetailsOpen, setByomDetailsOpen] = useState(false);

  // New Ruleset wizard
  const [newRulesetOpen, setNewRulesetOpen] = useState(false);
  const [newRulesetStep, setNewRulesetStep] = useState<1 | 2 | 3>(1);
  const [newRulesetOption, setNewRulesetOption] = useState<'create' | 'datakit' | null>(null);
  const [newRulesetName, setNewRulesetName] = useState('');
  const [newRulesetPrimaryDMO, setNewRulesetPrimaryDMO] = useState('Individual');
  const [newRulesetDataSpace, setNewRulesetDataSpace] = useState('default');
  // Datakit selection state
  const [datakitSearch, setDatakitSearch] = useState('');
  const [selectedDatakit, setSelectedDatakit] = useState('Informatica MDM');
  const [selectedDatakitRuleset, setSelectedDatakitRuleset] = useState<string | null>(null);

  // Informatica MDM datakit only available in 264 Release timeline
  const datakitCategories = currentTimeline === '264-release'
    ? ['Knowledge Space', 'Billing Analytics', 'Informatica MDM', 'Agentforce Analytics', 'Pricing', 'Content Kit']
    : ['Knowledge Space', 'Billing Analytics', 'Agentforce Analytics', 'Pricing', 'Content Kit'];
  // Full catalog of Informatica MDM rulesets — Phase-2 item always shown (grayed), others filtered by session bundle selection
  const allInformaticaRulesets: { name: string; id: string; dataSpace: string; primaryDMO: string; phase2?: boolean; cx?: boolean; bundleName?: string }[] = [
    { name: 'Customer 360', id: 'INFA-C360', dataSpace: 'default', primaryDMO: 'Individual', cx: true, bundleName: 'Informatica MDM Cloud' },
    { name: 'Customer 360', id: 'INFA-C360-RT', dataSpace: 'default', primaryDMO: 'Individual', phase2: true, cx: true, bundleName: 'Informatica MDM Cloud' },
    { name: 'Organization 360', id: 'INFA-O360', dataSpace: 'default', primaryDMO: 'Account', bundleName: 'Informatica MDM Cloud' },
    { name: 'Reference 360', id: 'INFA-R360', dataSpace: 'default', primaryDMO: 'Account', bundleName: 'Informatica MDM Cloud' },
    { name: 'Supplier 360', id: 'INFA-S360', dataSpace: 'default', primaryDMO: 'Account', bundleName: 'Informatica Data Quality' },
    { name: 'Finance 360', id: 'INFA-F360', dataSpace: 'default', primaryDMO: 'Account', bundleName: 'Informatica Data Quality' },
  ];

  // Filter Informatica rulesets: Phase-2 items always visible (but disabled), others only if their bundle was selected in Setup
  const hasSessionBundles = demoSession && demoSession.selectedBundles.length > 0;
  const filteredInformaticaRulesets = hasSessionBundles
    ? allInformaticaRulesets.filter((rs) => rs.phase2 || demoSession.selectedBundles.includes(rs.bundleName || ''))
    : allInformaticaRulesets; // show all if no session (backward compat)

  const datakitRulesets: Record<string, { name: string; id: string; dataSpace: string; primaryDMO: string; phase2?: boolean; cx?: boolean; bundleName?: string }[]> = {
    'Knowledge Space': [
      { name: 'Customer Dedup', id: 'KS-001', dataSpace: 'default', primaryDMO: 'Individual' },
    ],
    'Billing Analytics': [
      { name: 'Billing Account Match', id: 'BA-001', dataSpace: 'default', primaryDMO: 'Account' },
    ],
    'Informatica MDM': filteredInformaticaRulesets,
    'Agentforce Analytics': [
      { name: 'Agent Contact Resolution', id: 'AF-001', dataSpace: 'default', primaryDMO: 'Individual' },
    ],
    'Pricing': [],
    'Content Kit': [],
  };

  const handleOpenNewRuleset = () => {
    setNewRulesetStep(1);
    setNewRulesetOption(null);
    setNewRulesetName('');
    setNewRulesetPrimaryDMO('Individual');
    setNewRulesetDataSpace('default');
    setDatakitSearch('');
    setSelectedDatakit(currentTimeline === '264-release' ? 'Informatica MDM' : 'Knowledge Space');
    setSelectedDatakitRuleset(null);
    setNewRulesetOpen(true);
  };

  const handleNewRulesetNext = () => {
    if (newRulesetStep === 1 && newRulesetOption) {
      setNewRulesetStep(2);
    } else if (newRulesetStep === 2) {
      if (newRulesetOption === 'create' && newRulesetName.trim()) {
        setNewRulesetStep(3);
      } else if (newRulesetOption === 'datakit' && selectedDatakitRuleset) {
        // Populate name/DMO from selected datakit ruleset
        const currentRulesets = datakitRulesets[selectedDatakit] || [];
        const picked = currentRulesets.find((r) => r.id === selectedDatakitRuleset);
        if (picked) {
          setNewRulesetName(picked.name);
          setNewRulesetPrimaryDMO(picked.primaryDMO);
          setNewRulesetDataSpace(picked.dataSpace);
        }
        setNewRulesetStep(3);
      }
    }
  };

  const handleNewRulesetBack = () => {
    if (newRulesetStep === 2) setNewRulesetStep(1);
    else if (newRulesetStep === 3) setNewRulesetStep(2);
  };

  const handleNewRulesetSave = () => {
    if (!newRulesetName.trim()) return;
    const isFromDatakit = newRulesetOption === 'datakit';
    // Check if the selected datakit ruleset is a CX (Customer 360) type
    const currentDkRulesets = datakitRulesets[selectedDatakit] || [];
    const pickedDk = currentDkRulesets.find((r) => r.id === selectedDatakitRuleset);
    const isCXDatakit = isFromDatakit && pickedDk?.cx === true;
    // CX datakits get pre-populated with match rules and reconciliation data
    const cxMatchRules: MatchRule[] = isCXDatakit ? [
      { id: 'mr-cx-1', ruleName: 'Fuzzy Name and Normalized Email', priority: 1, criteria: [
        { id: 'mc-cx-1', dataModelObject: 'Individual', field: 'First Name', matchMethod: 'Fuzzy: First Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        { id: 'mc-cx-2', dataModelObject: 'Individual', field: 'Last Name', matchMethod: 'Fuzzy: Last Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        { id: 'mc-cx-3', dataModelObject: 'Contact Point Email', field: 'Email Address', matchMethod: 'Normalized', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
      ]},
      { id: 'mr-cx-2', ruleName: 'Fuzzy Name and Normalized Phone', priority: 2, criteria: [
        { id: 'mc-cx-4', dataModelObject: 'Individual', field: 'First Name', matchMethod: 'Fuzzy: First Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        { id: 'mc-cx-5', dataModelObject: 'Individual', field: 'Last Name', matchMethod: 'Fuzzy: Last Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        { id: 'mc-cx-6', dataModelObject: 'Contact Point Phone', field: 'Phone Number', matchMethod: 'Normalized', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
      ]},
      { id: 'mr-cx-3', ruleName: 'Fuzzy Name and Normalized Address', priority: 3, criteria: [
        { id: 'mc-cx-7', dataModelObject: 'Individual', field: 'First Name', matchMethod: 'Fuzzy: First Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        { id: 'mc-cx-8', dataModelObject: 'Individual', field: 'Last Name', matchMethod: 'Fuzzy: Last Name', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
        { id: 'mc-cx-9', dataModelObject: 'Contact Point Address', field: 'Address Line 1', matchMethod: 'Normalized', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
      ]},
      { id: 'mr-cx-4', ruleName: 'Unique Identifier 01', priority: 4, criteria: [
        { id: 'mc-cx-10', dataModelObject: 'Party Identification', field: 'Identification Number', matchMethod: 'Exact', crossFieldDMO: '', crossFieldMatchField: '', matchOnBlank: false, caseSensitive: false },
      ]},
    ] : [];
    const cxReconGroups: ReconciliationGroup[] = isCXDatakit ? [
      { dmoName: 'Contact Point Address', defaultRule: 'Most Recent', fields: [
        { id: 'rf-cx-1', fieldName: 'Address Line 1', reconciliationRule: 'Most Recent', usingDefault: true },
        { id: 'rf-cx-2', fieldName: 'City', reconciliationRule: 'Most Recent', usingDefault: true },
        { id: 'rf-cx-3', fieldName: 'State', reconciliationRule: 'Most Recent', usingDefault: true },
        { id: 'rf-cx-4', fieldName: 'Postal Code', reconciliationRule: 'Most Recent', usingDefault: true },
        { id: 'rf-cx-5', fieldName: 'Country', reconciliationRule: 'Most Recent', usingDefault: true },
      ]},
      { dmoName: 'Contact Point App', defaultRule: 'Most Recent', fields: [
        { id: 'rf-cx-6', fieldName: 'App Id', reconciliationRule: 'Most Recent', usingDefault: true },
        { id: 'rf-cx-7', fieldName: 'App Type', reconciliationRule: 'Most Recent', usingDefault: true },
      ]},
      { dmoName: 'Contact Point Email', defaultRule: 'Most Recent', fields: [
        { id: 'rf-cx-8', fieldName: 'Email Address', reconciliationRule: 'Source Priority', usingDefault: false },
        { id: 'rf-cx-9', fieldName: 'Email Domain', reconciliationRule: 'Most Recent', usingDefault: true },
      ]},
      { dmoName: 'Contact Point Phone', defaultRule: 'Most Recent', fields: [
        { id: 'rf-cx-10', fieldName: 'Phone Number', reconciliationRule: 'Source Priority', usingDefault: false },
        { id: 'rf-cx-11', fieldName: 'Phone Type', reconciliationRule: 'Most Recent', usingDefault: true },
      ]},
      { dmoName: 'Individual', defaultRule: 'Source Priority', fields: [
        { id: 'rf-cx-12', fieldName: 'First Name', reconciliationRule: 'Source Priority', usingDefault: true },
        { id: 'rf-cx-13', fieldName: 'Last Name', reconciliationRule: 'Source Priority', usingDefault: true },
        { id: 'rf-cx-14', fieldName: 'Date of Birth', reconciliationRule: 'Most Recent', usingDefault: false },
      ]},
      { dmoName: 'Party Identification', defaultRule: 'Most Recent', fields: [
        { id: 'rf-cx-15', fieldName: 'Identification Number', reconciliationRule: 'Most Recent', usingDefault: true },
        { id: 'rf-cx-16', fieldName: 'Identification Type', reconciliationRule: 'Most Recent', usingDefault: true },
      ]},
    ] : [];
    const newRs: IdentityRuleset = {
      id: `rs-new-${Date.now()}`,
      rulesetName: newRulesetName,
      rulesetId: isFromDatakit && selectedDatakitRuleset ? selectedDatakitRuleset : `IDR-${new Date().getFullYear()}-${String(rulesets.length + 1).padStart(3, '0')}`,
      dataSpace: newRulesetDataSpace,
      primaryDataModelObject: newRulesetPrimaryDMO,
      secondaryDataModelObject: newRulesetPrimaryDMO,
      rulesetStatus: isCXDatakit ? 'Published' : 'Draft',
      lastJobStatus: isCXDatakit ? 'Completed' : 'Not Run',
      lastJobCompleted: isCXDatakit ? new Date().toLocaleString() : '—',
      description: isFromDatakit ? `Installed from ${selectedDatakit} datakit${isCXDatakit ? ' (CX)' : ''}` : '',
      createdBy: 'Data Cloud',
      createdDate: new Date().toLocaleString(),
      lastModifiedBy: isCXDatakit ? 'Automated Process' : 'Data Cloud',
      isScheduled: false,
      sourceProfiles: isCXDatakit ? 12061 : 0,
      matchedSourceProfiles: isCXDatakit ? 93 : 0,
      totalUnifiedProfiles: isCXDatakit ? 10594 : 0,
      consolidationRate: isCXDatakit ? 12 : 0,
      matchRules: cxMatchRules,
      reconciliationGroups: cxReconGroups,
      processingHistory: isCXDatakit ? generateProcessingHistory() : [],
      isBYOM: isFromDatakit,
      byomSource: isFromDatakit ? selectedDatakit : undefined,
      isCX: isCXDatakit,
    };
    createMutation.mutate(localToApi(newRs));
    // Record installed datakit in session
    if (isFromDatakit && selectedDatakitRuleset && onDemoSessionChange && demoSession) {
      onDemoSessionChange({
        ...demoSession,
        installedDatakits: [...demoSession.installedDatakits, selectedDatakitRuleset],
      });
    }
    setNewRulesetOpen(false);
  };

  // ── Match Rules handlers ────────────────────────────────────────
  const handleOpenEditMatchRules = () => {
    if (!selectedRuleset) return;
    setLocalMatchRules(selectedRuleset.matchRules.map((r) => ({ ...r, criteria: r.criteria.map((c) => ({ ...c })) })));
    setMatchRulesStep('instructions');
    setEditMatchRulesOpen(true);
  };

  const handleSaveMatchRules = () => {
    if (!selectedRuleset) return;
    const updated = { ...selectedRuleset, matchRules: localMatchRules };
    setSelectedRuleset(updated);
    setEditMatchRulesOpen(false);
    // Persist to API
    if (updated._dbId) {
      updateMutation.mutate({ id: updated._dbId, data: localToApi(updated) });
    }
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
    const updated = { ...selectedRuleset, reconciliationGroups: updatedGroups };
    setSelectedRuleset(updated);
    setEditReconRuleOpen(false);
    setEditingReconField(null);
    setSelectedReconFields(new Set());
    // Persist to API
    if (updated._dbId) {
      updateMutation.mutate({ id: updated._dbId, data: localToApi(updated) });
    }
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
  // BYOM DETAIL VIEW — "Bring Your Own MDM" mode (non-CX only)
  // CX datakits (Customer 360 / Real Time) use the standard detail view
  // ──────────────────────────────────────────────────────────────────
  // Determine if this BYOM ruleset's datakit has been installed → mappings are populated
  const byomMappingPopulated = selectedRuleset?.isBYOM && demoSession
    ? demoSession.installedDatakits.includes(selectedRuleset.rulesetId)
    : false;

  // Data exploration chart modal
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreDMO, setExploreDMO] = useState<'link' | 'unified'>('link');

  if (selectedRuleset && selectedRuleset.isBYOM && !selectedRuleset.isCX) {
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

        {/* BYOM Header */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--sf-text-tertiary)]">Identity Resolution</p>
              <h1 className="text-xl font-bold text-[var(--sf-text-primary)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#032D60] flex items-center justify-center flex-shrink-0">
                  <Fingerprint className="w-4.5 h-4.5 text-white" />
                </div>
                NTO Pro-North America
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">Open Page</button>
              <button className="px-3 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">Publish...</button>
              <button className="px-3 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">Edit Properties</button>
              <button className="px-3 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">Clone</button>
              <button className="w-7 h-7 flex items-center justify-center border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-8 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Primary DMO</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedRuleset.primaryDataModelObject}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Ruleset ID</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedRuleset.rulesetId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Data Space</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)] capitalize">{selectedRuleset.dataSpace}</p>
            </div>
          </div>
        </div>

        {/* BYOM Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">
          <div className="flex gap-4 p-6">
            {/* Left column */}
            <div className="flex-1 space-y-4">
              {/* "Bring Your Own Identity" — Verification cards */}
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="text-base font-bold text-[var(--sf-text-primary)]">&ldquo;Bring Your Own Identity&rdquo;</h2>
                </div>
                <div className="sf-card-body space-y-4">
                  {/* Verify Unified Link DMO */}
                  <div className="border border-[var(--sf-border)] rounded-lg p-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--sf-text-primary)] mb-1">Verify Unified Link DMO</h3>
                      <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed">
                        Explore the Unified Link data model object to understand cross-source identity linkage and resolution quality.
                      </p>
                    </div>
                    <button
                      onClick={() => { setExploreDMO('link'); setExploreOpen(true); }}
                      className="flex-shrink-0 ml-4 px-4 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Explore
                    </button>
                  </div>

                  {/* Verify Primary Unified DMO */}
                  <div className="border border-[var(--sf-border)] rounded-lg p-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--sf-text-primary)] mb-1">Verify Primary Unified DMO</h3>
                      <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed">
                        Explore the Primary Unified data model object to review merged profile quality and field completeness.
                      </p>
                    </div>
                    <button
                      onClick={() => { setExploreDMO('unified'); setExploreOpen(true); }}
                      className="flex-shrink-0 ml-4 px-4 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Explore
                    </button>
                  </div>
                </div>
              </div>

              {/* "Bring Your Own Identity" — Mapping status (toggles based on datakit install) */}
              <div className="sf-card">
                <div className="sf-card-header flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--sf-text-primary)]">&ldquo;Bring Your Own Identity&rdquo;</h2>
                  <span className={`text-xs font-medium ${byomMappingPopulated ? 'text-[var(--sf-success)]' : 'text-[var(--sf-text-tertiary)]'}`}>
                    {byomMappingPopulated ? '87 / 87 Fields Mapped' : '0 / 87 Fields Mapped'}
                  </span>
                </div>
                <div className="sf-card-body">
                  {byomMappingPopulated ? (
                    <>
                      {/* Populated mapping status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[var(--sf-success)]" />
                          <p className="text-sm text-[var(--sf-text-secondary)]">
                            <span className="sf-link font-medium">Your Mapping</span> is complete. 3rd party rules active.
                          </p>
                        </div>
                        <button className="px-4 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">
                          Convert to Regular IR
                        </button>
                      </div>

                      {/* Populated mapping canvas — all connected */}
                      <div className="border border-[var(--sf-border)] rounded-lg bg-[#FAFAF9] p-4">
                        <div className="flex items-start gap-0 relative">
                          {/* Source fields column */}
                          <div className="w-[200px] flex-shrink-0">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] font-medium mb-2 px-2">Source Fields</div>
                            {['First Name', 'Last Name', 'Email', 'Phone', 'Address Line 1', 'City', 'State', 'Postal Code'].map((f) => (
                              <div key={f} className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--sf-text-primary)] border-b border-[var(--sf-border)] last:border-0">
                                <div className="w-2 h-2 rounded-full bg-[var(--sf-success)]" />
                                {f}
                              </div>
                            ))}
                          </div>

                          {/* Center — SVG connection lines */}
                          <div className="flex-1 min-h-[220px] relative">
                            <svg className="w-full h-full absolute inset-0" viewBox="0 0 200 260" preserveAspectRatio="none">
                              {[0,1,2,3,4,5,6,7].map((i) => {
                                const y = 30 + i * 29;
                                return <line key={i} x1="0" y1={y} x2="200" y2={y} stroke="#4BC076" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />;
                              })}
                            </svg>
                          </div>

                          {/* Target DMO column */}
                          <div className="w-[200px] flex-shrink-0">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] font-medium mb-2 px-2">Target DMO</div>
                            {['ssot__FirstName__c', 'ssot__LastName__c', 'ssot__Email__c', 'ssot__Phone__c', 'ssot__Street__c', 'ssot__City__c', 'ssot__State__c', 'ssot__PostalCode__c'].map((f) => (
                              <div key={f} className="flex items-center justify-end gap-2 px-2 py-1.5 text-xs text-[var(--sf-text-primary)] border-b border-[var(--sf-border)] last:border-0">
                                {f}
                                <div className="w-2 h-2 rounded-full bg-[var(--sf-success)]" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Empty mapping status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-[var(--sf-warning)]" />
                          <p className="text-sm text-[var(--sf-text-secondary)]">
                            <span className="font-medium">No mappings configured.</span> Map source fields to target DMOs to activate identity resolution.
                          </p>
                        </div>
                        <button className="px-4 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">
                          Start Mapping
                        </button>
                      </div>

                      {/* Empty mapping canvas */}
                      <div className="border border-[var(--sf-border)] rounded-lg bg-[#FAFAF9] p-4">
                        <div className="flex items-start gap-0">
                          <div className="w-[200px] flex-shrink-0">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] font-medium mb-2 px-2">Source Fields</div>
                            {['First Name', 'Last Name', 'Email', 'Phone', 'Address Line 1', 'City', 'State', 'Postal Code'].map((f) => (
                              <div key={f} className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--sf-text-secondary)] border-b border-[var(--sf-border)] last:border-0">
                                <div className="w-2 h-2 rounded-full bg-[#D8DDE6]" />
                                {f}
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 flex items-center justify-center min-h-[220px]">
                            <div className="text-center">
                              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#E5E5E5] flex items-center justify-center">
                                <ArrowRight className="w-5 h-5 text-[#B0B0B0]" />
                              </div>
                              <p className="text-xs text-[var(--sf-text-tertiary)]">No connections</p>
                              <p className="text-[10px] text-[var(--sf-text-tertiary)] mt-0.5">Drag fields to create mappings</p>
                            </div>
                          </div>
                          <div className="w-[200px] flex-shrink-0">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] font-medium mb-2 px-2">Target DMO</div>
                            {['ssot__FirstName__c', 'ssot__LastName__c', 'ssot__Email__c', 'ssot__Phone__c', 'ssot__Street__c', 'ssot__City__c', 'ssot__State__c', 'ssot__PostalCode__c'].map((f) => (
                              <div key={f} className="flex items-center justify-end gap-2 px-2 py-1.5 text-xs text-[var(--sf-text-secondary)] border-b border-[var(--sf-border)] last:border-0">
                                {f}
                                <div className="w-2 h-2 rounded-full bg-[#D8DDE6]" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Collapsible Details */}
                  <div className="border-t border-[var(--sf-border)] pt-3 mt-4">
                    <button
                      onClick={() => setByomDetailsOpen(!byomDetailsOpen)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[var(--sf-text-primary)] mb-3"
                    >
                      {byomDetailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Details
                    </button>
                    {byomDetailsOpen && (
                      <div className="sf-detail-grid pl-5">
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Source</div>
                          <div className="sf-detail-value">{selectedRuleset.byomSource || 'External MDM'}</div>
                        </div>
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Mapping Type</div>
                          <div className="sf-detail-value">Direct</div>
                        </div>
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Unified Link DMO</div>
                          <div className="sf-detail-value">ssot__UnifiedLink__dlm</div>
                        </div>
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Primary Unified DMO</div>
                          <div className="sf-detail-value">ssot__Individual__dlm</div>
                        </div>
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Created Date</div>
                          <div className="sf-detail-value">{selectedRuleset.createdDate}</div>
                        </div>
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Last Modified</div>
                          <div className="sf-detail-value">{selectedRuleset.createdDate}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="w-[320px] flex-shrink-0 space-y-4">
              {/* Resolution Summary */}
              <div className="sf-card">
                <div className="px-4 py-3 border-b-2 border-[var(--sf-blue)]">
                  <h3 className="text-sm font-semibold text-[var(--sf-blue)]">Resolution Summary</h3>
                </div>
                <div className="p-6 text-center">
                  {/* Desert/cactus illustration placeholder */}
                  <div className="mx-auto mb-4 w-32 h-24 flex items-center justify-center">
                    <svg viewBox="0 0 128 96" className="w-full h-full text-[#B0C4DE]" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="80" cy="30" r="18" strokeDasharray="4 3" />
                      <circle cx="90" cy="25" r="10" strokeDasharray="3 2" />
                      <path d="M20 80 Q35 20 40 40 Q42 50 44 40 Q48 20 50 80" />
                      <path d="M30 55 Q20 50 25 45" />
                      <path d="M44 50 Q54 45 50 40" />
                      <line x1="5" y1="80" x2="125" y2="80" />
                      <path d="M60 80 Q70 70 80 80" />
                      <path d="M90 80 Q95 75 100 80" />
                    </svg>
                  </div>
                  <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed mb-4">
                    Nothing here yet. If you enable, you can see summaries of your last run job to help you analyze further configurations etc.{' '}
                    <span className="sf-link">Learn More</span>
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button className="px-4 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">
                      Enable
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Post / Poll / Question activity card */}
              <div className="sf-card">
                <div className="flex border-b border-[var(--sf-border)]">
                  {['Post', 'Poll', 'Question'].map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                        tab === 'Post'
                          ? 'border-[var(--sf-blue)] text-[var(--sf-blue)]'
                          : 'border-transparent text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-secondary)]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Share an update..."
                      className="flex-1 px-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)]"
                    />
                    <button className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">
                      Share
                    </button>
                  </div>
                </div>
                <div className="px-3 pb-3 flex items-center justify-between">
                  <button className="flex items-center gap-1 text-xs text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-secondary)]">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-28 px-2 py-1 text-xs border border-[var(--sf-border)] rounded focus:outline-none"
                    />
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Data Exploration Modal ─────────────────────────────── */}
        {exploreOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setExploreOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-2xl w-[720px] max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--sf-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--sf-text-primary)]">
                    Data Explorer — {exploreDMO === 'link' ? 'Unified Link DMO' : 'Primary Unified DMO'}
                  </h2>
                  <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
                    {exploreDMO === 'link' ? 'ssot__UnifiedLink__dlm' : `ssot__${selectedRuleset.primaryDataModelObject}__dlm`}
                  </p>
                </div>
                <button onClick={() => setExploreOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chart grid */}
              <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
                {/* Row 1: Record counts + match rate */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-[var(--sf-border)] rounded-lg p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] mb-1">Total Records</p>
                    <p className="text-2xl font-bold text-[var(--sf-blue)]">{exploreDMO === 'link' ? '45,892' : '38,241'}</p>
                  </div>
                  <div className="border border-[var(--sf-border)] rounded-lg p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] mb-1">{exploreDMO === 'link' ? 'Linked Pairs' : 'Unified Profiles'}</p>
                    <p className="text-2xl font-bold text-[var(--sf-success)]">{exploreDMO === 'link' ? '12,547' : '10,594'}</p>
                  </div>
                  <div className="border border-[var(--sf-border)] rounded-lg p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)] mb-1">{exploreDMO === 'link' ? 'Link Rate' : 'Consolidation'}</p>
                    <p className="text-2xl font-bold text-[#FF4A00]">{exploreDMO === 'link' ? '27.3%' : '72.3%'}</p>
                  </div>
                </div>

                {/* Chart: Source Distribution (bar chart via SVG) */}
                <div className="border border-[var(--sf-border)] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-3">
                    {exploreDMO === 'link' ? 'Links by Source System' : 'Records by Data Source'}
                  </h3>
                  <svg viewBox="0 0 600 140" className="w-full">
                    {[
                      { label: 'Informatica MDM', value: 0.72, color: '#FF4A00' },
                      { label: 'Salesforce CRM', value: 0.45, color: '#0070D2' },
                      { label: 'Marketing Cloud', value: 0.28, color: '#9C27B0' },
                      { label: 'External API', value: 0.15, color: '#4CAF50' },
                    ].map((bar, i) => (
                      <g key={bar.label} transform={`translate(0, ${i * 34})`}>
                        <text x="0" y="14" fontSize="11" fill="#706E6B" fontFamily="sans-serif">{bar.label}</text>
                        <rect x="140" y="2" width={bar.value * 350} height="18" rx="3" fill={bar.color} opacity="0.85" />
                        <text x={145 + bar.value * 350} y="15" fontSize="10" fill="#706E6B" fontFamily="sans-serif">{Math.round(bar.value * 100)}%</text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Chart: Field Completeness (horizontal segments) */}
                <div className="border border-[var(--sf-border)] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-3">Field Completeness</h3>
                  <div className="space-y-2">
                    {(exploreDMO === 'link'
                      ? [{ f: 'Source Record ID', pct: 100 }, { f: 'Target Record ID', pct: 100 }, { f: 'Link Confidence', pct: 94 }, { f: 'Match Rule', pct: 91 }, { f: 'Created Date', pct: 100 }]
                      : [{ f: 'First Name', pct: 98 }, { f: 'Last Name', pct: 99 }, { f: 'Email', pct: 87 }, { f: 'Phone', pct: 72 }, { f: 'Address', pct: 64 }, { f: 'Date of Birth', pct: 41 }]
                    ).map((row) => (
                      <div key={row.f} className="flex items-center gap-3">
                        <span className="text-xs text-[var(--sf-text-secondary)] w-32 flex-shrink-0">{row.f}</span>
                        <div className="flex-1 h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.pct > 90 ? '#4BC076' : row.pct > 70 ? '#FF9800' : '#E91E63' }} />
                        </div>
                        <span className="text-xs font-medium text-[var(--sf-text-primary)] w-10 text-right">{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart: Match Quality Distribution (donut via SVG) */}
                <div className="border border-[var(--sf-border)] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-3">
                    {exploreDMO === 'link' ? 'Link Confidence Distribution' : 'Match Quality Score'}
                  </h3>
                  <div className="flex items-center gap-8">
                    <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E5E5" strokeWidth="12" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#4BC076" strokeWidth="12" strokeDasharray={`${0.68 * 327} ${327}`} strokeDashoffset="0" transform="rotate(-90 60 60)" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#FF9800" strokeWidth="12" strokeDasharray={`${0.22 * 327} ${327}`} strokeDashoffset={`${-0.68 * 327}`} transform="rotate(-90 60 60)" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#E91E63" strokeWidth="12" strokeDasharray={`${0.10 * 327} ${327}`} strokeDashoffset={`${-0.90 * 327}`} transform="rotate(-90 60 60)" />
                      <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1B1C1D">68%</text>
                      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#706E6B">High</text>
                    </svg>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#4BC076]" /><span className="text-xs text-[var(--sf-text-secondary)]">High confidence (68%)</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FF9800]" /><span className="text-xs text-[var(--sf-text-secondary)]">Medium confidence (22%)</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#E91E63]" /><span className="text-xs text-[var(--sf-text-secondary)]">Low confidence (10%)</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // DETAIL VIEW (standard / non-BYOM)
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
              <p className="text-xs text-[var(--sf-text-tertiary)]">Identity Resolution</p>
              <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">{selectedRuleset.rulesetName}</h1>
            </div>
          </div>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Data Space</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)] capitalize">{selectedRuleset.dataSpace}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Primary Data Model Object</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedRuleset.primaryDataModelObject}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Ruleset ID</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedRuleset.rulesetId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Ruleset Status</p>
              <p className="text-sm">{statusBadge(selectedRuleset.rulesetStatus)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Last Job Status</p>
              <p className="text-sm">{statusBadge(selectedRuleset.lastJobStatus === 'Completed' ? 'Succeeded' : selectedRuleset.lastJobStatus)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Last Job Completed</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedRuleset.lastJobCompleted}</p>
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
            <div className="flex gap-4 p-6">
              {/* Left column — Match Rules + Reconciliation Rules */}
              <div className="flex-1 space-y-4 min-w-0">
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
                    <div className="sf-card-body space-y-2">
                      {selectedRuleset.matchRules.map((rule, ri) => (
                        <div key={rule.id} className="flex items-start gap-3">
                          {ri > 0 && <span className="text-xs font-bold text-[var(--sf-text-tertiary)] mt-1 w-6 text-center flex-shrink-0">OR</span>}
                          {ri === 0 && <span className="w-6 flex-shrink-0" />}
                          <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
                            rule.ruleName === 'Unique Identifier 01' ? 'border-[#FFB75D] bg-[#FFFBF5]' : 'border-[var(--sf-border)] bg-[#FAFAF9]'
                          }`}>
                            {rule.ruleName === 'Unique Identifier 01' && (
                              <AlertTriangle className="w-4 h-4 text-[#FFB75D] flex-shrink-0" />
                            )}
                            <span className="text-sm text-[var(--sf-text-primary)]">{rule.ruleName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
                      const isOpen = reconGroupsOpen[group.dmoName] !== false;
                      return (
                        <div key={group.dmoName} className="border-b border-[var(--sf-border-light)] last:border-b-0">
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

              {/* Right sidebar — Resolution Summary + Warnings + Feed */}
              <div className="w-[320px] flex-shrink-0 space-y-4">
                {/* Resolution Summary */}
                <div className="sf-card">
                  <div className="px-4 py-3 border-b-2 border-[var(--sf-blue)]">
                    <h3 className="text-sm font-semibold text-[var(--sf-blue)]">Resolution Summary</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--sf-text-tertiary)]">Total Unified Profiles</span>
                      <span className="text-sm font-bold text-[var(--sf-text-primary)]">{fmt(selectedRuleset.totalUnifiedProfiles)}</span>
                    </div>
                    <div className="text-xs text-[var(--sf-text-tertiary)]">/ {fmt(selectedRuleset.sourceProfiles)} Source Profiles</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--sf-text-tertiary)]">Consolidation Rate</span>
                      <span className="text-sm font-bold text-[var(--sf-text-primary)]">{selectedRuleset.consolidationRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--sf-text-tertiary)]">Known Unified Profiles</span>
                      <span className="text-sm font-medium text-[var(--sf-text-primary)]">{fmt(selectedRuleset.totalUnifiedProfiles)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--sf-text-tertiary)]">Anonymous Unified Profiles</span>
                      <span className="text-sm font-medium text-[var(--sf-text-primary)]">8</span>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                <div className="sf-card">
                  <div className="px-4 py-3 border-b border-[var(--sf-border)]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FFB75D]" />
                      <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">Warnings (2)</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-[var(--sf-text-secondary)]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FFB75D] flex-shrink-0 mt-0.5" />
                      <span>Match rule &ldquo;Unique Identifier 01&rdquo; may produce false positives with non-unique identifiers.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-[var(--sf-text-secondary)]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FFB75D] flex-shrink-0 mt-0.5" />
                      <span>Consolidation rate below 15% — consider reviewing match rules for better coverage.</span>
                    </div>
                  </div>
                </div>

                {/* Post / Poll / Question feed */}
                <div className="sf-card">
                  <div className="flex border-b border-[var(--sf-border)]">
                    {['Post', 'Poll', 'Question'].map((tab) => (
                      <button
                        key={tab}
                        className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                          tab === 'Post'
                            ? 'border-[var(--sf-blue)] text-[var(--sf-blue)]'
                            : 'border-transparent text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-secondary)]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Share an update..."
                        className="flex-1 px-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)]"
                      />
                      <button className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">
                        Share
                      </button>
                    </div>
                  </div>
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

  // 264 Release timeline → empty state (new release, no rulesets yet — create from Datakit with Informatica)
  // Handled inline below to share the modal JSX
  const is264Release = currentTimeline === '264-release';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--sf-blue)]" />
        <span className="ml-2 text-sm text-[var(--sf-text-secondary)]">Loading rulesets...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">Identity Resolutions</h1>
          <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Manage rulesets that match and unify source profiles into unified profiles.</p>
        </div>
        <button onClick={handleOpenNewRuleset} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors">
          <Plus className="w-4 h-4" /> New Ruleset
        </button>
      </div>
      {is264Release ? (
        /* 264 Release: empty state — create new IR from Datakit with Informatica */
        <div className="sf-card">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <svg viewBox="0 0 140 100" className="w-32 h-24 mb-6 opacity-30">
              <defs>
                <linearGradient id="irEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#69B4F0" />
                  <stop offset="100%" stopColor="#4A9DE0" />
                </linearGradient>
              </defs>
              <path d="M58 12c5.5-5.7 13-9.2 21.5-9.2 11.3 0 21.2 6.4 26.1 15.7 4.1-1.7 8.6-2.6 13.3-2.6 18 0 32.5 14.5 32.5 32.5S137 80.9 119 80.9c-2.3 0-4.6-.2-6.9-.6-4.4 6.7-11.8 11-20.3 11-4.4 0-8.4-1.2-11.9-3.2-4.4 7.8-12.6 13.1-22.2 13.1-9 0-16.9-4.7-21.3-11.6-2.6.6-5.2 1.1-7.9 1.1C11.6 91.7.3 78 .3 61c0-11.1 5.9-20.8 14.7-26.2C13.5 31.3 12.7 27.6 12.7 23.5 12.7 10.8 23.5 0 36.2 0 45.3 0 53.4 5.2 58 12z"
                fill="url(#irEmptyGrad)" />
              <text x="70" y="58" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="18" fontStyle="italic" fontWeight="bold">
                salesforce
              </text>
            </svg>
            <h2 className="text-base font-semibold text-[var(--sf-text-primary)] mb-2">No Identity Resolution Rulesets</h2>
            <p className="text-sm text-[var(--sf-text-tertiary)] max-w-md">
              Get started by creating a new ruleset. Use <span className="font-semibold text-[#FF5D2D]">Install from Datakits</span> to set up Informatica MDM identity resolution.
            </p>
          </div>
        </div>
      ) : (
        /* Today: full data table with all rulesets */
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
              All Identity Resolution Rulesets <span className="text-xs font-normal text-[var(--sf-text-tertiary)]">({rulesets.length})</span>
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
                {rulesets.map((rs) => (
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
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: New Ruleset Wizard (3 steps)
         ═══════════════════════════════════════════════════════════ */}
      {newRulesetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNewRulesetOpen(false)} />
          <div className={`relative bg-white rounded-lg shadow-2xl max-h-[85vh] flex flex-col transition-all ${newRulesetStep === 2 && newRulesetOption === 'datakit' ? 'w-[860px]' : 'w-[640px]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">New Ruleset</h2>
                <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
                  {newRulesetStep === 1 ? 'Select an option to continue.' : newRulesetStep === 2 ? 'Configure your new ruleset.' : 'Review and confirm.'}
                </p>
              </div>
              <button onClick={() => setNewRulesetOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {newRulesetStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { key: 'create' as const, icon: Plus, label: 'Create New Ruleset', desc: 'Build a custom identity resolution ruleset from scratch.' },
                    { key: 'datakit' as const, icon: Download, label: 'Install from Datakits', desc: 'Install a pre-built ruleset from available datakits.' },
                  ]).map((opt) => {
                    const selected = newRulesetOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setNewRulesetOption(opt.key)}
                        className={`relative flex flex-col items-center justify-center h-40 rounded-lg border-2 transition-all text-center px-4 ${
                          selected
                            ? 'border-[var(--sf-blue)] bg-white shadow-sm'
                            : 'border-[#D8DDE6] bg-white hover:border-[#B0B0B0]'
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-0 right-0 w-7 h-7 bg-[var(--sf-blue)] flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                            <Check className="w-3 h-3 text-white absolute top-0.5 right-0.5" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${selected ? 'bg-[#EEF4FF]' : 'bg-[#F3F3F3]'}`}>
                          <opt.icon className={`w-5 h-5 ${selected ? 'text-[var(--sf-blue)]' : 'text-[var(--sf-text-tertiary)]'}`} />
                        </div>
                        <span className="text-sm font-medium text-[var(--sf-text-primary)]">{opt.label}</span>
                        <span className="text-xs text-[var(--sf-text-tertiary)] mt-1">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {newRulesetStep === 2 && newRulesetOption === 'create' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                      <span className="text-[var(--sf-error)]">*</span> Ruleset Name
                    </label>
                    <input
                      type="text"
                      value={newRulesetName}
                      onChange={(e) => setNewRulesetName(e.target.value)}
                      placeholder="e.g., Individual (Main)"
                      className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                      <span className="text-[var(--sf-error)]">*</span> Primary Data Model Object
                    </label>
                    <select
                      value={newRulesetPrimaryDMO}
                      onChange={(e) => setNewRulesetPrimaryDMO(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded bg-white focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                    >
                      {dataModelObjects.map((dmo) => (
                        <option key={dmo} value={dmo}>{dmo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Data Space</label>
                    <select
                      value={newRulesetDataSpace}
                      onChange={(e) => setNewRulesetDataSpace(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded bg-white focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                    >
                      <option value="default">default</option>
                    </select>
                  </div>
                </div>
              )}

              {newRulesetStep === 2 && newRulesetOption === 'datakit' && (
                <div className="flex gap-0 -mx-6 -my-6 h-[420px]">
                  {/* Left sidebar: datakit categories */}
                  <div className="w-[220px] flex-shrink-0 border-r border-[var(--sf-border)] bg-[#FAFAF9] overflow-y-auto">
                    <div className="px-3 py-3">
                      <input
                        type="text"
                        value={datakitSearch}
                        onChange={(e) => setDatakitSearch(e.target.value)}
                        placeholder="Search datakits..."
                        className="w-full px-2.5 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)]"
                      />
                    </div>
                    <nav className="px-1 pb-3">
                      {datakitCategories
                        .filter((cat) => cat.toLowerCase().includes(datakitSearch.toLowerCase()))
                        .map((cat) => {
                          const isInformatica = cat === 'Informatica MDM';
                          const isActive = selectedDatakit === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => { setSelectedDatakit(cat); setSelectedDatakitRuleset(null); }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md mb-0.5 transition-colors ${
                                isActive && isInformatica
                                  ? 'bg-[#FFF3ED] text-[#FF4A00] font-semibold'
                                  : isActive
                                    ? 'bg-[#EEF4FF] text-[var(--sf-blue)] font-semibold'
                                    : isInformatica
                                      ? 'text-[#FF4A00] font-medium hover:bg-[#FFF8F5]'
                                      : 'text-[var(--sf-text-secondary)] hover:bg-white'
                              }`}
                            >
                              {cat}
                              {isInformatica && !isActive && (
                                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FF4A00] text-white">NEW</span>
                              )}
                            </button>
                          );
                        })}
                    </nav>
                  </div>

                  {/* Right side: rulesets table */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-[var(--sf-border)]">
                      <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">Datakit Selection</h3>
                      <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">{selectedDatakit} — select a ruleset to install</p>
                      {/* Session context: show remembered connections + bundles */}
                      {demoSession && demoSession.informaticaConnections.length > 0 && selectedDatakit === 'Informatica MDM' && (
                        <div className="mt-2 px-3 py-2 bg-[#FFF3ED] rounded-md border border-[#FFD6C0]">
                          <p className="text-[11px] font-medium text-[#B33500]">
                            Connected: {demoSession.informaticaConnections.map((c) => c.alias).join(', ')}
                          </p>
                          {demoSession.selectedBundles.length > 0 && (
                            <p className="text-[11px] text-[#B33500] mt-0.5">
                              Installed Bundles: {demoSession.selectedBundles.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {(datakitRulesets[selectedDatakit] || []).length === 0 ? (
                      <div className="flex items-center justify-center h-48 text-sm text-[var(--sf-text-tertiary)]">
                        No rulesets available for {selectedDatakit}.
                      </div>
                    ) : (
                      <table className="sf-table">
                        <thead>
                          <tr>
                            <th className="w-10"></th>
                            <th>Ruleset Name</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(datakitRulesets[selectedDatakit] || []).map((rs) => {
                            const isPhase2 = !!rs.phase2;
                            return (
                            <tr
                              key={rs.id}
                              className={`${isPhase2 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${selectedDatakitRuleset === rs.id && !isPhase2 ? 'bg-[#EEF4FF]' : 'hover:bg-[#FAFAF9]'}`}
                              onClick={() => { if (!isPhase2) setSelectedDatakitRuleset(rs.id); }}
                            >
                              <td>
                                <input
                                  type="radio"
                                  name="datakit-ruleset"
                                  checked={selectedDatakitRuleset === rs.id}
                                  onChange={() => { if (!isPhase2) setSelectedDatakitRuleset(rs.id); }}
                                  disabled={isPhase2}
                                  className="w-4 h-4 accent-[var(--sf-blue)]"
                                />
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${isPhase2 ? 'text-[var(--sf-text-tertiary)]' : 'text-[var(--sf-text-primary)]'}`}>{rs.name}</span>
                                  {isPhase2 && (
                                    <span className="sf-badge sf-badge-neutral" style={{ opacity: 0.6 }}>Phase-2</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-sm text-[var(--sf-text-tertiary)]">
                                {rs.primaryDMO} resolution — {rs.dataSpace} data space
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {newRulesetStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-[#E1F5FE] rounded-lg">
                    <Info className="w-5 h-5 text-[var(--sf-blue)] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[var(--sf-text-secondary)]">
                      {newRulesetOption === 'datakit'
                        ? <>Your ruleset will be created with defaults from <strong>{selectedDatakit}</strong>. Review and click <strong>Save</strong>.</>
                        : <>Review the details below and click <strong>Save</strong> to create your new ruleset.</>
                      }
                    </div>
                  </div>
                  <div className="sf-card">
                    <div className="sf-detail-grid">
                      <div className="sf-detail-field"><div className="sf-detail-label">Ruleset Name</div><div className="sf-detail-value font-medium">{newRulesetName}</div></div>
                      <div className="sf-detail-field"><div className="sf-detail-label">Primary DMO</div><div className="sf-detail-value">{newRulesetPrimaryDMO}</div></div>
                      <div className="sf-detail-field"><div className="sf-detail-label">Data Space</div><div className="sf-detail-value">{newRulesetDataSpace}</div></div>
                      <div className="sf-detail-field"><div className="sf-detail-label">Status</div><div className="sf-detail-value"><span className="sf-badge sf-badge-warning">Draft</span></div></div>
                      {newRulesetOption === 'datakit' && (
                        <>
                          <div className="sf-detail-field"><div className="sf-detail-label">Source</div><div className="sf-detail-value">{selectedDatakit}</div></div>
                          <div className="sf-detail-field"><div className="sf-detail-label">Mode</div><div className="sf-detail-value">Bring Your Own MDM</div></div>
                          <div className="sf-detail-field"><div className="sf-detail-label">Ruleset ID</div><div className="sf-detail-value">{selectedDatakitRuleset}</div></div>
                          <div className="sf-detail-field"><div className="sf-detail-label">Created By</div><div className="sf-detail-value">Data Cloud</div></div>
                          {/* Session-remembered data */}
                          {demoSession && demoSession.informaticaConnections.length > 0 && selectedDatakit === 'Informatica MDM' && (
                            <>
                              <div className="sf-detail-field">
                                <div className="sf-detail-label">Connection</div>
                                <div className="sf-detail-value">{demoSession.informaticaConnections.map((c) => c.alias).join(', ')}</div>
                              </div>
                              {demoSession.selectedBundles.length > 0 && (
                                <div className="sf-detail-field">
                                  <div className="sf-detail-label">Data Bundles</div>
                                  <div className="sf-detail-value">{demoSession.selectedBundles.join(', ')}</div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with step indicator */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--sf-border)] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      s < newRulesetStep ? 'bg-[var(--sf-success)] text-white' :
                      s === newRulesetStep ? 'bg-[var(--sf-blue)] text-white' :
                      'bg-[#E5E5E5] text-[var(--sf-text-tertiary)]'
                    }`}>
                      {s < newRulesetStep ? <Check className="w-3 h-3" /> : s}
                    </div>
                    {s < 3 && <div className={`w-6 h-0.5 ${s < newRulesetStep ? 'bg-[var(--sf-success)]' : 'bg-[#E5E5E5]'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {newRulesetStep === 1 ? (
                  <>
                    <button onClick={() => setNewRulesetOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                    <button
                      onClick={handleNewRulesetNext}
                      disabled={!newRulesetOption}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                ) : newRulesetStep === 2 ? (
                  <>
                    <button onClick={handleNewRulesetBack} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Back</button>
                    <button
                      onClick={handleNewRulesetNext}
                      disabled={newRulesetOption === 'create' ? !newRulesetName.trim() : !selectedDatakitRuleset}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleNewRulesetBack} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Back</button>
                    <button
                      onClick={handleNewRulesetSave}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]"
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
