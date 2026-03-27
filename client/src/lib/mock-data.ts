// Mock Data360 data for the Salesforce Lightning prototype

export interface Data360Record {
  id: string;
  type: 'Account' | 'Contact' | 'Opportunity' | 'Case' | 'Lead';
  name: string;
  subtitle?: string;
  icon: string;
  details: Record<string, string>;
  relatedLists: RelatedList[];
}

export interface RelatedList {
  title: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface SearchResult {
  id: string;
  type: Data360Record['type'];
  name: string;
  subtitle: string;
  icon: string;
}

export interface SalesforceApp {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// Navigation tab config - label + whether it has a dropdown chevron
export interface NavTab {
  label: string;
  hasDropdown?: boolean;
}

// Grouped navigation for vertical left-nav (Data Cloud groupings based on official docs)
export interface NavGroup {
  title: string;
  icon?: string; // lucide icon identifier for section header
  items: NavTab[];
}

export const appNavGroups: Record<string, NavGroup[]> = {
  'data-cloud': [
    {
      title: '',
      items: [{ label: 'Home' }],
    },
    {
      title: 'Connect & Unify',
      icon: 'list-filter',
      items: [
        { label: 'Data Streams' },
        { label: 'Data Lake Objects' },
        { label: 'Data Transforms' },
        { label: 'Data Model' },
        { label: 'Identity Resolutions' },
      ],
    },
    {
      title: 'Govern Data',
      icon: 'landmark',
      items: [
        { label: 'Data Spaces' },
        { label: 'Data Governance', hasDropdown: true },
        { label: 'Data Catalog', hasDropdown: true },
      ],
    },
    {
      title: 'Process Content',
      icon: 'file-text',
      items: [
        { label: 'Search Indexes' },
        { label: 'Secondary Indexes' },
        { label: 'Document AI' },
        { label: 'Content Viewer' },
        { label: 'Content Lens' },
        { label: 'Google Drive' },
        { label: 'Semantic Search' },
      ],
    },
    {
      title: 'Query & Segment',
      icon: 'grid-3x3',
      items: [
        { label: 'Segments' },
        { label: 'Calculated Insights' },
        { label: 'Data Graphs' },
        { label: 'View Data', hasDropdown: true },
      ],
    },
    {
      title: 'Analyze & Predict',
      icon: 'trending-up',
      items: [
        { label: 'Einstein Studio', hasDropdown: true },
        { label: 'Semantic Models' },
        { label: 'Reports', hasDropdown: true },
        { label: 'Dashboards', hasDropdown: true },
      ],
    },
    {
      title: 'Act on Data',
      icon: 'timer',
      items: [
        { label: 'Activations' },
        { label: 'Activation Targets' },
        { label: 'Communication Capping' },
        { label: 'Data Actions' },
        { label: 'Data Action Targets' },
      ],
    },
    {
      title: 'Build & Share',
      icon: 'share-2',
      items: [],
    },
  ],
  sales: [
    { title: '', items: [{ label: 'Home' }] },
    { title: 'Sales', items: [
      { label: 'Accounts', hasDropdown: true },
      { label: 'Contacts', hasDropdown: true },
      { label: 'Opportunities', hasDropdown: true },
      { label: 'Leads', hasDropdown: true },
    ]},
    { title: 'Analytics', items: [
      { label: 'Reports', hasDropdown: true },
      { label: 'Dashboards', hasDropdown: true },
    ]},
  ],
  service: [
    { title: '', items: [{ label: 'Home' }] },
    { title: 'Service', items: [
      { label: 'Cases', hasDropdown: true },
      { label: 'Contacts', hasDropdown: true },
      { label: 'Accounts', hasDropdown: true },
      { label: 'Knowledge', hasDropdown: true },
    ]},
    { title: 'Analytics', items: [
      { label: 'Reports', hasDropdown: true },
      { label: 'Dashboards', hasDropdown: true },
    ]},
  ],
  marketing: [
    { title: '', items: [{ label: 'Home' }] },
    { title: 'Marketing', items: [
      { label: 'Campaigns', hasDropdown: true },
      { label: 'Leads', hasDropdown: true },
      { label: 'Contacts', hasDropdown: true },
    ]},
    { title: 'Analytics', items: [
      { label: 'Reports', hasDropdown: true },
      { label: 'Dashboards', hasDropdown: true },
    ]},
  ],
  admin: [
    {
      title: '',
      items: [{ label: 'Google Drive' }],
    },
  ],
};

// Flat nav items (kept for backward compat)
export const appNavItems: Record<string, NavTab[]> = Object.fromEntries(
  Object.entries(appNavGroups).map(([key, groups]) => [
    key,
    groups.flatMap((g) => g.items),
  ])
);

// Available Salesforce apps
export const salesforceApps: SalesforceApp[] = [
  { id: 'data-cloud', name: 'Data 360', description: 'Unified customer data platform', color: 'var(--slds-g-color-brand-1)', icon: 'Database' },
  { id: 'sales', name: 'Sales', description: 'Manage your sales pipeline', color: '#7F8DE1', icon: 'TrendingUp' },
  { id: 'service', name: 'Service', description: 'Customer service console', color: '#F49756', icon: 'Headphones' },
  { id: 'marketing', name: 'Marketing', description: 'Campaign management', color: '#E8788A', icon: 'Megaphone' },
  { id: 'commerce', name: 'Commerce', description: 'Commerce management', color: '#56B1F0', icon: 'ShoppingCart' },
  { id: 'platform', name: 'Platform', description: 'App development', color: '#9B8BF4', icon: 'Code' },
  { id: 'admin', name: 'Admin', description: 'System administration & setup', color: '#54698D', icon: 'Settings' },
];

// Mock Data360 records
export const data360Records: Data360Record[] = [
  {
    id: 'acc-001',
    type: 'Account',
    name: 'Acme Corporation',
    subtitle: 'Technology - Enterprise',
    icon: 'Building2',
    details: {
      'Account Name': 'Acme Corporation',
      'Account Number': 'ACC-2024-001',
      'Industry': 'Technology',
      'Type': 'Enterprise',
      'Phone': '(415) 555-1234',
      'Website': 'www.acme.com',
      'Billing Address': '100 Market Street, San Francisco, CA 94105',
      'Annual Revenue': '$45,000,000',
      'Employees': '2,500',
      'Account Owner': 'Sarah Johnson',
      'Rating': 'Hot',
      'SLA': 'Platinum',
      'Data360 Score': '92 / 100',
      'Data Quality': 'Verified',
    },
    relatedLists: [
      {
        title: 'Contacts',
        columns: ['Name', 'Title', 'Email', 'Phone'],
        rows: [
          { Name: 'John Smith', Title: 'CEO', Email: 'john.smith@acme.com', Phone: '(415) 555-1001' },
          { Name: 'Emily Chen', Title: 'CTO', Email: 'emily.chen@acme.com', Phone: '(415) 555-1002' },
          { Name: 'Michael Park', Title: 'VP of Sales', Email: 'michael.park@acme.com', Phone: '(415) 555-1003' },
          { Name: 'Lisa Wong', Title: 'CFO', Email: 'lisa.wong@acme.com', Phone: '(415) 555-1004' },
        ],
      },
      {
        title: 'Opportunities',
        columns: ['Opportunity Name', 'Stage', 'Amount', 'Close Date'],
        rows: [
          { 'Opportunity Name': 'Acme Enterprise License', Stage: 'Negotiation', Amount: '$500,000', 'Close Date': '2026-03-15' },
          { 'Opportunity Name': 'Acme Data Integration', Stage: 'Proposal', Amount: '$150,000', 'Close Date': '2026-04-01' },
          { 'Opportunity Name': 'Acme Cloud Migration', Stage: 'Qualification', Amount: '$320,000', 'Close Date': '2026-06-30' },
        ],
      },
      {
        title: 'Cases',
        columns: ['Case Number', 'Subject', 'Status', 'Priority'],
        rows: [
          { 'Case Number': 'CS-10234', Subject: 'API integration issue', Status: 'Open', Priority: 'High' },
          { 'Case Number': 'CS-10198', Subject: 'License renewal inquiry', Status: 'In Progress', Priority: 'Medium' },
        ],
      },
      {
        title: 'Data360 Segments',
        columns: ['Segment Name', 'Match Score', 'Source', 'Last Updated'],
        rows: [
          { 'Segment Name': 'Enterprise Tech Buyers', 'Match Score': '95%', Source: 'CRM + Marketing Cloud', 'Last Updated': '2026-02-14' },
          { 'Segment Name': 'High-Value Accounts', 'Match Score': '88%', Source: 'Revenue Data', 'Last Updated': '2026-02-13' },
          { 'Segment Name': 'West Coast Enterprise', 'Match Score': '92%', Source: 'Geo + Firmographic', 'Last Updated': '2026-02-10' },
        ],
      },
    ],
  },
  {
    id: 'acc-002',
    type: 'Account',
    name: 'Global Industries Ltd',
    subtitle: 'Manufacturing - Mid-Market',
    icon: 'Building2',
    details: {
      'Account Name': 'Global Industries Ltd',
      'Account Number': 'ACC-2024-002',
      'Industry': 'Manufacturing',
      'Type': 'Mid-Market',
      'Phone': '(312) 555-9876',
      'Website': 'www.globalindustries.com',
      'Billing Address': '200 Wacker Drive, Chicago, IL 60606',
      'Annual Revenue': '$18,000,000',
      'Employees': '800',
      'Account Owner': 'David Kim',
      'Rating': 'Warm',
      'SLA': 'Gold',
      'Data360 Score': '78 / 100',
      'Data Quality': 'Needs Review',
    },
    relatedLists: [
      {
        title: 'Contacts',
        columns: ['Name', 'Title', 'Email', 'Phone'],
        rows: [
          { Name: 'Robert Taylor', Title: 'President', Email: 'r.taylor@globalind.com', Phone: '(312) 555-9001' },
          { Name: 'Amanda Foster', Title: 'VP Operations', Email: 'a.foster@globalind.com', Phone: '(312) 555-9002' },
        ],
      },
      {
        title: 'Opportunities',
        columns: ['Opportunity Name', 'Stage', 'Amount', 'Close Date'],
        rows: [
          { 'Opportunity Name': 'Global Ind. Platform Deal', Stage: 'Discovery', Amount: '$220,000', 'Close Date': '2026-05-15' },
        ],
      },
      {
        title: 'Data360 Segments',
        columns: ['Segment Name', 'Match Score', 'Source', 'Last Updated'],
        rows: [
          { 'Segment Name': 'Manufacturing Sector', 'Match Score': '91%', Source: 'Industry Classification', 'Last Updated': '2026-02-12' },
          { 'Segment Name': 'Mid-Market Growth', 'Match Score': '76%', Source: 'Revenue Trend', 'Last Updated': '2026-02-11' },
        ],
      },
    ],
  },
  {
    id: 'con-001',
    type: 'Contact',
    name: 'John Smith',
    subtitle: 'CEO at Acme Corporation',
    icon: 'User',
    details: {
      'Full Name': 'John Smith',
      'Title': 'Chief Executive Officer',
      'Account': 'Acme Corporation',
      'Email': 'john.smith@acme.com',
      'Phone': '(415) 555-1001',
      'Mobile': '(415) 555-8001',
      'Mailing Address': '100 Market Street, San Francisco, CA 94105',
      'Department': 'Executive',
      'Lead Source': 'Partner Referral',
      'Data360 ID': 'D360-C-00421',
      'Identity Score': '97%',
      'Last Activity': '2026-02-14',
    },
    relatedLists: [
      {
        title: 'Activities',
        columns: ['Subject', 'Type', 'Date', 'Status'],
        rows: [
          { Subject: 'Quarterly Business Review', Type: 'Meeting', Date: '2026-02-14', Status: 'Completed' },
          { Subject: 'Contract renewal discussion', Type: 'Call', Date: '2026-02-10', Status: 'Completed' },
          { Subject: 'Executive dinner invite', Type: 'Email', Date: '2026-02-08', Status: 'Sent' },
        ],
      },
      {
        title: 'Opportunities',
        columns: ['Opportunity Name', 'Role', 'Stage', 'Amount'],
        rows: [
          { 'Opportunity Name': 'Acme Enterprise License', Role: 'Decision Maker', Stage: 'Negotiation', Amount: '$500,000' },
          { 'Opportunity Name': 'Acme Cloud Migration', Role: 'Executive Sponsor', Stage: 'Qualification', Amount: '$320,000' },
        ],
      },
      {
        title: 'Data360 Touchpoints',
        columns: ['Channel', 'Interaction', 'Date', 'Sentiment'],
        rows: [
          { Channel: 'Email', Interaction: 'Newsletter Open', Date: '2026-02-13', Sentiment: 'Positive' },
          { Channel: 'Web', Interaction: 'Pricing Page Visit', Date: '2026-02-11', Sentiment: 'Neutral' },
          { Channel: 'Event', Interaction: 'Dreamforce Registration', Date: '2026-02-05', Sentiment: 'Positive' },
        ],
      },
    ],
  },
  {
    id: 'con-002',
    type: 'Contact',
    name: 'Emily Chen',
    subtitle: 'CTO at Acme Corporation',
    icon: 'User',
    details: {
      'Full Name': 'Emily Chen',
      'Title': 'Chief Technology Officer',
      'Account': 'Acme Corporation',
      'Email': 'emily.chen@acme.com',
      'Phone': '(415) 555-1002',
      'Mobile': '(415) 555-8002',
      'Mailing Address': '100 Market Street, San Francisco, CA 94105',
      'Department': 'Engineering',
      'Lead Source': 'Web',
      'Data360 ID': 'D360-C-00422',
      'Identity Score': '94%',
      'Last Activity': '2026-02-12',
    },
    relatedLists: [
      {
        title: 'Activities',
        columns: ['Subject', 'Type', 'Date', 'Status'],
        rows: [
          { Subject: 'Technical architecture review', Type: 'Meeting', Date: '2026-02-12', Status: 'Completed' },
          { Subject: 'Integration demo', Type: 'Call', Date: '2026-02-06', Status: 'Completed' },
        ],
      },
      {
        title: 'Data360 Touchpoints',
        columns: ['Channel', 'Interaction', 'Date', 'Sentiment'],
        rows: [
          { Channel: 'Web', Interaction: 'API Documentation View', Date: '2026-02-11', Sentiment: 'Neutral' },
          { Channel: 'Email', Interaction: 'Technical Whitepaper Download', Date: '2026-02-09', Sentiment: 'Positive' },
        ],
      },
    ],
  },
  {
    id: 'opp-001',
    type: 'Opportunity',
    name: 'Acme Enterprise License',
    subtitle: 'Acme Corporation - Negotiation',
    icon: 'DollarSign',
    details: {
      'Opportunity Name': 'Acme Enterprise License',
      'Account': 'Acme Corporation',
      'Stage': 'Negotiation',
      'Amount': '$500,000',
      'Close Date': '2026-03-15',
      'Probability': '75%',
      'Type': 'New Business',
      'Lead Source': 'Partner Referral',
      'Next Step': 'Final contract review',
      'Owner': 'Sarah Johnson',
      'Forecast Category': 'Commit',
      'Created Date': '2025-11-01',
    },
    relatedLists: [
      {
        title: 'Contact Roles',
        columns: ['Contact', 'Role', 'Primary'],
        rows: [
          { Contact: 'John Smith', Role: 'Decision Maker', Primary: 'Yes' },
          { Contact: 'Emily Chen', Role: 'Technical Evaluator', Primary: 'No' },
          { Contact: 'Lisa Wong', Role: 'Economic Buyer', Primary: 'No' },
        ],
      },
      {
        title: 'Products',
        columns: ['Product', 'Quantity', 'Unit Price', 'Total'],
        rows: [
          { Product: 'Enterprise License', Quantity: '2,500', 'Unit Price': '$150', Total: '$375,000' },
          { Product: 'Premium Support', Quantity: '1', 'Unit Price': '$75,000', Total: '$75,000' },
          { Product: 'Data Integration Add-on', Quantity: '1', 'Unit Price': '$50,000', Total: '$50,000' },
        ],
      },
      {
        title: 'Stage History',
        columns: ['Stage', 'Amount', 'Date', 'Days In Stage'],
        rows: [
          { Stage: 'Negotiation', Amount: '$500,000', Date: '2026-01-20', 'Days In Stage': '26' },
          { Stage: 'Proposal', Amount: '$480,000', Date: '2025-12-15', 'Days In Stage': '36' },
          { Stage: 'Discovery', Amount: '$400,000', Date: '2025-11-01', 'Days In Stage': '44' },
        ],
      },
    ],
  },
  {
    id: 'case-001',
    type: 'Case',
    name: 'CS-10234: API integration issue',
    subtitle: 'Acme Corporation - High Priority',
    icon: 'LifeBuoy',
    details: {
      'Case Number': 'CS-10234',
      'Subject': 'API integration issue',
      'Status': 'Open',
      'Priority': 'High',
      'Account': 'Acme Corporation',
      'Contact': 'Emily Chen',
      'Type': 'Technical',
      'Reason': 'Integration Error',
      'Origin': 'Email',
      'Owner': 'Tech Support Team',
      'Created Date': '2026-02-13',
      'Description': 'Customer experiencing intermittent 500 errors on REST API calls during peak hours.',
    },
    relatedLists: [
      {
        title: 'Case Comments',
        columns: ['Author', 'Comment', 'Date'],
        rows: [
          { Author: 'Tech Support', Comment: 'Investigating rate limiting configuration', Date: '2026-02-14' },
          { Author: 'Emily Chen', Comment: 'Errors occurring between 9-11 AM PST', Date: '2026-02-13' },
        ],
      },
    ],
  },
  {
    id: 'lead-001',
    type: 'Lead',
    name: 'Jessica Martinez',
    subtitle: 'VP Engineering at StartupXYZ',
    icon: 'UserPlus',
    details: {
      'Full Name': 'Jessica Martinez',
      'Company': 'StartupXYZ',
      'Title': 'VP of Engineering',
      'Email': 'j.martinez@startupxyz.io',
      'Phone': '(650) 555-7890',
      'Status': 'Working',
      'Rating': 'Hot',
      'Lead Source': 'Webinar',
      'Industry': 'Software',
      'Annual Revenue': '$5,000,000',
      'Employees': '50',
      'Data360 Score': '85 / 100',
    },
    relatedLists: [
      {
        title: 'Campaign History',
        columns: ['Campaign', 'Status', 'Date', 'Response'],
        rows: [
          { Campaign: 'Q1 Product Webinar', Status: 'Responded', Date: '2026-02-10', Response: 'Attended' },
          { Campaign: 'Data360 Newsletter', Status: 'Sent', Date: '2026-01-15', Response: 'Opened' },
        ],
      },
      {
        title: 'Data360 Insights',
        columns: ['Signal', 'Confidence', 'Source', 'Date'],
        rows: [
          { Signal: 'Buying Intent - High', Confidence: '89%', Source: 'Web Activity', Date: '2026-02-14' },
          { Signal: 'Technology Fit', Confidence: '92%', Source: 'Firmographic Data', Date: '2026-02-12' },
        ],
      },
    ],
  },
  {
    id: 'acc-003',
    type: 'Account',
    name: 'Pinnacle Financial Services',
    subtitle: 'Financial Services - Enterprise',
    icon: 'Building2',
    details: {
      'Account Name': 'Pinnacle Financial Services',
      'Account Number': 'ACC-2024-003',
      'Industry': 'Financial Services',
      'Type': 'Enterprise',
      'Phone': '(212) 555-4567',
      'Website': 'www.pinnaclefs.com',
      'Billing Address': '1 Wall Street, New York, NY 10005',
      'Annual Revenue': '$120,000,000',
      'Employees': '5,000',
      'Account Owner': 'Sarah Johnson',
      'Rating': 'Hot',
      'SLA': 'Platinum',
      'Data360 Score': '96 / 100',
      'Data Quality': 'Verified',
    },
    relatedLists: [
      {
        title: 'Contacts',
        columns: ['Name', 'Title', 'Email', 'Phone'],
        rows: [
          { Name: 'Alexandra Wright', Title: 'CIO', Email: 'a.wright@pinnaclefs.com', Phone: '(212) 555-4001' },
          { Name: 'Marcus Johnson', Title: 'VP Technology', Email: 'm.johnson@pinnaclefs.com', Phone: '(212) 555-4002' },
          { Name: 'Diana Patel', Title: 'Head of Data', Email: 'd.patel@pinnaclefs.com', Phone: '(212) 555-4003' },
        ],
      },
      {
        title: 'Opportunities',
        columns: ['Opportunity Name', 'Stage', 'Amount', 'Close Date'],
        rows: [
          { 'Opportunity Name': 'Pinnacle Data360 Implementation', Stage: 'Closed Won', Amount: '$850,000', 'Close Date': '2025-12-20' },
          { 'Opportunity Name': 'Pinnacle Platform Expansion', Stage: 'Proposal', Amount: '$420,000', 'Close Date': '2026-04-30' },
        ],
      },
      {
        title: 'Data360 Segments',
        columns: ['Segment Name', 'Match Score', 'Source', 'Last Updated'],
        rows: [
          { 'Segment Name': 'Financial Enterprise', 'Match Score': '98%', Source: 'Industry + Revenue', 'Last Updated': '2026-02-14' },
          { 'Segment Name': 'Data360 Active Users', 'Match Score': '100%', Source: 'Product Usage', 'Last Updated': '2026-02-14' },
        ],
      },
    ],
  },
];

// Search function that filters records by query
export function searchData360(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const lower = query.toLowerCase();
  return data360Records
    .filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.subtitle?.toLowerCase().includes(lower) ||
        r.type.toLowerCase().includes(lower) ||
        Object.values(r.details).some((v) => v.toLowerCase().includes(lower))
    )
    .map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      subtitle: r.subtitle || '',
      icon: r.icon,
    }));
}

