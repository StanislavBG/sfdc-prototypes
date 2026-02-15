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

// Navigation items per app context (matches Data Cloud UI from screenshots)
export const appNavItems: Record<string, NavTab[]> = {
  'data-cloud': [
    { label: 'Home' },
    { label: 'Data Streams', hasDropdown: true },
    { label: 'Data Model' },
    { label: 'Data Explorer' },
    { label: 'Identity Resolutions', hasDropdown: true },
    { label: 'Profile Explorer' },
    { label: 'Reports', hasDropdown: true },
    { label: 'Dashboards', hasDropdown: true },
    { label: 'Query Editor', hasDropdown: true },
    { label: 'Calculated Insights', hasDropdown: true },
    { label: 'Segments', hasDropdown: true },
    { label: 'Activation Targets', hasDropdown: true },
    { label: 'Activations', hasDropdown: true },
    { label: 'More', hasDropdown: true },
  ],
  sales: [
    { label: 'Home' },
    { label: 'Accounts', hasDropdown: true },
    { label: 'Contacts', hasDropdown: true },
    { label: 'Opportunities', hasDropdown: true },
    { label: 'Leads', hasDropdown: true },
    { label: 'Reports', hasDropdown: true },
    { label: 'Dashboards', hasDropdown: true },
  ],
  service: [
    { label: 'Home' },
    { label: 'Cases', hasDropdown: true },
    { label: 'Contacts', hasDropdown: true },
    { label: 'Accounts', hasDropdown: true },
    { label: 'Knowledge', hasDropdown: true },
    { label: 'Reports', hasDropdown: true },
    { label: 'Dashboards', hasDropdown: true },
  ],
  marketing: [
    { label: 'Home' },
    { label: 'Campaigns', hasDropdown: true },
    { label: 'Leads', hasDropdown: true },
    { label: 'Contacts', hasDropdown: true },
    { label: 'Reports', hasDropdown: true },
    { label: 'Dashboards', hasDropdown: true },
  ],
};

// Available Salesforce apps
export const salesforceApps: SalesforceApp[] = [
  { id: 'data-cloud', name: 'Data Cloud', description: 'Unified customer data platform', color: '#032D60', icon: 'Database' },
  { id: 'sales', name: 'Sales', description: 'Manage your sales pipeline', color: '#7F8DE1', icon: 'TrendingUp' },
  { id: 'service', name: 'Service', description: 'Customer service console', color: '#F49756', icon: 'Headphones' },
  { id: 'marketing', name: 'Marketing', description: 'Campaign management', color: '#E8788A', icon: 'Megaphone' },
  { id: 'commerce', name: 'Commerce', description: 'Commerce management', color: '#56B1F0', icon: 'ShoppingCart' },
  { id: 'platform', name: 'Platform', description: 'App development', color: '#9B8BF4', icon: 'Code' },
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
