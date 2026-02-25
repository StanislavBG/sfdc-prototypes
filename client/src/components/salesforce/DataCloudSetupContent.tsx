import { useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Settings,
  ExternalLink,
  X,
  CheckCircle2,
  Check,
  Info,
  Zap,
  Plus,
  ArrowLeft,
  Play,
  FileText,
  BookOpen,
  LayoutGrid,
  Cloud,
  Cog,
  ArrowRight,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
interface Connection {
  id: string;
  connectionName: string;
  alias: string;
  connectionStatus: 'Active' | 'Inactive' | 'Pending';
  lastUpdated: string;
  orgId: string;
}

interface DataBundle {
  name: string;
  installedVersion: string;
  latestVersion: string;
}

interface SetupPage {
  id: string;
  label: string;
  section: string;
  hasChildren?: boolean;
  children?: { id: string; label: string }[];
}

// ── Setup Nav Structure ──────────────────────────────────────────────
const setupNavSections: { title: string; items: SetupPage[] }[] = [
  {
    title: '',
    items: [{ id: 'setup-home', label: 'Data Cloud Setup Home', section: '' }],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { id: 'permission-sets', label: 'Permission Sets', section: '' },
      { id: 'users', label: 'Users', section: '' },
    ],
  },
  {
    title: 'FEATURE MANAGEMENT',
    items: [
      { id: 'solution-manager', label: 'Solution Manager', section: '' },
      { id: 'data-spaces', label: 'Data Spaces', section: '' },
      { id: 'notebook-ai', label: 'Notebook AI', section: '' },
      {
        id: 'feature-manager', label: 'Feature Manager', section: '',
        hasChildren: true,
        children: [
          { id: 'admin-tools', label: 'Admin Tools' },
          { id: 'developer-tools', label: 'Developer Tools' },
          { id: 'clean-rooms', label: 'Clean Rooms' },
        ],
      },
    ],
  },
  {
    title: 'SALESFORCE INTEGRATIONS',
    items: [
      { id: 'data-cloud-one', label: 'Data Cloud One', section: '' },
      { id: 'salesforce-crm', label: 'Salesforce CRM', section: '' },
      { id: 'informatica-mdm-sf', label: 'Informatica MDM', section: '' },
      { id: 'hierarchy-ingestion', label: 'Hierarchy Ingestion', section: '' },
      { id: 'data-360-org-allowlist', label: 'Data 360 Org Allowlist', section: '' },
      {
        id: 'marketing', label: 'Marketing', section: '',
        hasChildren: true,
        children: [],
      },
      {
        id: 'commerce-cloud', label: 'Commerce Cloud', section: '',
        hasChildren: true,
        children: [],
      },
    ],
  },
  {
    title: 'EXTERNAL INTEGRATIONS',
    items: [
      { id: 'external-activation-platforms', label: 'External Activation Platforms', section: '' },
      { id: 'snowflake', label: 'Snowflake', section: '' },
      { id: 'informatica-mdm', label: 'Informatica MDM', section: '' },
      { id: 'websites-mobile-apps', label: 'Websites & Mobile Apps', section: '' },
      { id: 'ingestion-api', label: 'Ingestion API', section: '' },
      { id: 'other-connectors', label: 'Other Connectors', section: '' },
    ],
  },
];

// ── Initial Mock Data ─────────────────────────────────────────────────
const initialSfdcConnections: Connection[] = [
  { id: 'conn-1', connectionName: 'Data Cloud SG', alias: 'Home', connectionStatus: 'Active', lastUpdated: 'Apr 30, 2025, 11:17 AM', orgId: '00Dfo000001QldR' },
];

const sfdcBundles: DataBundle[] = [
  { name: 'Sales Cloud', installedVersion: '--', latestVersion: '1.4' },
  { name: 'Salesforce CDP CRM Loyalty', installedVersion: '--', latestVersion: '1.8' },
  { name: 'Service Cloud', installedVersion: '--', latestVersion: '7.0' },
];

const initialInformaticaConnections: Connection[] = [];

const informaticaBundles: DataBundle[] = [
  { name: 'Informatica MDM Cloud', installedVersion: '--', latestVersion: '2.1' },
  { name: 'Informatica Data Quality', installedVersion: '--', latestVersion: '3.4' },
];

// ── Informatica Logo SVG ─────────────────────────────────────────────
function InformaticaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 50" className={className} fill="none">
      <rect width="200" height="50" rx="4" fill="#FF4A00" />
      <text x="100" y="33" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold">
        informatica
      </text>
    </svg>
  );
}