// Get a single record by ID
export function getRecord(id: string): Data360Record | undefined {
  return data360Records.find((r) => r.id === id);
}

// Default record to show (when no search has been performed)
export function getDefaultRecord(): Data360Record {
  return data360Records[0]; // Acme Corporation
}

// ==========================================
// Workflow types & mock data
// ==========================================

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  detailType: 'config' | 'choices' | 'learning' | 'review';
  detailContent: {
    heading: string;
    description: string;
    options?: { label: string; description: string; recommended?: boolean }[];
    fields?: { label: string; value: string; editable?: boolean }[];
    tips?: string[];
  };
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'for-you' | 'popular';
  steps: WorkflowStep[];
}

export interface UserProfile {
  name: string;
  title: string;
  role: string;
  avatar?: string;
}

// Current logged-in user mock
export const currentUser: UserProfile = {
  name: 'Sarah Johnson',
  title: 'Data Cloud Admin',
  role: 'admin',
};

// Workflows personalised for the logged-in user
export const forYouWorkflows: Workflow[] = [
  {
    id: 'wf-segment-builder',
    title: 'Build a Customer Segment',
    description: 'Create a targeted audience segment using unified customer profiles.',
    icon: 'Users',
    category: 'for-you',
    steps: [
      {
        id: 'sb-1',
        title: 'Define Segment Goal',
        description: 'Describe the audience you want to reach.',
        status: 'completed',
        detailType: 'config',
        detailContent: {
          heading: 'Segment Goal',
          description: 'What audience are you trying to build?',
          fields: [
            { label: 'Segment Name', value: 'High-Value West Coast', editable: true },
            { label: 'Description', value: 'Enterprise accounts in CA, OR, WA with >$1M revenue', editable: true },
          ],
        },
      },
      {
        id: 'sb-2',
        title: 'Select Data Sources',
        description: 'Choose which data streams to include.',
        status: 'active',
        detailType: 'choices',
        detailContent: {
          heading: 'Data Sources',
          description: 'Select the data streams that will power this segment.',
          options: [
            { label: 'CRM Accounts', description: 'Salesforce CRM account records', recommended: true },
            { label: 'Marketing Cloud', description: 'Email engagement & campaign data' },
            { label: 'Commerce Cloud', description: 'Purchase history & transactions', recommended: true },
            { label: 'Web Analytics', description: 'Website visit & behavior data' },
          ],
        },
      },
      {
        id: 'sb-3',
        title: 'Set Filter Criteria',
        description: 'Define the rules that determine segment membership.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Filter Rules',
          description: 'Configure the criteria for segment membership.',
          fields: [
            { label: 'Region', value: 'West Coast (CA, OR, WA)', editable: true },
            { label: 'Revenue', value: '> $1,000,000', editable: true },
            { label: 'Account Type', value: 'Enterprise', editable: true },
            { label: 'Engagement Score', value: '> 70', editable: true },
          ],
        },
      },
      {
        id: 'sb-4',
        title: 'Review & Activate',
        description: 'Preview segment size and activate.',
        status: 'upcoming',
        detailType: 'review',
        detailContent: {
          heading: 'Segment Review',
          description: 'Review your segment configuration before activation.',
          tips: [
            'Estimated segment size will be calculated after activation.',
            'You can edit the segment criteria at any time.',
            'Activation targets can be added in the next step.',
          ],
        },
      },
    ],
  },
  {
    id: 'wf-identity-resolution',
    title: 'Set Up Identity Resolution',
    description: 'Configure matching rules to unify customer profiles across sources.',
    icon: 'Fingerprint',
    category: 'for-you',
    steps: [
      {
        id: 'ir-1',
        title: 'Choose Match Strategy',
        description: 'Select the approach for matching records.',
        status: 'active',
        detailType: 'choices',
        detailContent: {
          heading: 'Match Strategy',
          description: 'How should we match records across data sources?',
          options: [
            { label: 'Deterministic', description: 'Exact matches on email, phone, or ID', recommended: true },
            { label: 'Probabilistic', description: 'Fuzzy matching using ML algorithms' },
            { label: 'Hybrid', description: 'Combine both approaches for best results' },
          ],
        },
      },
      {
        id: 'ir-2',
        title: 'Configure Match Rules',
        description: 'Define the fields and thresholds for matching.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Match Rules',
          description: 'Set up the fields and thresholds for identity matching.',
          fields: [
            { label: 'Primary Key', value: 'Email Address', editable: true },
            { label: 'Secondary Key', value: 'Phone Number', editable: true },
            { label: 'Match Threshold', value: '85%', editable: true },
          ],
        },
      },
      {
        id: 'ir-3',
        title: 'Test & Validate',
        description: 'Run a test batch and review match quality.',
        status: 'upcoming',
        detailType: 'review',
        detailContent: {
          heading: 'Validation',
          description: 'Review the identity resolution test results.',
          tips: [
            'A sample of 1,000 records will be processed.',
            'Review match pairs for accuracy before full run.',
            'Adjust thresholds if too many false positives appear.',
          ],
        },
      },
    ],
  },
  {
    id: 'wf-data-quality',
    title: 'Run Data Quality Assessment',
    description: 'Scan your data streams for completeness, accuracy, and freshness.',
    icon: 'BarChart3',
    category: 'for-you',
    steps: [
      {
        id: 'dq-1',
        title: 'Select Data Streams',
        description: 'Choose which streams to assess.',
        status: 'active',
        detailType: 'choices',
        detailContent: {
          heading: 'Data Streams',
          description: 'Which data streams should be included in the quality assessment?',
          options: [
            { label: 'CRM Core', description: 'Accounts, contacts, opportunities', recommended: true },
            { label: 'Marketing Events', description: 'Campaign responses & engagement' },
            { label: 'Support Tickets', description: 'Case and ticket data' },
            { label: 'Product Usage', description: 'Telemetry & usage analytics' },
          ],
        },
      },
      {
        id: 'dq-2',
        title: 'Configure Quality Rules',
        description: 'Set thresholds for quality scoring.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Quality Thresholds',
          description: 'Define what constitutes acceptable data quality.',
          fields: [
            { label: 'Completeness', value: '> 90%', editable: true },
            { label: 'Freshness', value: '< 7 days old', editable: true },
            { label: 'Accuracy', value: '> 95% valid formats', editable: true },
          ],
        },
      },
      {
        id: 'dq-3',
        title: 'Review Results',
        description: 'Analyze the quality report and take action.',
        status: 'upcoming',
        detailType: 'learning',
        detailContent: {
          heading: 'Understanding Data Quality',
          description: 'Learn how to interpret and improve your data quality scores.',
          tips: [
            'Completeness measures how many required fields are populated.',
            'Freshness indicates how recently each record was updated.',
            'Accuracy checks field values against expected formats and ranges.',
            'Use the recommendations to prioritize data cleanup tasks.',
          ],
        },
      },
    ],
  },
];

