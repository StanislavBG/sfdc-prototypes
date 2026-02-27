import { useState } from 'react';
import { useMdsSimulator } from './MdsSimulatorContext';
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
  Eye,
  EyeOff,
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
  fieldTag?: string; // e.g. "264 fields" — shown as a tag on highlighted bundles
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
    items: [
      { id: 'setup-home', label: 'Data Cloud Setup Home', section: '' },
      { id: 'installed-packages', label: 'Installed Packages', section: '' },
    ],
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
  { name: 'Informatica MDM Cloud', installedVersion: '--', latestVersion: '2.1', fieldTag: '264 fields' },
  { name: 'Informatica Data Quality', installedVersion: '--', latestVersion: '3.4', fieldTag: '86 fields' },
];

// ── Informatica Logo SVG ─────────────────────────────────────────────
function InformaticaLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 50" className={className} style={style} fill="none">
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

interface DemoSessionState {
  informaticaConnections: { name: string; alias: string; orgId: string }[];
  selectedBundles: string[];
  installedDatakits: string[];
}

// ── Installed Package type ──────────────────────────────────────────
interface InstalledPackage {
  name: string;
  publisher: string;
  versionNumber: string;
  namespacePrefix: string;
  installDate: string;
  limits: boolean;
  apps: number;
  tabs: number;
  objects: number;
  appExchangeReady: 'Passed' | 'Not Passed';
  description?: string;
  versionName?: string;
  packageType?: string;
  packageId?: string;
  language?: string;
  isInformatica?: boolean;
}

const baseInstalledPackages: InstalledPackage[] = [
  { name: 'Salesforce Standard Data Model', publisher: 'Salesforce', versionNumber: '1.126', namespacePrefix: 'ssot', installDate: '4/30/2025, 11:40 AM', limits: false, apps: 0, tabs: 0, objects: 0, appExchangeReady: 'Not Passed', description: 'This package contains the standard data model for Data Cloud. Visit the link (https://sfdc.co/dcssot) if you receive a version installation error.', versionName: 'Spring 2025', packageType: 'Managed', packageId: '033B0000000PulE', language: 'English' },
  { name: 'CDPAdvertising', publisher: 'Salesforce', versionNumber: '3.21', namespacePrefix: 'cdpactvstrgptnr', installDate: '4/30/2025, 11:16 AM', limits: true, apps: 0, tabs: 0, objects: 0, appExchangeReady: 'Passed', versionName: 'Spring 2025', packageType: 'Managed', packageId: '033B0000000QxlF', language: 'English' },
];

interface DataCloudSetupContentProps {
  onBack?: () => void;
  demoSession?: DemoSessionState;
  onDemoSessionChange?: (session: DemoSessionState) => void;
  currentTimeline?: string;
}