// ── Salesforce Cloud Logo ────────────────────────────────────────────
function SalesforceCloudLogo({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 140 100" width={size} height={size * 0.71}>
      <defs>
        <linearGradient id="sfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#69B4F0" />
          <stop offset="100%" stopColor="#4A9DE0" />
        </linearGradient>
      </defs>
      <path d="M58 12c5.5-5.7 13-9.2 21.5-9.2 11.3 0 21.2 6.4 26.1 15.7 4.1-1.7 8.6-2.6 13.3-2.6 18 0 32.5 14.5 32.5 32.5S137 80.9 119 80.9c-2.3 0-4.6-.2-6.9-.6-4.4 6.7-11.8 11-20.3 11-4.4 0-8.4-1.2-11.9-3.2-4.4 7.8-12.6 13.1-22.2 13.1-9 0-16.9-4.7-21.3-11.6-2.6.6-5.2 1.1-7.9 1.1C11.6 91.7.3 78 .3 61c0-11.1 5.9-20.8 14.7-26.2C13.5 31.3 12.7 27.6 12.7 23.5 12.7 10.8 23.5 0 36.2 0 45.3 0 53.4 5.2 58 12z"
        fill="url(#sfGrad)" />
      <text x="70" y="58" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="18" fontStyle="italic" fontWeight="bold">
        salesforce
      </text>
    </svg>
  );
}

// ── Connect an Org Wizard Steps ──────────────────────────────────────
type WizardStep = 'select-type' | 'alias' | 'login' | 'permissions';

interface DataCloudSetupContentProps {
  onBack?: () => void;
}

