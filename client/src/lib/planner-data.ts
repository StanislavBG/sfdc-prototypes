// Workflow Planner data models and mock data
// Implements the 4-region workflow planner architecture

// ==========================================
// Core Types
// ==========================================

export interface Persona {
  id: string;
  name: string;
  role: string;
  agenda: string[];
  context: string;
}

export interface JobInput {
  id: string;
  description: string;
  persona: Persona;
  submittedAt: string;
}

/** A single step in a planned workflow */
export interface PlannerStep {
  id: string;
  title: string;
  goal: string;
  instructions: string[];
  expectedInput: Record<string, string>;
  expectedOutput: Record<string, string>;
  /** Runtime actual values, populated as tracker executes */
  actualInput?: Record<string, string>;
  actualOutput?: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'error';
  /** Progress 0-100 for animation */
  progress: number;
}

/** A complete workflow definition produced by the planner */
export interface PlannedWorkflow {
  id: string;
  title: string;
  description: string;
  jobInput: JobInput;
  steps: PlannerStep[];
  status: 'planning' | 'ready' | 'running' | 'completed' | 'error';
  createdAt: string;
}

/** Source for step explorer: tracker (actual values) or definition (expected values) */
export type StepDataSource = 'tracker' | 'definition';

// ==========================================
// Mock Personas
// ==========================================

export const mockPersonas: Persona[] = [
  {
    id: 'persona-admin',
    name: 'Sarah Johnson',
    role: 'Data Cloud Admin',
    agenda: [
      'Maintain data quality across all streams',
      'Configure identity resolution rules',
      'Monitor ingestion pipelines',
    ],
    context: 'Salesforce Data Cloud org with 2.4M unified profiles, 47 active segments, connected to CRM, Marketing Cloud, and Commerce Cloud.',
  },
  {
    id: 'persona-analyst',
    name: 'David Kim',
    role: 'Data Analyst',
    agenda: [
      'Build customer insights and reports',
      'Create calculated metrics for business KPIs',
      'Analyze segment performance',
    ],
    context: 'Focused on enterprise accounts in West Coast region. Needs cross-channel attribution and lifetime value calculations.',
  },
  {
    id: 'persona-marketer',
    name: 'Lisa Chen',
    role: 'Marketing Manager',
    agenda: [
      'Create and manage audience segments',
      'Activate segments to ad platforms',
      'Track campaign performance',
    ],
    context: 'Q1 campaign push targeting high-value enterprise accounts. Needs to sync segments to Google Ads, Meta, and Marketing Cloud journeys.',
  },
];

// ==========================================
// Mock Planned Workflows
// ==========================================

