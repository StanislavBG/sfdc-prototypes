import { useState, useEffect, useRef } from 'react';
import { useMdsSimulator } from './MdsSimulatorContext';
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
  const { triggerDelay } = useMdsSimulator();

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
      triggerDelay(() => setNewRulesetStep(2));
    } else if (newRulesetStep === 2) {
      if (newRulesetOption === 'create' && newRulesetName.trim()) {
        triggerDelay(() => setNewRulesetStep(3));
      } else if (newRulesetOption === 'datakit' && selectedDatakitRuleset) {
        // Populate name/DMO from selected datakit ruleset
        const currentRulesets = datakitRulesets[selectedDatakit] || [];
        const picked = currentRulesets.find((r) => r.id === selectedDatakitRuleset);
        if (picked) {
          setNewRulesetName(picked.name);
          setNewRulesetPrimaryDMO(picked.primaryDMO);
          setNewRulesetDataSpace(picked.dataSpace);
        }
        triggerDelay(() => setNewRulesetStep(3));
      }
    }
  };

  const handleNewRulesetBack = () => {
    if (newRulesetStep === 2) setNewRulesetStep(1);
    else if (newRulesetStep === 3) setNewRulesetStep(2);
  };

  const handleNewRulesetSave = () => {
    if (!newRulesetName.trim()) return;
    triggerDelay(() => handleNewRulesetSaveInner());
  };

  const handleNewRulesetSaveInner = () => {
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
      <div className="slds-h-full slds-flex slds-flex-col">
        {/* Breadcrumb */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_x-small slds-flex slds-items-center slds-gap_x-small">
          <button onClick={() => setSelectedRuleset(null)} className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-brand sf-hover-underline">
            <ArrowLeft className="slds-icon-size_x-small" />
            Identity Resolutions
          </button>
          <ChevronRight className="slds-icon-size_xx-small slds-text-neutral-7" />
          <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.rulesetName}</span>
        </div>

        {/* BYOM Header */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium">
          <div className="slds-flex slds-items-center slds-justify-between">
            <div>
              <p className="slds-text-size_small slds-text-neutral-7">Identity Resolution</p>
              <h1 className="slds-text-size_x-large slds-font-weight_bold slds-text-neutral-base slds-flex slds-items-center slds-gap_small">
                <div className="slds-border-radius_pill slds-bg-brand-1 slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                  <Fingerprint className="slds-icon-size_medium slds-text-white" />
                </div>
                NTO Pro-North America
              </h1>
            </div>
            <div className="slds-flex slds-items-center slds-gap_x-small">
              <button className="slds-p-horizontal_small slds-p-vertical_xx-small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>Open Page</button>
              <button className="slds-p-horizontal_small slds-p-vertical_xx-small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>Publish...</button>
              <button className="slds-p-horizontal_small slds-p-vertical_xx-small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>Edit Properties</button>
              <button className="slds-p-horizontal_small slds-p-vertical_xx-small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>Clone</button>
              <button className="slds-flex slds-items-center slds-justify-center slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                <ChevronDown className="slds-icon-size_x-small" />
              </button>
            </div>
          </div>

          {/* Info bar */}
          <div className="slds-flex slds-items-center slds-gap_x-large slds-m-top_medium">
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Primary DMO</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.primaryDataModelObject}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Ruleset ID</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.rulesetId}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Data Space</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base" style={{ textTransform: 'capitalize' }}>{selectedRuleset.dataSpace}</p>
            </div>
          </div>
        </div>

        {/* BYOM Content */}
        <div className="slds-flex-1 slds-overflow-y-auto slds-bg-neutral-2">
          <div className="slds-flex slds-gap_medium slds-p-around_large">
            {/* Left column */}
            <div className="slds-flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* "Bring Your Own Identity" — Verification cards */}
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base">&ldquo;Bring Your Own Identity&rdquo;</h2>
                </div>
                <div className="sf-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Verify Unified Link DMO */}
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium slds-flex slds-items-start slds-justify-between">
                    <div>
                      <h3 className="slds-text-size_medium slds-font-weight_bold slds-text-neutral-base slds-m-bottom_xx-small">Verify Unified Link DMO</h3>
                      <p className="slds-text-size_small slds-text-neutral-7 slds-leading-relaxed">
                        Explore the Unified Link data model object to understand cross-source identity linkage and resolution quality.
                      </p>
                    </div>
                    <button
                      onClick={() => { setExploreDMO('link'); setExploreOpen(true); }}
                      className="slds-flex-shrink-0 slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-flex slds-items-center slds-gap_xx-small" style={{ marginLeft: '16px', paddingTop: '6px', paddingBottom: '6px' }}
                    >
                      <Search className="slds-icon-size_x-small" />
                      Explore
                    </button>
                  </div>

                  {/* Verify Primary Unified DMO */}
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium slds-flex slds-items-start slds-justify-between">
                    <div>
                      <h3 className="slds-text-size_medium slds-font-weight_bold slds-text-neutral-base slds-m-bottom_xx-small">Verify Primary Unified DMO</h3>
                      <p className="slds-text-size_small slds-text-neutral-7 slds-leading-relaxed">
                        Explore the Primary Unified data model object to review merged profile quality and field completeness.
                      </p>
                    </div>
                    <button
                      onClick={() => { setExploreDMO('unified'); setExploreOpen(true); }}
                      className="slds-flex-shrink-0 slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-flex slds-items-center slds-gap_xx-small" style={{ marginLeft: '16px', paddingTop: '6px', paddingBottom: '6px' }}
                    >
                      <Search className="slds-icon-size_x-small" />
                      Explore
                    </button>
                  </div>
                </div>
              </div>

              {/* "Bring Your Own Identity" — Mapping status (toggles based on datakit install) */}
              <div className="sf-card">
                <div className="sf-card-header slds-flex slds-items-center slds-justify-between">
                  <h2 className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base">&ldquo;Bring Your Own Identity&rdquo;</h2>
                  <span className={`slds-text-size_small slds-font-weight_medium ${byomMappingPopulated ? 'slds-text-success' : 'slds-text-neutral-7'}`}>
                    {byomMappingPopulated ? '87 / 87 Fields Mapped' : '0 / 87 Fields Mapped'}
                  </span>
                </div>
                <div className="sf-card-body">
                  {byomMappingPopulated ? (
                    <>
                      {/* Populated mapping status */}
                      <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_medium">
                        <div className="slds-flex slds-items-center slds-gap_x-small">
                          <CheckCircle2 className="slds-icon-size_default slds-text-success" />
                          <p className="slds-text-size_medium slds-text-neutral-9">
                            <span className="sf-link slds-font-weight_medium">Your Mapping</span> is complete. 3rd party rules active.
                          </p>
                        </div>
                        <button className="slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                          Convert to Regular IR
                        </button>
                      </div>

                      {/* Populated mapping canvas — all connected */}
                      <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium" style={{ backgroundColor: '#FAFAF9' }}>
                        <div className="slds-flex slds-items-start slds-pos-relative" style={{ gap: 0 }}>
                          {/* Source fields column */}
                          <div className="slds-flex-shrink-0" style={{ width: '200px' }}>
                            <div className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-font-weight_medium slds-m-bottom_x-small slds-p-horizontal_x-small" style={{ fontSize: '10px' }}>Source Fields</div>
                            {['First Name', 'Last Name', 'Email', 'Phone', 'Address Line 1', 'City', 'State', 'Postal Code'].map((f) => (
                              <div key={f} className="slds-flex slds-items-center slds-gap_x-small slds-p-horizontal_x-small slds-text-size_small slds-text-neutral-base slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                <div className="slds-border-radius_pill slds-bg-success" style={{ width: '8px', height: '8px' }} />
                                {f}
                              </div>
                            ))}
                          </div>

                          {/* Center — SVG connection lines */}
                          <div className="slds-flex-1 slds-pos-relative" style={{ minHeight: '220px' }}>
                            <svg className="slds-w-full slds-h-full slds-pos-absolute slds-inset-0" viewBox="0 0 200 260" preserveAspectRatio="none">
                              {[0,1,2,3,4,5,6,7].map((i) => {
                                const y = 30 + i * 29;
                                return <line key={i} x1="0" y1={y} x2="200" y2={y} stroke="#4BC076" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />;
                              })}
                            </svg>
                          </div>

                          {/* Target DMO column */}
                          <div className="slds-flex-shrink-0" style={{ width: '200px' }}>
                            <div className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-font-weight_medium slds-m-bottom_x-small slds-p-horizontal_x-small" style={{ fontSize: '10px' }}>Target DMO</div>
                            {['ssot__FirstName__c', 'ssot__LastName__c', 'ssot__Email__c', 'ssot__Phone__c', 'ssot__Street__c', 'ssot__City__c', 'ssot__State__c', 'ssot__PostalCode__c'].map((f) => (
                              <div key={f} className="slds-flex slds-items-center slds-justify-end slds-gap_x-small slds-p-horizontal_x-small slds-text-size_small slds-text-neutral-base slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                {f}
                                <div className="slds-border-radius_pill slds-bg-success" style={{ width: '8px', height: '8px' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Empty mapping status */}
                      <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_medium">
                        <div className="slds-flex slds-items-center slds-gap_x-small">
                          <AlertTriangle className="slds-icon-size_default slds-text-warning" />
                          <p className="slds-text-size_medium slds-text-neutral-9">
                            <span className="slds-font-weight_medium">No mappings configured.</span> Map source fields to target DMOs to activate identity resolution.
                          </p>
                        </div>
                        <button className="slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                          Start Mapping
                        </button>
                      </div>

                      {/* Empty mapping canvas */}
                      <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium" style={{ backgroundColor: '#FAFAF9' }}>
                        <div className="slds-flex slds-items-start" style={{ gap: 0 }}>
                          <div className="slds-flex-shrink-0" style={{ width: '200px' }}>
                            <div className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-font-weight_medium slds-m-bottom_x-small slds-p-horizontal_x-small" style={{ fontSize: '10px' }}>Source Fields</div>
                            {['First Name', 'Last Name', 'Email', 'Phone', 'Address Line 1', 'City', 'State', 'Postal Code'].map((f) => (
                              <div key={f} className="slds-flex slds-items-center slds-gap_x-small slds-p-horizontal_x-small slds-text-size_small slds-text-neutral-9 slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                <div className="slds-border-radius_pill" style={{ width: '8px', height: '8px', backgroundColor: '#D8DDE6' }} />
                                {f}
                              </div>
                            ))}
                          </div>
                          <div className="slds-flex-1 slds-flex slds-items-center slds-justify-center" style={{ minHeight: '220px' }}>
                            <div className="slds-text-center">
                              <div className="slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-m-bottom_x-small" style={{ width: '48px', height: '48px', margin: '0 auto 8px', backgroundColor: 'var(--slds-g-color-border-2)' }}>
                                <ArrowRight className="slds-icon-size_default" style={{ color: '#B0B0B0' }} />
                              </div>
                              <p className="slds-text-size_small slds-text-neutral-7">No connections</p>
                              <p className="slds-text-neutral-7 slds-m-top_xx-small" style={{ fontSize: '10px' }}>Drag fields to create mappings</p>
                            </div>
                          </div>
                          <div className="slds-flex-shrink-0" style={{ width: '200px' }}>
                            <div className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-font-weight_medium slds-m-bottom_x-small slds-p-horizontal_x-small" style={{ fontSize: '10px' }}>Target DMO</div>
                            {['ssot__FirstName__c', 'ssot__LastName__c', 'ssot__Email__c', 'ssot__Phone__c', 'ssot__Street__c', 'ssot__City__c', 'ssot__State__c', 'ssot__PostalCode__c'].map((f) => (
                              <div key={f} className="slds-flex slds-items-center slds-justify-end slds-gap_x-small slds-p-horizontal_x-small slds-text-size_small slds-text-neutral-9 slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                {f}
                                <div className="slds-border-radius_pill" style={{ width: '8px', height: '8px', backgroundColor: '#D8DDE6' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Collapsible Details */}
                  <div className="slds-border_top slds-border-color_border-1 slds-p-top_small slds-m-top_medium">
                    <button
                      onClick={() => setByomDetailsOpen(!byomDetailsOpen)}
                      className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-base slds-m-bottom_small"
                    >
                      {byomDetailsOpen ? <ChevronDown className="slds-icon-size_small" /> : <ChevronRight className="slds-icon-size_small" />}
                      Details
                    </button>
                    {byomDetailsOpen && (
                      <div className="sf-detail-grid slds-p-left_medium" style={{ paddingLeft: '20px' }}>
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
            <div className="slds-flex-shrink-0" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Resolution Summary */}
              <div className="sf-card">
                <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_brand" style={{ borderBottomWidth: '2px' }}>
                  <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-brand">Resolution Summary</h3>
                </div>
                <div className="slds-p-around_large slds-text-center">
                  {/* Desert/cactus illustration placeholder */}
                  <div className="slds-flex slds-items-center slds-justify-center slds-m-bottom_medium" style={{ width: '128px', height: '96px', margin: '0 auto 16px' }}>
                    <svg viewBox="0 0 128 96" className="slds-w-full slds-h-full" style={{ color: '#B0C4DE' }} fill="none" stroke="currentColor" strokeWidth="1.5">
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
                  <p className="slds-text-size_small slds-text-neutral-7 slds-leading-relaxed slds-m-bottom_medium">
                    Nothing here yet. If you enable, you can see summaries of your last run job to help you analyze further configurations etc.{' '}
                    <span className="sf-link">Learn More</span>
                  </p>
                  <div className="slds-flex slds-items-center slds-justify-center slds-gap_small">
                    <button className="slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                      Enable
                    </button>
                    <button className="slds-flex slds-items-center slds-justify-center slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                      <Camera className="slds-icon-size_x-small" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Post / Poll / Question activity card */}
              <div className="sf-card">
                <div className="slds-flex slds-border_bottom slds-border-color_border-1">
                  {['Post', 'Poll', 'Question'].map((tab) => (
                    <button
                      key={tab}
                      className={`slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-transition-colors ${
                        tab === 'Post'
                          ? 'slds-border-color_brand slds-text-brand'
                          : 'slds-text-neutral-7'
                      }`}
                      style={{ paddingTop: '10px', paddingBottom: '10px', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: tab === 'Post' ? undefined : 'transparent' }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="slds-p-around_small">
                  <div className="slds-flex slds-items-center slds-gap_x-small">
                    <input
                      type="text"
                      placeholder="Share an update..."
                      className="slds-flex-1 slds-p-horizontal_small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
                    />
                    <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                      Share
                    </button>
                  </div>
                </div>
                <div className="slds-p-horizontal_small slds-p-bottom_small slds-flex slds-items-center slds-justify-between">
                  <button className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-neutral-7">
                    <RefreshCw className="slds-icon-size_xx-small" />
                  </button>
                  <div className="slds-flex slds-items-center slds-gap_xx-small">
                    <Search className="slds-icon-size_x-small slds-text-neutral-7" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ width: '112px', paddingTop: '4px', paddingBottom: '4px', outline: 'none' }}
                    />
                    <button className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '24px', height: '24px' }}>
                      <RefreshCw className="slds-icon-size_xx-small" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Data Exploration Modal ─────────────────────────────── */}
        {exploreOpen && (
          <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
            <div className="slds-pos-absolute slds-inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setExploreOpen(false)} />
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-overflow-hidden" style={{ width: '720px', maxHeight: '80vh' }}>
              {/* Header */}
              <div className="slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1 slds-flex slds-items-center slds-justify-between">
                <div>
                  <h2 className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base">
                    Data Explorer — {exploreDMO === 'link' ? 'Unified Link DMO' : 'Primary Unified DMO'}
                  </h2>
                  <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
                    {exploreDMO === 'link' ? 'ssot__UnifiedLink__dlm' : `ssot__${selectedRuleset.primaryDataModelObject}__dlm`}
                  </p>
                </div>
                <button onClick={() => setExploreOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                  <X className="slds-icon-size_small" />
                </button>
              </div>

              {/* Chart grid */}
              <div className="slds-p-around_large slds-overflow-y-auto" style={{ maxHeight: '65vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Row 1: Record counts + match rate */}
                <div className="slds-css-grid slds-css-grid-cols-3 slds-gap_medium">
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium slds-text-center">
                    <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>Total Records</p>
                    <p className="slds-text-size_xx-large slds-font-weight_bold slds-text-brand">{exploreDMO === 'link' ? '45,892' : '38,241'}</p>
                  </div>
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium slds-text-center">
                    <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>{exploreDMO === 'link' ? 'Linked Pairs' : 'Unified Profiles'}</p>
                    <p className="slds-text-size_xx-large slds-font-weight_bold slds-text-success">{exploreDMO === 'link' ? '12,547' : '10,594'}</p>
                  </div>
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium slds-text-center">
                    <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>{exploreDMO === 'link' ? 'Link Rate' : 'Consolidation'}</p>
                    <p className="slds-text-size_xx-large slds-font-weight_bold" style={{ color: '#FF4A00' }}>{exploreDMO === 'link' ? '27.3%' : '72.3%'}</p>
                  </div>
                </div>

                {/* Chart: Source Distribution (bar chart via SVG) */}
                <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium">
                  <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">
                    {exploreDMO === 'link' ? 'Links by Source System' : 'Records by Data Source'}
                  </h3>
                  <svg viewBox="0 0 600 140" className="slds-w-full">
                    {[
                      { label: 'Informatica MDM', value: 0.72, color: '#FF4A00' },
                      { label: 'Salesforce CRM', value: 0.45, color: 'var(--slds-g-color-brand)' },
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
                <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium">
                  <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">Field Completeness</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(exploreDMO === 'link'
                      ? [{ f: 'Source Record ID', pct: 100 }, { f: 'Target Record ID', pct: 100 }, { f: 'Link Confidence', pct: 94 }, { f: 'Match Rule', pct: 91 }, { f: 'Created Date', pct: 100 }]
                      : [{ f: 'First Name', pct: 98 }, { f: 'Last Name', pct: 99 }, { f: 'Email', pct: 87 }, { f: 'Phone', pct: 72 }, { f: 'Address', pct: 64 }, { f: 'Date of Birth', pct: 41 }]
                    ).map((row) => (
                      <div key={row.f} className="slds-flex slds-items-center slds-gap_small">
                        <span className="slds-text-size_small slds-text-neutral-9 slds-flex-shrink-0" style={{ width: '128px' }}>{row.f}</span>
                        <div className="slds-flex-1 slds-border-radius_pill slds-overflow-hidden" style={{ height: '12px', backgroundColor: 'var(--slds-g-color-border-2)' }}>
                          <div className="slds-h-full slds-border-radius_pill" style={{ width: `${row.pct}%`, backgroundColor: row.pct > 90 ? '#4BC076' : row.pct > 70 ? '#FF9800' : '#E91E63' }} />
                        </div>
                        <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base" style={{ width: '40px', textAlign: 'right' }}>{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart: Match Quality Distribution (donut via SVG) */}
                <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium">
                  <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">
                    {exploreDMO === 'link' ? 'Link Confidence Distribution' : 'Match Quality Score'}
                  </h3>
                  <div className="slds-flex slds-items-center slds-gap_x-large">
                    <svg viewBox="0 0 120 120" className="slds-flex-shrink-0" style={{ width: '112px', height: '112px' }}>
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E5E5" strokeWidth="12" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#4BC076" strokeWidth="12" strokeDasharray={`${0.68 * 327} ${327}`} strokeDashoffset="0" transform="rotate(-90 60 60)" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#FF9800" strokeWidth="12" strokeDasharray={`${0.22 * 327} ${327}`} strokeDashoffset={`${-0.68 * 327}`} transform="rotate(-90 60 60)" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#E91E63" strokeWidth="12" strokeDasharray={`${0.10 * 327} ${327}`} strokeDashoffset={`${-0.90 * 327}`} transform="rotate(-90 60 60)" />
                      <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1B1C1D">68%</text>
                      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#706E6B">High</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="slds-flex slds-items-center slds-gap_x-small"><div className="slds-border-radius_pill" style={{ width: '12px', height: '12px', backgroundColor: '#4BC076' }} /><span className="slds-text-size_small slds-text-neutral-9">High confidence (68%)</span></div>
                      <div className="slds-flex slds-items-center slds-gap_x-small"><div className="slds-border-radius_pill" style={{ width: '12px', height: '12px', backgroundColor: '#FF9800' }} /><span className="slds-text-size_small slds-text-neutral-9">Medium confidence (22%)</span></div>
                      <div className="slds-flex slds-items-center slds-gap_x-small"><div className="slds-border-radius_pill" style={{ width: '12px', height: '12px', backgroundColor: '#E91E63' }} /><span className="slds-text-size_small slds-text-neutral-9">Low confidence (10%)</span></div>
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
      <div className="slds-h-full slds-flex slds-flex-col">
        {/* Breadcrumb */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_x-small slds-flex slds-items-center slds-gap_x-small">
          <button onClick={() => setSelectedRuleset(null)} className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-brand sf-hover-underline">
            <ArrowLeft className="slds-icon-size_x-small" />
            Identity Resolutions
          </button>
          <ChevronRight className="slds-icon-size_xx-small slds-text-neutral-7" />
          <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.rulesetName}</span>
        </div>

        {/* Header */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium">
          <div className="slds-flex slds-items-start slds-gap_medium">
            <div className="slds-border-radius_medium slds-bg-brand-1 slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '40px', height: '40px' }}>
              <Fingerprint className="slds-icon-size_default slds-text-white" />
            </div>
            <div className="slds-flex-1">
              <p className="slds-text-size_small slds-text-neutral-7">Identity Resolution</p>
              <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>{selectedRuleset.rulesetName}</h1>
            </div>
          </div>

          {/* Metadata bar */}
          <div className="slds-flex slds-flex-wrap slds-items-center slds-m-top_medium" style={{ columnGap: '32px', rowGap: '8px' }}>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Data Space</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base" style={{ textTransform: 'capitalize' }}>{selectedRuleset.dataSpace}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Primary Data Model Object</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.primaryDataModelObject}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Ruleset ID</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.rulesetId}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Ruleset Status</p>
              <p className="slds-text-size_medium">{statusBadge(selectedRuleset.rulesetStatus)}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Last Job Status</p>
              <p className="slds-text-size_medium">{statusBadge(selectedRuleset.lastJobStatus === 'Completed' ? 'Succeeded' : selectedRuleset.lastJobStatus)}</p>
            </div>
            <div>
              <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Last Job Completed</p>
              <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{selectedRuleset.lastJobCompleted}</p>
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
        <div className="slds-flex-1 slds-overflow-y-auto slds-bg-neutral-2">

          {/* ── DETAILS TAB ── */}
          {detailTab === 'details' && (
            <div className="slds-flex slds-gap_medium slds-p-around_large">
              {/* Left column — Match Rules + Reconciliation Rules */}
              <div className="slds-flex-1 slds-min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Match Rules card */}
                <div className="sf-card">
                  <div className="sf-card-header">
                    <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
                      Match Rules <span className="slds-text-size_small slds-font-weight_regular slds-text-neutral-7">({selectedRuleset.matchRules.length})</span>
                    </h2>
                    <button onClick={handleOpenEditMatchRules} className="slds-flex slds-items-center slds-gap_xx-small slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                      <Edit3 className="slds-icon-size_x-small" />
                      Edit
                    </button>
                  </div>
                  {selectedRuleset.matchRules.length === 0 ? (
                    <div className="sf-card-body slds-text-center slds-p-vertical_x-large slds-text-size_medium slds-text-neutral-7">No match rules configured.</div>
                  ) : (
                    <div className="sf-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedRuleset.matchRules.map((rule, ri) => (
                        <div key={rule.id} className="slds-flex slds-items-start slds-gap_small">
                          {ri > 0 && <span className="slds-text-size_small slds-font-weight_bold slds-text-neutral-7 slds-m-top_xx-small slds-text-center slds-flex-shrink-0" style={{ width: '24px' }}>OR</span>}
                          {ri === 0 && <span className="slds-flex-shrink-0" style={{ width: '24px' }} />}
                          <div className={`slds-flex-1 slds-flex slds-items-center slds-gap_x-small slds-p-horizontal_small slds-border-radius_large slds-border_all ${
                            rule.ruleName === 'Unique Identifier 01' ? 'slds-border-color_border-1' : 'slds-border-color_border-1'
                          }`} style={{ paddingTop: '10px', paddingBottom: '10px', borderColor: rule.ruleName === 'Unique Identifier 01' ? '#FFB75D' : undefined, backgroundColor: rule.ruleName === 'Unique Identifier 01' ? '#FFFBF5' : '#FAFAF9' }}>
                            {rule.ruleName === 'Unique Identifier 01' && (
                              <AlertTriangle className="slds-icon-size_small slds-flex-shrink-0" style={{ color: '#FFB75D' }} />
                            )}
                            <span className="slds-text-size_medium slds-text-neutral-base">{rule.ruleName}</span>
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
                      <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Reconciliation Rules</h2>
                      <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Reconciliation rules determine which field value to keep when source profiles are merged into a unified profile.</p>
                    </div>
                    {selectedReconFields.size > 0 && (
                      <button onClick={handleUpdateSelected} className="slds-flex slds-items-center slds-gap_xx-small slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                        Update Selected ({selectedReconFields.size})
                      </button>
                    )}
                  </div>
                  <div>
                    {selectedRuleset.reconciliationGroups.map((group) => {
                      const isOpen = reconGroupsOpen[group.dmoName] !== false;
                      return (
                        <div key={group.dmoName} className="slds-border_bottom slds-border-color_border-2">
                          <button onClick={() => toggleReconGroup(group.dmoName)} className="slds-w-full slds-flex slds-items-center slds-justify-between slds-p-horizontal_medium slds-p-vertical_small slds-transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAF9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <div className="slds-flex slds-items-center slds-gap_x-small">
                              {isOpen ? <ChevronDown className="slds-icon-size_small slds-text-neutral-7" /> : <ChevronRight className="slds-icon-size_small slds-text-neutral-7" />}
                              <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">{group.dmoName}</span>
                            </div>
                            <div className="slds-flex slds-items-center slds-gap_x-small slds-text-size_small slds-text-neutral-7">
                              <span>Default Reconciliation Rule:</span>
                              <span className="slds-font-weight_medium slds-text-neutral-9">{group.defaultRule}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-text-neutral-7" style={{ width: '24px', height: '24px' }}
                                title="Edit Default Reconciliation Rule"
                              >
                                <Pencil className="slds-icon-size_xx-small" />
                              </button>
                            </div>
                          </button>
                          {isOpen && (
                            <table className="sf-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '40px' }}></th>
                                  <th>Field</th>
                                  <th>Reconciliation Rule</th>
                                  <th className="slds-text-center" style={{ width: '96px' }}>Using Default?</th>
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
                                        className="slds-icon-size_small slds-border-radius_small slds-border-color_border-1"
                                      />
                                    </td>
                                    <td>
                                      <button onClick={() => handleOpenEditReconRule(field)} className="sf-link">
                                        {field.fieldName}
                                      </button>
                                    </td>
                                    <td>{field.reconciliationRule}</td>
                                    <td className="slds-text-center">
                                      {field.usingDefault && <Check className="slds-icon-size_small slds-text-success" style={{ margin: '0 auto' }} />}
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
              <div className="slds-flex-shrink-0" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Resolution Summary */}
                <div className="sf-card">
                  <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_brand" style={{ borderBottomWidth: '2px' }}>
                    <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-brand">Resolution Summary</h3>
                  </div>
                  <div className="slds-p-around_medium" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="slds-flex slds-items-center slds-justify-between">
                      <span className="slds-text-size_small slds-text-neutral-7">Total Unified Profiles</span>
                      <span className="slds-text-size_medium slds-font-weight_bold slds-text-neutral-base">{fmt(selectedRuleset.totalUnifiedProfiles)}</span>
                    </div>
                    <div className="slds-text-size_small slds-text-neutral-7">/ {fmt(selectedRuleset.sourceProfiles)} Source Profiles</div>
                    <div className="slds-flex slds-items-center slds-justify-between">
                      <span className="slds-text-size_small slds-text-neutral-7">Consolidation Rate</span>
                      <span className="slds-text-size_medium slds-font-weight_bold slds-text-neutral-base">{selectedRuleset.consolidationRate}%</span>
                    </div>
                    <div className="slds-flex slds-items-center slds-justify-between">
                      <span className="slds-text-size_small slds-text-neutral-7">Known Unified Profiles</span>
                      <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{fmt(selectedRuleset.totalUnifiedProfiles)}</span>
                    </div>
                    <div className="slds-flex slds-items-center slds-justify-between">
                      <span className="slds-text-size_small slds-text-neutral-7">Anonymous Unified Profiles</span>
                      <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">8</span>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                <div className="sf-card">
                  <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_border-1">
                    <div className="slds-flex slds-items-center slds-gap_x-small">
                      <AlertTriangle className="slds-icon-size_small" style={{ color: '#FFB75D' }} />
                      <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Warnings (2)</h3>
                    </div>
                  </div>
                  <div className="slds-p-around_medium" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="slds-flex slds-items-start slds-gap_x-small slds-text-size_small slds-text-neutral-9">
                      <AlertTriangle className="slds-icon-size_x-small slds-flex-shrink-0 slds-m-top_xx-small" style={{ color: '#FFB75D' }} />
                      <span>Match rule &ldquo;Unique Identifier 01&rdquo; may produce false positives with non-unique identifiers.</span>
                    </div>
                    <div className="slds-flex slds-items-start slds-gap_x-small slds-text-size_small slds-text-neutral-9">
                      <AlertTriangle className="slds-icon-size_x-small slds-flex-shrink-0 slds-m-top_xx-small" style={{ color: '#FFB75D' }} />
                      <span>Consolidation rate below 15% — consider reviewing match rules for better coverage.</span>
                    </div>
                  </div>
                </div>

                {/* Post / Poll / Question feed */}
                <div className="sf-card">
                  <div className="slds-flex slds-border_bottom slds-border-color_border-1">
                    {['Post', 'Poll', 'Question'].map((tab) => (
                      <button
                        key={tab}
                        className={`slds-p-horizontal_medium slds-text-size_small slds-font-weight_medium slds-transition-colors ${
                          tab === 'Post'
                            ? 'slds-border-color_brand slds-text-brand'
                            : 'slds-text-neutral-7'
                        }`}
                        style={{ paddingTop: '10px', paddingBottom: '10px', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: tab === 'Post' ? undefined : 'transparent' }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="slds-p-around_small">
                    <div className="slds-flex slds-items-center slds-gap_x-small">
                      <input
                        type="text"
                        placeholder="Share an update..."
                        className="slds-flex-1 slds-p-horizontal_small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
                      />
                      <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
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
            <div className="slds-p-around_large">
              <div className="sf-card">
                <div className="sf-card-header"><h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Ruleset Configuration</h2></div>
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
            <div className="slds-p-around_large" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p className="slds-text-size_medium slds-text-neutral-9">
                Daily summaries contain the aggregate results of all runs of this ruleset from a single date.
              </p>
              <div className="slds-flex slds-items-center slds-justify-end slds-gap_x-small slds-text-size_small slds-text-neutral-7">
                <Info className="slds-icon-size_x-small" />
                <span>Automatic runs:</span>
                <span className="slds-font-weight_medium slds-text-neutral-9">{selectedRuleset.isScheduled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="sf-card">
                <div className="sf-card-header">
                  <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Daily Processing Summary</h2>
                </div>
                {selectedRuleset.processingHistory.length === 0 ? (
                  <div className="sf-card-body slds-text-center slds-p-vertical_x-large" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
                    <Clock className="slds-text-neutral-7 slds-m-bottom_x-small" style={{ width: '32px', height: '32px', margin: '0 auto 8px' }} />
                    <p className="slds-text-size_medium slds-text-neutral-7">No processing history available</p>
                  </div>
                ) : (
                  <div className="slds-overflow-x-auto">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th style={{ width: '48px' }}></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Date <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Total Source P... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Total Unified P... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Total Known P... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Consolidation ... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Total Unknow... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Processed Re... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Aggregate Sta... <ChevronDown className="slds-icon-size_xx-small" /></div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRuleset.processingHistory.map((entry) => (
                          <tr key={entry.id}>
                            <td className="slds-text-center slds-text-neutral-7">{entry.rowNum}</td>
                            <td>{entry.date}</td>
                            <td>{fmt(entry.totalSourceProfiles)}</td>
                            <td>{fmt(entry.totalUnifiedProfiles)}</td>
                            <td>{fmt(entry.totalKnownProfiles)}</td>
                            <td>{entry.consolidationRate}</td>
                            <td>{entry.totalUnknown}</td>
                            <td>{fmt(entry.processedRecords)}</td>
                            <td>
                              <div className="slds-flex slds-items-center slds-gap_xx-small">
                                <AlertTriangle className="slds-icon-size_x-small" style={{ color: '#B7791F' }} />
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
          <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
            <div className="slds-pos-absolute slds-inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setEditMatchRulesOpen(false)} />
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col" style={{ width: '760px', maxHeight: '85vh' }}>
              <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1">
                <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">
                  {matchRulesStep === 'instructions' ? 'Match Rule Instructions' : 'Edit Match Rules'}
                </h2>
                <button onClick={() => setEditMatchRulesOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                  <X className="slds-icon-size_small" />
                </button>
              </div>
              <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_large" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                {matchRulesStep === 'instructions' ? (
                  <div className="slds-flex slds-items-start slds-gap_small slds-p-around_medium slds-border-radius_large" style={{ backgroundColor: '#E1F5FE' }}>
                    <Info className="slds-icon-size_default slds-text-brand slds-flex-shrink-0 slds-m-top_xx-small" />
                    <div className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p className="slds-font-weight_semibold slds-text-neutral-base">How Match Rules Work</p>
                      <p>Match rules define how source profiles are compared and grouped into unified profiles. Rules are evaluated in priority order.</p>
                      <p>Each match rule specifies:</p>
                      <ul className="slds-m-left_medium" style={{ listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li><strong>Match Fields</strong> — The fields used to compare source profiles.</li>
                        <li><strong>Match Type</strong> — Whether the comparison is Exact, Fuzzy, or Normalized.</li>
                        <li><strong>Priority</strong> — The order in which rules are evaluated.</li>
                      </ul>
                      <div className="slds-m-top_x-small slds-p-around_small slds-bg-white slds-border-radius_small slds-border_all slds-border-color_border-2">
                        <p className="slds-text-size_small slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_xx-small">Best Practices</p>
                        <ul className="slds-text-size_small slds-text-neutral-9" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <li>Start with strict (Exact) rules at high priority and add fuzzy rules at lower priority.</li>
                          <li>Use multiple fields in a single rule for more precise matching.</li>
                          <li>Test your rules with a sample batch before running a full job.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="slds-flex slds-items-center slds-justify-between">
                      <p className="slds-text-size_medium slds-text-neutral-9">{localMatchRules.length} match rule{localMatchRules.length !== 1 ? 's' : ''} configured.</p>
                      <button onClick={handleAddNewMatchRule} className="slds-flex slds-items-center slds-gap_xx-small slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                        <Plus className="slds-icon-size_x-small" /> Add Rule
                      </button>
                    </div>
                    {localMatchRules.length === 0 ? (
                      <div className="slds-text-center slds-text-size_medium slds-text-neutral-7" style={{ paddingTop: '48px', paddingBottom: '48px' }}>No match rules configured yet.</div>
                    ) : (
                      <table className="sf-table">
                        <thead><tr><th style={{ width: '32px' }}></th><th>Priority</th><th>Rule Name</th><th>Criteria</th><th style={{ width: '112px' }}>Actions</th></tr></thead>
                        <tbody>
                          {localMatchRules.map((rule) => (
                            <tr key={rule.id}>
                              <td><GripVertical className="slds-icon-size_small slds-text-neutral-7 slds-cursor-pointer" /></td>
                              <td className="slds-font-weight_medium">{rule.priority}</td>
                              <td className="sf-link slds-cursor-pointer" onClick={() => handleConfigureRule(rule)}>{rule.ruleName}</td>
                              <td>
                                <div className="slds-flex slds-flex-wrap slds-gap_xx-small">
                                  {rule.criteria.map((c) => (
                                    <span key={c.id} className="sf-badge sf-badge-info">{c.field || 'Unconfigured'}</span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="slds-flex slds-items-center slds-gap_xx-small">
                                  <button onClick={() => handleConfigureRule(rule)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }} title="Configure">
                                    <Edit3 className="slds-icon-size_x-small" />
                                  </button>
                                  <button onClick={() => handleDeleteMatchRule(rule.id)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-text-neutral-7" style={{ width: '28px', height: '28px' }} title="Delete">
                                    <Trash2 className="slds-icon-size_x-small" />
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
              <div className="slds-flex slds-items-center slds-justify-end slds-gap_small slds-p-horizontal_large slds-p-vertical_medium slds-border_top slds-border-color_border-1">
                {matchRulesStep === 'instructions' ? (
                  <>
                    <button onClick={() => setEditMatchRulesOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Cancel</button>
                    <button onClick={() => setMatchRulesStep('rules')} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small">Continue</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setMatchRulesStep('instructions')} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Back</button>
                    <button onClick={handleSaveMatchRules} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small">Save Match Rules</button>
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
          <div className="slds-pos-fixed slds-inset-0 slds-flex slds-items-center slds-justify-center" style={{ zIndex: 60 }}>
            <div className="slds-pos-absolute slds-inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setConfigureRuleOpen(false)} />
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col" style={{ width: '820px', maxHeight: '85vh' }}>
              <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1">
                <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">Configure Match Criteria</h2>
                <button onClick={() => setConfigureRuleOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                  <X className="slds-icon-size_small" />
                </button>
              </div>
              <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_large" style={{ paddingTop: '20px', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="slds-text-size_medium slds-text-neutral-9">
                  Configure at least one match criterion. Values in the specified fields will be compared for matches.
                </p>
                {/* Rule Name */}
                <div>
                  <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>Match Rule Name</label>
                  <input
                    type="text"
                    value={editingRule.ruleName}
                    onChange={(e) => setEditingRule({ ...editingRule, ruleName: e.target.value })}
                    placeholder="e.g., Fuzzy Name and Normalized Email"
                    className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ outline: 'none' }}
                  />
                </div>
                {/* Match Criteria table */}
                <div>
                  <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_x-small" style={{ display: 'block' }}>Match Criteria</label>
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small slds-overflow-hidden">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th>Data Model Object</th>
                          <th>Field</th>
                          <th>Match Method</th>
                          <th style={{ width: '112px' }}>Advanced Settings</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingRule.criteria.map((criterion) => (
                          <tr key={criterion.id}>
                            <td>
                              <select
                                value={criterion.dataModelObject}
                                onChange={(e) => updateCriterion(criterion.id, { dataModelObject: e.target.value, field: '' })}
                                className="slds-w-full slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
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
                                className="slds-w-full slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
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
                                className="slds-w-full slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
                              >
                                <option value="">Select...</option>
                                {matchMethods.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </td>
                            <td className="slds-text-center">
                              <button
                                onClick={() => handleOpenAdvanced(criterion.id)}
                                className="slds-text-size_small slds-text-brand sf-hover-underline"
                              >
                                Configure
                              </button>
                            </td>
                            <td>
                              {editingRule.criteria.length > 1 && (
                                <button onClick={() => handleDeleteCriterion(criterion.id)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                                  <Trash2 className="slds-icon-size_x-small" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={handleAddCriterion} className="slds-flex slds-items-center slds-gap_xx-small slds-m-top_small slds-text-size_small slds-font-weight_medium slds-text-brand sf-hover-underline">
                    <Plus className="slds-icon-size_x-small" /> Add Criteria
                  </button>
                </div>
              </div>
              <div className="slds-flex slds-items-center slds-justify-end slds-gap_small slds-p-horizontal_large slds-p-vertical_medium slds-border_top slds-border-color_border-1">
                <button onClick={() => setConfigureRuleOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Cancel</button>
                <button
                  onClick={handleSaveConfiguredRule}
                  disabled={!editingRule.ruleName.trim() || editingRule.criteria.every((c) => !c.field)}
                  className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-opacity_50 slds-cursor-not-allowed" style={{ opacity: (!editingRule.ruleName.trim() || editingRule.criteria.every((c) => !c.field)) ? 0.5 : 1, cursor: (!editingRule.ruleName.trim() || editingRule.criteria.every((c) => !c.field)) ? 'not-allowed' : 'pointer' }}
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
          <div className="slds-pos-fixed slds-inset-0 slds-flex slds-items-center slds-justify-center" style={{ zIndex: 70 }}>
            <div className="slds-pos-absolute slds-inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setAdvancedSettingsOpen(false)} />
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col" style={{ width: '640px', maxHeight: '80vh' }}>
              <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1">
                <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">Advanced Match Criteria Settings</h2>
                <button onClick={() => setAdvancedSettingsOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                  <X className="slds-icon-size_small" />
                </button>
              </div>
              <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_large" style={{ paddingTop: '20px', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Cross-Field Match Settings */}
                <div>
                  <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">Cross-Field Match Settings</h3>
                  <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small slds-overflow-hidden">
                    <table className="sf-table">
                      <thead>
                        <tr><th></th><th>Data Model Object</th><th>Match Field</th><th>Scheduled Match Method</th></tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7">Primary DMO</td>
                          <td className="slds-text-size_small slds-text-neutral-9">{advancedCriterion.dataModelObject || '—'}</td>
                          <td className="slds-text-size_small slds-text-neutral-9">{advancedCriterion.field || '—'}</td>
                          <td className="slds-text-size_small slds-text-neutral-9">{advancedCriterion.matchMethod || '—'}</td>
                        </tr>
                        <tr>
                          <td className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7">Match to Individual</td>
                          <td>
                            <select
                              value={advancedCriterion.crossFieldDMO}
                              onChange={(e) => updateCriterion(advancedCriterion.id, { crossFieldDMO: e.target.value, crossFieldMatchField: '' })}
                              className="slds-w-full slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingTop: '6px', paddingBottom: '6px' }}
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
                              className="slds-w-full slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingTop: '6px', paddingBottom: '6px' }}
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
                  <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">Match Method Refinements</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="slds-flex slds-items-center slds-gap_small slds-cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedCriterion.matchOnBlank}
                        onChange={(e) => updateCriterion(advancedCriterion.id, { matchOnBlank: e.target.checked })}
                        className="slds-icon-size_small slds-border-radius_small slds-border-color_border-1"
                      />
                      <span className="slds-text-size_medium slds-text-neutral-base">Match on Blank</span>
                      <Info className="slds-icon-size_x-small slds-text-neutral-7" />
                    </label>
                    <label className="slds-flex slds-items-center slds-gap_small slds-cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedCriterion.caseSensitive}
                        onChange={(e) => updateCriterion(advancedCriterion.id, { caseSensitive: e.target.checked })}
                        className="slds-icon-size_small slds-border-radius_small slds-border-color_border-1"
                      />
                      <span className="slds-text-size_medium slds-text-neutral-base">Case Sensitive</span>
                      <Info className="slds-icon-size_x-small slds-text-neutral-7" />
                    </label>
                  </div>
                </div>
              </div>
              <div className="slds-flex slds-items-center slds-justify-end slds-gap_small slds-p-horizontal_large slds-p-vertical_medium slds-border_top slds-border-color_border-1">
                <button onClick={() => setAdvancedSettingsOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Cancel</button>
                <button onClick={handleSaveAdvanced} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small">Back To Basic Setting</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MODAL: Edit Reconciliation Rule
           ═══════════════════════════════════════════════════════════ */}
        {editReconRuleOpen && editingReconField && (
          <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
            <div className="slds-pos-absolute slds-inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setEditReconRuleOpen(false)} />
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col" style={{ width: '520px' }}>
              <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1">
                <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">
                  Edit Reconciliation Rule for {editingReconField.fieldName}
                </h2>
                <button onClick={() => setEditReconRuleOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                  <X className="slds-icon-size_small" />
                </button>
              </div>
              <div className="slds-p-horizontal_large" style={{ paddingTop: '20px', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="slds-text-size_medium slds-text-neutral-9">
                  When the default reconciliation rule is enabled, this field inherits the rule set at the DMO level.
                </p>
                {/* Default toggle */}
                <div>
                  <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_x-small" style={{ display: 'block' }}>Default Reconciliation Rule</label>
                  <div className="slds-flex slds-items-center slds-gap_small">
                    <button
                      onClick={() => setEditReconUseDefault(!editReconUseDefault)}
                      className={`slds-pos-relative slds-border-radius_pill slds-transition-colors ${editReconUseDefault ? 'slds-bg-brand' : ''}`}
                      style={{ width: '40px', height: '20px', backgroundColor: editReconUseDefault ? undefined : 'var(--slds-g-color-border-1)' }}
                    >
                      <span className={`slds-pos-absolute slds-border-radius_pill slds-bg-white slds-shadow_small slds-transition-all`} style={{ top: '2px', width: '16px', height: '16px', left: editReconUseDefault ? '22px' : '2px' }} />
                    </button>
                    <span className="slds-text-size_medium slds-text-neutral-base">{editReconUseDefault ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                {/* Field Reconciliation Rule dropdown */}
                {!editReconUseDefault && (
                  <div>
                    <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>Field Reconciliation Rule</label>
                    <div className="slds-pos-relative">
                      <select
                        value={editReconRuleValue}
                        onChange={(e) => setEditReconRuleValue(e.target.value)}
                        className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ appearance: 'none', outline: 'none' }}
                      >
                        <option value="Most Recent">Last Updated</option>
                        <option value="Most Frequent">Most Frequent</option>
                        <option value="Source Priority">Source Priority</option>
                      </select>
                      <ChevronDown className="slds-pos-absolute slds-icon-size_small slds-text-neutral-7" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                )}
                {/* Ignore Empty Values */}
                <label className="slds-flex slds-items-center slds-gap_small slds-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editReconIgnoreEmpty}
                    onChange={(e) => setEditReconIgnoreEmpty(e.target.checked)}
                    className="slds-icon-size_small slds-border-radius_small slds-border-color_border-1"
                  />
                  <span className="slds-text-size_medium slds-text-neutral-base">Ignore Empty Values</span>
                </label>
              </div>
              <div className="slds-flex slds-items-center slds-justify-end slds-gap_small slds-p-horizontal_large slds-p-vertical_medium slds-border_top slds-border-color_border-1">
                <button onClick={() => setEditReconRuleOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Cancel</button>
                <button onClick={handleSaveReconRule} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small">Save</button>
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
      <div className="slds-flex slds-items-center slds-justify-center" style={{ height: '256px' }}>
        <Loader2 className="slds-icon-size_large sf-spin slds-text-brand" />
        <span className="slds-m-left_x-small slds-text-size_medium slds-text-neutral-9">Loading rulesets...</span>
      </div>
    );
  }

  return (
    <div className="slds-p-around_large">
      <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_medium">
        <div>
          <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>Identity Resolutions</h1>
          <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Manage rulesets that match and unify source profiles into unified profiles.</p>
        </div>
        <button onClick={handleOpenNewRuleset} className="slds-flex slds-items-center slds-gap_xx-small slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors">
          <Plus className="slds-icon-size_small" /> New Ruleset
        </button>
      </div>
      {is264Release ? (
        /* 264 Release: show installed datakit rulesets, or empty state if none */
        (() => {
          const installedIds = new Set(demoSession?.installedDatakits || []);
          const sessionRulesets = rulesets.filter((rs) => installedIds.has(rs.rulesetId));
          if (sessionRulesets.length === 0) {
            return (
              <div className="sf-card">
                <div className="slds-flex slds-flex-col slds-items-center slds-justify-center slds-p-horizontal_large slds-text-center" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
                  <svg viewBox="0 0 140 100" className="slds-m-bottom_large slds-opacity_50" style={{ width: '128px', height: '96px', opacity: 0.3 }}>
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
                  <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_x-small">No Identity Resolution Rulesets</h2>
                  <p className="slds-text-size_medium slds-text-neutral-7" style={{ maxWidth: '28rem' }}>
                    Get started by creating a new ruleset. Use <span className="slds-font-weight_semibold" style={{ color: '#FF5D2D' }}>Install from Datakits</span> to set up Informatica MDM identity resolution.
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div className="sf-card">
              <div className="sf-card-header">
                <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
                  Identity Resolution Rulesets <span className="slds-text-size_small slds-font-weight_regular slds-text-neutral-7">({sessionRulesets.length})</span>
                </h2>
              </div>
              <div className="slds-overflow-x-auto">
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
                    {sessionRulesets.map((rs) => (
                      <tr key={rs.id}>
                        <td><button onClick={() => { setSelectedRuleset(rs); setDetailTab('details'); }} className="sf-link slds-font-weight_medium">{rs.rulesetName}</button></td>
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
          );
        })()
      ) : (
        /* Today: full data table with all rulesets */
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
              All Identity Resolution Rulesets <span className="slds-text-size_small slds-font-weight_regular slds-text-neutral-7">({rulesets.length})</span>
            </h2>
          </div>
          <div className="slds-overflow-x-auto">
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
                    <td><button onClick={() => { setSelectedRuleset(rs); setDetailTab('details'); }} className="sf-link slds-font-weight_medium">{rs.rulesetName}</button></td>
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
        <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
          <div className="slds-pos-absolute slds-inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setNewRulesetOpen(false)} />
          <div className={`slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col slds-transition-all`} style={{ maxHeight: '85vh', width: newRulesetStep === 2 && newRulesetOption === 'datakit' ? '860px' : '640px' }}>
            {/* Header */}
            <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1">
              <div>
                <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">New Ruleset</h2>
                <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
                  {newRulesetStep === 1 ? 'Select an option to continue.' : newRulesetStep === 2 ? 'Configure your new ruleset.' : 'Review and confirm.'}
                </p>
              </div>
              <button onClick={() => setNewRulesetOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-hover-bg-neutral-2 slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                <X className="slds-icon-size_small" />
              </button>
            </div>

            {/* Body */}
            <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_large slds-p-vertical_large">
              {newRulesetStep === 1 && (
                <div className="slds-css-grid slds-css-grid-cols-2 slds-gap_medium">
                  {([
                    { key: 'create' as const, icon: Plus, label: 'Create New Ruleset', desc: 'Build a custom identity resolution ruleset from scratch.' },
                    { key: 'datakit' as const, icon: Download, label: 'Install from Datakits', desc: 'Install a pre-built ruleset from available datakits.' },
                  ]).map((opt) => {
                    const selected = newRulesetOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setNewRulesetOption(opt.key)}
                        className={`slds-pos-relative slds-flex slds-flex-col slds-items-center slds-justify-center slds-border-radius_large slds-transition-all slds-text-center slds-p-horizontal_medium ${
                          selected
                            ? 'slds-border-color_brand slds-bg-white slds-shadow_small'
                            : 'slds-bg-white'
                        }`}
                        style={{ height: '160px', borderWidth: '2px', borderStyle: 'solid', borderColor: selected ? undefined : '#D8DDE6' }}
                      >
                        {selected && (
                          <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '28px', height: '28px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                            <Check className="slds-icon-size_xx-small slds-text-white slds-pos-absolute" style={{ top: '2px', right: '2px' }} />
                          </div>
                        )}
                        <div className={`slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-m-bottom_small ${selected ? '' : 'slds-bg-neutral-2'}`} style={{ width: '40px', height: '40px', backgroundColor: selected ? '#EEF4FF' : undefined }}>
                          <opt.icon className={`slds-icon-size_default ${selected ? 'slds-text-brand' : 'slds-text-neutral-7'}`} />
                        </div>
                        <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{opt.label}</span>
                        <span className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {newRulesetStep === 2 && newRulesetOption === 'create' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>
                      <span className="slds-text-error">*</span> Ruleset Name
                    </label>
                    <input
                      type="text"
                      value={newRulesetName}
                      onChange={(e) => setNewRulesetName(e.target.value)}
                      placeholder="e.g., Individual (Main)"
                      className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>
                      <span className="slds-text-error">*</span> Primary Data Model Object
                    </label>
                    <select
                      value={newRulesetPrimaryDMO}
                      onChange={(e) => setNewRulesetPrimaryDMO(e.target.value)}
                      className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ outline: 'none' }}
                    >
                      {dataModelObjects.map((dmo) => (
                        <option key={dmo} value={dmo}>{dmo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>Data Space</label>
                    <select
                      value={newRulesetDataSpace}
                      onChange={(e) => setNewRulesetDataSpace(e.target.value)}
                      className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ outline: 'none' }}
                    >
                      <option value="default">default</option>
                    </select>
                  </div>
                </div>
              )}

              {newRulesetStep === 2 && newRulesetOption === 'datakit' && (
                <div className="slds-flex" style={{ gap: 0, margin: '-24px', height: '420px' }}>
                  {/* Left sidebar: datakit categories */}
                  <div className="slds-flex-shrink-0 slds-overflow-y-auto" style={{ width: '220px', borderRight: '1px solid var(--slds-g-color-border-1)', backgroundColor: '#FAFAF9' }}>
                    <div className="slds-p-around_small">
                      <input
                        type="text"
                        value={datakitSearch}
                        onChange={(e) => setDatakitSearch(e.target.value)}
                        placeholder="Search datakits..."
                        className="slds-w-full slds-p-horizontal_x-small slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
                      />
                    </div>
                    <nav className="slds-p-horizontal_xx-small slds-p-bottom_small">
                      {datakitCategories
                        .filter((cat) => cat.toLowerCase().includes(datakitSearch.toLowerCase()))
                        .map((cat) => {
                          const isInformatica = cat === 'Informatica MDM';
                          const isActive = selectedDatakit === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => triggerDelay(() => { setSelectedDatakit(cat); setSelectedDatakitRuleset(null); })}
                              className={`slds-w-full slds-text-left slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border-radius_medium slds-m-bottom_xx-small slds-transition-colors ${
                                isActive && isInformatica
                                  ? 'slds-font-weight_semibold'
                                  : isActive
                                    ? 'slds-text-brand slds-font-weight_semibold'
                                    : isInformatica
                                      ? 'slds-font-weight_medium'
                                      : 'slds-text-neutral-9'
                              }`}
                              style={{
                                backgroundColor: isActive && isInformatica ? '#FFF3ED' : isActive ? '#EEF4FF' : undefined,
                                color: isInformatica ? '#FF4A00' : undefined,
                              }}
                            >
                              {cat}
                              {isInformatica && !isActive && (
                                <span className="slds-m-left_xx-small slds-inline-flex slds-items-center slds-p-horizontal_xx-small slds-border-radius_small slds-font-weight_bold slds-text-white" style={{ fontSize: '10px', paddingTop: '2px', paddingBottom: '2px', backgroundColor: '#FF4A00' }}>NEW</span>
                              )}
                            </button>
                          );
                        })}
                    </nav>
                  </div>

                  {/* Right side: rulesets table */}
                  <div className="slds-flex-1 slds-overflow-y-auto">
                    <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_border-1">
                      <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Datakit Selection</h3>
                      <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">{selectedDatakit} — select a ruleset to install</p>
                      {/* Session context: show remembered connections + bundles */}
                      {demoSession && demoSession.informaticaConnections.length > 0 && selectedDatakit === 'Informatica MDM' && (
                        <div className="slds-m-top_x-small slds-p-horizontal_small slds-p-vertical_x-small slds-border-radius_medium slds-border_all" style={{ backgroundColor: '#FFF3ED', borderColor: '#FFD6C0' }}>
                          <p className="slds-font-weight_medium" style={{ fontSize: '11px', color: '#B33500' }}>
                            Connected: {demoSession.informaticaConnections.map((c) => c.alias).join(', ')}
                          </p>
                          {demoSession.selectedBundles.length > 0 && (
                            <p className="slds-m-top_xx-small" style={{ fontSize: '11px', color: '#B33500' }}>
                              Installed Bundles: {demoSession.selectedBundles.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {(datakitRulesets[selectedDatakit] || []).length === 0 ? (
                      <div className="slds-flex slds-items-center slds-justify-center slds-text-size_medium slds-text-neutral-7" style={{ height: '192px' }}>
                        No rulesets available for {selectedDatakit}.
                      </div>
                    ) : (
                      <table className="sf-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}></th>
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
                              className={`${isPhase2 ? 'slds-opacity_50 slds-cursor-not-allowed' : 'slds-cursor-pointer'}`}
                              style={{ backgroundColor: selectedDatakitRuleset === rs.id && !isPhase2 ? '#EEF4FF' : undefined }}
                              onClick={() => { if (!isPhase2) setSelectedDatakitRuleset(rs.id); }}
                            >
                              <td>
                                <input
                                  type="radio"
                                  name="datakit-ruleset"
                                  checked={selectedDatakitRuleset === rs.id}
                                  onChange={() => { if (!isPhase2) setSelectedDatakitRuleset(rs.id); }}
                                  disabled={isPhase2}
                                  className="slds-icon-size_small" style={{ accentColor: 'var(--slds-g-color-brand)' }}
                                />
                              </td>
                              <td>
                                <div className="slds-flex slds-items-center slds-gap_x-small">
                                  <span className={`slds-text-size_medium slds-font-weight_medium ${isPhase2 ? 'slds-text-neutral-7' : 'slds-text-neutral-base'}`}>{rs.name}</span>
                                  {isPhase2 && (
                                    <span className="sf-badge sf-badge-neutral" style={{ opacity: 0.6 }}>Phase-2</span>
                                  )}
                                </div>
                              </td>
                              <td className="slds-text-size_medium slds-text-neutral-7">
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="slds-flex slds-items-start slds-gap_small slds-p-around_medium slds-border-radius_large" style={{ backgroundColor: '#E1F5FE' }}>
                    <Info className="slds-icon-size_default slds-text-brand slds-flex-shrink-0 slds-m-top_xx-small" />
                    <div className="slds-text-size_medium slds-text-neutral-9">
                      {newRulesetOption === 'datakit'
                        ? <>Your ruleset will be created with defaults from <strong>{selectedDatakit}</strong>. Review and click <strong>Save</strong>.</>
                        : <>Review the details below and click <strong>Save</strong> to create your new ruleset.</>
                      }
                    </div>
                  </div>
                  <div className="sf-card">
                    <div className="sf-detail-grid">
                      <div className="sf-detail-field"><div className="sf-detail-label">Ruleset Name</div><div className="sf-detail-value slds-font-weight_medium">{newRulesetName}</div></div>
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
            <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_top slds-border-color_border-1" style={{ backgroundColor: '#FAFAF9' }}>
              <div className="slds-flex slds-items-center slds-gap_x-small">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="slds-flex slds-items-center slds-gap_xx-small">
                    <div className={`slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-text-size_small slds-font-weight_medium ${
                      s < newRulesetStep ? 'slds-bg-success slds-text-white' :
                      s === newRulesetStep ? 'slds-bg-brand slds-text-white' :
                      'slds-text-neutral-7'
                    }`} style={{ width: '24px', height: '24px', backgroundColor: s > newRulesetStep ? 'var(--slds-g-color-border-2)' : undefined }}>
                      {s < newRulesetStep ? <Check className="slds-icon-size_xx-small" /> : s}
                    </div>
                    {s < 3 && <div style={{ width: '24px', height: '2px', backgroundColor: s < newRulesetStep ? 'var(--slds-g-color-success)' : 'var(--slds-g-color-border-2)' }} />}
                  </div>
                ))}
              </div>
              <div className="slds-flex slds-items-center slds-gap_small">
                {newRulesetStep === 1 ? (
                  <>
                    <button onClick={() => setNewRulesetOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Cancel</button>
                    <button
                      onClick={handleNewRulesetNext}
                      disabled={!newRulesetOption}
                      className="slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ paddingLeft: '20px', paddingRight: '20px', opacity: !newRulesetOption ? 0.5 : 1, cursor: !newRulesetOption ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </>
                ) : newRulesetStep === 2 ? (
                  <>
                    <button onClick={handleNewRulesetBack} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Back</button>
                    <button
                      onClick={handleNewRulesetNext}
                      disabled={newRulesetOption === 'create' ? !newRulesetName.trim() : !selectedDatakitRuleset}
                      className="slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ paddingLeft: '20px', paddingRight: '20px', opacity: (newRulesetOption === 'create' ? !newRulesetName.trim() : !selectedDatakitRuleset) ? 0.5 : 1, cursor: (newRulesetOption === 'create' ? !newRulesetName.trim() : !selectedDatakitRuleset) ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleNewRulesetBack} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small slds-hover-bg-neutral-2">Back</button>
                    <button
                      onClick={handleNewRulesetSave}
                      className="slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ paddingLeft: '20px', paddingRight: '20px' }}
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
