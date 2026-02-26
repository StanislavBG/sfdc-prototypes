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

interface DemoSessionState {
  informaticaConnections: { name: string; alias: string; orgId: string }[];
  selectedBundles: string[];
}

interface DataCloudSetupContentProps {
  onBack?: () => void;
  demoSession?: DemoSessionState;
  onDemoSessionChange?: (session: DemoSessionState) => void;
}

// ── Component ────────────────────────────────────────────────────────
export default function DataCloudSetupContent({ onBack, demoSession, onDemoSessionChange }: DataCloudSetupContentProps) {
  const [activeNavItem, setActiveNavItem] = useState('setup-home');
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

  // Setup Home state
  const [setupHomeLearnOpen, setSetupHomeLearnOpen] = useState(true);
  const [setupHomeTab, setSetupHomeTab] = useState<'get-started' | 'plan-data' | 'monitor'>('get-started');
  const [mdsSimulatorVisible, setMdsSimulatorVisible] = useState(false);

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

  const currentPageLabel = activeNavItem === 'setup-home' ? 'Data Cloud Setup Home' : activeNavItem === 'salesforce-crm' ? 'Salesforce CRM' : (activeNavItem === 'informatica-mdm' || activeNavItem === 'informatica-mdm-sf') ? 'Informatica MDM' : activeNavItem === 'solution-manager' ? 'Solution Manager' : setupNavSections.flatMap((s) => s.items).find((i) => i.id === activeNavItem)?.label || 'Setup';
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
                      {item.id === 'solution-manager' && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#0070D2] text-white rounded">New</span>
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
          {activeNavItem === 'setup-home' ? (
            /* ═══════════════════════════════════════════════════════════
               DATA CLOUD SETUP HOME — Matches Salesforce reference layout
               ═══════════════════════════════════════════════════════════ */
            <div>
              {/* Page header — SETUP / Data Cloud Setup */}
              <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-[#F49756] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--sf-blue)] uppercase tracking-wide">SETUP</div>
                    <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">Data Cloud Setup</h1>
                  </div>
                </div>
                <button className="px-4 py-1.5 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] flex items-center gap-1">
                  Create <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Alert banner */}
              <div className="bg-[#FFF3CD] border-b border-[#FFE69C] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#856404] flex-shrink-0" />
                  <p className="text-sm text-[#856404]">
                    Data Cloud standard permission sets have changed. Some users must be assigned to new permission sets. Find out what's changed and what you should do next.
                  </p>
                </div>
                <button className="text-sm font-medium text-[var(--sf-link)] hover:underline flex-shrink-0 ml-4">Learn More</button>
              </div>

              {/* Welcome to Data Cloud hero */}
              <div className="relative bg-white border-b border-[var(--sf-border)] overflow-hidden">
                <div className="px-6 py-8 max-w-3xl">
                  <h2 className="text-3xl font-bold text-[var(--sf-text-primary)] mb-4">Welcome to Data Cloud</h2>
                  <p className="text-sm text-[var(--sf-text-secondary)] leading-relaxed">
                    Harness the power of Data Cloud to unify all your company's data into a holistic view of each customer. Data Cloud consolidates data from all your source systems into Customer 360 profiles to help you understand your customers, empower your teams, and drive business decisions. Use Data Cloud's unified profile data to drive automation and analytics, personalize engagements, and power trusted AI.
                  </p>
                </div>
                {/* Mountain / sunset illustration */}
                <div className="absolute right-0 top-0 bottom-0 w-[400px] pointer-events-none">
                  <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="xMaxYMax slice">
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

              {/* ── Admin Toggle Panel ── */}
              <div className="px-6 pt-6 pb-2">
                <div className="border border-[var(--sf-border)] rounded-lg bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">😊</span>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--sf-text-primary)]">Prototype Controls</h4>
                        <p className="text-[10px] text-[var(--sf-text-tertiary)]">Toggle visibility of simulator branding elements</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">😄</span>
                        <label className="text-xs font-medium text-[var(--sf-text-secondary)]">MDS Simulator</label>
                        <button
                          onClick={() => setMdsSimulatorVisible(!mdsSimulatorVisible)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${mdsSimulatorVisible ? 'bg-[var(--sf-blue)]' : 'bg-[#D8DDE6]'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${mdsSimulatorVisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <span className="text-2xl">😎</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MDS Simulator thinking indicator — hidden by default */}
              {mdsSimulatorVisible && (
                <div className="px-6 pb-2">
                  <div className="border-2 border-dashed border-[var(--sf-blue)]/30 rounded-lg bg-[#EEF4FF] p-4 flex items-center gap-4">
                    {/* Thinking animation */}
                    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <div className="absolute inset-0 rounded-full border-2 border-[var(--sf-blue)]/20 border-t-[var(--sf-blue)] animate-spin" />
                      <div className="absolute inset-1.5 rounded-full border-2 border-[#FF4A00]/20 border-b-[#FF4A00] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                      <span className="text-lg">🧠</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-blue)] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-blue)] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sf-blue)] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs font-medium text-[var(--sf-blue)]">Thinking...</span>
                      </div>
                      <div className="text-base font-bold text-[var(--sf-text-primary)] tracking-wide">
                        MDS Simulator
                      </div>
                      <p className="text-[10px] text-[var(--sf-text-tertiary)] mt-0.5">
                        Multi-Domain Simulator — Informatica MDM + Salesforce Data Cloud prototype environment
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className="text-3xl">😃</span>
                      <span className="text-[9px] text-[var(--sf-text-tertiary)] font-medium">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Learn About Data Cloud — collapsible */}
              <div className="px-6 py-6">
                <button
                  onClick={() => setSetupHomeLearnOpen(!setupHomeLearnOpen)}
                  className="flex items-center gap-2 mb-4"
                >
                  {setupHomeLearnOpen ? <ChevronDown className="w-5 h-5 text-[var(--sf-text-tertiary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--sf-text-tertiary)]" />}
                  <h3 className="text-base font-semibold text-[var(--sf-text-primary)]">Learn About Data Cloud</h3>
                </button>

                {setupHomeLearnOpen && (
                  <div className="flex gap-6">
                    {/* Left — tabs + content */}
                    <div className="flex-1 min-w-0">
                      {/* Tab bar */}
                      <div className="flex border-b border-[var(--sf-border)] mb-5">
                        {(['get-started', 'plan-data', 'monitor'] as const).map((tab) => {
                          const labels = { 'get-started': 'Get Started', 'plan-data': 'Plan Data Strategy', monitor: 'Monitor Data Cloud' };
                          return (
                            <button
                              key={tab}
                              onClick={() => setSetupHomeTab(tab)}
                              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                setupHomeTab === tab
                                  ? 'border-[var(--sf-blue)] text-[var(--sf-blue)]'
                                  : 'border-transparent text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-secondary)]'
                              }`}
                            >
                              {labels[tab]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab content */}
                      {setupHomeTab === 'get-started' && (
                        <div>
                          <p className="text-sm text-[var(--sf-text-secondary)] leading-relaxed mb-2">
                            Ensure that your org has all the necessary licenses to enable access to the features you need to use. Set up data spaces to organize and secure your data. Use permission sets to grant your users access to Data Cloud data and features.
                          </p>
                          <p className="text-sm text-[var(--sf-text-secondary)] leading-relaxed mb-6">
                            Credits are consumed by usage of features and services. Use Digital Wallet to check your recent consumption and consumption trends.
                          </p>

                          <h4 className="text-sm font-bold text-[var(--sf-text-primary)] mb-3">Get Started</h4>
                          <div className="border border-[var(--sf-border)] rounded-lg divide-y divide-[var(--sf-border)]">
                            {[
                              { label: 'Review or add licenses', action: 'Check Your Account', navId: '' },
                              { label: 'Partition data with data spaces', action: 'Open Data Spaces Setup', navId: 'data-spaces' },
                              { label: 'Set up Data Cloud users', action: 'Manage Your Users', navId: 'users' },
                              { label: 'Check credit consumption', action: 'Open Digital Wallet', navId: '' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-[var(--sf-text-secondary)]">{item.label}</span>
                                <button
                                  onClick={() => item.navId && setActiveNavItem(item.navId)}
                                  className="text-sm font-medium text-[var(--sf-link)] hover:underline"
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
                          <p className="text-sm text-[var(--sf-text-secondary)] leading-relaxed mb-4">
                            Plan your data strategy by mapping your source systems, defining data models, and establishing data quality rules before connecting your data to Data Cloud.
                          </p>
                          <div className="border border-[var(--sf-border)] rounded-lg divide-y divide-[var(--sf-border)]">
                            {[
                              { label: 'Map source systems and data objects', action: 'View Data Model' },
                              { label: 'Define identity resolution strategy', action: 'Identity Resolution' },
                              { label: 'Set up calculated insights', action: 'Create Insights' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-[var(--sf-text-secondary)]">{item.label}</span>
                                <button className="text-sm font-medium text-[var(--sf-link)] hover:underline">{item.action}</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {setupHomeTab === 'monitor' && (
                        <div>
                          <p className="text-sm text-[var(--sf-text-secondary)] leading-relaxed mb-4">
                            Monitor your Data Cloud usage, job statuses, and system health to ensure your data pipelines are running smoothly.
                          </p>
                          <div className="border border-[var(--sf-border)] rounded-lg divide-y divide-[var(--sf-border)]">
                            {[
                              { label: 'Check data stream health', action: 'View Data Streams' },
                              { label: 'Monitor identity resolution jobs', action: 'View Jobs' },
                              { label: 'Review error logs', action: 'View Logs' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-[var(--sf-text-secondary)]">{item.label}</span>
                                <button className="text-sm font-medium text-[var(--sf-link)] hover:underline">{item.action}</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right sidebar — Resources */}
                    <div className="w-[260px] flex-shrink-0">
                      <div className="border-l-2 border-[var(--sf-border)] pl-5">
                        <h4 className="text-base font-semibold text-[var(--sf-text-primary)] mb-4">Resources</h4>
                        <div className="space-y-3">
                          {[
                            { label: 'About Salesforce Data Cloud', icon: '📘' },
                            { label: 'Unlock Your Data with Data Cloud', icon: '🔑' },
                            { label: 'Plan Data Strategy', icon: '📋' },
                            { label: 'Data Cloud Features and Learning Path', icon: '📚' },
                            { label: 'Get Started Using Data Cloud', icon: '🚀' },
                          ].map((res, i) => (
                            <button key={i} className="flex items-center gap-2 text-sm text-[var(--sf-link)] hover:underline w-full text-left">
                              <span className="text-base flex-shrink-0">{res.icon}</span>
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

                            // ── Step body renderer based on type ──
                            const renderStepBody = () => {
                              switch (step.type) {
                                case 'action':
                                  return (
                                    <>
                                      <p className="text-sm text-[var(--sf-text-secondary)] mb-5 leading-relaxed">{step.description}</p>
                                      {status !== 'completed' && (
                                        <button onClick={smHandleCompleteStep} className="px-4 py-2 text-sm font-medium text-white bg-[#0070D2] rounded hover:bg-[#005FB2] transition-colors">
                                          {step.actionLabel}
                                        </button>
                                      )}
                                    </>
                                  );

                                case 'form':
                                  return (
                                    <div className="space-y-4">
                                      {step.fields.map((field, fi) => (
                                        <div key={fi}>
                                          <label className="block text-sm font-medium text-[var(--sf-text-primary)] mb-1">
                                            {field.name} {field.required && <span className="text-[var(--sf-error)]">*</span>}
                                          </label>
                                          <div className="relative">
                                            <input
                                              type={field.inputType === 'password' ? (smFormPasswordVisible[`${smActiveSolution}-${smActiveStep}-${fi}`] ? 'text' : 'password') : field.inputType}
                                              placeholder={field.placeholder}
                                              className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-1 focus:ring-[rgba(27,150,255,0.2)]"
                                            />
                                            {field.inputType === 'password' && (
                                              <button
                                                type="button"
                                                onClick={() => setSmFormPasswordVisible(prev => ({ ...prev, [`${smActiveSolution}-${smActiveStep}-${fi}`]: !prev[`${smActiveSolution}-${smActiveStep}-${fi}`] }))}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)]"
                                              >
                                                {smFormPasswordVisible[`${smActiveSolution}-${smActiveStep}-${fi}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {status !== 'completed' && (
                                        <button onClick={smHandleCompleteStep} className="px-4 py-2 text-sm font-medium text-white bg-[#0070D2] rounded hover:bg-[#005FB2] transition-colors mt-2">
                                          Validate Connection
                                        </button>
                                      )}
                                    </div>
                                  );

                                case 'multiselect':
                                  return (
                                    <div className="space-y-5">
                                      {step.groups.map((group, gi) => (
                                        <div key={gi}>
                                          <div className="text-sm font-semibold text-[var(--sf-text-primary)] mb-2">{group.name}</div>
                                          <div className="flex flex-wrap gap-2">
                                            {group.options.map((option, oi) => {
                                              const key = `${smActiveSolution}-${smActiveStep}-${gi}-${oi}`;
                                              const selected = smMultiselectState[key] || false;
                                              return (
                                                <button
                                                  key={oi}
                                                  onClick={() => setSmMultiselectState(prev => ({ ...prev, [key]: !prev[key] }))}
                                                  className={`px-3 py-2 text-sm rounded border transition-colors ${
                                                    selected
                                                      ? 'bg-[#EEF4FF] border-[#0070D2] text-[#0070D2] font-medium'
                                                      : 'bg-white border-[var(--sf-border)] text-[var(--sf-text-secondary)] hover:border-[#0070D2]'
                                                  }`}
                                                >
                                                  {selected && <Check className="w-3 h-3 inline mr-1.5" />}
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
                                    <div className="space-y-3">
                                      {step.options.map((option, oi) => {
                                        const key = `${smActiveSolution}-${smActiveStep}`;
                                        const selected = (smRadioState[key] ?? 0) === oi;
                                        return (
                                          <button
                                            key={oi}
                                            onClick={() => setSmRadioState(prev => ({ ...prev, [key]: oi }))}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                              selected
                                                ? 'border-[#0070D2] bg-[#EEF4FF]'
                                                : 'border-[var(--sf-border)] bg-white hover:border-[#B0B0B0]'
                                            }`}
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                                                selected ? 'border-[#0070D2]' : 'border-[#DDDBDA]'
                                              }`}>
                                                {selected && <div className="w-2 h-2 rounded-full bg-[#0070D2]" />}
                                              </div>
                                              <div>
                                                <div className="text-sm font-semibold text-[var(--sf-text-primary)]">{option.label}</div>
                                                <p className="text-xs text-[var(--sf-text-secondary)] mt-1 leading-relaxed">{option.description}</p>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );

                                case 'table-list':
                                  return (
                                    <div className="space-y-2">
                                      {step.tables.map((table, ti) => (
                                        <div key={ti} className="flex items-center justify-between p-3 bg-[#FAFAF9] border border-[var(--sf-border)] rounded">
                                          <span className="text-sm font-mono text-[var(--sf-text-primary)]">{table}</span>
                                          <button className="px-3 py-1.5 text-xs font-medium text-[var(--sf-link)] border border-[var(--sf-border)] rounded hover:bg-white transition-colors">
                                            Review Mappings & Create Fields
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'preview':
                                  return (
                                    <div className="space-y-4">
                                      {step.items.map((item, pi) => (
                                        <div key={pi}>
                                          <p className="text-sm text-[var(--sf-text-secondary)] mb-2">{item.description}</p>
                                          <button className="px-3 py-1.5 text-xs font-medium text-[var(--sf-link)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] transition-colors">
                                            {item.name} &rarr;
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'rules-list':
                                  return (
                                    <div className="space-y-2">
                                      {step.rules.map((rule, ri) => (
                                        <div key={ri} className="flex items-center justify-between p-3 bg-[#FAFAF9] border border-[var(--sf-border)] rounded">
                                          <div>
                                            <div className="text-sm font-medium text-[var(--sf-text-primary)]">{rule.name}</div>
                                            <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">{rule.description}</p>
                                          </div>
                                          <button className="px-3 py-1.5 text-xs font-medium text-[var(--sf-link)] border border-[var(--sf-border)] rounded hover:bg-white transition-colors flex-shrink-0 ml-4">
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
                                      <p className="text-sm text-[var(--sf-text-secondary)] mb-5 leading-relaxed">{step.description}</p>
                                      <div className="flex items-center gap-3 mb-4">
                                        <button
                                          onClick={() => setSmToggleState(prev => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
                                          className={`relative w-12 h-6 rounded-full transition-colors ${isOn ? 'bg-[#0070D2]' : 'bg-[#DDDBDA]'}`}
                                        >
                                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOn ? 'left-[26px]' : 'left-0.5'}`} />
                                        </button>
                                        <span className="text-sm font-medium text-[var(--sf-text-primary)]">
                                          {isOn ? 'Sync Enabled' : 'Sync Disabled'}
                                        </span>
                                      </div>
                                    </>
                                  );
                                }

                                case 'substeps':
                                  return (
                                    <div className="space-y-2">
                                      {step.substeps.map((substep, si) => (
                                        <div key={si} className="flex items-center justify-between p-3 bg-[#FAFAF9] border border-[var(--sf-border)] rounded">
                                          <div>
                                            <div className="text-sm font-medium text-[var(--sf-text-primary)]">{substep.name}</div>
                                            <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">{substep.description}</p>
                                          </div>
                                          <a href={substep.link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--sf-link)] hover:underline flex-shrink-0 ml-4 flex items-center gap-1">
                                            View Trailhead <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  );

                                case 'text-links':
                                  return (
                                    <>
                                      <div className="text-sm text-[var(--sf-text-secondary)] leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: step.description }} />
                                      {step.links.length > 0 && (
                                        <div className="space-y-2">
                                          {step.links.map((link, li) => (
                                            <a key={li} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--sf-link)] hover:underline">
                                              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
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
                                    {step.type === 'action' && step.system && (
                                      <span className={`ml-auto px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                                        step.system === 'D360'
                                          ? 'bg-[#EEF4FF] text-[#0070D2]'
                                          : 'bg-[#FFF3ED] text-[#D95800]'
                                      }`}>
                                        {step.system === 'D360' ? '\u2601 ' : '\u2699 '}{step.system}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="sf-card-body">
                                  {renderStepBody()}
                                  {status === 'completed' && (
                                    <div className="flex items-center gap-2 text-sm text-[#2E844A] font-medium mt-4">
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
                                        &larr; Previous
                                      </button>
                                    )}
                                    {smActiveStep < sol.steps.length - 1 ? (
                                      <button
                                        onClick={smHandleCompleteStep}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#0070D2] rounded hover:bg-[#005FB2]"
                                      >
                                        Next Step &rarr;
                                      </button>
                                    ) : (
                                      <button
                                        onClick={smHandleCompleteStep}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#2E844A] rounded hover:bg-[#256B3B]"
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
              <div className="sf-card mb-6 relative">
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
              <div className="sf-card mb-6">
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
              <div className="sf-card">
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
                        <th className="w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBundles.map((bundle) => {
                        const isInstalled = demoSession?.selectedBundles.includes(bundle.name);
                        return (
                        <tr key={bundle.name}>
                          <td className="sf-link font-medium">{bundle.name}</td>
                          <td>{isInstalled ? bundle.latestVersion : bundle.installedVersion}</td>
                          <td>{bundle.latestVersion}</td>
                          <td>
                            {isInstalled ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--sf-success)]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (onDemoSessionChange && demoSession) {
                                    onDemoSessionChange({
                                      ...demoSession,
                                      selectedBundles: [...demoSession.selectedBundles, bundle.name],
                                    });
                                  }
                                }}
                                className={`px-3 py-1 text-xs font-medium text-white rounded transition-colors ${
                                  isInformatica ? 'bg-[#FF4A00] hover:bg-[#E54300]' : 'bg-[var(--sf-blue)] hover:bg-[var(--sf-blue-hover)]'
                                }`}
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