function createSegmentWorkflow(persona: Persona): PlannedWorkflow {
  return {
    id: 'pw-segment-build',
    title: 'Build High-Value Customer Segment',
    description: 'Create a targeted segment of high-value enterprise accounts for Q1 campaign activation.',
    jobInput: {
      id: 'job-001',
      description: 'I need to build a segment of high-value enterprise customers on the West Coast for our Q1 marketing push. Should include accounts with >$1M revenue and high engagement scores.',
      persona,
      submittedAt: new Date().toISOString(),
    },
    status: 'running',
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'ps-1',
        title: 'Analyze Data Sources',
        goal: 'Identify and validate available data streams that contain the required customer attributes.',
        instructions: [
          'Query the Data Cloud catalog for streams containing revenue, engagement, and geographic data.',
          'Validate that CRM Account records include annual revenue fields.',
          'Check Marketing Cloud engagement score availability.',
          'Confirm geographic data coverage for West Coast states (CA, OR, WA).',
        ],
        expectedInput: {
          'Target Attributes': 'Revenue, Engagement Score, Region',
          'Data Catalog': 'Data Cloud Stream Registry',
        },
        expectedOutput: {
          'Available Streams': 'CRM Accounts, Marketing Engagement, Firmographic Data',
          'Coverage Score': '>95% for required attributes',
          'Data Freshness': 'All streams updated within 24 hours',
        },
        actualInput: {
          'Target Attributes': 'Annual Revenue, Engagement Score, Billing State',
          'Data Catalog': 'Data Cloud Stream Registry v2.4',
        },
        actualOutput: {
          'Available Streams': 'CRM Accounts (2.4M), MC Engagement (1.8M), Firmographic (2.1M)',
          'Coverage Score': '97.3% attribute coverage',
          'Data Freshness': 'CRM: 2h ago, MC: 4h ago, Firmographic: 12h ago',
        },
        status: 'completed',
        progress: 100,
      },
      {
        id: 'ps-2',
        title: 'Define Segment Criteria',
        goal: 'Configure filter rules that define segment membership based on business requirements.',
        instructions: [
          'Set revenue filter: Annual Revenue > $1,000,000.',
          'Set region filter: Billing State IN (CA, OR, WA).',
          'Set engagement filter: Engagement Score > 70.',
          'Set account type filter: Type = Enterprise.',
          'Combine filters with AND logic.',
        ],
        expectedInput: {
          'Business Rules': 'Revenue >$1M, West Coast, High Engagement, Enterprise',
          'Filter Logic': 'AND combination',
        },
        expectedOutput: {
          'Segment Definition': 'SQL-like filter expression',
          'Estimated Size': '~3,000-5,000 profiles',
        },
        actualInput: {
          'Business Rules': 'AnnualRevenue > 1000000 AND BillingState IN (CA,OR,WA) AND EngagementScore > 70 AND Type = Enterprise',
          'Filter Logic': 'AND (all conditions must be true)',
        },
        actualOutput: {
          'Segment Definition': 'WHERE annual_revenue > 1000000 AND billing_state IN ("CA","OR","WA") AND engagement_score > 70 AND account_type = "Enterprise"',
          'Estimated Size': '3,847 profiles matched',
        },
        status: 'running',
        progress: 65,
      },
      {
        id: 'ps-3',
        title: 'Validate & Preview',
        goal: 'Run the segment against live data and preview member profiles for quality assurance.',
        instructions: [
          'Execute segment query against unified profile store.',
          'Sample 50 profiles for manual review.',
          'Check for known data quality issues (duplicates, stale records).',
          'Generate segment statistics (size, overlap with existing segments, demographics breakdown).',
        ],
        expectedInput: {
          'Segment Query': 'Compiled filter expression from Step 2',
          'Sample Size': '50 profiles for review',
        },
        expectedOutput: {
          'Total Matches': 'Profile count meeting all criteria',
          'Quality Score': 'Duplicate and freshness check results',
          'Sample Profiles': 'Top 50 profiles with key attributes',
        },
        status: 'pending',
        progress: 0,
      },
      {
        id: 'ps-4',
        title: 'Configure Activation',
        goal: 'Set up activation targets to push the segment to downstream marketing platforms.',
        instructions: [
          'Select activation targets: Google Ads Customer Match, Meta Custom Audiences.',
          'Map segment fields to target platform schemas.',
          'Configure refresh schedule (every 6 hours).',
          'Set up consent and privacy filters.',
          'Enable monitoring alerts for sync failures.',
        ],
        expectedInput: {
          'Segment': 'Validated segment from Step 3',
          'Target Platforms': 'Google Ads, Meta Ads',
          'Refresh Cadence': 'Every 6 hours',
        },
        expectedOutput: {
          'Activation Config': 'Platform-specific sync configurations',
          'Field Mappings': 'Segment fields → Platform fields',
          'Schedule': 'Cron expression for 6-hour refresh',
        },
        status: 'pending',
        progress: 0,
      },
      {
        id: 'ps-5',
        title: 'Publish & Monitor',
        goal: 'Publish the segment and activation, then verify the initial sync completes successfully.',
        instructions: [
          'Publish the segment to make it available for activation.',
          'Trigger initial sync to all configured platforms.',
          'Monitor sync progress and check for errors.',
          'Verify record counts match between source and targets.',
          'Set up ongoing monitoring dashboard.',
        ],
        expectedInput: {
          'Published Segment': 'Active segment with activation configs',
          'Sync Trigger': 'Manual initial + scheduled recurring',
        },
        expectedOutput: {
          'Sync Status': 'All platforms synced successfully',
          'Records Synced': 'Count per platform',
          'Monitoring': 'Dashboard URL and alert configuration',
        },
        status: 'pending',
        progress: 0,
      },
    ],
  };
}