// Static popular use cases
export const popularWorkflows: Workflow[] = [
  {
    id: 'wf-connect-unify',
    title: 'Connect & Unify',
    description: 'Connect data sources and create unified customer profiles end-to-end.',
    icon: 'Database',
    category: 'popular',
    steps: [
      {
        id: 'cu-1',
        title: 'Connect Data Sources',
        description: 'Choose and configure your data source connectors.',
        status: 'active',
        detailType: 'choices',
        detailContent: {
          heading: 'Data Sources',
          description: 'Which data sources would you like to connect?',
          options: [
            { label: 'Salesforce CRM', description: 'Sync accounts, contacts, and opportunities', recommended: true },
            { label: 'Informatica MDM', description: 'Master data management bundles' },
            { label: 'Marketing Cloud', description: 'Email engagement & journeys' },
            { label: 'External APIs', description: 'REST/SOAP integrations' },
          ],
        },
      },
      {
        id: 'cu-2',
        title: 'Map to Data Model',
        description: 'Map incoming fields to the Data Cloud data model.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Data Model Mapping',
          description: 'Map source fields to Data Cloud objects and relationships.',
          fields: [
            { label: 'Target Object', value: 'Unified Individual', editable: true },
            { label: 'Primary Key', value: 'Email Address', editable: true },
            { label: 'Relationship Key', value: 'Account ID', editable: true },
          ],
        },
      },
      {
        id: 'cu-3',
        title: 'Configure Identity Resolution',
        description: 'Set up matching rules to unify records across sources.',
        status: 'upcoming',
        detailType: 'choices',
        detailContent: {
          heading: 'Identity Resolution',
          description: 'How should records be matched and unified?',
          options: [
            { label: 'Deterministic', description: 'Exact match on email, phone, or ID', recommended: true },
            { label: 'Probabilistic', description: 'Fuzzy matching using ML models' },
            { label: 'Hybrid', description: 'Both approaches for maximum coverage' },
          ],
        },
      },
      {
        id: 'cu-4',
        title: 'Test & Deploy',
        description: 'Run a test unification batch and review results.',
        status: 'upcoming',
        detailType: 'review',
        detailContent: {
          heading: 'Unification Review',
          description: 'Review the test results before deploying.',
          tips: [
            'A sample of 1,000 records will be processed for testing.',
            'Review match quality and duplicate resolution.',
            'Deploy to begin scheduled unification runs.',
            'Monitor results via the Data Quality dashboard.',
          ],
        },
      },
    ],
  },
  {
    id: 'wf-activation',
    title: 'Create an Activation',
    description: 'Push a segment to a marketing or advertising platform.',
    icon: 'Zap',
    category: 'popular',
    steps: [
      {
        id: 'act-1',
        title: 'Choose Segment',
        description: 'Select the segment to activate.',
        status: 'active',
        detailType: 'choices',
        detailContent: {
          heading: 'Segment Selection',
          description: 'Which segment would you like to activate?',
          options: [
            { label: 'Enterprise Tech Buyers', description: '12,400 profiles · Updated 2h ago', recommended: true },
            { label: 'High-Value Accounts', description: '3,200 profiles · Updated 1d ago' },
            { label: 'West Coast Enterprise', description: '8,100 profiles · Updated 4h ago' },
          ],
        },
      },
      {
        id: 'act-2',
        title: 'Select Target',
        description: 'Choose the activation target platform.',
        status: 'upcoming',
        detailType: 'choices',
        detailContent: {
          heading: 'Activation Target',
          description: 'Where should this segment be sent?',
          options: [
            { label: 'Google Ads', description: 'Customer Match audiences' },
            { label: 'Meta Ads', description: 'Custom Audiences' },
            { label: 'Marketing Cloud', description: 'Journey Builder entry' },
            { label: 'Salesforce CRM', description: 'Campaign member sync' },
          ],
        },
      },
      {
        id: 'act-3',
        title: 'Map Fields',
        description: 'Map segment fields to target platform fields.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Field Mapping',
          description: 'Map your segment fields to the target platform.',
          fields: [
            { label: 'Email', value: 'email → hashed_email', editable: true },
            { label: 'Name', value: 'full_name → customer_name', editable: true },
            { label: 'Phone', value: 'phone → phone_number', editable: true },
          ],
        },
      },
      {
        id: 'act-4',
        title: 'Review & Publish',
        description: 'Confirm settings and activate.',
        status: 'upcoming',
        detailType: 'review',
        detailContent: {
          heading: 'Activation Review',
          description: 'Confirm your activation settings before publishing.',
          tips: [
            'Data will be refreshed on the schedule you configure.',
            'Initial sync may process for several minutes.',
            'You can pause or stop the activation at any time.',
          ],
        },
      },
    ],
  },
  {
    id: 'wf-calculated-insight',
    title: 'Build a Calculated Insight',
    description: 'Create a derived metric from your unified data model.',
    icon: 'Calculator',
    category: 'popular',
    steps: [
      {
        id: 'ci-1',
        title: 'Define Metric',
        description: 'Describe the insight you want to calculate.',
        status: 'active',
        detailType: 'config',
        detailContent: {
          heading: 'Metric Definition',
          description: 'Define the calculated insight.',
          fields: [
            { label: 'Metric Name', value: 'Lifetime Value Score', editable: true },
            { label: 'Object', value: 'Unified Individual', editable: true },
            { label: 'Calculation', value: 'SUM(purchases) * engagement_weight', editable: true },
          ],
        },
      },
      {
        id: 'ci-2',
        title: 'Select Dimensions',
        description: 'Choose grouping and filtering dimensions.',
        status: 'upcoming',
        detailType: 'choices',
        detailContent: {
          heading: 'Dimensions',
          description: 'How should the metric be grouped?',
          options: [
            { label: 'By Account', description: 'Aggregate at account level' },
            { label: 'By Region', description: 'Group by geographic region' },
            { label: 'By Time Period', description: 'Monthly / quarterly breakdown', recommended: true },
          ],
        },
      },
      {
        id: 'ci-3',
        title: 'Preview & Save',
        description: 'Review sample calculations and save.',
        status: 'upcoming',
        detailType: 'review',
        detailContent: {
          heading: 'Preview',
          description: 'Review sample output before saving.',
          tips: [
            'Preview shows the first 100 calculated values.',
            'Full computation runs on the configured schedule.',
            'You can reference this insight in segments and reports.',
          ],
        },
      },
    ],
  },
  {
    id: 'wf-data-stream',
    title: 'Connect a Data Stream',
    description: 'Ingest data from an external source into Data Cloud.',
    icon: 'Database',
    category: 'popular',
    steps: [
      {
        id: 'ds-1',
        title: 'Choose Connector',
        description: 'Select the data source type.',
        status: 'active',
        detailType: 'choices',
        detailContent: {
          heading: 'Connector Type',
          description: 'What type of data source are you connecting?',
          options: [
            { label: 'Salesforce CRM', description: 'Sync CRM objects directly', recommended: true },
            { label: 'Amazon S3', description: 'Import files from S3 buckets' },
            { label: 'Google Cloud Storage', description: 'Import from GCS' },
            { label: 'Custom API', description: 'Connect via Ingestion API' },
          ],
        },
      },
      {
        id: 'ds-2',
        title: 'Configure Connection',
        description: 'Set up authentication and source settings.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Connection Settings',
          description: 'Configure the data source connection.',
          fields: [
            { label: 'Connection Name', value: '', editable: true },
            { label: 'Refresh Schedule', value: 'Every 6 hours', editable: true },
            { label: 'Data Format', value: 'Auto-detect', editable: true },
          ],
        },
      },
      {
        id: 'ds-3',
        title: 'Map to Data Model',
        description: 'Map source fields to your data model objects.',
        status: 'upcoming',
        detailType: 'config',
        detailContent: {
          heading: 'Data Model Mapping',
          description: 'Map incoming fields to Data Cloud objects.',
          fields: [
            { label: 'Target Object', value: 'Select...', editable: true },
            { label: 'Primary Key', value: 'Select...', editable: true },
            { label: 'Timestamp Field', value: 'Select...', editable: true },
          ],
        },
      },
      {
        id: 'ds-4',
        title: 'Test & Deploy',
        description: 'Run a test ingestion and deploy.',
        status: 'upcoming',
        detailType: 'review',
        detailContent: {
          heading: 'Test Ingestion',
          description: 'Verify the data stream before deploying.',
          tips: [
            'A sample of records will be ingested for testing.',
            'Review field mappings and data types in the preview.',
            'Deploy to start scheduled ingestion.',
          ],
        },
      },
    ],
  },
  {
    id: 'wf-explore-profiles',
    title: 'Explore Unified Profiles',
    description: 'Browse and search unified customer profiles.',
    icon: 'UserSearch',
    category: 'popular',
    steps: [
      {
        id: 'ep-1',
        title: 'Search Profiles',
        description: 'Find a profile by name, email, or ID.',
        status: 'active',
        detailType: 'config',
        detailContent: {
          heading: 'Profile Search',
          description: 'Enter search criteria to find unified profiles.',
          fields: [
            { label: 'Search Term', value: '', editable: true },
            { label: 'Filter by Source', value: 'All Sources', editable: true },
          ],
        },
      },
      {
        id: 'ep-2',
        title: 'View Profile Details',
        description: 'Examine the unified profile and its source records.',
        status: 'upcoming',
        detailType: 'learning',
        detailContent: {
          heading: 'Understanding Unified Profiles',
          description: 'Learn how Data Cloud merges records into unified profiles.',
          tips: [
            'Each profile shows all matched records from connected sources.',
            'Identity resolution scores indicate match confidence.',
            'Timeline view shows all interactions across channels.',
            'Use the graph view to see entity relationships.',
          ],
        },
      },
    ],
  },
];