// ── Component ────────────────────────────────────────────────────────
export default function DataCloudSetupContent({ onBack }: DataCloudSetupContentProps) {
  const [activeNavItem, setActiveNavItem] = useState('salesforce-crm');
  const [quickFindQuery, setQuickFindQuery] = useState('');
  const [expandedNavItems, setExpandedNavItems] = useState<Set<string>>(new Set(['feature-manager']));

  // Persisted connections state
  const [sfdcConnections, setSfdcConnections] = useState<Connection[]>(initialSfdcConnections);
  const [informaticaConnections, setInformaticaConnections] = useState<Connection[]>(initialInformaticaConnections);

  // Connect Org wizard
  const [connectOrgOpen, setConnectOrgOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('select-type');
  const [selectedOrgType, setSelectedOrgType] = useState<'salesforce' | 'sandbox' | null>(null);
  const [connectionAlias, setConnectionAlias] = useState('INFA_MDM_01');
  const [loginUsername, setLoginUsername] = useState('entity_resolution_demo@datacloud.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Solution Manager state
  const [smActiveSolution, setSmActiveSolution] = useState<string | null>(null);
  const [smActiveStep, setSmActiveStep] = useState(0);
  const [smStepProgress, setSmStepProgress] = useState<Record<string, Record<number, 'not-started' | 'in-progress' | 'completed'>>>({
    'Phase-1': {}, 'Phase-2-A': {}, 'Phase-2-B': {}, 'CH': {},
  });

  const isInformatica = activeNavItem === 'informatica-mdm' || activeNavItem === 'informatica-mdm-sf';

  const toggleNavExpand = (id: string) => {
    setExpandedNavItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenConnectOrg = () => {
    setWizardStep('select-type');
    setSelectedOrgType(null);
    setConnectionAlias(isInformatica ? 'INFA_MDM_01' : '');
    setLoginUsername(isInformatica ? 'admin@informatica-mdm.com' : 'entity_resolution_demo@datacloud.com');
    setLoginPassword('');
    setConnectOrgOpen(true);
  };

  const handleWizardNext = () => {
    if (wizardStep === 'select-type' && selectedOrgType) {
      setWizardStep('alias');
    } else if (wizardStep === 'alias' && connectionAlias.trim()) {
      setWizardStep('login');
    } else if (wizardStep === 'login') {
      setWizardStep('permissions');
    }
  };

  const handleWizardBack = () => {
    if (wizardStep === 'alias') setWizardStep('select-type');
    else if (wizardStep === 'login') setWizardStep('alias');
    else if (wizardStep === 'permissions') setWizardStep('login');
  };

  const handleAllowAccess = () => {
    // Create a new connection from wizard data
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      connectionName: isInformatica
        ? `Informatica MDM ${selectedOrgType === 'sandbox' ? 'Sandbox' : 'Org'}`
        : `Salesforce ${selectedOrgType === 'sandbox' ? 'Sandbox' : 'Org'}`,
      alias: connectionAlias || (isInformatica ? 'INFA_MDM_01' : 'NewOrg'),
      connectionStatus: 'Active',
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      orgId: isInformatica
        ? `INFA${Math.random().toString(36).substring(2, 12).toUpperCase()}`
        : `00D${Math.random().toString(36).substring(2, 15)}`,
    };

    if (isInformatica) {
      setInformaticaConnections((prev) => [...prev, newConnection]);
    } else {
      setSfdcConnections((prev) => [...prev, newConnection]);
    }
    setConnectOrgOpen(false);
  };

  // Filter nav items
  const filteredSections = quickFindQuery.trim()
    ? setupNavSections.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.label.toLowerCase().includes(quickFindQuery.toLowerCase()) ||
          item.children?.some((c) => c.label.toLowerCase().includes(quickFindQuery.toLowerCase()))
        ),
      })).filter((s) => s.items.length > 0)
    : setupNavSections;

  // ── Solution Manager data ────────────────────────────────────────────
  const smTiles = [
    { id: 'Phase-1', badge: 'Phase 1', title: 'Integrate Business Entities from Informatica', description: 'Realize the full potential of the curated and enriched business entities from Informatica directly in D360. In this step by step guide, we will work through the steps required to operationalize business entities created in Informatica in D360.' },
    { id: 'Phase-2-A', badge: 'Phase 2', title: 'Integrate Business Entities from Informatica', description: 'Configure your Informatica connection and data integration settings. Interactive step-by-step guide with forms, entity selection, identity resolution, mappings, sync, and experience setup.' },
  ];

  interface SmStep { title: string; headline: string; system?: 'D360' | 'Informatica'; description: string; actionLabel: string }
  const smSolutions: Record<string, { title: string; headline: string; steps: SmStep[] }> = {
    'Phase-1': {
      title: 'Integrate Business Entities [Phase 1]',
      headline: 'Follow the steps below to configure your Informatica integration with Data 360',
      steps: [
        { title: 'Create Ingestion End-Point', headline: 'API Configuration', system: 'D360', description: 'Setup Ingestion-API end-point via D360-Setup.', actionLabel: 'Configure End-Point' },
        { title: 'Create Schema', headline: 'Schema Registration', system: 'Informatica', description: 'Register business entities with predefined schema.', actionLabel: 'Define Schema' },
        { title: 'Business Entity to Lake', headline: 'Extensibility Packages', system: 'Informatica', description: 'Install Informatica Extensibility Packages.', actionLabel: 'Install Packages' },
        { title: 'Publish Data: Day 0 & 1', headline: 'Initial Load & Change Data Capture', system: 'Informatica', description: 'Day 0: Initial data load from Informatica to D360. Day 1: Enable CDC (Change Data Capture) feed for ongoing synchronization.', actionLabel: 'Configure Data Publishing' },
        { title: 'BYO-MDM Definition', headline: 'Create BYO-MDM Ruleset from MDM-DataKit', system: 'D360', description: 'Define BYO-MDM ruleset configuration using MDM-DataKit.', actionLabel: 'Configure Ruleset' },
        { title: 'Business Entity Mappings', headline: 'Create Business Entity to Unified DMO Mappings from DataKit', system: 'D360', description: 'Configure mappings between business entities and unified DMO using DataKit.', actionLabel: 'Configure Mappings' },
      ],
    },
    'Phase-2-A': {
      title: 'Integrate Business Entities [Phase 2]',
      headline: 'Configure your Informatica connection and data integration settings',
      steps: [
        { title: 'Connect to Informatica System', headline: 'Establish connection with credentials', description: 'Configure Connection Name, Tenant URL, Username, and Password. Ensure API access is enabled.', actionLabel: 'Configure Connection' },
        { title: 'Choose Business Entity', headline: 'Select entities to integrate', description: 'Select from available Tenants (USA-1, Europe-1) and Entities (Customer, Product, Supplier).', actionLabel: 'Select Entities' },
        { title: 'Choose Identity Resolution', headline: 'Select resolution method', description: 'Choose between Direct Mapping (clean data) or Golden Key-Ring (complex multi-source data).', actionLabel: 'Configure Resolution' },
        { title: 'Review Mappings', headline: 'Validate data object mappings', description: 'Review and validate mappings for Customer_Base, Customer_Address, Product_Master, and other data objects.', actionLabel: 'Review Mappings' },
        { title: 'Validate Connected Data', headline: 'Preview integrated data', description: 'Preview Customer Data, Product Data, and Supplier Data to verify integration.', actionLabel: 'Validate Data' },
        { title: 'Set up Identity Rules', headline: 'Configure match rules', description: 'Configure Fuzzy Name Match, Email Exact Match, Phone Number Match, and Address Similarity rules.', actionLabel: 'Configure Rules' },
        { title: 'Enable Sync', headline: 'Configure synchronization', description: 'Enable automatic synchronization between Informatica and Data 360. Configure sync frequency and conflict resolution.', actionLabel: 'Enable Sync' },
        { title: 'Setup Experiences', headline: 'Configure user experiences', description: 'Setup Search Before Create, Copy Field Values, and Add Related List experiences.', actionLabel: 'Setup Experiences' },
      ],
    },
  };

  const smHandleStepClick = (stepIdx: number) => {
    if (!smActiveSolution) return;
    setSmActiveStep(stepIdx);
    setSmStepProgress((prev) => {
      const sol = prev[smActiveSolution] || {};
      if (sol[stepIdx] === 'completed') return prev;
      return { ...prev, [smActiveSolution]: { ...sol, [stepIdx]: 'in-progress' } };
    });
  };

  const smHandleCompleteStep = () => {
    if (!smActiveSolution) return;
    const sol = smSolutions[smActiveSolution];
    if (!sol) return;
    setSmStepProgress((prev) => {
      const updated = { ...prev, [smActiveSolution]: { ...prev[smActiveSolution], [smActiveStep]: 'completed' as const } };
      return updated;
    });
    if (smActiveStep < sol.steps.length - 1) {
      const nextStep = smActiveStep + 1;
      setSmActiveStep(nextStep);
      setSmStepProgress((prev) => ({
        ...prev,
        [smActiveSolution]: { ...prev[smActiveSolution], [smActiveStep]: 'completed' as const, [nextStep]: 'in-progress' as const },
      }));
    }
  };

  const smGetProgress = (solutionId: string) => {
    const sol = smSolutions[solutionId];
    if (!sol) return 0;
    const prog = smStepProgress[solutionId] || {};
    const completed = Object.values(prog).filter((s) => s === 'completed').length;
    return Math.round((completed / sol.steps.length) * 100);
  };

  const currentPageLabel = activeNavItem === 'salesforce-crm' ? 'Salesforce CRM' : (activeNavItem === 'informatica-mdm' || activeNavItem === 'informatica-mdm-sf') ? 'Informatica MDM' : activeNavItem === 'solution-manager' ? 'Solution Manager' : setupNavSections.flatMap((s) => s.items).find((i) => i.id === activeNavItem)?.label || 'Setup';
  const currentConnections = isInformatica ? informaticaConnections : sfdcConnections;
  const currentBundles = isInformatica ? informaticaBundles : sfdcBundles;
  const connectorName = isInformatica ? 'Informatica MDM' : 'Salesforce CRM';

  return (
    <div className="h-full flex flex-col">
      {/* Setup Header Bar */}
      <div className="bg-white border-b border-[var(--sf-border)] px-4 py-2 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Data 360
        </button>
        <div className="w-px h-4 bg-[var(--sf-border)]" />
        <span className="text-sm font-semibold text-[var(--sf-text-primary)]">Data Cloud Setup</span>
        <div className="flex-1" />
        <span className="text-xs text-[var(--sf-text-tertiary)]">Home</span>
        <span className="text-xs text-[var(--sf-text-tertiary)]">Object Manager</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Nav ── */}
        <nav className="w-[220px] min-w-[220px] bg-white border-r border-[var(--sf-border)] flex flex-col h-full overflow-y-auto">
          {/* Quick Find */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
              <input
                type="text"
                placeholder="Quick Find"
                value={quickFindQuery}
                onChange={(e) => setQuickFindQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-1 focus:ring-[rgba(27,150,255,0.2)]"
              />
            </div>
          </div>

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto pb-4">
            {filteredSections.map((section, si) => (
              <div key={si}>
                {section.title && (
                  <div className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--sf-text-tertiary)]">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (item.hasChildren) toggleNavExpand(item.id);
                        else setActiveNavItem(item.id);
                      }}
                      className={`w-full flex items-center gap-1.5 px-4 py-1.5 text-xs text-left transition-colors ${
                        activeNavItem === item.id
                          ? (item.id === 'informatica-mdm-sf' || item.id === 'informatica-mdm'
                              ? 'bg-[#FFF3ED] text-[#FF4A00] font-semibold'
                              : item.id === 'solution-manager'
                                ? 'bg-[#EEF4FF] text-[#0070D2] font-bold'
                                : 'bg-[#EEF4FF] text-[var(--sf-blue)] font-semibold')
                          : (item.id === 'informatica-mdm-sf'
                              ? 'text-[#FF4A00] font-medium hover:bg-[#FFF3ED]'
                              : item.id === 'solution-manager'
                                ? 'text-[#0070D2] font-semibold hover:bg-[#EEF4FF]'
                                : 'text-[var(--sf-text-secondary)] hover:bg-[#F3F3F3]')
                      }`}
                    >
                      {item.hasChildren && (
                        expandedNavItems.has(item.id)
                          ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                          : <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className={activeNavItem === item.id ? (item.id === 'informatica-mdm-sf' || item.id === 'informatica-mdm' ? 'text-[#FF4A00]' : item.id === 'solution-manager' ? 'text-[#0070D2]' : 'sf-link') : item.id === 'solution-manager' ? 'text-[#0070D2]' : ''}>{item.label}</span>
                      {item.id === 'informatica-mdm-sf' && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#FF4A00] text-white rounded">New</span>
                      )}
                    </button>
                    {item.hasChildren && expandedNavItems.has(item.id) && item.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setActiveNavItem(child.id)}
                        className={`w-full flex items-center pl-10 pr-4 py-1.5 text-xs text-left transition-colors ${
                          activeNavItem === child.id ? 'bg-[#EEF4FF] text-[var(--sf-blue)] font-semibold' : 'text-[var(--sf-text-secondary)] hover:bg-[#F3F3F3]'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">
          {activeNavItem === 'solution-manager' ? (
            /* ═══════════════════════════════════════════════════════════
               SOLUTION MANAGER CONTENT
               ═══════════════════════════════════════════════════════════ */
            smActiveSolution && smSolutions[smActiveSolution] ? (
              /* ── Phase Detail Page ── */
              (() => {
                const sol = smSolutions[smActiveSolution];
                const progress = smGetProgress(smActiveSolution);
                const prog = smStepProgress[smActiveSolution] || {};
                return (
                  <div className="h-full flex flex-col">
                    {/* Breadcrumb */}
                    <div className="bg-white border-b border-[var(--sf-border)] px-6 py-2.5 flex items-center gap-2">
                      <button onClick={() => setSmActiveSolution(null)} className="text-xs text-[var(--sf-link)] hover:underline">Solution Manager</button>
                      <ChevronRight className="w-3 h-3 text-[var(--sf-text-tertiary)]" />
                      <span className="text-xs font-medium text-[var(--sf-text-primary)]">{sol.title}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-white border-b border-[var(--sf-border)] px-6 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[var(--sf-text-secondary)]">Overall Progress</span>
                        <span className="text-xs font-bold text-[#0070D2]">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#DDDBDA] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0070D2, #00A1E0)' }}
                        />
                      </div>
                    </div>

                    {/* Content: sidebar + steps */}
                    <div className="flex flex-1 overflow-hidden">
                      {/* Step sidebar */}
                      <div className="w-[200px] min-w-[200px] bg-white border-r border-[var(--sf-border)] overflow-y-auto">
                        <div className="px-4 py-3 border-b border-[var(--sf-border)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sf-text-tertiary)]">Steps</span>
                        </div>
                        <nav className="py-2">
                          {sol.steps.map((step, idx) => {
                            const status = prog[idx] || 'not-started';
                            const isActive = smActiveStep === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => smHandleStepClick(idx)}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                                  isActive ? 'bg-[#EEF4FF]' : 'hover:bg-[#F3F3F3]'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                                  status === 'completed' ? 'bg-[#2E844A] text-white' :
                                  status === 'in-progress' ? 'bg-[#0070D2] text-white' :
                                  'border-2 border-[#DDDBDA] text-[var(--sf-text-tertiary)]'
                                }`}>
                                  {status === 'completed' ? <Check className="w-3 h-3" /> : idx + 1}
                                </div>
                                <span className={`text-xs leading-tight ${
                                  status === 'completed' ? 'text-[#2E844A] font-medium' :
                                  status === 'in-progress' ? 'text-[#0070D2] font-semibold' :
                                  'text-[var(--sf-text-secondary)]'
                                }`}>
                                  {step.title}
                                </span>
                              </button>
                            );
                          })}
                        </nav>
                        {/* Tutorial video placeholder */}
                        <div className="mx-4 mb-4 mt-2 rounded-lg border border-[var(--sf-border)] bg-[#F3F3F3] p-4 text-center">
                          <Play className="w-8 h-8 mx-auto text-[var(--sf-text-tertiary)] mb-2" />
                          <span className="text-xs text-[var(--sf-text-tertiary)]">Tutorial Video</span>
                        </div>
                      </div>

                      {/* Step content */}
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-3xl">
                          {/* Solution header */}
                          <div className="mb-6">
                            <h2 className="text-xl font-light text-[var(--sf-text-primary)] mb-1">Integrate Business Entities from Informatica</h2>
                            <p className="text-sm text-[var(--sf-text-tertiary)]">{sol.headline}</p>
                          </div>

                          {/* Active step card */}
                          {(() => {
                            const step = sol.steps[smActiveStep];
                            if (!step) return null;
                            const status = prog[smActiveStep] || 'not-started';
                            return (
                              <div className={`sf-card mb-4 ${status === 'completed' ? 'ring-2 ring-[#2E844A]/30' : ''}`}>
                                <div className="sf-card-header">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      status === 'completed' ? 'bg-[#2E844A] text-white' :
                                      'bg-[#0070D2] text-white'
                                    }`}>
                                      {status === 'completed' ? <Check className="w-4 h-4" /> : smActiveStep + 1}
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">{step.title}</h3>
                                      <p className="text-xs text-[var(--sf-text-tertiary)]">{step.headline}</p>
                                    </div>
                                    {step.system && (
                                      <span className={`ml-auto px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                                        step.system === 'D360'
                                          ? 'bg-[#EEF4FF] text-[#0070D2]'
                                          : 'bg-[#FFF3ED] text-[#D95800]'
                                      }`}>
                                        {step.system === 'D360' ? '☁ ' : '⚙ '}{step.system}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="sf-card-body">
                                  <p className="text-sm text-[var(--sf-text-secondary)] mb-5 leading-relaxed">{step.description}</p>
                                  {status !== 'completed' && (
                                    <button
                                      onClick={smHandleCompleteStep}
                                      className="px-4 py-2 text-sm font-medium text-white bg-[#0070D2] rounded hover:bg-[#005FB2] transition-colors"
                                    >
                                      {step.actionLabel}
                                    </button>
                                  )}
                                  {status === 'completed' && (
                                    <div className="flex items-center gap-2 text-sm text-[#2E844A] font-medium">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Step completed
                                    </div>
                                  )}
                                </div>
                                {/* Step footer */}
                                <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--sf-border)] bg-[#FAFAF9]">
                                  <div className="flex items-center gap-3">
                                    <button className="text-xs text-[var(--sf-link)] hover:underline flex items-center gap-1">
                                      <FileText className="w-3 h-3" /> Documentation
                                    </button>
                                    <button className="text-xs text-[var(--sf-link)] hover:underline flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" /> Tutorial
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {smActiveStep > 0 && (
                                      <button
                                        onClick={() => smHandleStepClick(smActiveStep - 1)}
                                        className="px-3 py-1.5 text-xs font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]"
                                      >
                                        Previous
                                      </button>
                                    )}
                                    {smActiveStep < sol.steps.length - 1 ? (
                                      <button
                                        onClick={() => { smHandleCompleteStep(); }}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#0070D2] rounded hover:bg-[#005FB2]"
                                      >
                                        Next Step
                                      </button>
                                    ) : (
                                      <button
                                        onClick={smHandleCompleteStep}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#2E844A] rounded hover:bg-[#256B3B]"
                                      >
                                        Complete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* ── Solution Manager Tiles ── */
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-light text-[var(--sf-text-primary)] mb-1">Solution Manager</h1>
                  <p className="text-sm text-[var(--sf-text-tertiary)]">Explore and implement data management solutions</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {smTiles.map((tile) => {
                    const progress = smGetProgress(tile.id);
                    return (
                      <button
                        key={tile.id}
                        onClick={() => { setSmActiveSolution(tile.id); setSmActiveStep(0); }}
                        className="text-left bg-white border border-[var(--sf-border)] rounded-lg p-6 hover:shadow-lg hover:border-[#0070D2] hover:-translate-y-0.5 transition-all group"
                      >
                        <span className="inline-block px-2 py-1 text-[11px] font-bold text-[#0070D2] bg-[#EEF4FF] rounded mb-3">
                          {tile.badge}
                        </span>
                        <h3 className="text-base font-semibold text-[#0070D2] mb-2 leading-snug group-hover:underline">{tile.title}</h3>
                        <p className="text-sm text-[var(--sf-text-secondary)] leading-relaxed mb-3">{tile.description}</p>
                        {smSolutions[tile.id] && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#DDDBDA] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0070D2, #00A1E0)' }} />
                            </div>
                            <span className="text-[10px] font-bold text-[#0070D2]">{progress}%</span>
                          </div>
                        )}
                        {tile.id === 'CH' && (
                          <div className="mt-2 text-xs text-[var(--sf-text-tertiary)] italic">Work in progress</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (activeNavItem === 'salesforce-crm' || activeNavItem === 'informatica-mdm' || activeNavItem === 'informatica-mdm-sf') ? (
            <div className="p-6">
              {/* Page header */}
              <div className={`sf-card mb-6 relative ${isInformatica ? 'ring-2 ring-[#FF4A00]/50 border-[#FF4A00]/40' : ''}`}>
                {isInformatica && (
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-[#FF4A00] text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg rounded-tr-[7px]">
                    New to Salesforce
                  </div>
                )}
                <div className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isInformatica ? 'bg-[#FF4A00]' : 'bg-[#706E6B]'}`}>
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-[var(--sf-blue)] uppercase tracking-wide">SETUP</div>
                    <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">{connectorName}</h1>
                  </div>
                  <button
                    onClick={handleOpenConnectOrg}
                    className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
                      isInformatica ? 'bg-[#FF4A00] hover:bg-[#E54300]' : 'bg-[var(--sf-blue)] hover:bg-[var(--sf-blue-hover)]'
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>

              {/* Standard Connections */}
              <div className={`sf-card mb-6 ${isInformatica ? 'ring-2 ring-[#FF4A00]/50 border-[#FF4A00]/40' : ''}`}>
                <div className="sf-card-header">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Standard Connections</h2>
                    <Info className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
                  </div>
                </div>
                {currentConnections.length === 0 ? (
                  <div className="sf-card-body text-center py-12">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isInformatica ? 'bg-[#FFF3ED]' : 'bg-[#F3F3F3]'}`}>
                      <Zap className={`w-7 h-7 ${isInformatica ? 'text-[#FF4A00]' : 'text-[var(--sf-text-tertiary)]'}`} />
                    </div>
                    <p className="text-sm font-medium text-[var(--sf-text-primary)] mb-1">No connections configured</p>
                    <p className="text-xs text-[var(--sf-text-tertiary)] mb-4">
                      {isInformatica
                        ? 'Connect your Informatica MDM instance to start syncing master data with Data Cloud.'
                        : 'Click "New" to connect a Salesforce org.'}
                    </p>
                    <button
                      onClick={handleOpenConnectOrg}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
                        isInformatica ? 'bg-[#FF4A00] hover:bg-[#E54300]' : 'bg-[var(--sf-blue)] hover:bg-[var(--sf-blue-hover)]'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> Connect {isInformatica ? 'Informatica MDM' : 'an Org'}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th className="w-10"></th>
                          <th><div className="flex items-center gap-1">Connection Name <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                          <th><div className="flex items-center gap-1">Alias <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                          <th><div className="flex items-center gap-1">Connection Status <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                          <th><div className="flex items-center gap-1">Last Updated <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                          <th><div className="flex items-center gap-1">Org Id <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentConnections.map((conn, i) => (
                          <tr key={conn.id}>
                            <td className="text-center text-[var(--sf-text-tertiary)]">{i + 1}</td>
                            <td className="sf-link font-medium">{conn.connectionName}</td>
                            <td>{conn.alias}</td>
                            <td>{conn.connectionStatus}</td>
                            <td>{conn.lastUpdated}</td>
                            <td className="font-mono text-xs">{conn.orgId}</td>
                            <td>
                              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Standard Data Bundles */}
              <div className={`sf-card ${isInformatica ? 'ring-2 ring-[#FF4A00]/50 border-[#FF4A00]/40' : ''}`}>
                <div className="sf-card-header">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">Standard Data Bundles</h2>
                    <Info className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="sf-table">
                    <thead>
                      <tr>
                        <th><div className="flex items-center gap-1">Name <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                        <th><div className="flex items-center gap-1">Installed Version <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                        <th><div className="flex items-center gap-1">Latest Version <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBundles.map((bundle) => (
                        <tr key={bundle.name}>
                          <td className="sf-link font-medium">{bundle.name}</td>
                          <td>{bundle.installedVersion}</td>
                          <td>{bundle.latestVersion}</td>
                          <td>
                            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Generic setup page placeholder */
            <div className="p-6">
              <div className="sf-card">
                <div className="sf-card-header">
                  <h1 className="text-base font-semibold text-[var(--sf-text-primary)]">{currentPageLabel}</h1>
                </div>
                <div className="sf-card-body">
                  <p className="text-sm text-[var(--sf-text-tertiary)]">Setup content for {currentPageLabel}.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Connect an Org Wizard
         ═══════════════════════════════════════════════════════════ */}
      {connectOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConnectOrgOpen(false)} />

          {/* Step: Login */}
          {wizardStep === 'login' ? (
            <div className="relative bg-[#F0F2F5] rounded-lg shadow-2xl w-[480px] flex flex-col items-center py-12 px-8">
              <button onClick={() => setConnectOrgOpen(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded hover:bg-black/5 text-[var(--sf-text-tertiary)]">
                <X className="w-4 h-4" />
              </button>
              {/* Logo */}
              {isInformatica ? (
                <div className="mb-8">
                  <InformaticaLogo className="h-14 w-auto" />
                </div>
              ) : (
                <div className="mb-8">
                  <SalesforceCloudLogo size={100} />
                </div>
              )}
              {/* Login form */}
              <div className="w-full bg-white rounded-lg border border-[#D8DDE6] p-6 space-y-4">
                <div>
                  <label className="block text-sm text-[var(--sf-link)] mb-1">Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#D8DDE6] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--sf-link)] mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#D8DDE6] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                  />
                </div>
                <button
                  onClick={handleWizardNext}
                  className="w-full py-2.5 text-sm font-medium text-white bg-[#4A89DC] rounded hover:bg-[#3B7BD3] transition-colors"
                >
                  Log In
                </button>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-[#D8DDE6] text-[var(--sf-blue)]" />
                  <span className="text-sm text-[var(--sf-text-primary)]">Remember me</span>
                </label>
                <div className="border-t border-[#D8DDE6] pt-3 flex items-center justify-between">
                  <button className="text-sm text-[var(--sf-link)] hover:underline">Forgot Your Password?</button>
                  <button className="text-sm text-[var(--sf-link)] hover:underline">Use Custom Domain</button>
                </div>
              </div>
            </div>
          ) : wizardStep === 'permissions' ? (
            /* Step: Permissions / Allow Access */
            <div className="relative bg-[#F0F2F5] rounded-lg shadow-2xl w-[520px] flex flex-col items-center py-12 px-8">
              <button onClick={() => setConnectOrgOpen(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded hover:bg-black/5 text-[var(--sf-text-tertiary)]">
                <X className="w-4 h-4" />
              </button>
              {/* Logo */}
              {isInformatica ? (
                <div className="mb-6">
                  <InformaticaLogo className="h-14 w-auto" />
                </div>
              ) : (
                <div className="mb-6">
                  <SalesforceCloudLogo size={100} />
                </div>
              )}
              <h2 className="text-2xl text-[var(--sf-text-tertiary)] mb-6">Allow Access?</h2>
              <div className="w-full bg-white rounded-lg border border-[#D8DDE6] p-6 space-y-4">
                <p className="text-sm text-[var(--sf-text-secondary)]">
                  {isInformatica ? 'Informatica MDM' : 'Data Cloud Salesforce'} Org Registration is asking to:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-sm text-[var(--sf-text-primary)]">
                  <li>Access the identity URL service</li>
                  <li>Access unique user identifiers</li>
                  <li>Manage user data via APIs</li>
                </ul>
                <p className="text-sm text-[var(--sf-text-secondary)]">
                  Do you want to allow access for<br />
                  {loginUsername}? (<button className="text-[var(--sf-link)] hover:underline">Not you?</button>)
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setConnectOrgOpen(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-[var(--sf-link)] border border-[#D8DDE6] rounded hover:bg-[#F3F3F3] transition-colors"
                  >
                    Deny
                  </button>
                  <button
                    onClick={handleAllowAccess}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-[#4A89DC] rounded hover:bg-[#3B7BD3] transition-colors"
                  >
                    Allow
                  </button>
                </div>
                <p className="text-xs text-[var(--sf-text-tertiary)] pt-2">
                  To revoke access at any time, go to your personal settings.
                </p>
              </div>
            </div>
          ) : (
            /* Steps: select-type & alias */
            <div className="relative bg-white rounded-lg shadow-2xl w-[640px] max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="text-center py-6 border-b border-[var(--sf-border)]">
                <h2 className="text-xl font-normal text-[var(--sf-text-primary)]">Connect an Org</h2>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {wizardStep === 'select-type' ? (
                  <div className="space-y-6">
                    {/* Existing connection info */}
                    {currentConnections.length > 0 && (
                      <div className={`flex items-center gap-3 p-4 rounded-lg ${isInformatica ? 'bg-[#FFF8F5]' : 'bg-[#FAFAF9]'}`}>
                        <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${isInformatica ? 'text-[#FF4A00]' : 'text-[var(--sf-success)]'}`} />
                        <div>
                          <div className="text-sm font-semibold text-[var(--sf-text-primary)]">{currentConnections[0].connectionName}</div>
                          <div className="text-xs text-[var(--sf-text-tertiary)]">Org ID: {currentConnections[0].orgId}</div>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-[var(--sf-text-secondary)]">
                      Choose what type of org you would like to connect to as a data source and data action target. <button className="text-[var(--sf-link)] hover:underline">Learn More</button>
                    </p>

                    {/* Org type cards */}
                    <div className="grid grid-cols-2 gap-4">
                      {(['salesforce', 'sandbox'] as const).map((type) => {
                        const selected = selectedOrgType === type;
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedOrgType(type)}
                            className={`relative flex items-center justify-center h-32 rounded-lg border-2 transition-all ${
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
                            <span className="text-sm text-[var(--sf-text-primary)]">
                              {type === 'salesforce' ? 'Connect to a Salesforce Org' : 'Connect to a Sandbox Org'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Alias step */
                  <div className="space-y-6">
                    <p className="text-sm text-[var(--sf-text-secondary)]">
                      Assign an alias for your {connectorName} connector that contains up to 15 alphanumeric characters. You can't change the alias later. The alias is used in data stream names and helps you filter your connections.
                    </p>
                    <div>
                      <label className="block text-sm text-[var(--sf-text-primary)] mb-1">
                        <span className="text-[var(--sf-error)]">*</span> Connection Alias
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={connectionAlias}
                          onChange={(e) => {
                            if (e.target.value.length <= 15) setConnectionAlias(e.target.value);
                          }}
                          placeholder="Create an alias..."
                          className="w-72 px-3 py-2 text-sm border-2 border-[var(--sf-blue)] rounded focus:outline-none focus:ring-2 focus:ring-[rgba(27,150,255,0.2)]"
                          maxLength={15}
                        />
                        <span className="text-sm text-[var(--sf-text-tertiary)]">{connectionAlias.length}/15</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-4 border-t border-[var(--sf-border)] bg-[#FAFAF9]">
                {wizardStep === 'select-type' ? (
                  <>
                    <button onClick={() => setConnectOrgOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-link)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                    <button
                      onClick={handleWizardNext}
                      disabled={!selectedOrgType}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleWizardBack} className="px-4 py-2 text-sm font-medium text-[var(--sf-link)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Back</button>
                    <button
                      onClick={handleWizardNext}
                      disabled={!connectionAlias.trim()}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