function createDataQualityWorkflow(persona: Persona): PlannedWorkflow {
  return {
    id: 'pw-data-quality',
    title: 'Data Quality Assessment & Remediation',
    description: 'Comprehensive data quality scan across all connected streams with automated remediation recommendations.',
    jobInput: {
      id: 'job-002',
      description: 'Run a full data quality assessment on our CRM and Marketing data streams. I need to identify completeness gaps, stale records, and format issues before our Q1 reporting cycle.',
      persona,
      submittedAt: new Date().toISOString(),
    },
    status: 'ready',
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'dq-1',
        title: 'Inventory Data Streams',
        goal: 'Catalog all active data streams and their current health metrics.',
        instructions: [
          'List all connected data streams with last ingestion timestamps.',
          'Check stream health status (active, paused, errored).',
          'Document record counts and growth trends.',
        ],
        expectedInput: {
          'Scope': 'All active data streams',
          'Health Metrics': 'Ingestion status, record counts, error rates',
        },
        expectedOutput: {
          'Stream Inventory': 'Complete list with health status',
          'Total Streams': 'Count of active/paused/errored',
          'Total Records': 'Aggregate record count',
        },
        status: 'pending',
        progress: 0,
      },
      {
        id: 'dq-2',
        title: 'Run Completeness Analysis',
        goal: 'Measure field completeness across all required attributes.',
        instructions: [
          'Define required fields per object type (Account, Contact, Lead).',
          'Calculate fill rates for each required field.',
          'Flag fields below 90% completeness threshold.',
          'Identify patterns in missing data (by source, by time period).',
        ],
        expectedInput: {
          'Required Fields': 'Per-object field requirements',
          'Threshold': '90% minimum completeness',
        },
        expectedOutput: {
          'Completeness Report': 'Per-field fill rates',
          'Below Threshold': 'Fields needing remediation',
          'Pattern Analysis': 'Root cause indicators',
        },
        status: 'pending',
        progress: 0,
      },
      {
        id: 'dq-3',
        title: 'Detect Format & Accuracy Issues',
        goal: 'Validate field formats and identify accuracy problems.',
        instructions: [
          'Run email format validation on all email fields.',
          'Verify phone number formats against E.164 standard.',
          'Check address standardization against USPS database.',
          'Validate date fields for reasonable ranges.',
        ],
        expectedInput: {
          'Validation Rules': 'Format patterns per field type',
          'Standards': 'E.164, RFC 5322, USPS',
        },
        expectedOutput: {
          'Format Errors': 'Count and examples per field',
          'Accuracy Score': 'Percentage of valid records',
          'Remediation Queue': 'Prioritized list of fixes',
        },
        status: 'pending',
        progress: 0,
      },
      {
        id: 'dq-4',
        title: 'Generate Remediation Plan',
        goal: 'Create actionable recommendations for fixing identified data quality issues.',
        instructions: [
          'Prioritize issues by business impact (segment accuracy, activation quality).',
          'Recommend automated fixes where possible (format normalization).',
          'Flag issues requiring manual review.',
          'Estimate effort and timeline for remediation.',
        ],
        expectedInput: {
          'Quality Issues': 'All findings from Steps 2-3',
          'Business Context': 'Q1 reporting deadline and segment dependencies',
        },
        expectedOutput: {
          'Remediation Plan': 'Prioritized action items',
          'Automated Fixes': 'Scripts/transforms to apply',
          'Manual Review Queue': 'Records requiring human attention',
          'Timeline': 'Estimated completion dates',
        },
        status: 'pending',
        progress: 0,
      },
    ],
  };
}

// ==========================================
// Planner Function (simulated)
// ==========================================

/** Simulates the planner generating a workflow from a job description */
export function generateWorkflow(jobDescription: string, persona: Persona): PlannedWorkflow {
  const lower = jobDescription.toLowerCase();

  if (lower.includes('segment') || lower.includes('audience') || lower.includes('campaign')) {
    return createSegmentWorkflow(persona);
  }

  if (lower.includes('quality') || lower.includes('assessment') || lower.includes('remediat')) {
    return createDataQualityWorkflow(persona);
  }

  // Default: return segment workflow
  return createSegmentWorkflow(persona);
}

/** Get a default workflow for demo purposes */
export function getDefaultPlannedWorkflow(): PlannedWorkflow {
  return createSegmentWorkflow(mockPersonas[0]);
}