// ── Component ────────────────────────────────────────────────────────
export default function DataCloudSetupContent({ onBack, demoSession, onDemoSessionChange, currentTimeline }: DataCloudSetupContentProps) {
  const [activeNavItem, setActiveNavItem] = useState('setup-home');
  const [quickFindQuery, setQuickFindQuery] = useState('');
  const [expandedNavItems, setExpandedNavItems] = useState<Set<string>>(new Set(['feature-manager']));

  // Persisted connections state — initialize from demoSession for session persistence
  const [sfdcConnections, setSfdcConnections] = useState<Connection[]>(initialSfdcConnections);
  const [informaticaConnections, setInformaticaConnections] = useState<Connection[]>(() => {
    if (demoSession?.informaticaConnections.length) {
      return demoSession.informaticaConnections.map((c, i) => ({
        id: `conn-infa-session-${i}`,
        connectionName: c.name,
        alias: c.alias,
        connectionStatus: 'Active',
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        orgId: c.orgId,
      }));
    }
    return initialInformaticaConnections;
  });

  // Install Bundle wizard modal
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installModalBundle, setInstallModalBundle] = useState<DataBundle | null>(null);
  const [installModalChoice, setInstallModalChoice] = useState<'admins' | 'all' | 'profiles'>('admins');
  const [installModalLoading, setInstallModalLoading] = useState(false);

  // Installed Packages state — initialize from demoSession for session persistence
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>(() => {
    const pkgs = [...baseInstalledPackages];
    if (demoSession?.selectedBundles.length) {
      demoSession.selectedBundles.forEach((bundleName) => {
        const isInfaBundle = informaticaBundles.some((b) => b.name === bundleName);
        const displayName = bundleName === 'Informatica MDM Cloud' ? 'Customer 360' : bundleName === 'Informatica Data Quality' ? 'Organization 360' : bundleName;
        const bundle = [...informaticaBundles, ...sfdcBundles].find((b) => b.name === bundleName);
        pkgs.push({
          name: displayName,
          publisher: isInfaBundle ? 'Informatica' : 'CDP CRM 1',
          versionNumber: bundle?.latestVersion || '1.0',
          namespacePrefix: isInfaBundle ? 'infa_mdm_dk' : 'cdp_crm_dk2',
          installDate: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          limits: false,
          apps: 0,
          tabs: 0,
          objects: 0,
          appExchangeReady: 'Passed',
          description: isInfaBundle ? `Informatica MDM business entity bundle for ${displayName}. Contains master data objects, match rules, and data quality configurations.` : '',
          versionName: isInfaBundle ? 'Winter 2026' : 'Spring 2025',
          packageType: 'Managed',
          packageId: `033B${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
          language: 'English',
          isInformatica: isInfaBundle,
        });
      });
    }
    return pkgs;
  });
  const [packageDetailName, setPackageDetailName] = useState<string | null>(null);

  // Connect Org wizard
  const [connectOrgOpen, setConnectOrgOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('select-type');
  const [selectedOrgType, setSelectedOrgType] = useState<'salesforce' | 'sandbox' | null>(null);
  const [connectionAlias, setConnectionAlias] = useState('INFA_MDM_01');
  const [loginUsername, setLoginUsername] = useState('entity_resolution_demo@datacloud.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // MDS Simulator — global context
  const { enabled: mdsSimulatorVisible, setEnabled: setMdsSimulatorVisible, triggerDelay } = useMdsSimulator();

  // Setup Home state
  const [setupHomeLearnOpen, setSetupHomeLearnOpen] = useState(true);
  const [setupHomeTab, setSetupHomeTab] = useState<'get-started' | 'plan-data' | 'monitor'>('get-started');

  // Solution Manager state
  const [smActiveSolution, setSmActiveSolution] = useState<string | null>(null);
  const [smActiveStep, setSmActiveStep] = useState(0);
  const [smStepProgress, setSmStepProgress] = useState<Record<string, Record<number, 'not-started' | 'in-progress' | 'completed'>>>({
    'Phase-1': {}, 'Phase-2-A': {}, 'Phase-2-B': {}, 'CH': {},
  });
  // Interactive step state for Phase 1 rich controls
  const [smFormPasswordVisible, setSmFormPasswordVisible] = useState<Record<string, boolean>>({});
  const [smMultiselectState, setSmMultiselectState] = useState<Record<string, boolean>>({});
  const [smRadioState, setSmRadioState] = useState<Record<string, number>>({});
  const [smToggleState, setSmToggleState] = useState<Record<string, boolean>>({});

  const is264Release = currentTimeline === '264-release';
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
      triggerDelay(() => setWizardStep('alias'));
    } else if (wizardStep === 'alias' && connectionAlias.trim()) {
      triggerDelay(() => setWizardStep('login'));
    } else if (wizardStep === 'login') {
      triggerDelay(() => setWizardStep('permissions'));
    }
  };

  const handleWizardBack = () => {
    if (wizardStep === 'alias') setWizardStep('select-type');
    else if (wizardStep === 'login') setWizardStep('alias');
    else if (wizardStep === 'permissions') setWizardStep('login');
  };

  const handleAllowAccess = () => {
    triggerDelay(() => handleAllowAccessInner());
  };

  const handleAllowAccessInner = () => {
    // Create a new connection from wizard data
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      connectionName: isInformatica
        ? `Informatica MDM ${selectedOrgType === 'sandbox' ? 'Sandbox Tenant' : 'Production Tenant'}`
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
      // Update demo session with the new Informatica connection
      if (onDemoSessionChange && demoSession) {
        onDemoSessionChange({
          ...demoSession,
          informaticaConnections: [
            ...demoSession.informaticaConnections,
            { name: newConnection.connectionName, alias: newConnection.alias, orgId: newConnection.orgId },
          ],
        });
      }
    } else {
      setSfdcConnections((prev) => [...prev, newConnection]);
    }
    setConnectOrgOpen(false);
  };

  // Gate Informatica-related nav items behind 264 Release timeline
  const informaticaNavIds = new Set(['informatica-mdm', 'informatica-mdm-sf', 'solution-manager']);
  const timelineFilteredNav = is264Release
    ? setupNavSections
    : setupNavSections.map((section) => ({
        ...section,
        items: section.items.filter((item) => !informaticaNavIds.has(item.id)),
      })).filter((s) => s.items.length > 0 || s.title);

  // Filter nav items by search query
  const filteredSections = quickFindQuery.trim()
    ? timelineFilteredNav.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.label.toLowerCase().includes(quickFindQuery.toLowerCase()) ||
          item.children?.some((c) => c.label.toLowerCase().includes(quickFindQuery.toLowerCase()))
        ),
      })).filter((s) => s.items.length > 0)
    : timelineFilteredNav;

  // ── Solution Manager data ────────────────────────────────────────────
  const smTiles = [
    { id: 'Phase-1', badge: 'Phase 1', title: 'Integrate Business Entities from Informatica', description: 'Realize the full potential of the curated and enriched business entities from Informatica directly in D360. In this step by step guide, we will work through the steps required to operationalize business entities created in Informatica in D360.' },
    { id: 'Phase-2-A', badge: 'Phase 2', title: 'Integrate Business Entities from Informatica', description: 'Configure your Informatica connection and data integration settings. Interactive step-by-step guide with forms, entity selection, identity resolution, mappings, sync, and experience setup.' },
  ];

  // ── Rich Step Types (matching reference repo Phase-2-A / Phase-2-B) ──
  type SmStepBase = { title: string; headline: string };
  type SmStepAction = SmStepBase & { type: 'action'; system?: 'D360' | 'Informatica'; description: string; actionLabel: string };
  type SmStepForm = SmStepBase & { type: 'form'; fields: { name: string; inputType: string; placeholder: string; required: boolean }[] };
  type SmStepMultiselect = SmStepBase & { type: 'multiselect'; groups: { name: string; options: string[] }[] };
  type SmStepRadio = SmStepBase & { type: 'radio'; options: { label: string; description: string }[] };
  type SmStepTableList = SmStepBase & { type: 'table-list'; tables: string[] };
  type SmStepPreview = SmStepBase & { type: 'preview'; items: { name: string; description: string }[] };
  type SmStepRulesList = SmStepBase & { type: 'rules-list'; rules: { name: string; description: string }[] };
  type SmStepToggle = SmStepBase & { type: 'toggle'; description: string };
  type SmStepSubsteps = SmStepBase & { type: 'substeps'; substeps: { name: string; link: string; description: string }[] };
  type SmStepTextLinks = SmStepBase & { type: 'text-links'; description: string; links: { label: string; url: string }[] };
  type SmStep = SmStepAction | SmStepForm | SmStepMultiselect | SmStepRadio | SmStepTableList | SmStepPreview | SmStepRulesList | SmStepToggle | SmStepSubsteps | SmStepTextLinks;

  const smSolutions: Record<string, { title: string; headline: string; steps: SmStep[] }> = {
    'Phase-1': {
      title: 'Integrate Business Entities [Phase 1]',
      headline: 'Configure your Informatica connection and data integration settings',
      steps: [
        {
          title: 'Connect to Informatica System',
          headline: 'Establish connection with credentials',
          type: 'form',
          fields: [
            { name: 'Connection Name', inputType: 'text', placeholder: 'Enter connection name', required: true },
            { name: 'Tenant URL', inputType: 'text', placeholder: 'https://your-tenant.informatica.com', required: true },
            { name: 'Username', inputType: 'text', placeholder: 'Enter username', required: true },
            { name: 'Password', inputType: 'password', placeholder: 'Enter password', required: true },
          ],
        },
        {
          title: 'Choose Business Entity',
          headline: 'Select entities to integrate',
          type: 'multiselect',
          groups: [
            { name: 'Tenants', options: ['USA-1', 'Europe-1'] },
            { name: 'Entities', options: ['Customer', 'Product', 'Supplier'] },
          ],
        },
        {
          title: 'Choose Identity Resolution',
          headline: 'Select resolution method',
          type: 'radio',
          options: [
            { label: 'Direct Mapping', description: 'Use direct field mapping for identity resolution. Best for clean, well-structured data with consistent identifiers.' },
            { label: 'Golden Key-Ring', description: 'Use Golden Key-Ring approach for advanced identity resolution. Recommended for complex data with multiple source systems.' },
          ],
        },
        {
          title: 'Review Mappings',
          headline: 'Validate data object mappings',
          type: 'table-list',
          tables: ['Customer_Base', 'Customer_Address', 'Customer_Contact', 'Product_Master', 'Product_Category', 'Product_Pricing', 'Supplier_Base', 'Supplier_Location', 'Order_Header', 'Order_Line', 'Payment_Info', 'Inventory_Stock'],
        },
        {
          title: 'Validate Connected Data',
          headline: 'Preview integrated data',
          type: 'preview',
          items: [
            { name: 'Customer Data Preview', description: 'Preview customer records from Informatica' },
            { name: 'Product Data Preview', description: 'Preview product catalog data' },
            { name: 'Supplier Data Preview', description: 'Preview supplier information' },
          ],
        },
        {
          title: 'Set up Identity Rules',
          headline: 'Configure match rules',
          type: 'rules-list',
          rules: [
            { name: 'Fuzzy Name Match', description: 'Match records based on similar names' },
            { name: 'Email Exact Match', description: 'Match records with identical email addresses' },
            { name: 'Phone Number Match', description: 'Match records by phone number normalization' },
            { name: 'Address Similarity', description: 'Match records by address components' },
          ],
        },
        {
          title: 'Enable Sync',
          headline: 'Configure synchronization',
          type: 'toggle',
          description: 'Enable automatic synchronization with Informatica. When enabled, changes in your Informatica system will be automatically reflected in Data 360.',
        },
        {
          title: 'Setup Experiences',
          headline: 'Configure user experiences',
          type: 'substeps',
          substeps: [
            { name: 'Search Before Create', link: 'https://trailhead.salesforce.com/sbc', description: 'Enable duplicate checking before record creation' },
            { name: 'Copy Field Values', link: 'https://trailhead.salesforce.com/copy', description: 'Configure automatic field value population' },
            { name: 'Add Related List', link: 'https://trailhead.salesforce.com/related', description: 'Display related records from Informatica' },
          ],
        },
      ],
    },
    'Phase-2-A': {
      title: 'Integrate Business Entities [Phase 2]',
      headline: 'Documentation and guidance for each integration step',
      steps: [
        {
          title: 'Connect to Informatica System',
          headline: 'Establish connection with credentials',
          type: 'text-links',
          description: 'To connect to your Informatica system, you will need to provide a <strong>Connection Name</strong>, the <strong>Tenant URL</strong> (e.g. https://your-tenant.informatica.com), your <strong>Username</strong>, and <strong>Password</strong>. Ensure that your Informatica tenant has API access enabled and that the credentials have sufficient permissions for data integration operations.',
          links: [
            { label: 'Informatica Connection Setup Guide', url: 'https://docs.informatica.com/cloud-common-services/administrator/current-version/connection-configuration.html' },
            { label: 'API Access Configuration', url: 'https://docs.informatica.com/cloud-common-services/administrator/current-version/api-access.html' },
          ],
        },
        {
          title: 'Choose Business Entity',
          headline: 'Select entities to integrate',
          type: 'text-links',
          description: 'Select the business entities you want to integrate from Informatica into D360. Available <strong>Tenants</strong> include USA-1 and Europe-1. Available <strong>Entities</strong> include Customer, Product, and Supplier. Choose the tenants and entities that match your integration requirements.',
          links: [
            { label: 'Business Entity Overview', url: 'https://docs.informatica.com/master-data-management/multidomain-mdm/current-version/business-entity-services-guide.html' },
            { label: 'Entity Selection Best Practices', url: 'https://docs.informatica.com/master-data-management/multidomain-mdm/current-version/best-practices.html' },
          ],
        },
        {
          title: 'Choose Identity Resolution',
          headline: 'Select resolution method',
          type: 'text-links',
          description: 'Two identity resolution methods are available:<br/><br/><strong>Direct Mapping</strong> — Use direct field mapping for identity resolution. Best for clean, well-structured data with consistent identifiers.<br/><br/><strong>Golden Key-Ring</strong> — Use the Golden Key-Ring approach for advanced identity resolution. Recommended for complex data with multiple source systems.',
          links: [
            { label: 'Identity Resolution Methods', url: 'https://docs.informatica.com/data-quality-and-governance/data-as-a-service/current-version/identity-resolution.html' },
            { label: 'Golden Key-Ring Documentation', url: 'https://docs.informatica.com/master-data-management/multidomain-mdm/current-version/match-merge.html' },
          ],
        },
        {
          title: 'Review Mappings',
          headline: 'Validate data object mappings',
          type: 'text-links',
          description: 'Review and validate the mappings for the following data objects: <strong>Customer_Base</strong>, <strong>Customer_Address</strong>, <strong>Customer_Contact</strong>, <strong>Product_Master</strong>, <strong>Product_Category</strong>, <strong>Product_Pricing</strong>, <strong>Supplier_Base</strong>, <strong>Supplier_Location</strong>, <strong>Order_Header</strong>, <strong>Order_Line</strong>, <strong>Payment_Info</strong>, and <strong>Inventory_Stock</strong>. Ensure all field mappings are correctly aligned between Informatica and D360 before proceeding.',
          links: [
            { label: 'Data Object Mapping Guide', url: 'https://docs.informatica.com/cloud-common-services/data-integration/current-version/mappings.html' },
            { label: 'Field Mapping Reference', url: 'https://docs.informatica.com/cloud-common-services/data-integration/current-version/field-mapping.html' },
          ],
        },
        {
          title: 'Validate Connected Data',
          headline: 'Preview integrated data',
          type: 'text-links',
          description: 'After configuring mappings, validate the connected data by previewing records from each integrated entity. Verify <strong>Customer Data</strong> (customer records from Informatica), <strong>Product Data</strong> (product catalog data), and <strong>Supplier Data</strong> (supplier information). Confirm that records are correctly transformed and loaded before enabling synchronization.',
          links: [
            { label: 'Data Validation Guide', url: 'https://docs.informatica.com/cloud-common-services/data-integration/current-version/data-preview.html' },
            { label: 'Troubleshooting Data Issues', url: 'https://docs.informatica.com/cloud-common-services/data-integration/current-version/troubleshooting.html' },
          ],
        },
        {
          title: 'Set up Identity Rules',
          headline: 'Configure match rules',
          type: 'text-links',
          description: 'Configure identity match rules to define how records are matched across systems:<br/><br/><strong>Fuzzy Name Match</strong> — Match records based on similar names<br/><strong>Email Exact Match</strong> — Match records with identical email addresses<br/><strong>Phone Number Match</strong> — Match records by phone number normalization<br/><strong>Address Similarity</strong> — Match records by address components',
          links: [
            { label: 'Match Rule Configuration', url: 'https://docs.informatica.com/master-data-management/multidomain-mdm/current-version/match-rules.html' },
            { label: 'Identity Rule Best Practices', url: 'https://docs.informatica.com/master-data-management/multidomain-mdm/current-version/identity-best-practices.html' },
          ],
        },
        {
          title: 'Enable Sync',
          headline: 'Configure synchronization',
          type: 'text-links',
          description: 'Enable automatic synchronization between Informatica and Data 360. When sync is enabled, changes in your Informatica system will be automatically reflected in Data 360. Configure sync frequency, conflict resolution settings, and error handling policies to match your operational requirements.',
          links: [
            { label: 'Synchronization Setup Guide', url: 'https://docs.informatica.com/cloud-common-services/data-integration/current-version/synchronization.html' },
            { label: 'D360 Setup Documentation', url: 'https://help.salesforce.com/s/articleView?id=sf.data360_setup.htm' },
          ],
        },
        {
          title: 'Setup Experiences',
          headline: 'Configure user experiences',
          type: 'text-links',
          description: 'Configure the end-user experiences for working with integrated data in D360:<br/><br/><strong>Search Before Create</strong> — Enable duplicate checking before record creation<br/><strong>Copy Field Values</strong> — Configure automatic field value population<br/><strong>Add Related List</strong> — Display related records from Informatica',
          links: [
            { label: 'Search Before Create', url: 'https://trailhead.salesforce.com/sbc' },
            { label: 'Copy Field Values', url: 'https://trailhead.salesforce.com/copy' },
            { label: 'Add Related List', url: 'https://trailhead.salesforce.com/related' },
          ],
        },
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

  const currentPageLabel = activeNavItem === 'setup-home' ? 'Data Cloud Setup Home' : activeNavItem === 'salesforce-crm' ? 'Salesforce CRM' : (activeNavItem === 'informatica-mdm' || activeNavItem === 'informatica-mdm-sf') ? 'Informatica MDM' : activeNavItem === 'solution-manager' ? 'Solution Manager' : activeNavItem === 'installed-packages' ? 'Installed Packages' : setupNavSections.flatMap((s) => s.items).find((i) => i.id === activeNavItem)?.label || 'Setup';
  const currentConnections = isInformatica ? informaticaConnections : sfdcConnections;
  const currentBundles = isInformatica ? informaticaBundles : sfdcBundles;
  const connectorName = isInformatica ? 'Informatica MDM' : 'Salesforce CRM';

  // ── Install Bundle handler ──
  const handleInstallBundle = () => {
    if (!installModalBundle) return;
    triggerDelay(() => {
      setInstallModalLoading(true);
      setTimeout(() => {
      // Add bundle to session
      if (onDemoSessionChange && demoSession) {
        onDemoSessionChange({
          ...demoSession,
          selectedBundles: [...demoSession.selectedBundles, installModalBundle.name],
        });
      }
      // Add to installed packages list
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      const isInfaBundle = informaticaBundles.some((b) => b.name === installModalBundle.name);
      const displayName = installModalBundle.name === 'Informatica MDM Cloud' ? 'Customer 360' : installModalBundle.name === 'Informatica Data Quality' ? 'Organization 360' : installModalBundle.name;
      const newPkg: InstalledPackage = {
        name: displayName,
        publisher: isInfaBundle ? 'Informatica' : 'CDP CRM 1',
        versionNumber: installModalBundle.latestVersion,
        namespacePrefix: isInfaBundle ? 'infa_mdm_dk' : 'cdp_crm_dk2',
        installDate: dateStr,
        limits: false,
        apps: 0,
        tabs: 0,
        objects: 0,
        appExchangeReady: 'Passed',
        description: isInfaBundle
          ? `Informatica MDM business entity bundle for ${displayName}. Contains master data objects, match rules, and data quality configurations.`
          : '',
        versionName: isInfaBundle ? 'Winter 2026' : 'Spring 2025',
        packageType: 'Managed',
        packageId: `033B${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        language: 'English',
        isInformatica: isInfaBundle,
      };
      setInstalledPackages((prev) => [...prev, newPkg]);
      setInstallModalOpen(false);
      setInstallModalLoading(false);
      // Navigate to Installed Packages page
      setActiveNavItem('installed-packages');
      setPackageDetailName(null);
    }, 2500);
    });
  };

  // Informatica metadata components for View Components
  const getInformaticaComponents = (pkgName: string) => {
    const prefix = pkgName === 'Customer 360' ? 'C360' : pkgName === 'Organization 360' ? 'Org360' : pkgName.replace(/\s+/g, '');
    return [
      { name: `INFA_${prefix}_PersonEntityMasterRecordMatchRuleConfig`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_OrganizationEntityGoldenRecordMergePolicy`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_AddressStandardizationQualityRuleDefinition`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_PhoneNormalizationDataQualityTransform`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_EmailValidationDataQualityRuleExecution`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_CrossReferenceKeyRingResolutionMapping`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_BusinessEntityRelationshipHierarchyModel`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_TrustScoreCalculationWeightedAlgorithm`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_SurvivorshipRulePrioritySourceSystemRank`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_DataStewardTaskAssignmentWorkflowConfig`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_MasterDataSyncScheduleIncrementalDelta`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_ChangeDataCaptureEventNotificationStream`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_DataQualityProfileStatisticsAggregation`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_FuzzyMatchThresholdConfigurationSetting`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_DuplicateClusterIdentificationBatchJob`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_HierarchyManagerNodeRelationshipType`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_ReferenceDataCrossWalkMappingTransform`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_GoldenRecordConsolidationViewDefinition`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_SourceSystemRegistrationConnectorConfig`, parentObject: '', type: 'Data Package Kit Object' },
      { name: `INFA_${prefix}_DataLineageTraceabilityAuditLogEntry`, parentObject: '', type: 'Data Package Kit Object' },
    ];
  };

  // Detail package for the Package Details page
  const detailPackage = packageDetailName ? installedPackages.find((p) => p.name === packageDetailName) : null;

  return (
    <div className="slds-h-full slds-flex slds-flex-col">
      {/* Setup Header Bar */}
      <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_medium slds-p-vertical_x-small slds-flex slds-items-center slds-gap_small">
        <button onClick={onBack} className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-brand sf-hover-underline">
          <ArrowLeft className="slds-icon-size_x-small" />
          Back to Data 360
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--slds-g-color-border-1)' }} />
        <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Data Cloud Setup</span>
        <div className="slds-flex-1" />
        <span className="slds-text-size_small slds-text-neutral-7">Home</span>
        <span className="slds-text-size_small slds-text-neutral-7">Object Manager</span>
      </div>

      <div className="slds-flex slds-flex-1 slds-overflow-hidden">
        {/* ── Left Nav ── */}
        <nav style={{ width: '220px', minWidth: '220px' }} className="slds-bg-white slds-border_right slds-border-color_border-1 slds-flex slds-flex-col slds-h-full slds-overflow-y-auto">
          {/* Quick Find */}
          <div className="slds-p-around_small">
            <div className="slds-pos-relative">
              <Search className="slds-pos-absolute slds-icon-size_x-small slds-text-neutral-7" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Quick Find"
                value={quickFindQuery}
                onChange={(e) => setQuickFindQuery(e.target.value)}
                className="slds-w-full slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small"
                style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px' }}
              />
            </div>
          </div>

          {/* Nav sections */}
          <div className="slds-flex-1 slds-overflow-y-auto slds-p-bottom_medium">
            {filteredSections.map((section, si) => (
              <div key={si}>
                {section.title && (
                  <div className="slds-p-horizontal_medium slds-p-top_medium slds-font-weight_bold slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ paddingBottom: '4px', fontSize: '10px', letterSpacing: '0.05em' }}>
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (item.hasChildren) toggleNavExpand(item.id);
                        else triggerDelay(() => setActiveNavItem(item.id));
                      }}
                      className={`slds-w-full slds-flex slds-items-center slds-gap_xx-small slds-p-horizontal_medium slds-text-size_small slds-text-left slds-transition-colors ${
                        activeNavItem === item.id
                          ? (item.id === 'informatica-mdm-sf' || item.id === 'informatica-mdm'
                              ? 'slds-font-weight_semibold'
                              : item.id === 'solution-manager'
                                ? 'slds-text-brand slds-font-weight_bold'
                                : 'slds-text-brand slds-font-weight_semibold')
                          : (item.id === 'informatica-mdm-sf'
                              ? 'slds-font-weight_medium'
                              : item.id === 'solution-manager'
                                ? 'slds-text-brand slds-font-weight_semibold'
                                : 'slds-text-neutral-9 sf-hover-bg-neutral')
                      }`}
                      style={{
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        ...(activeNavItem === item.id
                          ? (item.id === 'informatica-mdm-sf' || item.id === 'informatica-mdm'
                              ? { background: '#FFF3ED', color: '#FF4A00' }
                              : { background: '#EEF4FF' })
                          : (item.id === 'informatica-mdm-sf'
                              ? { color: '#FF4A00' }
                              : {})),
                      }}
                    >
                      {item.hasChildren && (
                        expandedNavItems.has(item.id)
                          ? <ChevronDown className="slds-icon-size_xx-small slds-flex-shrink-0" />
                          : <ChevronRight className="slds-icon-size_xx-small slds-flex-shrink-0" />
                      )}
                      <span className={activeNavItem === item.id ? (item.id === 'informatica-mdm-sf' || item.id === 'informatica-mdm' ? '' : item.id === 'solution-manager' ? 'slds-text-brand' : 'sf-link') : item.id === 'solution-manager' ? 'slds-text-brand' : ''} style={activeNavItem === item.id && (item.id === 'informatica-mdm-sf' || item.id === 'informatica-mdm') ? { color: '#FF4A00' } : undefined}>{item.label}</span>
                      {item.id === 'informatica-mdm-sf' && (
                        <span className="slds-font-weight_bold slds-text-uppercase slds-tracking-wide slds-text-white slds-border-radius_small" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '9px', background: '#FF4A00' }}>New</span>
                      )}
                      {item.id === 'solution-manager' && (
                        <span className="slds-font-weight_bold slds-text-uppercase slds-tracking-wide slds-text-white slds-bg-brand slds-border-radius_small" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '9px' }}>New</span>
                      )}
                    </button>
                    {item.hasChildren && expandedNavItems.has(item.id) && item.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setActiveNavItem(child.id)}
                        className={`slds-w-full slds-flex slds-items-center slds-p-right_medium slds-text-size_small slds-text-left slds-transition-colors ${
                          activeNavItem === child.id ? 'slds-text-brand slds-font-weight_semibold' : 'slds-text-neutral-9 sf-hover-bg-neutral'
                        }`}
                        style={{ paddingLeft: '40px', paddingTop: '6px', paddingBottom: '6px', ...(activeNavItem === child.id ? { background: '#EEF4FF' } : {}) }}
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
        <main className="slds-flex-1 slds-overflow-y-auto slds-bg-neutral-2">
          {activeNavItem === 'setup-home' ? (
            /* ═══════════════════════════════════════════════════════════
               DATA CLOUD SETUP HOME — Matches Salesforce reference layout
               ═══════════════════════════════════════════════════════════ */
            <div>
              {/* Page header — SETUP / Data Cloud Setup */}
              <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium slds-flex slds-items-center slds-justify-between">
                <div className="slds-flex slds-items-center slds-gap_medium">
                  <div className="slds-flex slds-items-center slds-justify-center slds-flex-shrink-0 slds-border-radius_small" style={{ width: '40px', height: '40px', background: '#F49756' }}>
                    <svg viewBox="0 0 24 24" className="slds-icon-size_default slds-text-white" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  </div>
                  <div>
                    <div className="slds-text-size_small slds-font-weight_medium slds-text-brand slds-text-uppercase slds-tracking-wide">SETUP</div>
                    <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>Data Cloud Setup</h1>
                  </div>
                </div>
                <button className="slds-p-horizontal_medium slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-flex slds-items-center slds-gap_xx-small" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                  Create <ChevronDown className="slds-icon-size_x-small" />
                </button>
              </div>

              {/* Alert banner */}
              <div className="slds-border_bottom slds-p-horizontal_large slds-p-vertical_small slds-flex slds-items-center slds-justify-between" style={{ background: '#FFF3CD', borderBottomColor: '#FFE69C' }}>
                <div className="slds-flex slds-items-center slds-gap_x-small">
                  <Info className="slds-icon-size_small slds-flex-shrink-0" style={{ color: '#856404' }} />
                  <p className="slds-text-size_medium" style={{ color: '#856404' }}>
                    Data Cloud standard permission sets have changed. Some users must be assigned to new permission sets. Find out what's changed and what you should do next.
                  </p>
                </div>
                <button className="slds-text-size_medium slds-font-weight_medium slds-text-brand sf-hover-underline slds-flex-shrink-0 slds-m-left_medium">Learn More</button>
              </div>

              {/* Welcome to Data Cloud hero */}
              <div className="slds-pos-relative slds-bg-white slds-border_bottom slds-border-color_border-1 slds-overflow-hidden">
                <div className="slds-p-horizontal_large slds-p-vertical_x-large" style={{ maxWidth: '48rem' }}>
                  <h2 className="slds-font-weight_bold slds-text-neutral-base slds-m-bottom_medium" style={{ fontSize: '30px' }}>Welcome to Data Cloud</h2>
                  <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed">
                    Harness the power of Data Cloud to unify all your company's data into a holistic view of each customer. Data Cloud consolidates data from all your source systems into Customer 360 profiles to help you understand your customers, empower your teams, and drive business decisions. Use Data Cloud's unified profile data to drive automation and analytics, personalize engagements, and power trusted AI.
                  </p>
                </div>
                {/* Mountain / sunset illustration */}
                <div className="slds-pos-absolute" style={{ right: 0, top: 0, bottom: 0, width: '400px', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 400 180" className="slds-w-full slds-h-full" preserveAspectRatio="xMaxYMax slice">
                    <defs>
                      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#87CEEB" />
                        <stop offset="100%" stopColor="#E0F0FF" />
                      </linearGradient>
                      <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF8C00" />
                      </linearGradient>
                    </defs>
                    <rect width="400" height="180" fill="url(#skyGrad)" />
                    <circle cx="320" cy="60" r="30" fill="url(#sunGrad)" opacity="0.6" />
                    <path d="M0 180 L80 80 L120 120 L180 60 L240 110 L300 50 L400 130 L400 180 Z" fill="#2E844A" opacity="0.7" />
                    <path d="M0 180 L60 120 L130 150 L200 90 L280 140 L350 100 L400 150 L400 180 Z" fill="#1B5E20" opacity="0.6" />
                    <path d="M0 180 L100 150 L200 160 L300 140 L400 165 L400 180 Z" fill="#4A2800" opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* Learn About Data Cloud — collapsible */}
              <div className="slds-p-around_large">
                <button
                  onClick={() => setSetupHomeLearnOpen(!setupHomeLearnOpen)}
                  className="slds-flex slds-items-center slds-gap_x-small slds-m-bottom_medium"
                >
                  {setupHomeLearnOpen ? <ChevronDown className="slds-icon-size_default slds-text-neutral-7" /> : <ChevronRight className="slds-icon-size_default slds-text-neutral-7" />}
                  <h3 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">Learn About Data Cloud</h3>
                </button>

                {setupHomeLearnOpen && (
                  <div className="slds-flex slds-gap_large">
                    {/* Left — tabs + content */}
                    <div className="slds-flex-1 slds-min-w-0">
                      {/* Tab bar */}
                      <div className="slds-flex slds-border_bottom slds-border-color_border-1 slds-m-bottom_medium" style={{ marginBottom: '20px' }}>
                        {(['get-started', 'plan-data', 'monitor'] as const).map((tab) => {
                          const labels = { 'get-started': 'Get Started', 'plan-data': 'Plan Data Strategy', monitor: 'Monitor Data Cloud' };
                          return (
                            <button
                              key={tab}
                              onClick={() => setSetupHomeTab(tab)}
                              className={`slds-p-horizontal_medium slds-text-size_medium slds-font-weight_medium slds-transition-colors ${
                                setupHomeTab === tab
                                  ? 'slds-text-brand slds-border-color_brand'
                                  : 'slds-text-neutral-7'
                              }`}
                              style={{
                                paddingTop: '10px',
                                paddingBottom: '10px',
                                borderBottom: setupHomeTab === tab ? '2px solid var(--slds-g-color-brand)' : '2px solid transparent',
                              }}
                            >
                              {labels[tab]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab content */}
                      {setupHomeTab === 'get-started' && (
                        <div>
                          <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed slds-m-bottom_x-small">
                            Ensure that your org has all the necessary licenses to enable access to the features you need to use. Set up data spaces to organize and secure your data. Use permission sets to grant your users access to Data Cloud data and features.
                          </p>
                          <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed slds-m-bottom_large">
                            Credits are consumed by usage of features and services. Use Digital Wallet to check your recent consumption and consumption trends.
                          </p>

                          <h4 className="slds-text-size_medium slds-font-weight_bold slds-text-neutral-base slds-m-bottom_small">Get Started</h4>
                          <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large sf-divide-y">
                            {[
                              { label: 'Review or add licenses', action: 'Check Your Account', navId: '' },
                              { label: 'Partition data with data spaces', action: 'Open Data Spaces Setup', navId: 'data-spaces' },
                              { label: 'Set up Data Cloud users', action: 'Manage Your Users', navId: 'users' },
                              { label: 'Check credit consumption', action: 'Open Digital Wallet', navId: '' },
                            ].map((item, i) => (
                              <div key={i} className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_medium slds-p-vertical_small">
                                <span className="slds-text-size_medium slds-text-neutral-9">{item.label}</span>
                                <button
                                  onClick={() => item.navId && setActiveNavItem(item.navId)}
                                  className="slds-text-size_medium slds-font-weight_medium slds-text-brand sf-hover-underline"
                                >
                                  {item.action}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {setupHomeTab === 'plan-data' && (
                        <div>
                          <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed slds-m-bottom_medium">
                            Plan your data strategy by mapping your source systems, defining data models, and establishing data quality rules before connecting your data to Data Cloud.
                          </p>
                          <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large sf-divide-y">
                            {[
                              { label: 'Map source systems and data objects', action: 'View Data Model' },
                              { label: 'Define identity resolution strategy', action: 'Identity Resolution' },
                              { label: 'Set up calculated insights', action: 'Create Insights' },
                            ].map((item, i) => (
                              <div key={i} className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_medium slds-p-vertical_small">
                                <span className="slds-text-size_medium slds-text-neutral-9">{item.label}</span>
                                <button className="slds-text-size_medium slds-font-weight_medium slds-text-brand sf-hover-underline">{item.action}</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {setupHomeTab === 'monitor' && (
                        <div>
                          <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed slds-m-bottom_medium">
                            Monitor your Data Cloud usage, job statuses, and system health to ensure your data pipelines are running smoothly.
                          </p>
                          <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large sf-divide-y">
                            {[
                              { label: 'Check data stream health', action: 'View Data Streams' },
                              { label: 'Monitor identity resolution jobs', action: 'View Jobs' },
                              { label: 'Review error logs', action: 'View Logs' },
                            ].map((item, i) => (
                              <div key={i} className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_medium slds-p-vertical_small">
                                <span className="slds-text-size_medium slds-text-neutral-9">{item.label}</span>
                                <button className="slds-text-size_medium slds-font-weight_medium slds-text-brand sf-hover-underline">{item.action}</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right sidebar — Resources */}
                    <div className="slds-flex-shrink-0" style={{ width: '260px' }}>
                      <div className="slds-p-left_medium slds-border-color_border-1" style={{ borderLeft: '2px solid var(--slds-g-color-border-1)' }}>
                        <h4 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_medium">Resources</h4>
                        <div className="slds-gap_small" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {[
                            { label: 'About Salesforce Data Cloud', icon: '📘' },
                            { label: 'Unlock Your Data with Data Cloud', icon: '🔑' },
                            { label: 'Plan Data Strategy', icon: '📋' },
                            { label: 'Data Cloud Features and Learning Path', icon: '📚' },
                            { label: 'Get Started Using Data Cloud', icon: '🚀' },
                          ].map((res, i) => (
                            <button key={i} className="slds-flex slds-items-center slds-gap_x-small slds-text-size_medium slds-text-brand sf-hover-underline slds-w-full slds-text-left">
                              <span className="slds-text-size_large slds-flex-shrink-0">{res.icon}</span>
                              {res.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeNavItem === 'data-360-org-allowlist' ? (
            /* ═══════════════════════════════════════════════════════════
               D360 ORG ALLOWLIST — hidden prototype controls page
               ═══════════════════════════════════════════════════════════ */
            <div>
              {/* Page header */}
              <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium">
                <div className="slds-text-size_small slds-font-weight_medium slds-text-brand slds-text-uppercase slds-tracking-wide">SETUP</div>
                <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>Data 360 Org Allowlist</h1>
              </div>

              <div className="slds-p-around_large" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Allowlist table placeholder */}
                <div className="sf-card">
                  <div className="sf-card-header">
                    <h2 className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base">Allowed Organizations</h2>
                  </div>
                  <div className="sf-card-body">
                    <table className="sf-table slds-w-full slds-text-size_small">
                      <thead>
                        <tr>
                          <th>Organization ID</th>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="sf-link slds-font-weight_medium">00Dfo000001QldR</td>
                          <td>Data Cloud SG</td>
                          <td><span className="slds-inline-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-font-weight_medium slds-text-success"><CheckCircle2 className="slds-icon-size_x-small" /> Active</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Prototype Controls (moved from Setup Home) ── */}
                <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-bg-white slds-overflow-hidden">
                  <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_medium slds-p-vertical_small" style={{ padding: '12px 20px' }}>
                    <div className="slds-flex slds-items-center slds-gap_small">
                      <span style={{ fontSize: '24px' }}>😊</span>
                      <div>
                        <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Prototype Controls</h4>
                        <p className="slds-text-neutral-7" style={{ fontSize: '10px' }}>Toggle visibility of simulator branding elements</p>
                      </div>
                    </div>
                    <div className="slds-flex slds-items-center slds-gap_medium">
                      <div className="slds-flex slds-items-center slds-gap_x-small">
                        <span style={{ fontSize: '18px' }}>😄</span>
                        <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-9">MDS Simulator</label>
                        <button
                          onClick={() => setMdsSimulatorVisible(!mdsSimulatorVisible)}
                          className={`slds-pos-relative slds-border-radius_pill slds-transition-colors ${mdsSimulatorVisible ? 'slds-bg-brand' : ''}`}
                          style={{ width: '40px', height: '20px', ...(!mdsSimulatorVisible ? { background: '#D8DDE6' } : {}) }}
                        >
                          <div className="slds-pos-absolute slds-border-radius_pill slds-bg-white slds-shadow_small slds-transition-all" style={{ top: '2px', width: '16px', height: '16px', transform: mdsSimulatorVisible ? 'translateX(20px)' : 'translateX(2px)' }} />
                        </button>
                      </div>
                      <span style={{ fontSize: '24px' }}>😎</span>
                    </div>
                  </div>
                </div>

                {/* MDS Simulator thinking indicator */}
                {mdsSimulatorVisible && (
                  <div className="slds-border-radius_large slds-p-around_medium slds-flex slds-items-center slds-gap_medium" style={{ border: '2px dashed rgba(0,112,210,0.3)', background: '#EEF4FF' }}>
                    <div className="slds-pos-relative slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                      <div className="slds-pos-absolute slds-inset-0 slds-border-radius_pill sf-spin" style={{ border: '2px solid rgba(0,112,210,0.2)', borderTopColor: 'var(--slds-g-color-brand)' }} />
                      <div className="slds-pos-absolute slds-border-radius_pill sf-spin" style={{ inset: '6px', border: '2px solid rgba(255,74,0,0.2)', borderBottomColor: '#FF4A00', animationDirection: 'reverse', animationDuration: '1.5s' }} />
                      <span style={{ fontSize: '18px' }}>🧠</span>
                    </div>
                    <div className="slds-flex-1">
                      <div className="slds-flex slds-items-center slds-gap_x-small slds-m-bottom_xx-small">
                        <div className="slds-flex slds-gap_xxx-small" style={{ gap: '2px' }}>
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '6px', height: '6px', animation: 'bounce 1s infinite', animationDelay: '0ms' }} />
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '6px', height: '6px', animation: 'bounce 1s infinite', animationDelay: '150ms' }} />
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '6px', height: '6px', animation: 'bounce 1s infinite', animationDelay: '300ms' }} />
                        </div>
                        <span className="slds-text-size_small slds-font-weight_medium slds-text-brand">Thinking...</span>
                      </div>
                      <div className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base slds-tracking-wide">
                        MDS Simulator
                      </div>
                      <p className="slds-text-neutral-7 slds-m-top_xxx-small" style={{ fontSize: '10px' }}>
                        Multi-Domain Simulator — Informatica MDM + Salesforce Data Cloud prototype environment
                      </p>
                    </div>
                    <div className="slds-flex slds-flex-col slds-items-center slds-gap_xx-small slds-flex-shrink-0">
                      <span style={{ fontSize: '30px' }}>😃</span>
                      <span className="slds-text-neutral-7 slds-font-weight_medium" style={{ fontSize: '9px' }}>Active</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeNavItem === 'solution-manager' ? (
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
                  <div className="slds-h-full slds-flex slds-flex-col">
                    {/* Breadcrumb */}
                    <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-flex slds-items-center slds-gap_x-small" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                      <button onClick={() => setSmActiveSolution(null)} className="slds-text-size_small slds-text-brand sf-hover-underline">Solution Manager</button>
                      <ChevronRight className="slds-icon-size_xx-small slds-text-neutral-7" />
                      <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{sol.title}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_small">
                      <div className="slds-flex slds-items-center slds-justify-between" style={{ marginBottom: '6px' }}>
                        <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-9">Overall Progress</span>
                        <span className="slds-text-size_small slds-font-weight_bold slds-text-brand">{progress}%</span>
                      </div>
                      <div className="slds-w-full slds-border-radius_pill slds-overflow-hidden" style={{ height: '8px', background: 'var(--slds-g-color-border-1)' }}>
                        <div
                          className="slds-h-full slds-border-radius_pill slds-transition-all"
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0070D2, #00A1E0)', transitionDuration: '500ms' }}
                        />
                      </div>
                    </div>

                    {/* Content: sidebar + steps */}
                    <div className="slds-flex slds-flex-1 slds-overflow-hidden">
                      {/* Step sidebar */}
                      <div className="slds-bg-white slds-border_right slds-border-color_border-1 slds-overflow-y-auto" style={{ width: '200px', minWidth: '200px' }}>
                        <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_border-1">
                          <span className="slds-font-weight_bold slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>Steps</span>
                        </div>
                        <nav className="slds-p-vertical_x-small">
                          {sol.steps.map((step, idx) => {
                            const status = prog[idx] || 'not-started';
                            const isActive = smActiveStep === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => smHandleStepClick(idx)}
                                className={`slds-w-full slds-flex slds-items-center slds-p-horizontal_medium slds-text-left slds-transition-colors ${
                                  isActive ? '' : 'sf-hover-bg-neutral'
                                }`}
                                style={{ gap: '10px', paddingTop: '10px', paddingBottom: '10px', ...(isActive ? { background: '#EEF4FF' } : {}) }}
                              >
                                <div className={`slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-flex-shrink-0 slds-text-size_small slds-font-weight_medium ${
                                  status === 'completed' ? 'slds-bg-success slds-text-white' :
                                  status === 'in-progress' ? 'slds-bg-brand slds-text-white' :
                                  'slds-text-neutral-7'
                                }`} style={{ width: '24px', height: '24px', ...(status === 'not-started' ? { border: '2px solid var(--slds-g-color-border-1)' } : {}) }}>
                                  {status === 'completed' ? <Check className="slds-icon-size_xx-small" /> : idx + 1}
                                </div>
                                <span className={`slds-text-size_small ${
                                  status === 'completed' ? 'slds-text-success slds-font-weight_medium' :
                                  status === 'in-progress' ? 'slds-text-brand slds-font-weight_semibold' :
                                  'slds-text-neutral-9'
                                }`} style={{ lineHeight: '1.25' }}>
                                  {step.title}
                                </span>
                              </button>
                            );
                          })}
                        </nav>
                        {/* Tutorial video placeholder */}
                        <div className="slds-m-horizontal_medium slds-m-bottom_medium slds-m-top_x-small slds-border-radius_large slds-border_all slds-border-color_border-1 slds-bg-neutral-2 slds-p-around_medium slds-text-center">
                          <Play className="slds-text-neutral-7 slds-m-bottom_x-small" style={{ width: '32px', height: '32px', margin: '0 auto 8px auto' }} />
                          <span className="slds-text-size_small slds-text-neutral-7">Tutorial Video</span>
                        </div>
                      </div>

                      {/* Step content */}
                      <div className="slds-flex-1 slds-overflow-y-auto slds-p-around_large">
                        <div style={{ maxWidth: '48rem' }}>
                          {/* Solution header */}
                          <div className="slds-m-bottom_large">
                            <h2 className="slds-text-size_x-large slds-font-weight_regular slds-text-neutral-base slds-m-bottom_xx-small">Integrate Business Entities from Informatica</h2>
                            <p className="slds-text-size_medium slds-text-neutral-7">{sol.headline}</p>
                          </div>

                          {/* Active step card */}
                          {(() => {
                            const step = sol.steps[smActiveStep];
                            if (!step) return null;
                            const status = prog[smActiveStep] || 'not-started';

                            // ── Step body renderer based on type ──
                            const renderStepBody = () => {
                              switch (step.type) {
                                case 'action':
                                  return (
                                    <>
                                      <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed" style={{ marginBottom: '20px' }}>{step.description}</p>
                                      {status !== 'completed' && (
                                        <button onClick={smHandleCompleteStep} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors">
                                          {step.actionLabel}
                                        </button>
                                      )}
                                    </>
                                  );

                                case 'form':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                      {step.fields.map((field, fi) => (
                                        <div key={fi}>
                                          <label className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base slds-m-bottom_xx-small" style={{ display: 'block', marginBottom: '4px' }}>
                                            {field.name} {field.required && <span className="slds-text-error">*</span>}
                                          </label>
                                          <div className="slds-pos-relative">
                                            <input
                                              type={field.inputType === 'password' ? (smFormPasswordVisible[`${smActiveSolution}-${smActiveStep}-${fi}`] ? 'text' : 'password') : field.inputType}
                                              placeholder={field.placeholder}
                                              className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small"
                                            />
                                            {field.inputType === 'password' && (
                                              <button
                                                type="button"
                                                onClick={() => setSmFormPasswordVisible(prev => ({ ...prev, [`${smActiveSolution}-${smActiveStep}-${fi}`]: !prev[`${smActiveSolution}-${smActiveStep}-${fi}`] }))}
                                                className="slds-pos-absolute slds-text-neutral-7"
                                                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                                              >
                                                {smFormPasswordVisible[`${smActiveSolution}-${smActiveStep}-${fi}`] ? <EyeOff className="slds-icon-size_small" /> : <Eye className="slds-icon-size_small" />}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {status !== 'completed' && (
                                        <button onClick={smHandleCompleteStep} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors slds-m-top_x-small">
                                          Validate Connection
                                        </button>
                                      )}
                                    </div>
                                  );

                                case 'multiselect':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                      {step.groups.map((group, gi) => (
                                        <div key={gi}>
                                          <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_x-small">{group.name}</div>
                                          <div className="slds-flex slds-flex-wrap slds-gap_x-small">
                                            {group.options.map((option, oi) => {
                                              const key = `${smActiveSolution}-${smActiveStep}-${gi}-${oi}`;
                                              const selected = smMultiselectState[key] || false;
                                              return (
                                                <button
                                                  key={oi}
                                                  onClick={() => setSmMultiselectState(prev => ({ ...prev, [key]: !prev[key] }))}
                                                  className={`slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border-radius_small slds-border_all slds-transition-colors ${
                                                    selected
                                                      ? 'slds-border-color_brand slds-text-brand slds-font-weight_medium'
                                                      : 'slds-bg-white slds-border-color_border-1 slds-text-neutral-9'
                                                  }`}
                                                  style={selected ? { background: '#EEF4FF' } : undefined}
                                                >
                                                  {selected && <Check className="slds-icon-size_xx-small" style={{ display: 'inline', marginRight: '6px' }} />}
                                                  {option}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'radio':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {step.options.map((option, oi) => {
                                        const key = `${smActiveSolution}-${smActiveStep}`;
                                        const selected = (smRadioState[key] ?? 0) === oi;
                                        return (
                                          <button
                                            key={oi}
                                            onClick={() => setSmRadioState(prev => ({ ...prev, [key]: oi }))}
                                            className={`slds-w-full slds-text-left slds-p-around_medium slds-border-radius_large slds-transition-all ${
                                              selected
                                                ? 'slds-border-color_brand'
                                                : 'slds-bg-white'
                                            }`}
                                            style={{ border: `2px solid ${selected ? 'var(--slds-g-color-brand)' : 'var(--slds-g-color-border-1)'}`, ...(selected ? { background: '#EEF4FF' } : {}) }}
                                          >
                                            <div className="slds-flex slds-items-start slds-gap_small">
                                              <div className={`slds-border-radius_pill slds-flex-shrink-0 slds-flex slds-items-center slds-justify-center ${
                                                selected ? 'slds-border-color_brand' : 'slds-border-color_border-1'
                                              }`} style={{ width: '16px', height: '16px', marginTop: '2px', border: `2px solid ${selected ? 'var(--slds-g-color-brand)' : 'var(--slds-g-color-border-1)'}` }}>
                                                {selected && <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '8px', height: '8px' }} />}
                                              </div>
                                              <div>
                                                <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">{option.label}</div>
                                                <p className="slds-text-size_small slds-text-neutral-9 slds-m-top_xx-small slds-leading-relaxed">{option.description}</p>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );

                                case 'table-list':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {step.tables.map((table, ti) => (
                                        <div key={ti} className="slds-flex slds-items-center slds-justify-between slds-p-around_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ background: '#FAFAF9' }}>
                                          <span className="slds-text-size_medium slds-text-neutral-base" style={{ fontFamily: 'monospace' }}>{table}</span>
                                          <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-brand slds-border_all slds-border-color_border-1 slds-border-radius_small slds-transition-colors" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                            Review Mappings & Create Fields
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'preview':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                      {step.items.map((item, pi) => (
                                        <div key={pi}>
                                          <p className="slds-text-size_medium slds-text-neutral-9 slds-m-bottom_x-small">{item.description}</p>
                                          <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-brand slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral slds-transition-colors" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                            {item.name} &rarr;
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'rules-list':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {step.rules.map((rule, ri) => (
                                        <div key={ri} className="slds-flex slds-items-center slds-justify-between slds-p-around_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ background: '#FAFAF9' }}>
                                          <div>
                                            <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{rule.name}</div>
                                            <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xxx-small">{rule.description}</p>
                                          </div>
                                          <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-brand slds-border_all slds-border-color_border-1 slds-border-radius_small slds-transition-colors slds-flex-shrink-0 slds-m-left_medium" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                                            Configure
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'toggle': {
                                  const toggleKey = `${smActiveSolution}-${smActiveStep}`;
                                  const isOn = smToggleState[toggleKey] || false;
                                  return (
                                    <>
                                      <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed" style={{ marginBottom: '20px' }}>{step.description}</p>
                                      <div className="slds-flex slds-items-center slds-gap_small slds-m-bottom_medium">
                                        <button
                                          onClick={() => setSmToggleState(prev => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
                                          className={`slds-pos-relative slds-border-radius_pill slds-transition-colors ${isOn ? 'slds-bg-brand' : ''}`}
                                          style={{ width: '48px', height: '24px', ...(!isOn ? { background: 'var(--slds-g-color-border-1)' } : {}) }}
                                        >
                                          <div className="slds-pos-absolute slds-border-radius_pill slds-bg-white slds-shadow_small slds-transition-all" style={{ top: '2px', width: '20px', height: '20px', left: isOn ? '26px' : '2px' }} />
                                        </button>
                                        <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">
                                          {isOn ? 'Sync Enabled' : 'Sync Disabled'}
                                        </span>
                                      </div>
                                    </>
                                  );
                                }

                                case 'substeps':
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {step.substeps.map((substep, si) => (
                                        <div key={si} className="slds-flex slds-items-center slds-justify-between slds-p-around_small slds-border_all slds-border-color_border-1 slds-border-radius_small" style={{ background: '#FAFAF9' }}>
                                          <div>
                                            <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{substep.name}</div>
                                            <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xxx-small">{substep.description}</p>
                                          </div>
                                          <a href={substep.link} target="_blank" rel="noopener noreferrer" className="slds-text-size_small slds-font-weight_medium slds-text-brand sf-hover-underline slds-flex-shrink-0 slds-m-left_medium slds-flex slds-items-center slds-gap_xx-small">
                                            View Trailhead <ExternalLink className="slds-icon-size_xx-small" />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'text-links':
                                  return (
                                    <>
                                      <div className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed" style={{ marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: step.description }} />
                                      {step.links.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {step.links.map((link, li) => (
                                            <a key={li} href={link.url} target="_blank" rel="noopener noreferrer" className="slds-flex slds-items-center slds-gap_x-small slds-text-size_medium slds-text-brand sf-hover-underline">
                                              <ExternalLink className="slds-icon-size_x-small slds-flex-shrink-0" />
                                              {link.label}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  );

                                default:
                                  return null;
                              }
                            };

                            return (
                              <div className={`sf-card slds-m-bottom_medium`} style={status === 'completed' ? { boxShadow: '0 0 0 2px rgba(46,132,74,0.3)' } : undefined}>
                                <div className="sf-card-header">
                                  <div className="slds-flex slds-items-center slds-gap_small">
                                    <div className={`slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-text-size_medium slds-font-weight_bold ${
                                      status === 'completed' ? 'slds-bg-success slds-text-white' :
                                      'slds-bg-brand slds-text-white'
                                    }`} style={{ width: '32px', height: '32px' }}>
                                      {status === 'completed' ? <Check className="slds-icon-size_small" /> : smActiveStep + 1}
                                    </div>
                                    <div>
                                      <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">{step.title}</h3>
                                      <p className="slds-text-size_small slds-text-neutral-7">{step.headline}</p>
                                    </div>
                                    {step.type === 'action' && step.system && (
                                      <span className={`slds-font-weight_bold slds-text-uppercase slds-tracking-wide slds-border-radius_small ${
                                        step.system === 'D360'
                                          ? 'slds-text-brand'
                                          : ''
                                      }`} style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '10px', background: step.system === 'D360' ? '#EEF4FF' : '#FFF3ED', color: step.system === 'D360' ? undefined : '#D95800' }}>
                                        {step.system === 'D360' ? '\u2601 ' : '\u2699 '}{step.system}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="sf-card-body">
                                  {renderStepBody()}
                                  {status === 'completed' && (
                                    <div className="slds-flex slds-items-center slds-gap_x-small slds-text-size_medium slds-text-success slds-font-weight_medium slds-m-top_medium">
                                      <CheckCircle2 className="slds-icon-size_small" />
                                      Step completed
                                    </div>
                                  )}
                                </div>
                                {/* Step footer */}
                                <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_medium slds-p-vertical_small slds-border_top slds-border-color_border-1" style={{ padding: '12px 20px', background: '#FAFAF9' }}>
                                  <div className="slds-flex slds-items-center slds-gap_small">
                                    <button className="slds-text-size_small slds-text-brand sf-hover-underline slds-flex slds-items-center slds-gap_xx-small">
                                      <FileText className="slds-icon-size_xx-small" /> Documentation
                                    </button>
                                    <button className="slds-text-size_small slds-text-brand sf-hover-underline slds-flex slds-items-center slds-gap_xx-small">
                                      <BookOpen className="slds-icon-size_xx-small" /> Tutorial
                                    </button>
                                  </div>
                                  <div className="slds-flex slds-items-center slds-gap_x-small">
                                    {smActiveStep > 0 && (
                                      <button
                                        onClick={() => smHandleStepClick(smActiveStep - 1)}
                                        className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral"
                                        style={{ paddingTop: '6px', paddingBottom: '6px' }}
                                      >
                                        &larr; Previous
                                      </button>
                                    )}
                                    {smActiveStep < sol.steps.length - 1 ? (
                                      <button
                                        onClick={smHandleCompleteStep}
                                        className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small"
                                        style={{ paddingTop: '6px', paddingBottom: '6px' }}
                                      >
                                        Next Step &rarr;
                                      </button>
                                    ) : (
                                      <button
                                        onClick={smHandleCompleteStep}
                                        className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-bg-success slds-border-radius_small"
                                        style={{ paddingTop: '6px', paddingBottom: '6px' }}
                                      >
                                        Complete &#10003;
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
              <div className="slds-p-around_large">
                <div className="slds-m-bottom_large">
                  <h1 className="slds-text-size_xx-large slds-font-weight_regular slds-text-neutral-base slds-m-bottom_xx-small">Solution Manager</h1>
                  <p className="slds-text-size_medium slds-text-neutral-7">Explore and implement data management solutions</p>
                </div>
                <div className="slds-css-grid slds-css-grid-cols-2" style={{ gap: '20px' }}>
                  {smTiles.map((tile) => {
                    const progress = smGetProgress(tile.id);
                    return (
                      <button
                        key={tile.id}
                        onClick={() => { setSmActiveSolution(tile.id); setSmActiveStep(0); }}
                        className="slds-text-left slds-bg-white slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_large slds-transition-all"
                      >
                        <span className="slds-font-weight_bold slds-text-brand slds-border-radius_small slds-m-bottom_small" style={{ display: 'inline-block', padding: '4px 8px', fontSize: '11px', background: '#EEF4FF' }}>
                          {tile.badge}
                        </span>
                        <h3 className="slds-text-size_large slds-font-weight_semibold slds-text-brand slds-m-bottom_x-small" style={{ lineHeight: '1.3' }}>{tile.title}</h3>
                        <p className="slds-text-size_medium slds-text-neutral-9 slds-leading-relaxed slds-m-bottom_small">{tile.description}</p>
                        {smSolutions[tile.id] && (
                          <div className="slds-flex slds-items-center slds-gap_x-small">
                            <div className="slds-flex-1 slds-border-radius_pill slds-overflow-hidden" style={{ height: '6px', background: 'var(--slds-g-color-border-1)' }}>
                              <div className="slds-h-full slds-border-radius_pill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0070D2, #00A1E0)' }} />
                            </div>
                            <span className="slds-font-weight_bold slds-text-brand" style={{ fontSize: '10px' }}>{progress}%</span>
                          </div>
                        )}
                        {tile.id === 'CH' && (
                          <div className="slds-m-top_x-small slds-text-size_small slds-text-neutral-7" style={{ fontStyle: 'italic' }}>Work in progress</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (activeNavItem === 'salesforce-crm' || activeNavItem === 'informatica-mdm' || activeNavItem === 'informatica-mdm-sf') ? (
            <div className="slds-p-around_large">
              {/* Page header */}
              <div className="sf-card slds-m-bottom_large slds-pos-relative">
                {isInformatica && (
                  <div className="slds-pos-absolute slds-font-weight_bold slds-text-uppercase slds-tracking-wide slds-text-white" style={{ top: 0, right: 0, padding: '2px 10px', fontSize: '10px', background: '#FF4A00', borderBottomLeftRadius: '8px', borderTopRightRadius: '7px' }}>
                    New to Salesforce
                  </div>
                )}
                <div className="slds-p-around_medium slds-flex slds-items-center slds-gap_medium" style={{ padding: '20px' }}>
                  <div className={`slds-border-radius_large slds-flex slds-items-center slds-justify-center slds-flex-shrink-0`} style={{ width: '48px', height: '48px', background: isInformatica ? '#FF4A00' : 'var(--slds-g-color-neutral-7)' }}>
                    <Settings className="slds-icon-size_large slds-text-white" />
                  </div>
                  <div className="slds-flex-1">
                    <div className="slds-text-size_small slds-font-weight_medium slds-text-brand slds-text-uppercase slds-tracking-wide">SETUP</div>
                    <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>{connectorName}</h1>
                  </div>
                  <button
                    onClick={handleOpenConnectOrg}
                    className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-border-radius_small slds-transition-colors"
                    style={{ background: isInformatica ? '#FF4A00' : 'var(--slds-g-color-brand)' }}
                  >
                    New
                  </button>
                </div>
              </div>

              {/* Standard Connections */}
              <div className="sf-card slds-m-bottom_large">
                <div className="sf-card-header">
                  <div className="slds-flex slds-items-center" style={{ gap: '6px' }}>
                    <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Standard Connections</h2>
                    <Info className="slds-icon-size_x-small slds-text-neutral-7" />
                  </div>
                </div>
                {currentConnections.length === 0 ? (
                  <div className="sf-card-body slds-text-center slds-p-vertical_x-large" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
                    <div className="slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-m-bottom_medium" style={{ width: '64px', height: '64px', margin: '0 auto 16px auto', background: isInformatica ? '#FFF3ED' : 'var(--slds-g-color-neutral-2)' }}>
                      <Zap style={{ width: '28px', height: '28px', color: isInformatica ? '#FF4A00' : 'var(--slds-g-color-neutral-7)' }} />
                    </div>
                    <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base slds-m-bottom_xx-small">No connections configured</p>
                    <p className="slds-text-size_small slds-text-neutral-7 slds-m-bottom_medium">
                      {isInformatica
                        ? 'Connect your Informatica MDM instance to start syncing master data with Data Cloud.'
                        : 'Click "New" to connect a Salesforce org.'}
                    </p>
                    <button
                      onClick={handleOpenConnectOrg}
                      className="slds-inline-flex slds-items-center slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-border-radius_small slds-transition-colors"
                      style={{ gap: '6px', background: isInformatica ? '#FF4A00' : 'var(--slds-g-color-brand)' }}
                    >
                      <Plus className="slds-icon-size_small" /> Connect {isInformatica ? 'Informatica MDM' : 'an Org'}
                    </button>
                  </div>
                ) : (
                  <div className="slds-overflow-x-auto">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Connection Name <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Alias <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Connection Status <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">Last Updated <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                          <th><div className="slds-flex slds-items-center slds-gap_xx-small">{isInformatica ? 'Tenant Id' : 'Org Id'} <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentConnections.map((conn, i) => (
                          <tr key={conn.id}>
                            <td className="slds-text-center slds-text-neutral-7">{i + 1}</td>
                            <td className="sf-link slds-font-weight_medium">{conn.connectionName}</td>
                            <td>{conn.alias}</td>
                            <td>{conn.connectionStatus}</td>
                            <td>{conn.lastUpdated}</td>
                            <td className="slds-text-size_small" style={{ fontFamily: 'monospace' }}>{conn.orgId}</td>
                            <td>
                              <button className="slds-flex slds-items-center slds-justify-center slds-border-radius_small sf-hover-bg-neutral slds-text-neutral-7" style={{ width: '24px', height: '24px' }}>
                                <ChevronDown className="slds-icon-size_x-small" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Standard Data Bundles — only show for Informatica when at least one connection exists */}
              {(!isInformatica || currentConnections.length > 0) && (
              <div className="sf-card">
                <div className="sf-card-header">
                  <div className="slds-flex slds-items-center" style={{ gap: '6px' }}>
                    <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Standard Data Bundles</h2>
                    <Info className="slds-icon-size_x-small slds-text-neutral-7" />
                  </div>
                </div>
                <div className="slds-overflow-x-auto">
                  <table className="sf-table">
                    <thead>
                      <tr>
                        <th><div className="slds-flex slds-items-center slds-gap_xx-small">Name <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                        <th><div className="slds-flex slds-items-center slds-gap_xx-small">Installed Version <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                        <th><div className="slds-flex slds-items-center slds-gap_xx-small">Latest Version <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                        <th style={{ width: '96px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBundles.map((bundle) => {
                        const isInstalled = demoSession?.selectedBundles.includes(bundle.name);
                        return (
                        <tr key={bundle.name}>
                          <td className="sf-link slds-font-weight_medium">
                            <span className="slds-flex slds-items-center slds-gap_x-small">
                              {bundle.name}
                              {bundle.fieldTag && (
                                <span className="slds-font-weight_bold slds-text-white slds-border-radius_small" style={{ padding: '2px 6px', fontSize: '9px', background: isInformatica ? '#FF4A00' : 'var(--slds-g-color-brand)' }}>{bundle.fieldTag}</span>
                              )}
                            </span>
                          </td>
                          <td>{isInstalled ? bundle.latestVersion : bundle.installedVersion}</td>
                          <td>{bundle.latestVersion}</td>
                          <td>
                            {isInstalled ? (
                              <span className="slds-inline-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-font-weight_medium slds-text-success">
                                <CheckCircle2 className="slds-icon-size_x-small" /> Installed
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setInstallModalBundle(bundle);
                                  setInstallModalChoice('admins');
                                  setInstallModalLoading(false);
                                  setInstallModalOpen(true);
                                }}
                                className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-text-white slds-border-radius_small slds-transition-colors"
                                style={{ paddingTop: '4px', paddingBottom: '4px', background: isInformatica ? '#FF4A00' : 'var(--slds-g-color-brand)' }}
                              >
                                Install
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          ) : activeNavItem === 'installed-packages' ? (
            /* ═══════════════════════════════════════════════════════════
               INSTALLED PACKAGES PAGE
               ═══════════════════════════════════════════════════════════ */
            <div>
              {/* Page header */}
              <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium slds-flex slds-items-center slds-gap_medium">
                <div className="slds-flex slds-items-center slds-justify-center slds-flex-shrink-0 slds-border-radius_small" style={{ width: '40px', height: '40px', background: '#F49756' }}>
                  <LayoutGrid className="slds-icon-size_default slds-text-white" />
                </div>
                <div>
                  <div className="slds-text-size_small slds-font-weight_medium slds-text-brand slds-text-uppercase slds-tracking-wide">SETUP</div>
                  <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>Installed Packages</h1>
                </div>
              </div>

              <div className="slds-p-around_large">
                {/* Package Detail view */}
                {detailPackage ? (
                  <div>
                    <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_medium">
                      <div>
                        <div className="slds-text-size_small slds-text-neutral-7" style={{ marginBottom: '2px' }}>Package Details</div>
                        <h2 className="slds-text-size_x-large slds-font-weight_bold slds-text-neutral-base">{detailPackage.name} (Managed)</h2>
                      </div>
                      <button className="slds-text-size_medium slds-text-brand sf-hover-underline">Help for this Page</button>
                    </div>

                    {/* Installed Package Detail card */}
                    <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small slds-m-bottom_large">
                      <div className={`slds-p-horizontal_medium slds-border_bottom slds-flex slds-items-center slds-justify-between`} style={{ paddingTop: '10px', paddingBottom: '10px', background: detailPackage.isInformatica ? '#FFF3ED' : '#FAFAF9', borderBottomColor: detailPackage.isInformatica ? '#FFD6C0' : 'var(--slds-g-color-border-1)' }}>
                        <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Installed Package Detail</span>
                        <div className="slds-flex slds-items-center slds-gap_x-small">
                          <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Uninstall</button>
                          <button onClick={() => setPackageDetailName('__components__:' + detailPackage.name)} className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>View Components</button>
                          <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Become Primary Contact</button>
                          <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>View Dependencies</button>
                        </div>
                      </div>
                      <div className="slds-bg-white">
                        <table className="slds-w-full slds-text-size_medium">
                          <tbody>
                            {[
                              ['Package Name', detailPackage.name, 'Version Number', detailPackage.versionNumber],
                              ['Language', detailPackage.language || 'English', 'First Installed Version Number', detailPackage.versionNumber],
                              ['Version Name', detailPackage.versionName || '', 'Package Type', detailPackage.packageType || 'Managed'],
                              ['Namespace Prefix', detailPackage.namespacePrefix, 'Modified By', `Data Cloud, ${detailPackage.installDate}`],
                              ['Version Setting', 'namespace', '', ''],
                              ['Package', detailPackage.packageId || '', '', ''],
                              ['Publisher', detailPackage.publisher, '', ''],
                              ['Description', detailPackage.description || '', '', ''],
                              ['Installed By', `Data Cloud, ${detailPackage.installDate}`, '', ''],
                            ].map(([label1, val1, label2, val2], i) => (
                              <tr key={i} className="slds-border_bottom slds-border-color_border-1" style={{ borderBottom: '1px solid var(--slds-g-color-border-1)' }}>
                                <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-right slds-text-neutral-7 slds-font-weight_medium slds-nowrap" style={{ width: '160px' }}>{label1}</td>
                                <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-neutral-base">{val1}</td>
                                {label2 && <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-right slds-text-neutral-7 slds-font-weight_medium slds-nowrap" style={{ width: '200px' }}>{label2}</td>}
                                {label2 && <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-neutral-base">{val2}</td>}
                                {!label2 && <td colSpan={2}></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="slds-border_top slds-border-color_border-1 slds-p-horizontal_medium slds-p-vertical_small slds-flex slds-items-center slds-gap_x-large">
                          <div className="slds-flex slds-items-center slds-gap_x-small">
                            <span className="slds-text-size_medium slds-text-neutral-7 slds-font-weight_medium">Count Towards Limits</span>
                            <input type="checkbox" checked={detailPackage.limits} readOnly style={{ width: '16px', height: '16px' }} />
                          </div>
                          <div className="slds-flex slds-items-center slds-gap_x-large" style={{ marginLeft: 'auto' }}>
                            <span className="slds-text-size_medium"><span className="slds-text-neutral-7 slds-font-weight_medium">Tabs</span> {detailPackage.tabs}</span>
                          </div>
                        </div>
                        <div className="slds-border_top slds-border-color_border-1 slds-p-horizontal_medium slds-p-vertical_small slds-flex slds-items-center slds-gap_x-large">
                          <span className="slds-text-size_medium"><span className="slds-text-neutral-7 slds-font-weight_medium">Apps</span> {detailPackage.apps}</span>
                          <span className="slds-text-size_medium" style={{ marginLeft: 'auto' }}><span className="slds-text-neutral-7 slds-font-weight_medium">Objects</span> {detailPackage.objects}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                ) : packageDetailName?.startsWith('__components__:') ? (
                  /* ═══ VIEW COMPONENTS PAGE ═══ */
                  (() => {
                    const compPkgName = packageDetailName.replace('__components__:', '');
                    const compPkg = installedPackages.find((p) => p.name === compPkgName);
                    const components = compPkg?.isInformatica ? getInformaticaComponents(compPkgName) : [];
                    return (
                      <div>
                        <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_medium">
                          <div>
                            <div className="slds-text-size_small slds-text-neutral-7" style={{ marginBottom: '2px' }}>Package Details</div>
                            <h2 className="slds-text-size_x-large slds-font-weight_bold slds-text-neutral-base">{compPkgName} (Managed)</h2>
                          </div>
                          <button className="slds-text-size_medium slds-text-brand sf-hover-underline">Help for this Page</button>
                        </div>

                        {/* Installed Package Detail — compact (no View Components button) */}
                        <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small slds-m-bottom_large">
                          <div className={`slds-p-horizontal_medium slds-border_bottom slds-flex slds-items-center slds-justify-between`} style={{ paddingTop: '10px', paddingBottom: '10px', background: compPkg?.isInformatica ? '#FFF3ED' : '#FAFAF9', borderBottomColor: compPkg?.isInformatica ? '#FFD6C0' : 'var(--slds-g-color-border-1)' }}>
                            <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Installed Package Detail</span>
                            <div className="slds-flex slds-items-center slds-gap_x-small">
                              <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Uninstall</button>
                              <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>Become Primary Contact</button>
                              <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral" style={{ paddingTop: '4px', paddingBottom: '4px' }}>View Dependencies</button>
                            </div>
                          </div>
                          <div className="slds-bg-white">
                            <table className="slds-w-full slds-text-size_medium">
                              <tbody>
                                {[
                                  ['Package Name', compPkg?.name || '', 'Version Number', compPkg?.versionNumber || ''],
                                  ['Language', compPkg?.language || 'English', 'First Installed Version Number', compPkg?.versionNumber || ''],
                                  ['Version Name', compPkg?.versionName || '', 'Package Type', compPkg?.packageType || 'Managed'],
                                  ['Namespace Prefix', compPkg?.namespacePrefix || '', 'Modified By', `Data Cloud, ${compPkg?.installDate || ''}`],
                                  ['Version Setting', 'namespace', '', ''],
                                  ['Package', compPkg?.packageId || '', '', ''],
                                  ['Publisher', compPkg?.publisher || '', '', ''],
                                  ['Description', compPkg?.description || '', '', ''],
                                  ['Installed By', `Data Cloud, ${compPkg?.installDate || ''}`, '', ''],
                                ].map(([label1, val1, label2, val2], i) => (
                                  <tr key={i} className="slds-border_bottom slds-border-color_border-1" style={{ borderBottom: '1px solid var(--slds-g-color-border-1)' }}>
                                    <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-right slds-text-neutral-7 slds-font-weight_medium slds-nowrap" style={{ width: '160px' }}>{label1}</td>
                                    <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-neutral-base">{val1}</td>
                                    {label2 && <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-right slds-text-neutral-7 slds-font-weight_medium slds-nowrap" style={{ width: '200px' }}>{label2}</td>}
                                    {label2 && <td className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-neutral-base">{val2}</td>}
                                    {!label2 && <td colSpan={2}></td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="slds-border_top slds-border-color_border-1 slds-p-horizontal_medium slds-p-vertical_small slds-flex slds-items-center slds-gap_x-large">
                              <span className="slds-text-size_medium"><span className="slds-text-neutral-7 slds-font-weight_medium">Count Towards Limits</span></span>
                              <input type="checkbox" checked={compPkg?.limits || false} readOnly style={{ width: '16px', height: '16px' }} />
                              <span className="slds-text-size_medium" style={{ marginLeft: 'auto' }}><span className="slds-text-neutral-7 slds-font-weight_medium">Tabs</span> {compPkg?.tabs || 0}</span>
                            </div>
                            <div className="slds-border_top slds-border-color_border-1 slds-p-horizontal_medium slds-p-vertical_small slds-flex slds-items-center slds-gap_x-large">
                              <span className="slds-text-size_medium"><span className="slds-text-neutral-7 slds-font-weight_medium">Apps</span> {compPkg?.apps || 0}</span>
                              <span className="slds-text-size_medium" style={{ marginLeft: 'auto' }}><span className="slds-text-neutral-7 slds-font-weight_medium">Objects</span> {compPkg?.objects || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Components Included in Package */}
                        <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small">
                          <div className={`slds-p-horizontal_medium slds-border_bottom`} style={{ paddingTop: '10px', paddingBottom: '10px', background: compPkg?.isInformatica ? '#FFF3ED' : '#FAFAF9', borderBottomColor: compPkg?.isInformatica ? '#FFD6C0' : 'var(--slds-g-color-border-1)' }}>
                            <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Metadata Components Included in Package</span>
                          </div>
                          <div className="slds-overflow-x-auto slds-bg-white">
                            <table className="slds-w-full slds-text-size_medium">
                              <thead>
                                <tr className="slds-border_bottom slds-border-color_border-1" style={{ background: '#FAFAF9' }}>
                                  <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '40px' }}>Action</th>
                                  <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">Component Name</th>
                                  <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '120px' }}>Parent Object</th>
                                  <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '180px' }}>Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {components.map((comp, i) => (
                                  <tr key={i} className="slds-border_bottom slds-border-color_border-1" style={{ borderBottom: '1px solid var(--slds-g-color-border-1)' }}>
                                    <td className="slds-p-horizontal_small" style={{ paddingTop: '6px', paddingBottom: '6px' }}></td>
                                    <td className="slds-p-horizontal_small slds-text-brand sf-hover-underline slds-cursor-pointer slds-text-size_small" style={{ paddingTop: '6px', paddingBottom: '6px', fontFamily: 'monospace' }}>{comp.name}</td>
                                    <td className="slds-p-horizontal_small slds-text-neutral-7" style={{ paddingTop: '6px', paddingBottom: '6px' }}>{comp.parentObject}</td>
                                    <td className="slds-p-horizontal_small slds-text-neutral-base" style={{ paddingTop: '6px', paddingBottom: '6px' }}>{comp.type}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()

                ) : (
                  /* ═══ INSTALLED PACKAGES LIST ═══ */
                  <div>
                    {/* Intro text */}
                    <div className="slds-m-bottom_large">
                      <h2 className="slds-text-size_large slds-font-weight_bold slds-text-neutral-base slds-m-bottom_small">Installed Packages</h2>
                      <div className="slds-flex slds-gap_large">
                        <div className="slds-flex-1 slds-text-size_medium slds-text-neutral-9" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p>On AppExchange you can browse, test drive, download, and install pre-built apps and components right into your salesforce.com environment. <button className="slds-text-brand sf-hover-underline">Learn More about Installing Packages</button>.</p>
                          <p>Apps and components are installed in packages. Any custom apps, tabs, and custom objects are initially marked as "In Development" and are not deployed to your users. This allows you to test and customize before deploying. You can deploy the components individually using the other features in setup or as a group by clicking Deploy.</p>
                          <p>Depending on the links next to an installed package, you can take different actions from this page.</p>
                          <p>To remove a package, click <strong>Uninstall</strong>. To manage your package licenses, click <strong>Manage Licenses</strong>.</p>
                        </div>
                        <div className="slds-flex-shrink-0 slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_medium slds-text-center" style={{ width: '200px' }}>
                          <div className="slds-w-full slds-border-radius_small slds-flex slds-items-center slds-justify-center slds-m-bottom_x-small" style={{ height: '48px', background: 'linear-gradient(to right, #00A1E0, var(--slds-g-color-brand-2))' }}>
                            <span className="slds-text-white slds-font-weight_bold slds-text-size_small">salesforce appexchange</span>
                          </div>
                          <button className="slds-text-size_medium slds-text-brand slds-font-weight_medium sf-hover-underline">Visit AppExchange &raquo;</button>
                        </div>
                      </div>
                    </div>

                    {/* Installed Packages table */}
                    <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small slds-m-bottom_large">
                      <div className="slds-p-horizontal_medium slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '10px', paddingBottom: '10px', background: '#FAFAF9' }}>
                        <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Installed Packages</span>
                      </div>
                      <div className="slds-overflow-x-auto slds-bg-white">
                        <table className="slds-w-full slds-text-size_medium">
                          <thead>
                            <tr className="slds-border_bottom slds-border-color_border-1">
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '70px' }}>Action</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">Package Name</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">Publisher</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">Version Number</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">Namespace Prefix</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">Install Date</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '50px' }}>Limits</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '40px' }}>Apps</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '40px' }}>Tabs</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-size_small slds-font-weight_semibold slds-text-neutral-base" style={{ width: '50px' }}>Objects</th>
                              <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-text-size_small slds-font-weight_semibold slds-text-neutral-base">AppExchange Ready</th>
                            </tr>
                          </thead>
                          <tbody>
                            {installedPackages.map((pkg, i) => (
                              <tr key={i} className="slds-border_bottom slds-border-color_border-1" style={{ borderBottom: '1px solid var(--slds-g-color-border-1)' }}>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-brand sf-hover-underline slds-cursor-pointer slds-text-size_small">Uninstall</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small">
                                  <button
                                    onClick={() => setPackageDetailName(pkg.name)}
                                    className={`slds-text-size_medium sf-hover-underline ${pkg.isInformatica ? 'slds-font-weight_medium' : 'slds-text-brand'}`}
                                    style={pkg.isInformatica ? { color: '#FF4A00' } : undefined}
                                  >
                                    {pkg.name}
                                  </button>
                                  {pkg.description && i === 0 && (
                                    <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xxx-small slds-m-left_medium">{pkg.description}</div>
                                  )}
                                </td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-base">{pkg.publisher}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-base">{pkg.versionNumber}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-base">{pkg.namespacePrefix}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-base slds-nowrap">{pkg.installDate}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center">{pkg.limits ? <Check className="slds-icon-size_small slds-text-neutral-base" style={{ margin: '0 auto' }} /> : ''}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-neutral-base">{pkg.apps}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-neutral-base">{pkg.tabs}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-neutral-base">{pkg.objects}</td>
                                <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-base">{pkg.appExchangeReady}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Uninstalled Packages */}
                    <div className="slds-border_all slds-border-color_border-1 slds-border-radius_small">
                      <div className="slds-p-horizontal_medium slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '10px', paddingBottom: '10px', background: '#FAFAF9' }}>
                        <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Uninstalled Packages</span>
                      </div>
                      <div className="slds-bg-white slds-p-horizontal_medium slds-p-vertical_small slds-text-size_medium slds-text-neutral-7">
                        No uninstalled package data archives
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Generic setup page placeholder */
            <div className="slds-p-around_large">
              <div className="sf-card">
                <div className="sf-card-header">
                  <h1 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">{currentPageLabel}</h1>
                </div>
                <div className="sf-card-body">
                  <p className="slds-text-size_medium slds-text-neutral-7">Setup content for {currentPageLabel}.</p>
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
        <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
          <div className="slds-pos-absolute slds-inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setConnectOrgOpen(false)} />

          {/* Step: Login */}
          {wizardStep === 'login' ? (
            <div className="slds-pos-relative slds-border-radius_large slds-shadow_large slds-flex slds-flex-col slds-items-center" style={{ background: '#F0F2F5', width: '480px', padding: '48px 32px' }}>
              <button onClick={() => setConnectOrgOpen(false)} className="slds-pos-absolute slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-text-neutral-7" style={{ top: '12px', right: '12px', width: '28px', height: '28px' }}>
                <X className="slds-icon-size_small" />
              </button>
              {/* Logo */}
              {isInformatica ? (
                <div className="slds-m-bottom_x-large" style={{ marginBottom: '32px' }}>
                  <InformaticaLogo style={{ height: '56px', width: 'auto' }} />
                </div>
              ) : (
                <div className="slds-m-bottom_x-large" style={{ marginBottom: '32px' }}>
                  <SalesforceCloudLogo size={100} />
                </div>
              )}
              {/* Login form */}
              <div className="slds-w-full slds-bg-white slds-border-radius_large slds-p-around_large" style={{ border: '1px solid #D8DDE6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="slds-text-size_medium slds-text-brand slds-m-bottom_xx-small" style={{ display: 'block', marginBottom: '4px' }}>Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="slds-w-full slds-p-horizontal_small slds-text-size_medium slds-border-radius_small"
                    style={{ paddingTop: '10px', paddingBottom: '10px', border: '1px solid #D8DDE6' }}
                  />
                </div>
                <div>
                  <label className="slds-text-size_medium slds-text-brand slds-m-bottom_xx-small" style={{ display: 'block', marginBottom: '4px' }}>Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="slds-w-full slds-p-horizontal_small slds-text-size_medium slds-border-radius_small"
                    style={{ paddingTop: '10px', paddingBottom: '10px', border: '1px solid #D8DDE6' }}
                  />
                </div>
                <button
                  onClick={handleWizardNext}
                  className="slds-w-full slds-text-size_medium slds-font-weight_medium slds-text-white slds-border-radius_small slds-transition-colors"
                  style={{ paddingTop: '10px', paddingBottom: '10px', background: '#4A89DC' }}
                >
                  Log In
                </button>
                <label className="slds-flex slds-items-center slds-gap_x-small slds-cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span className="slds-text-size_medium slds-text-neutral-base">Remember me</span>
                </label>
                <div className="slds-border_top slds-p-top_small slds-flex slds-items-center slds-justify-between" style={{ borderTopColor: '#D8DDE6' }}>
                  <button className="slds-text-size_medium slds-text-brand sf-hover-underline">Forgot Your Password?</button>
                  <button className="slds-text-size_medium slds-text-brand sf-hover-underline">Use Custom Domain</button>
                </div>
              </div>
            </div>
          ) : wizardStep === 'permissions' ? (
            /* Step: Permissions / Allow Access */
            <div className="slds-pos-relative slds-border-radius_large slds-shadow_large slds-flex slds-flex-col slds-items-center" style={{ background: '#F0F2F5', width: '520px', padding: '48px 32px' }}>
              <button onClick={() => setConnectOrgOpen(false)} className="slds-pos-absolute slds-flex slds-items-center slds-justify-center slds-border-radius_small slds-text-neutral-7" style={{ top: '12px', right: '12px', width: '28px', height: '28px' }}>
                <X className="slds-icon-size_small" />
              </button>
              {/* Logo */}
              {isInformatica ? (
                <div className="slds-m-bottom_large">
                  <InformaticaLogo style={{ height: '56px', width: 'auto' }} />
                </div>
              ) : (
                <div className="slds-m-bottom_large">
                  <SalesforceCloudLogo size={100} />
                </div>
              )}
              <h2 className="slds-text-size_xx-large slds-text-neutral-7 slds-m-bottom_large">Allow Access?</h2>
              <div className="slds-w-full slds-bg-white slds-border-radius_large slds-p-around_large" style={{ border: '1px solid #D8DDE6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="slds-text-size_medium slds-text-neutral-9">
                  {isInformatica ? 'Informatica MDM' : 'Data Cloud Salesforce'} Org Registration is asking to:
                </p>
                <ul className="slds-text-size_medium slds-text-neutral-base" style={{ listStyleType: 'disc', marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Access the identity URL service</li>
                  <li>Access unique user identifiers</li>
                  <li>Manage user data via APIs</li>
                </ul>
                <p className="slds-text-size_medium slds-text-neutral-9">
                  Do you want to allow access for<br />
                  {loginUsername}? (<button className="slds-text-brand sf-hover-underline">Not you?</button>)
                </p>
                <div className="slds-flex slds-items-center slds-gap_small slds-p-top_x-small">
                  <button
                    onClick={() => setConnectOrgOpen(false)}
                    className="slds-flex-1 slds-text-size_medium slds-font-weight_medium slds-text-brand slds-border-radius_small sf-hover-bg-neutral slds-transition-colors"
                    style={{ paddingTop: '10px', paddingBottom: '10px', border: '1px solid #D8DDE6' }}
                  >
                    Deny
                  </button>
                  <button
                    onClick={handleAllowAccess}
                    className="slds-flex-1 slds-text-size_medium slds-font-weight_medium slds-text-white slds-border-radius_small slds-transition-colors"
                    style={{ paddingTop: '10px', paddingBottom: '10px', background: '#4A89DC' }}
                  >
                    Allow
                  </button>
                </div>
                <p className="slds-text-size_small slds-text-neutral-7 slds-p-top_x-small">
                  To revoke access at any time, go to your personal settings.
                </p>
              </div>
            </div>
          ) : (
            /* Steps: select-type & alias */
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col" style={{ width: '640px', maxHeight: '85vh' }}>
              {/* Header */}
              <div className="slds-text-center slds-p-vertical_large slds-border_bottom slds-border-color_border-1">
                <h2 className="slds-text-size_x-large slds-font-weight_regular slds-text-neutral-base">
                  {isInformatica ? 'Connect an Informatica Tenant' : 'Connect an Org'}
                </h2>
              </div>

              {/* Body */}
              <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_x-large slds-p-vertical_large">
                {wizardStep === 'select-type' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <p className="slds-text-size_medium slds-text-neutral-9">
                      {isInformatica
                        ? 'Choose what type of Informatica tenant you would like to connect to as a master data source. '
                        : 'Choose what type of org you would like to connect to as a data source and data action target. '}
                      <button className="slds-text-brand sf-hover-underline">Learn More</button>
                    </p>

                    {/* Org type cards */}
                    <div className="slds-css-grid slds-css-grid-cols-2 slds-gap_medium">
                      {(['salesforce', 'sandbox'] as const).map((type) => {
                        const selected = selectedOrgType === type;
                        const accentColor = isInformatica ? '#FF4A00' : 'var(--slds-g-color-brand)';
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedOrgType(type)}
                            className={`slds-pos-relative slds-flex slds-items-center slds-justify-center slds-border-radius_large slds-transition-all ${
                              selected
                                ? 'slds-bg-white slds-shadow_small'
                                : 'slds-bg-white'
                            }`}
                            style={{ height: '128px', border: `2px solid ${selected ? accentColor : '#D8DDE6'}` }}
                          >
                            {selected && (
                              <div className="slds-pos-absolute slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '28px', height: '28px', backgroundColor: accentColor, clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                <Check className="slds-icon-size_xx-small slds-text-white slds-pos-absolute" style={{ top: '2px', right: '2px' }} />
                              </div>
                            )}
                            <span className="slds-text-size_medium slds-text-neutral-base">
                              {isInformatica
                                ? (type === 'salesforce' ? 'Connect to a Production Tenant' : 'Connect to a Sandbox Tenant')
                                : (type === 'salesforce' ? 'Connect to a Salesforce Org' : 'Connect to a Sandbox Org')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Alias step */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <p className="slds-text-size_medium slds-text-neutral-9">
                      {isInformatica
                        ? 'Assign an alias for your Informatica MDM tenant connection that contains up to 15 alphanumeric characters. You can\'t change the alias later. The alias is used in data stream names and helps you identify your tenants.'
                        : `Assign an alias for your ${connectorName} connector that contains up to 15 alphanumeric characters. You can't change the alias later. The alias is used in data stream names and helps you filter your connections.`}
                    </p>
                    <div>
                      <label className="slds-text-size_medium slds-text-neutral-base slds-m-bottom_xx-small" style={{ display: 'block', marginBottom: '4px' }}>
                        <span className="slds-text-error">*</span> {isInformatica ? 'Tenant Alias' : 'Connection Alias'}
                      </label>
                      <div className="slds-flex slds-items-center slds-gap_x-small">
                        <input
                          type="text"
                          value={connectionAlias}
                          onChange={(e) => {
                            if (e.target.value.length <= 15) setConnectionAlias(e.target.value);
                          }}
                          placeholder="Create an alias..."
                          className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border-radius_small"
                          style={{ width: '288px', border: '2px solid var(--slds-g-color-brand)' }}
                          maxLength={15}
                        />
                        <span className="slds-text-size_medium slds-text-neutral-7">{connectionAlias.length}/15</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_x-large slds-p-vertical_medium slds-border_top slds-border-color_border-1" style={{ background: '#FAFAF9' }}>
                {wizardStep === 'select-type' ? (
                  <>
                    <button onClick={() => setConnectOrgOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-brand slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral">Cancel</button>
                    <button
                      onClick={handleWizardNext}
                      disabled={!selectedOrgType}
                      className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-opacity_50 slds-cursor-not-allowed"
                      style={{ ...(!selectedOrgType ? {} : { opacity: 1, cursor: 'pointer' }), padding: '8px 20px' }}
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleWizardBack} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-brand slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral">Back</button>
                    <button
                      onClick={handleWizardNext}
                      disabled={!connectionAlias.trim()}
                      className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small"
                      style={{ ...(!connectionAlias.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {}), padding: '8px 20px' }}
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

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Install Bundle Wizard
         ═══════════════════════════════════════════════════════════ */}
      {installModalOpen && installModalBundle && (
        <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
          <div className="slds-pos-absolute slds-inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => !installModalLoading && setInstallModalOpen(false)} />

          {installModalLoading ? (
            /* Loading state */
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col slds-items-center" style={{ width: '520px', padding: '64px 32px' }}>
              <div className="slds-border-radius_pill sf-spin slds-m-bottom_large" style={{ width: '48px', height: '48px', border: '4px solid #E0E0E0', borderTopColor: '#FF4A00' }} />
              <p className="slds-text-size_medium slds-text-neutral-base slds-font-weight_medium">
                Installing and granting access to {installModalChoice === 'admins' ? 'admins Only' : installModalChoice === 'all' ? 'all Users' : 'specific Profiles'}...
              </p>
            </div>
          ) : (
            /* Selection step */
            <div className="slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col" style={{ width: '600px', maxHeight: '85vh' }}>
              <button onClick={() => setInstallModalOpen(false)} className="slds-pos-absolute slds-flex slds-items-center slds-justify-center slds-border-radius_small sf-hover-bg-neutral slds-text-neutral-7 slds-z-10" style={{ top: '12px', right: '12px', width: '28px', height: '28px' }}>
                <X className="slds-icon-size_small" />
              </button>

              {/* Header */}
              <div className="slds-p-horizontal_x-large slds-p-top_large slds-p-bottom_medium slds-border_bottom slds-border-color_border-1">
                <h2 className="slds-text-size_x-large slds-font-weight_bold slds-text-neutral-base">
                  Install {installModalBundle.name === 'Informatica MDM Cloud' ? 'Customer 360' : installModalBundle.name === 'Informatica Data Quality' ? 'Organization 360' : installModalBundle.name}
                </h2>
              </div>

              {/* Body */}
              <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_x-large slds-p-vertical_large" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Radio cards */}
                {([
                  { key: 'admins' as const, label: 'Install for Admins Only', desc: 'The package will only be visible and accessible to system administrators. All custom objects, fields, and components will be restricted to admin profiles.' },
                  { key: 'all' as const, label: 'Install for All Users', desc: 'The package components will be available to all user profiles. Custom tabs and objects will be visible across the organization.' },
                  { key: 'profiles' as const, label: 'Install for Specific Profiles...', desc: 'Choose which security profiles should have access to the package components. You can customize visibility per profile after installation.' },
                ]).map((opt) => {
                  const selected = installModalChoice === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setInstallModalChoice(opt.key)}
                      className={`slds-w-full slds-text-left slds-p-around_medium slds-border-radius_large slds-transition-all`}
                      style={{ border: `2px solid ${selected ? '#FF4A00' : '#D8DDE6'}`, background: selected ? '#FFF8F5' : 'white' }}
                    >
                      <div className="slds-flex slds-items-start slds-gap_small">
                        <div className={`slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-flex-shrink-0`} style={{ width: '20px', height: '20px', marginTop: '2px', border: `2px solid ${selected ? '#FF4A00' : '#D8DDE6'}` }}>
                          {selected && <div className="slds-border-radius_pill" style={{ width: '10px', height: '10px', background: '#FF4A00' }} />}
                        </div>
                        <div>
                          <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">{opt.label}</div>
                          <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">{opt.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Package details summary */}
                <div className="slds-m-top_medium slds-border_top slds-border-color_border-1 slds-p-top_medium">
                  <div className="slds-css-grid slds-css-grid-cols-2 slds-text-size_medium" style={{ rowGap: '8px' }}>
                    <div className="slds-text-neutral-7">App Name</div>
                    <div className="slds-text-neutral-base slds-font-weight_medium">
                      {installModalBundle.name === 'Informatica MDM Cloud' ? 'Customer 360' : installModalBundle.name === 'Informatica Data Quality' ? 'Organization 360' : installModalBundle.name}
                    </div>
                    <div className="slds-text-neutral-7">Publisher</div>
                    <div className="slds-text-neutral-base">{informaticaBundles.some((b) => b.name === installModalBundle.name) ? 'Informatica' : 'CDP CRM 1'}</div>
                    <div className="slds-text-neutral-7">Version Name</div>
                    <div className="slds-text-neutral-base">Winter 2026</div>
                    <div className="slds-text-neutral-7">Version Number</div>
                    <div className="slds-text-neutral-base">{installModalBundle.latestVersion}</div>
                    <div className="slds-text-neutral-7">Additional Details</div>
                    <div><button className="slds-text-size_medium slds-text-brand sf-hover-underline">View Components</button></div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="slds-flex slds-items-center slds-justify-end slds-gap_small slds-p-horizontal_x-large slds-p-vertical_medium slds-border_top slds-border-color_border-1" style={{ background: '#FAFAF9' }}>
                <button
                  onClick={() => setInstallModalOpen(false)}
                  className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-brand slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInstallBundle}
                  className="slds-text-size_medium slds-font-weight_medium slds-text-white slds-border-radius_small slds-transition-colors"
                  style={{ padding: '8px 20px', background: '#FF4A00' }}
                >
                  Install
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
