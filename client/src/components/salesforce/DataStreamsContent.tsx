import { useState } from 'react';
import { useMdsSimulator } from './MdsSimulatorContext';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Info,
  Database,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Upload,
  Server,
  Globe,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
interface DataStream {
  id: string;
  name: string;
  source: string;
  sourceType: 'salesforce' | 'informatica' | 'api' | 'file';
  object: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Error';
  recordsProcessed: number;
  lastRefreshed: string;
  refreshFrequency: string;
  dataSpace: string;
  tenant?: string;
  fields?: StreamField[];
}

interface StreamField {
  id: string;
  fieldName: string;
  dataType: string;
  targetDMO: string;
  targetField: string;
  mappingStatus: 'Auto-Mapped' | 'Manual' | 'Unmapped';
}

interface InformaticaBundle {
  id: string;
  name: string;
  description: string;
  objectCount: number;
  installed: boolean;
}

// ── Mock Data ────────────────────────────────────────────────────────
const mockDataStreams: DataStream[] = [
  { id: 'ds-1', name: 'Account - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'Account', status: 'Active', recordsProcessed: 145672, lastRefreshed: '02/25/2026, 3:45 PM', refreshFrequency: 'Every 1 hour', dataSpace: 'default' },
  { id: 'ds-2', name: 'Contact - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'Contact', status: 'Active', recordsProcessed: 324891, lastRefreshed: '02/25/2026, 3:45 PM', refreshFrequency: 'Every 1 hour', dataSpace: 'default' },
  { id: 'ds-3', name: 'Lead - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'Lead', status: 'Active', recordsProcessed: 89456, lastRefreshed: '02/25/2026, 2:30 PM', refreshFrequency: 'Every 6 hours', dataSpace: 'default' },
  { id: 'ds-4', name: 'Opportunity - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'Opportunity', status: 'Active', recordsProcessed: 56234, lastRefreshed: '02/25/2026, 3:45 PM', refreshFrequency: 'Every 1 hour', dataSpace: 'default' },
  { id: 'ds-5', name: 'Case - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'Case', status: 'Inactive', recordsProcessed: 234567, lastRefreshed: '02/20/2026, 9:00 AM', refreshFrequency: 'Manual', dataSpace: 'default' },
  { id: 'ds-6', name: 'EmailMessage - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'EmailMessage', status: 'Active', recordsProcessed: 1245678, lastRefreshed: '02/25/2026, 3:45 PM', refreshFrequency: 'Every 1 hour', dataSpace: 'default' },
  { id: 'ds-7', name: 'Campaign - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'Campaign', status: 'Active', recordsProcessed: 1234, lastRefreshed: '02/25/2026, 1:00 PM', refreshFrequency: 'Every 12 hours', dataSpace: 'default' },
  { id: 'ds-8', name: 'CampaignMember - Salesforce CRM', source: 'Salesforce CRM', sourceType: 'salesforce', object: 'CampaignMember', status: 'Active', recordsProcessed: 45678, lastRefreshed: '02/25/2026, 1:00 PM', refreshFrequency: 'Every 12 hours', dataSpace: 'default' },
];

interface BundleEntity {
  name: string;
  fieldCount: number;
}

interface InformaticaBundleExt extends InformaticaBundle {
  entities: BundleEntity[];
  type: string;
}

const informaticaBundles: InformaticaBundleExt[] = [
  {
    id: 'ib-1', name: 'Customer 360', description: 'Customer master data including demographics, preferences, and relationships', objectCount: 12, installed: false,
    type: 'MDM Business Entity Bundle',
    entities: [
      { name: 'Person', fieldCount: 24 }, { name: 'Organization', fieldCount: 18 }, { name: 'Address', fieldCount: 14 },
      { name: 'Phone', fieldCount: 8 }, { name: 'Email', fieldCount: 6 }, { name: 'Loyalty', fieldCount: 10 },
      { name: 'AlternateId', fieldCount: 5 }, { name: 'Relationship', fieldCount: 7 }, { name: 'Household', fieldCount: 9 },
      { name: 'SocialProfile', fieldCount: 6 }, { name: 'Consent', fieldCount: 8 }, { name: 'CustomerAccount', fieldCount: 12 },
    ],
  },
  {
    id: 'ib-2', name: 'Product 360', description: 'Product catalog, pricing, and category hierarchies', objectCount: 8, installed: false,
    type: 'MDM Business Entity Bundle',
    entities: [
      { name: 'Product', fieldCount: 22 }, { name: 'ProductCategory', fieldCount: 8 }, { name: 'ProductHierarchy', fieldCount: 6 },
      { name: 'ProductAttribute', fieldCount: 10 }, { name: 'ProductRelationship', fieldCount: 5 }, { name: 'PriceBookEntry', fieldCount: 9 },
      { name: 'Brand', fieldCount: 7 }, { name: 'ProductCatalog', fieldCount: 11 },
    ],
  },
  {
    id: 'ib-3', name: 'Supplier 360', description: 'Supplier profiles, contacts, and compliance data', objectCount: 8, installed: false,
    type: 'MDM Business Entity Bundle',
    entities: [
      { name: 'Supplier', fieldCount: 20 }, { name: 'SupplierContact', fieldCount: 12 }, { name: 'SupplierAddress', fieldCount: 10 },
      { name: 'BankAccount', fieldCount: 8 }, { name: 'Certification', fieldCount: 6 }, { name: 'Contract', fieldCount: 14 },
      { name: 'SupplierRating', fieldCount: 5 }, { name: 'ComplianceRecord', fieldCount: 9 },
    ],
  },
  {
    id: 'ib-4', name: 'Reference 360', description: 'Reference data sets, code lists, hierarchies, and crosswalks', objectCount: 12, installed: false,
    type: 'MDM Reference Data Bundle',
    entities: [
      { name: 'ReferenceDataSet', fieldCount: 8 }, { name: 'CodeList', fieldCount: 10 }, { name: 'HierarchicalCodeList', fieldCount: 12 },
      { name: 'DependentCodeList', fieldCount: 9 }, { name: 'CodeValue', fieldCount: 6 }, { name: 'Crosswalk', fieldCount: 7 },
      { name: 'Hierarchy', fieldCount: 8 }, { name: 'HierarchyModel', fieldCount: 5 }, { name: 'CustomAttribute', fieldCount: 4 },
      { name: 'DisplayAttribute', fieldCount: 3 }, { name: 'Classification', fieldCount: 6 }, { name: 'MappingRule', fieldCount: 7 },
    ],
  },
  {
    id: 'ib-5', name: 'Organization 360', description: 'Organization hierarchy, departments, and cost centers', objectCount: 9, installed: false,
    type: 'MDM Business Entity Bundle',
    entities: [
      { name: 'Organization', fieldCount: 18 }, { name: 'Department', fieldCount: 10 }, { name: 'CostCenter', fieldCount: 8 },
      { name: 'BusinessUnit', fieldCount: 7 }, { name: 'Division', fieldCount: 6 }, { name: 'LegalEntity', fieldCount: 12 },
      { name: 'OrgHierarchy', fieldCount: 5 }, { name: 'OrgRelationship', fieldCount: 6 }, { name: 'Location', fieldCount: 14 },
    ],
  },
  {
    id: 'ib-6', name: 'Finance 360', description: 'Chart of accounts, GL codes, and financial instruments', objectCount: 11, installed: false,
    type: 'MDM Reference Data Bundle',
    entities: [
      { name: 'GLAccount', fieldCount: 15 }, { name: 'ChartOfAccounts', fieldCount: 10 }, { name: 'CompanyCode', fieldCount: 12 },
      { name: 'CostCenter', fieldCount: 8 }, { name: 'CostCenterHierarchy', fieldCount: 6 }, { name: 'ProfitCenter', fieldCount: 9 },
      { name: 'FinancialInstrument', fieldCount: 14 }, { name: 'JournalEntry', fieldCount: 11 }, { name: 'GLCOAMaster', fieldCount: 16 },
      { name: 'BusinessArea', fieldCount: 7 }, { name: 'FunctionalArea', fieldCount: 5 },
    ],
  },
];

// ── Salesforce Standard Bundles ────────────────────────────────────────
interface SfBundle {
  id: string;
  name: string;
  objectCount: number;
  icon: string;
  iconColor: string;
  objects: string[];
}

const salesforceStandardBundles: SfBundle[] = [
  { id: 'sf-b1', name: 'Advanced Billing Bundle', objectCount: 18, icon: 'AB', iconColor: '#E91E63',
    objects: ['BillingSchedule', 'BillingScheduleGroup', 'Invoice', 'InvoiceLine', 'Payment', 'PaymentMethod', 'PaymentLineInvoice', 'CreditMemo', 'CreditMemoLine', 'DebitNote', 'DebitNoteLine', 'PaymentGateway', 'PaymentGatewayLog', 'FinanceBalanceSnapshot', 'FinanceTransaction', 'RefundLinePayment', 'PaymentAllocation', 'TaxTreatment'] },
  { id: 'sf-b2', name: 'Agent Metadata', objectCount: 4, icon: 'AM', iconColor: '#9C27B0',
    objects: ['GenAiPluginDefinition', 'BotDefinition', 'BotVersion', 'GenAiFunctionDefinition'] },
  { id: 'sf-b3', name: 'Asset Bundle', objectCount: 5, icon: 'AS', iconColor: '#4CAF50',
    objects: ['Asset', 'AssetRelationship', 'AssetAction', 'AssetActionSource', 'AssetStatePeriod'] },
  { id: 'sf-b4', name: 'bndl', objectCount: 1, icon: 'B', iconColor: '#607D8B',
    objects: ['CustomBundleObject'] },
  { id: 'sf-b5', name: 'Common Billing Bundle', objectCount: 12, icon: 'CB', iconColor: '#FF5722',
    objects: ['BillingSchedule', 'BillingScheduleGroup', 'Invoice', 'InvoiceLine', 'Payment', 'PaymentMethod', 'CreditMemo', 'CreditMemoLine', 'FinanceTransaction', 'FinanceBalanceSnapshot', 'PaymentLineInvoice', 'RefundLinePayment'] },
  { id: 'sf-b6', name: 'Content_Bundle', objectCount: 3, icon: 'CT', iconColor: '#795548',
    objects: ['ContentVersion', 'ContentDocument', 'ContentDocumentLink'] },
  { id: 'sf-b7', name: 'Digital Engagement', objectCount: 5, icon: 'DE', iconColor: '#00BCD4',
    objects: ['MessagingSession', 'MessagingEndUser', 'MessagingChannel', 'ConversationEntry', 'ConversationParticipant'] },
  { id: 'sf-b8', name: 'Emails', objectCount: 2, icon: 'EM', iconColor: '#3F51B5',
    objects: ['EmailMessage', 'EmailMessageRelation'] },
  { id: 'sf-b9', name: 'Einstein Activity Capture', objectCount: 3, icon: 'EA', iconColor: '#673AB7',
    objects: ['ActivityMetric', 'EmailActivity', 'EventActivity'] },
  { id: 'sf-b10', name: 'Einstein Analytics Bundle', objectCount: 6, icon: 'EI', iconColor: '#2196F3',
    objects: ['AnalyticDataflow', 'AnalyticDataset', 'AnalyticLens', 'AnalyticDashboard', 'AnalyticStory', 'AnalyticRecipe'] },
  { id: 'sf-b11', name: 'Engagement Bundle', objectCount: 4, icon: 'EN', iconColor: '#009688',
    objects: ['CampaignMember', 'Campaign', 'CampaignMemberStatus', 'CampaignInfluence'] },
  { id: 'sf-b12', name: 'Events & Tasks', objectCount: 3, icon: 'ET', iconColor: '#FF9800',
    objects: ['Event', 'Task', 'EventRelation'] },
  { id: 'sf-b13', name: 'Field Service Bundle', objectCount: 8, icon: 'FS', iconColor: '#4CAF50',
    objects: ['WorkOrder', 'WorkOrderLineItem', 'ServiceAppointment', 'ServiceResource', 'ServiceTerritory', 'AssignedResource', 'ResourceAbsence', 'TimeSheet'] },
  { id: 'sf-b14', name: 'Flow Orchestration', objectCount: 2, icon: 'FO', iconColor: '#E91E63',
    objects: ['FlowOrchestrationInstance', 'FlowOrchestrationStepInstance'] },
  { id: 'sf-b15', name: 'Knowledge Bundle', objectCount: 3, icon: 'KB', iconColor: '#FF5722',
    objects: ['Knowledge__kav', 'KnowledgeArticle', 'KnowledgeArticleVersion'] },
  { id: 'sf-b16', name: 'Lead Bundle', objectCount: 2, icon: 'LB', iconColor: '#9C27B0',
    objects: ['Lead', 'LeadHistory'] },
  { id: 'sf-b17', name: 'Loyalty Management', objectCount: 7, icon: 'LM', iconColor: '#FF9800',
    objects: ['LoyaltyProgram', 'LoyaltyProgramMember', 'LoyaltyMemberTier', 'LoyaltyMemberCurrency', 'TransactionJournal', 'LoyaltyPartnerProduct', 'LoyaltyMemberBadge'] },
  { id: 'sf-b18', name: 'Manufacturing Cloud', objectCount: 5, icon: 'MC', iconColor: '#795548',
    objects: ['AccountForecast', 'SalesAgreement', 'SalesAgreementProduct', 'RebateType', 'RebatePayoutSnapshot'] },
  { id: 'sf-b19', name: 'Opportunity Bundle', objectCount: 4, icon: 'OB', iconColor: '#3F51B5',
    objects: ['Opportunity', 'OpportunityLineItem', 'OpportunityContactRole', 'OpportunityHistory'] },
  { id: 'sf-b20', name: 'Order Bundle', objectCount: 4, icon: 'OR', iconColor: '#00BCD4',
    objects: ['Order', 'OrderItem', 'OrderItemSummary', 'OrderSummary'] },
  { id: 'sf-b21', name: 'Person Account Bundle', objectCount: 3, icon: 'PA', iconColor: '#2196F3',
    objects: ['Account', 'PersonAccount', 'AccountContactRelation'] },
  { id: 'sf-b22', name: 'Product & Price Book', objectCount: 4, icon: 'PP', iconColor: '#4CAF50',
    objects: ['Product2', 'PricebookEntry', 'Pricebook2', 'ProductCategory'] },
  { id: 'sf-b23', name: 'Quoting Bundle', objectCount: 3, icon: 'QB', iconColor: '#607D8B',
    objects: ['Quote', 'QuoteLineItem', 'QuoteDocument'] },
  { id: 'sf-b24', name: 'Sales Cloud Bundle', objectCount: 6, icon: 'SC', iconColor: 'var(--slds-g-color-brand)',
    objects: ['Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Campaign'] },
  { id: 'sf-b25', name: 'Service Cloud Bundle', objectCount: 5, icon: 'SV', iconColor: '#009688',
    objects: ['Case', 'CaseComment', 'CaseHistory', 'Entitlement', 'ServiceContract'] },
  { id: 'sf-b26', name: 'Social Post Bundle', objectCount: 2, icon: 'SP', iconColor: '#E91E63',
    objects: ['SocialPost', 'SocialPersona'] },
  { id: 'sf-b27', name: 'User Bundle', objectCount: 3, icon: 'UB', iconColor: '#673AB7',
    objects: ['User', 'UserRole', 'PermissionSetAssignment'] },
  { id: 'sf-b28', name: 'Websites & Mobile Apps', objectCount: 4, icon: 'WM', iconColor: '#FF5722',
    objects: ['WebStore', 'WebCart', 'WebCartItem', 'BuyerGroup'] },
];

// ── Field Templates per Bundle ───────────────────────────────────────
const bundleFieldTemplates: Record<string, { fieldName: string; dataType: string; targetDMO: string; targetField: string }[]> = {
  'Customer 360': [
    { fieldName: 'customer_id', dataType: 'Text(18)', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__Id__c' },
    { fieldName: 'first_name', dataType: 'Text(80)', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__FirstName__c' },
    { fieldName: 'last_name', dataType: 'Text(80)', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__LastName__c' },
    { fieldName: 'email', dataType: 'Email', targetDMO: 'ContactPointEmail', targetField: 'ssot__EmailAddress__c' },
    { fieldName: 'phone', dataType: 'Phone', targetDMO: 'ContactPointPhone', targetField: 'ssot__TelephoneNumber__c' },
    { fieldName: 'address_line_1', dataType: 'Text(255)', targetDMO: 'ContactPointAddress', targetField: 'ssot__AddressLine1__c' },
    { fieldName: 'city', dataType: 'Text(100)', targetDMO: 'ContactPointAddress', targetField: 'ssot__CityName__c' },
    { fieldName: 'state', dataType: 'Text(50)', targetDMO: 'ContactPointAddress', targetField: 'ssot__StateName__c' },
    { fieldName: 'postal_code', dataType: 'Text(20)', targetDMO: 'ContactPointAddress', targetField: 'ssot__PostalCodeId__c' },
    { fieldName: 'country', dataType: 'Text(50)', targetDMO: 'ContactPointAddress', targetField: 'ssot__CountryName__c' },
    { fieldName: 'date_of_birth', dataType: 'Date', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__BirthDate__c' },
    { fieldName: 'loyalty_tier', dataType: 'Text(20)', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__PersonLifeStage__c' },
    { fieldName: 'account_status', dataType: 'Picklist', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__Status__c' },
    { fieldName: 'created_date', dataType: 'DateTime', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__CreatedDate__c' },
    { fieldName: 'last_modified', dataType: 'DateTime', targetDMO: 'ssot__Individual__dlm', targetField: 'ssot__LastModifiedDate__c' },
  ],
  'Product 360': [
    { fieldName: 'product_id', dataType: 'Text(18)', targetDMO: 'Product__dlm', targetField: 'ssot__Id__c' },
    { fieldName: 'product_name', dataType: 'Text(255)', targetDMO: 'Product__dlm', targetField: 'ssot__Name__c' },
    { fieldName: 'sku', dataType: 'Text(50)', targetDMO: 'Product__dlm', targetField: 'ssot__SKU__c' },
    { fieldName: 'category', dataType: 'Text(100)', targetDMO: 'Product__dlm', targetField: 'ssot__Category__c' },
    { fieldName: 'price', dataType: 'Currency', targetDMO: 'Product__dlm', targetField: 'ssot__UnitPrice__c' },
    { fieldName: 'description', dataType: 'LongText', targetDMO: 'Product__dlm', targetField: 'ssot__Description__c' },
    { fieldName: 'status', dataType: 'Picklist', targetDMO: 'Product__dlm', targetField: 'ssot__Status__c' },
    { fieldName: 'brand', dataType: 'Text(100)', targetDMO: 'Product__dlm', targetField: 'ssot__Brand__c' },
  ],
  'Supplier 360': [
    { fieldName: 'supplier_id', dataType: 'Text(18)', targetDMO: 'Supplier__dlm', targetField: 'ssot__Id__c' },
    { fieldName: 'supplier_name', dataType: 'Text(255)', targetDMO: 'Supplier__dlm', targetField: 'ssot__Name__c' },
    { fieldName: 'contact_name', dataType: 'Text(150)', targetDMO: 'Supplier__dlm', targetField: 'ssot__ContactName__c' },
    { fieldName: 'contact_email', dataType: 'Email', targetDMO: 'Supplier__dlm', targetField: 'ssot__ContactEmail__c' },
    { fieldName: 'region', dataType: 'Text(50)', targetDMO: 'Supplier__dlm', targetField: 'ssot__Region__c' },
    { fieldName: 'rating', dataType: 'Number', targetDMO: 'Supplier__dlm', targetField: 'ssot__Rating__c' },
  ],
  'Reference 360': [
    { fieldName: 'ref_code', dataType: 'Text(50)', targetDMO: 'ReferenceData__dlm', targetField: 'ssot__Code__c' },
    { fieldName: 'ref_value', dataType: 'Text(255)', targetDMO: 'ReferenceData__dlm', targetField: 'ssot__Value__c' },
    { fieldName: 'ref_type', dataType: 'Picklist', targetDMO: 'ReferenceData__dlm', targetField: 'ssot__Type__c' },
    { fieldName: 'hierarchy_level', dataType: 'Number', targetDMO: 'ReferenceData__dlm', targetField: 'ssot__Level__c' },
    { fieldName: 'parent_code', dataType: 'Text(50)', targetDMO: 'ReferenceData__dlm', targetField: 'ssot__ParentCode__c' },
  ],
  'Organization 360': [
    { fieldName: 'org_id', dataType: 'Text(18)', targetDMO: 'Organization__dlm', targetField: 'ssot__Id__c' },
    { fieldName: 'org_name', dataType: 'Text(255)', targetDMO: 'Organization__dlm', targetField: 'ssot__Name__c' },
    { fieldName: 'department', dataType: 'Text(100)', targetDMO: 'Organization__dlm', targetField: 'ssot__Department__c' },
    { fieldName: 'parent_org_id', dataType: 'Text(18)', targetDMO: 'Organization__dlm', targetField: 'ssot__ParentId__c' },
    { fieldName: 'cost_center', dataType: 'Text(50)', targetDMO: 'Organization__dlm', targetField: 'ssot__CostCenter__c' },
  ],
  'Finance 360': [
    { fieldName: 'account_code', dataType: 'Text(30)', targetDMO: 'FinancialAccount__dlm', targetField: 'ssot__AccountCode__c' },
    { fieldName: 'account_name', dataType: 'Text(255)', targetDMO: 'FinancialAccount__dlm', targetField: 'ssot__Name__c' },
    { fieldName: 'gl_code', dataType: 'Text(20)', targetDMO: 'FinancialAccount__dlm', targetField: 'ssot__GLCode__c' },
    { fieldName: 'balance', dataType: 'Currency', targetDMO: 'FinancialAccount__dlm', targetField: 'ssot__Balance__c' },
    { fieldName: 'currency_code', dataType: 'Text(3)', targetDMO: 'FinancialAccount__dlm', targetField: 'ssot__CurrencyIso__c' },
  ],
};

// ── Connector Catalog ─────────────────────────────────────────────────
interface Connector {
  id: string;
  name: string;
  category: string;
  icon: string; // short label for SVG icon
  color: string;
  description?: string;
}

const otherSources: Connector[] = [
  { id: 'src-upload', name: 'File Upload', category: 'Other Sources', icon: '↑', color: '#706E6B', description: 'Upload CSV, JSON, or Parquet files' },
  { id: 'src-api', name: 'Ingestion API', category: 'Other Sources', icon: 'API', color: 'var(--slds-g-color-brand-1)', description: 'Real-time event data via REST API' },
  { id: 'src-s2s', name: 'Server to Server', category: 'Other Sources', icon: 'S2S', color: '#5C6BC0', description: 'Authenticated server-to-server connection' },
  { id: 'src-kits', name: 'Data Kits & Packages', category: 'Other Sources', icon: 'PKG', color: '#00A1E0', description: 'Installed data kits and managed packages' },
];

const explorerConnectors: Connector[] = [
  { id: 'c-acton', name: 'Act-On', category: 'Marketing', icon: 'AO', color: '#33B679' },
  { id: 'c-activecampaign', name: 'ActiveCampaign', category: 'Marketing', icon: 'AC', color: '#356AE6' },
  { id: 'c-acumatica', name: 'Acumatica', category: 'ERP', icon: 'ACU', color: '#C62828' },
  { id: 'c-adobe-analytics', name: 'Adobe Analytics', category: 'Analytics', icon: 'AA', color: '#FF0000' },
  { id: 'c-adobe-commerce', name: 'Adobe Commerce', category: 'Commerce', icon: 'AC', color: '#FF6F00' },
  { id: 'c-adobe-marketo', name: 'Adobe Marketo', category: 'Marketing', icon: 'MK', color: '#5C3D9E' },
  { id: 'c-airtable', name: 'Airtable', category: 'Database', icon: 'AT', color: '#18BFFF' },
  { id: 'c-amazon-ads', name: 'Amazon Ads', category: 'Advertising', icon: 'AA', color: '#FF9900' },
  { id: 'c-amazon-redshift', name: 'Amazon Redshift', category: 'Data Warehouse', icon: 'RS', color: '#8C4FFF' },
  { id: 'c-amazon-s3', name: 'Amazon S3', category: 'Storage', icon: 'S3', color: '#569A31' },
  { id: 'c-amplitude', name: 'Amplitude', category: 'Analytics', icon: 'AMP', color: '#1B1F3B' },
  { id: 'c-appflow', name: 'Amazon AppFlow', category: 'Integration', icon: 'AF', color: '#FF4F8B' },
  { id: 'c-asana', name: 'Asana', category: 'Productivity', icon: 'AS', color: '#F06A6A' },
  { id: 'c-azure-blob', name: 'Azure Blob Storage', category: 'Storage', icon: 'AZ', color: '#0078D4' },
  { id: 'c-azure-sql', name: 'Azure SQL', category: 'Database', icon: 'SQL', color: '#0078D4' },
  { id: 'c-azure-synapse', name: 'Azure Synapse', category: 'Data Warehouse', icon: 'SY', color: '#0078D4' },
  { id: 'c-bigcommerce', name: 'BigCommerce', category: 'Commerce', icon: 'BC', color: '#121118' },
  { id: 'c-bigquery', name: 'Google BigQuery', category: 'Data Warehouse', icon: 'BQ', color: '#4285F4' },
  { id: 'c-box', name: 'Box', category: 'Storage', icon: 'BOX', color: '#0061D5' },
  { id: 'c-braze', name: 'Braze', category: 'Marketing', icon: 'BR', color: '#1C1C1C' },
  { id: 'c-coupa', name: 'Coupa', category: 'Procurement', icon: 'CP', color: '#E31937' },
  { id: 'c-databricks', name: 'Databricks', category: 'Data Warehouse', icon: 'DB', color: '#FF3621' },
  { id: 'c-datadog', name: 'Datadog', category: 'Monitoring', icon: 'DD', color: '#632CA6' },
  { id: 'c-domo', name: 'Domo', category: 'Analytics', icon: 'DO', color: '#1DA1F2' },
  { id: 'c-drift', name: 'Drift', category: 'Chat', icon: 'DR', color: '#1F69FF' },
  { id: 'c-dropbox', name: 'Dropbox', category: 'Storage', icon: 'DB', color: '#0061FF' },
  { id: 'c-dynamics', name: 'Dynamics 365', category: 'CRM', icon: 'D365', color: '#002050' },
  { id: 'c-eloqua', name: 'Oracle Eloqua', category: 'Marketing', icon: 'EL', color: '#C74634' },
  { id: 'c-facebook-ads', name: 'Facebook Ads', category: 'Advertising', icon: 'FB', color: '#1877F2' },
  { id: 'c-freshdesk', name: 'Freshdesk', category: 'Support', icon: 'FD', color: '#2CA01C' },
  { id: 'c-ga4', name: 'Google Analytics 4', category: 'Analytics', icon: 'GA', color: '#E37400' },
  { id: 'c-gcs', name: 'Google Cloud Storage', category: 'Storage', icon: 'GCS', color: '#4285F4' },
  { id: 'c-google-ads', name: 'Google Ads', category: 'Advertising', icon: 'GA', color: '#4285F4' },
  { id: 'c-google-sheets', name: 'Google Sheets', category: 'Productivity', icon: 'GS', color: '#0F9D58' },
  { id: 'c-heap', name: 'Heap', category: 'Analytics', icon: 'HP', color: '#FF6A00' },
  { id: 'c-hubspot', name: 'HubSpot', category: 'CRM', icon: 'HS', color: '#FF7A59' },
  { id: 'c-intercom', name: 'Intercom', category: 'Support', icon: 'IC', color: '#1F8DED' },
  { id: 'c-iterable', name: 'Iterable', category: 'Marketing', icon: 'IT', color: '#6F52ED' },
  { id: 'c-jira', name: 'Jira', category: 'Productivity', icon: 'JR', color: '#0052CC' },
  { id: 'c-kafka', name: 'Apache Kafka', category: 'Streaming', icon: 'KF', color: '#231F20' },
  { id: 'c-klaviyo', name: 'Klaviyo', category: 'Marketing', icon: 'KL', color: '#1A1A1A' },
  { id: 'c-linkedin-ads', name: 'LinkedIn Ads', category: 'Advertising', icon: 'LI', color: '#0A66C2' },
  { id: 'c-looker', name: 'Looker', category: 'Analytics', icon: 'LK', color: '#4285F4' },
  { id: 'c-mailchimp', name: 'Mailchimp', category: 'Marketing', icon: 'MC', color: '#FFE01B' },
  { id: 'c-marketo', name: 'Marketo Engage', category: 'Marketing', icon: 'ME', color: '#5C3D9E' },
  { id: 'c-mixpanel', name: 'Mixpanel', category: 'Analytics', icon: 'MP', color: '#7856FF' },
  { id: 'c-mongodb', name: 'MongoDB', category: 'Database', icon: 'MDB', color: '#47A248' },
  { id: 'c-mysql', name: 'MySQL', category: 'Database', icon: 'MY', color: '#4479A1' },
  { id: 'c-netsuite', name: 'NetSuite', category: 'ERP', icon: 'NS', color: '#003B5C' },
  { id: 'c-oracle-db', name: 'Oracle Database', category: 'Database', icon: 'ORA', color: '#C74634' },
  { id: 'c-outreach', name: 'Outreach', category: 'Sales', icon: 'OR', color: '#5951FF' },
  { id: 'c-pardot', name: 'Pardot', category: 'Marketing', icon: 'PD', color: 'var(--slds-g-color-brand-1)' },
  { id: 'c-paypal', name: 'PayPal', category: 'Payments', icon: 'PP', color: '#003087' },
  { id: 'c-pendo', name: 'Pendo', category: 'Analytics', icon: 'PE', color: '#FF4876' },
  { id: 'c-pinterest', name: 'Pinterest Ads', category: 'Advertising', icon: 'PI', color: '#E60023' },
  { id: 'c-postgres', name: 'PostgreSQL', category: 'Database', icon: 'PG', color: '#336791' },
  { id: 'c-power-bi', name: 'Power BI', category: 'Analytics', icon: 'PBI', color: '#F2C811' },
  { id: 'c-qualtrics', name: 'Qualtrics', category: 'Survey', icon: 'QX', color: '#000000' },
  { id: 'c-quickbooks', name: 'QuickBooks', category: 'Finance', icon: 'QB', color: '#2CA01C' },
  { id: 'c-sailthru', name: 'Sailthru', category: 'Marketing', icon: 'ST', color: '#FF6B35' },
  { id: 'c-salesloft', name: 'SalesLoft', category: 'Sales', icon: 'SL', color: '#00A4BD' },
  { id: 'c-sap', name: 'SAP', category: 'ERP', icon: 'SAP', color: '#0FAAFF' },
  { id: 'c-segment', name: 'Segment', category: 'CDP', icon: 'SG', color: '#52BD94' },
  { id: 'c-sendgrid', name: 'SendGrid', category: 'Email', icon: 'SG', color: '#1A82e2' },
  { id: 'c-servicenow', name: 'ServiceNow', category: 'ITSM', icon: 'SN', color: '#81B5A1' },
  { id: 'c-sftp', name: 'SFTP', category: 'Storage', icon: 'FTP', color: '#706E6B' },
  { id: 'c-shopify', name: 'Shopify', category: 'Commerce', icon: 'SH', color: '#96BF48' },
  { id: 'c-slack', name: 'Slack', category: 'Productivity', icon: 'SL', color: '#4A154B' },
  { id: 'c-snapchat', name: 'Snapchat Ads', category: 'Advertising', icon: 'SC', color: '#FFFC00' },
  { id: 'c-snowflake', name: 'Snowflake', category: 'Data Warehouse', icon: 'SF', color: '#29B5E8' },
  { id: 'c-splunk', name: 'Splunk', category: 'Monitoring', icon: 'SP', color: '#65A637' },
  { id: 'c-square', name: 'Square', category: 'Payments', icon: 'SQ', color: '#006AFF' },
  { id: 'c-stripe', name: 'Stripe', category: 'Payments', icon: 'ST', color: '#635BFF' },
  { id: 'c-sugarcrm', name: 'SugarCRM', category: 'CRM', icon: 'SU', color: '#E61718' },
  { id: 'c-tableau', name: 'Tableau', category: 'Analytics', icon: 'TB', color: '#E97627' },
  { id: 'c-tiktok', name: 'TikTok Ads', category: 'Advertising', icon: 'TT', color: '#000000' },
  { id: 'c-trello', name: 'Trello', category: 'Productivity', icon: 'TR', color: '#0052CC' },
  { id: 'c-twilio', name: 'Twilio', category: 'Communication', icon: 'TW', color: '#F22F46' },
  { id: 'c-twitter', name: 'X (Twitter) Ads', category: 'Advertising', icon: 'X', color: '#1D1D1F' },
  { id: 'c-workday', name: 'Workday', category: 'HR', icon: 'WD', color: '#005CB9' },
  { id: 'c-zendesk', name: 'Zendesk', category: 'Support', icon: 'ZD', color: '#03363D' },
  { id: 'c-zoho', name: 'Zoho CRM', category: 'CRM', icon: 'ZO', color: '#E42527' },
  { id: 'c-zuora', name: 'Zuora', category: 'Billing', icon: 'ZU', color: '#2B6CB0' },
];

const connectorCategories = Array.from(new Set(explorerConnectors.map((c) => c.category))).sort();

function generateStreamFields(bundleName: string): StreamField[] {
  const template = bundleFieldTemplates[bundleName];
  if (!template) return [];
  return template.map((t, i) => ({
    id: `sf-${bundleName.replace(/\s+/g, '-').toLowerCase()}-${i}`,
    fieldName: t.fieldName,
    dataType: t.dataType,
    targetDMO: t.targetDMO,
    targetField: t.targetField,
    mappingStatus: 'Auto-Mapped' as const,
  }));
}

// ── Demo Session ────────────────────────────────────────────────────
interface DemoSessionState {
  informaticaConnections: { name: string; alias: string; orgId: string }[];
  selectedBundles: string[];
  installedDatakits: string[];
}

interface DataStreamsContentProps {
  demoSession?: DemoSessionState;
  currentTimeline?: string;
}

// Map installed bundle names to the data streams they generate — tenant alias injected at runtime
function getBundleStreams(tenant: string): Record<string, DataStream[]> {
  const t = tenant || 'Default';
  return {
    'Informatica MDM Cloud': [
      { id: 'ds-infa-c360', name: 'Customer 360 - Informatica MDM', source: `Informatica MDM (${t})`, sourceType: 'informatica', object: 'Customer 360', status: 'Active', recordsProcessed: 12061, lastRefreshed: '02/25/2026, 3:45 PM', refreshFrequency: 'Every 1 hour', dataSpace: 'default', tenant: t, fields: generateStreamFields('Customer 360') },
      { id: 'ds-infa-prod', name: 'Product 360 - Informatica MDM', source: `Informatica MDM (${t})`, sourceType: 'informatica', object: 'Product 360', status: 'Active', recordsProcessed: 8432, lastRefreshed: '02/25/2026, 3:45 PM', refreshFrequency: 'Every 1 hour', dataSpace: 'default', tenant: t, fields: generateStreamFields('Product 360') },
      { id: 'ds-infa-supp', name: 'Supplier 360 - Informatica MDM', source: `Informatica MDM (${t})`, sourceType: 'informatica', object: 'Supplier 360', status: 'Active', recordsProcessed: 3217, lastRefreshed: '02/25/2026, 2:30 PM', refreshFrequency: 'Every 6 hours', dataSpace: 'default', tenant: t, fields: generateStreamFields('Supplier 360') },
      { id: 'ds-infa-ref', name: 'Reference 360 - Informatica MDM', source: `Informatica MDM (${t})`, sourceType: 'informatica', object: 'Reference 360', status: 'Active', recordsProcessed: 1456, lastRefreshed: '02/25/2026, 1:00 PM', refreshFrequency: 'Every 12 hours', dataSpace: 'default', tenant: t, fields: generateStreamFields('Reference 360') },
    ],
    'Informatica Data Quality': [
      { id: 'ds-infa-org', name: 'Organization 360 - Informatica MDM', source: `Informatica MDM (${t})`, sourceType: 'informatica', object: 'Organization 360', status: 'Pending', recordsProcessed: 0, lastRefreshed: '—', refreshFrequency: 'Every 1 hour', dataSpace: 'default', tenant: t, fields: generateStreamFields('Organization 360') },
      { id: 'ds-infa-fin', name: 'Finance 360 - Informatica MDM', source: `Informatica MDM (${t})`, sourceType: 'informatica', object: 'Finance 360', status: 'Pending', recordsProcessed: 0, lastRefreshed: '—', refreshFrequency: 'Every 6 hours', dataSpace: 'default', tenant: t, fields: generateStreamFields('Finance 360') },
    ],
  };
}

// ── Component ────────────────────────────────────────────────────────
export default function DataStreamsContent({ demoSession, currentTimeline }: DataStreamsContentProps) {
  const { triggerDelay } = useMdsSimulator();
  const is264Release = currentTimeline === '264-release';

  // Compute session-aware data streams: base Salesforce streams + streams from installed bundles
  // Informatica streams only appear in 264 Release timeline, tenant comes from session connections
  const sessionStreams: DataStream[] = [];
  if (is264Release && demoSession) {
    const tenantAlias = demoSession.informaticaConnections[0]?.alias || 'Default';
    const bundleStreams = getBundleStreams(tenantAlias);
    demoSession.selectedBundles.forEach((bundleName) => {
      const streams = bundleStreams[bundleName];
      if (streams) sessionStreams.push(...streams);
    });
  }
  // Check if Informatica is connected in the current session (only relevant in 264 Release)
  const hasInformaticaConn = is264Release && (demoSession?.informaticaConnections.length ?? 0) > 0;

  const [dataStreams, setDataStreams] = useState<DataStream[]>(mockDataStreams);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Detail view state
  const [selectedStream, setSelectedStream] = useState<DataStream | null>(null);
  const [reviewFieldId, setReviewFieldId] = useState<string | null>(null);

  // New Data Stream modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newModalStep, setNewModalStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Data Space selection (Step 4)
  const [selectedDataSpace, setSelectedDataSpace] = useState('default');
  const [dataSpaceDropdownOpen, setDataSpaceDropdownOpen] = useState(false);

  // Informatica bundle selection — tenant comes from session connections
  const sessionTenants = demoSession?.informaticaConnections.map((c) => c.alias) || [];
  const [selectedTenant, setSelectedTenant] = useState(() => sessionTenants[0] || '');
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());

  // Connector explorer
  const [connectorSearch, setConnectorSearch] = useState('');
  const [connectorCategory, setConnectorCategory] = useState<string>('all');

  // Bundle detail sidebar
  const [focusedBundleId, setFocusedBundleId] = useState<string | null>(null);

  // Salesforce step 2: bundle vs object view, and SF bundle selection
  const [sfViewMode, setSfViewMode] = useState<'bundles' | 'objects'>('bundles');
  const [selectedSfBundles, setSelectedSfBundles] = useState<Set<string>>(new Set());
  const [sfBundleSearch, setSfBundleSearch] = useState('');
  const [focusedSfBundleId, setFocusedSfBundleId] = useState<string | null>(null);

  // Step 2 loading spinner — brief loading animation when entering Step 2
  const [step2Loading, setStep2Loading] = useState(false);

  // Helpers
  const fmt = (n: number) => n.toLocaleString();

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Active: 'sf-badge-success',
      Inactive: 'sf-badge-neutral',
      Pending: 'sf-badge-warning',
      Error: 'sf-badge-error',
    };
    return <span className={`sf-badge ${map[status] || 'sf-badge-neutral'}`}>{status}</span>;
  };

  const sourceIcon = (sourceType: string) => {
    if (sourceType === 'informatica') return '🔶';
    if (sourceType === 'salesforce') return '☁️';
    return '📄';
  };

  // Combine streams: session-derived Informatica streams go on TOP, then user-created/base streams
  const allStreams = [...sessionStreams.filter((ss) => !dataStreams.some((ds) => ds.id === ss.id)), ...dataStreams];

  // Filter streams
  const filteredStreams = allStreams.filter((ds) => {
    const matchSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.object.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSource = filterSource === 'all' || ds.sourceType === filterSource;
    return matchSearch && matchSource;
  });

  // Modal handlers
  const handleOpenNew = () => {
    setNewModalStep(1);
    setSelectedSource(null);
    setSelectedTenant(sessionTenants[0] || '');
    setSelectedBundles(new Set());
    setConnectorSearch('');
    setConnectorCategory('all');
    setFocusedBundleId(null);
    setSfViewMode('bundles');
    setSelectedSfBundles(new Set());
    setSfBundleSearch('');
    setFocusedSfBundleId(null);
    setSelectedDataSpace('default');
    setDataSpaceDropdownOpen(false);
    setNewModalOpen(true);
  };

  // Resolve any selectedSource to a display name/color
  const allConnectorSources = [...otherSources, ...explorerConnectors];
  const resolveSourceInfo = (src: string | null): { name: string; color: string; icon: string; category: string } => {
    if (!src) return { name: '', color: '#706E6B', icon: '', category: '' };
    if (src === 'salesforce') return { name: 'Salesforce CRM', color: 'var(--slds-g-color-brand)', icon: 'sf', category: 'CRM' };
    if (src === 'informatica') return { name: 'Informatica MDM', color: '#FF4A00', icon: 'INFA', category: 'MDM' };
    const found = allConnectorSources.find((c) => c.id === src);
    if (found) return { name: found.name, color: found.color, icon: found.icon, category: found.category };
    return { name: src, color: '#706E6B', icon: '?', category: '' };
  };
  const isCoreSource = selectedSource === 'salesforce' || selectedSource === 'informatica';

  const handleNewNext = () => {
    if (newModalStep === 1 && selectedSource) {
      // Core sources go to Step 2 (bundle selection); others skip to Step 3
      if (selectedSource === 'salesforce' || selectedSource === 'informatica') {
        triggerDelay(() => {
          setStep2Loading(true);
          setNewModalStep(2);
          setTimeout(() => setStep2Loading(false), 1500);
        });
      } else {
        triggerDelay(() => setNewModalStep(3));
      }
    } else if (newModalStep === 2) {
      if (selectedSource === 'informatica' && selectedBundles.size > 0) {
        triggerDelay(() => setNewModalStep(3));
      } else if (selectedSource === 'salesforce') {
        triggerDelay(() => setNewModalStep(3));
      }
    } else if (newModalStep === 3) {
      triggerDelay(() => setNewModalStep(4));
    }
  };

  const handleNewBack = () => {
    if (newModalStep === 2) setNewModalStep(1);
    else if (newModalStep === 3) {
      // Non-core sources skip Step 2, go back to Step 1
      if (selectedSource === 'salesforce' || selectedSource === 'informatica') {
        setNewModalStep(2);
      } else {
        setNewModalStep(1);
      }
    }
    else if (newModalStep === 4) setNewModalStep(3);
  };

  const toggleBundle = (id: string) => {
    setSelectedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateStreams = () => {
    triggerDelay(() => handleCreateStreamsInner());
  };

  const handleCreateStreamsInner = () => {
    if (selectedSource === 'informatica') {
      // Create one data stream per entity from each selected bundle
      const newStreams: DataStream[] = [];
      const ts = Date.now();
      selectedBundles.forEach((bundleId) => {
        const bundle = informaticaBundles.find((b) => b.id === bundleId);
        if (bundle) {
          bundle.entities.forEach((entity, idx) => {
            newStreams.push({
              id: `ds-infa-${ts}-${bundleId}-${idx}`,
              name: `${entity.name}_Home`,
              source: `Informatica MDM (${selectedTenant})`,
              sourceType: 'informatica',
              object: bundle.name,
              status: 'Pending',
              recordsProcessed: 0,
              lastRefreshed: '—',
              refreshFrequency: 'Every 1 hour',
              dataSpace: selectedDataSpace,
              tenant: selectedTenant,
              fields: Array.from({ length: entity.fieldCount }, (_, fi) => ({
                id: `sf-${entity.name.replace(/\s+/g, '-').toLowerCase()}-wiz-${fi}`,
                fieldName: `${entity.name}_Field_${fi + 1}`,
                dataType: ['Text', 'Number', 'Date', 'Lookup', 'Boolean'][fi % 5],
                targetDMO: 'Individual',
                targetField: `${entity.name}_Field_${fi + 1}`,
                mappingStatus: 'Auto-Mapped' as const,
              })),
            });
          });
        }
      });
      setDataStreams((prev) => [...newStreams, ...prev]);
    } else if (selectedSource === 'salesforce') {
      // Create one data stream per object from each selected Salesforce bundle
      const newStreams: DataStream[] = [];
      const ts = Date.now();
      selectedSfBundles.forEach((bundleId) => {
        const bundle = salesforceStandardBundles.find((b) => b.id === bundleId);
        if (bundle) {
          bundle.objects.forEach((obj, idx) => {
            newStreams.push({
              id: `ds-sf-${ts}-${bundleId}-${idx}`,
              name: `${obj}_Home`,
              source: 'Salesforce CRM',
              sourceType: 'salesforce',
              object: bundle.name,
              status: 'Pending',
              recordsProcessed: 0,
              lastRefreshed: '—',
              refreshFrequency: 'Every 1 hour',
              dataSpace: selectedDataSpace,
            });
          });
        }
      });
      if (newStreams.length > 0) {
        setDataStreams((prev) => [...newStreams, ...prev]);
      }
    } else if (selectedSource) {
      // Generic connector source — create a placeholder stream
      const info = resolveSourceInfo(selectedSource);
      const newStream: DataStream = {
        id: `ds-gen-${Date.now()}`,
        name: `${info.name} Stream`,
        source: info.name,
        sourceType: 'api',
        object: info.name,
        status: 'Pending',
        recordsProcessed: 0,
        lastRefreshed: '—',
        refreshFrequency: 'Every 1 hour',
        dataSpace: selectedDataSpace,
      };
      setDataStreams((prev) => [newStream, ...prev]);
    }
    setNewModalOpen(false);
  };

  // ── Helper: get the reviewing field ──
  // ── Data Mapping state helpers ──
  // Determine if a datakit is installed for the current stream
  const streamDatakitPrefix: Record<string, string> = {
    'Customer 360': 'INFA-C360',
    'Organization 360': 'INFA-O360',
    'Reference 360': 'INFA-R360',
    'Supplier 360': 'INFA-S360',
    'Product 360': 'INFA-P360',
    'Finance 360': 'INFA-F360',
  };
  const hasDatakitForStream = (stream: DataStream) => {
    const prefix = streamDatakitPrefix[stream.object];
    if (!prefix || !demoSession?.installedDatakits) return false;
    return demoSession.installedDatakits.some((dk) => dk.startsWith(prefix));
  };

  // Detail tab state
  const [detailTab, setDetailTab] = useState<'fields' | 'details' | 'refresh-history'>('fields');

  // ──────────────────────────────────────────────────────────────────
  // VISUAL MAPPING REVIEW SCREEN (Image 4)
  // ──────────────────────────────────────────────────────────────────
  if (selectedStream && reviewFieldId !== null) {
    const allFields = selectedStream.fields || [];
    const objectName = selectedStream.object;
    // Group target fields by DMO for the right side
    const dmoGroups: Record<string, StreamField[]> = {};
    allFields.forEach((f) => { (dmoGroups[f.targetDMO] = dmoGroups[f.targetDMO] || []).push(f); });
    const autoMappedCount = allFields.filter((f) => f.mappingStatus === 'Auto-Mapped').length;

    return (
      <div className="slds-h-full slds-flex slds-flex-col slds-bg-neutral-2">
        {/* Breadcrumb header */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_small slds-flex slds-items-center slds-gap_x-small">
          <button onClick={() => setReviewFieldId(null)} className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_medium slds-text-brand sf-hover-underline">
            <ArrowLeft className="slds-icon-size_small" />
            {selectedStream.name}
          </button>
          <ChevronRight className="slds-icon-size_xx-small slds-text-neutral-7" />
          <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">Field Mapping</span>
        </div>

        {/* 3-panel layout */}
        <div className="slds-flex-1 slds-overflow-hidden slds-flex">
          {/* LEFT: Source Fields */}
          <div className="slds-flex-shrink-0 slds-border_right slds-border-color_border-1 slds-bg-white slds-flex slds-flex-col" style={{ width: '360px' }}>
            <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_border-1 slds-flex slds-items-center slds-gap_x-small">
              <div className="slds-icon-size_large slds-border-radius_small slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ backgroundColor: '#FF4A00' }}>
                <svg viewBox="0 0 24 24" className="slds-icon-size_small"><text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">IN</text></svg>
              </div>
              <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Source Fields</h3>
              <span className="slds-text-size_small slds-text-neutral-7" style={{ marginLeft: 'auto' }}>{allFields.length} fields</span>
            </div>
            <div className="slds-flex-1 slds-overflow-y-auto">
              {allFields.map((field) => {
                const isActive = field.id === reviewFieldId;
                return (
                  <button
                    key={field.id}
                    onClick={() => setReviewFieldId(field.id)}
                    className={`slds-w-full slds-text-left slds-p-horizontal_medium slds-flex slds-items-center slds-gap_small slds-border_bottom slds-border-color_border-1 slds-transition-colors ${isActive ? '' : 'sf-hover-bg-neutral'}`}
                    style={{ paddingTop: '10px', paddingBottom: '10px', ...(isActive ? { backgroundColor: '#FFF3ED' } : {}) }}
                  >
                    <div className={`slds-border-radius_pill slds-flex-shrink-0 ${field.mappingStatus === 'Auto-Mapped' ? 'slds-bg-success' : ''}`} style={{ width: '8px', height: '8px', ...(field.mappingStatus === 'Unmapped' ? { backgroundColor: '#BA0517' } : field.mappingStatus !== 'Auto-Mapped' ? { backgroundColor: '#FFB75D' } : {}) }} />
                    <div className="slds-flex-1 slds-min-w-0">
                      <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base slds-truncate" style={{ fontFamily: 'monospace' }}>{field.fieldName}</div>
                      <div className="slds-text-neutral-7" style={{ fontSize: '10px' }}>{field.dataType}</div>
                    </div>
                    {field.mappingStatus === 'Auto-Mapped' && <Check className="slds-icon-size_x-small slds-text-success slds-flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: Connection lines */}
          <div className="slds-flex-shrink-0 slds-flex slds-items-stretch slds-pos-relative" style={{ width: '120px', backgroundColor: '#F9F9F9' }}>
            <svg className="slds-w-full slds-h-full" preserveAspectRatio="none" viewBox={`0 0 120 ${Math.max(allFields.length * 40, 400)}`}>
              {allFields.map((field, i) => {
                const dmoKeys = Object.keys(dmoGroups);
                let rightY = 0;
                let found = false;
                let offset = 0;
                for (const dmo of dmoKeys) {
                  offset += 44; // header
                  for (const f of dmoGroups[dmo]) {
                    if (f.id === field.id) {
                      rightY = offset + 18;
                      found = true;
                      break;
                    }
                    offset += 40;
                  }
                  if (found) break;
                  offset += 8;
                }
                if (!found) rightY = i * 40 + 60;
                const leftY = i * 40 + 60;
                const isActive = field.id === reviewFieldId;
                const color = field.mappingStatus === 'Auto-Mapped' ? '#2E844A' : '#FFB75D';
                return (
                  <path
                    key={field.id}
                    d={`M 0 ${leftY} C 60 ${leftY}, 60 ${rightY}, 120 ${rightY}`}
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    fill="none"
                    opacity={isActive ? 1 : 0.3}
                  />
                );
              })}
            </svg>
          </div>

          {/* RIGHT: Target DMO */}
          <div className="slds-flex-1 slds-bg-white slds-flex slds-flex-col slds-border_left slds-border-color_border-1">
            <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_border-1 slds-flex slds-items-center slds-gap_x-small">
              <div className="slds-icon-size_large slds-border-radius_small slds-bg-brand slds-flex slds-items-center slds-justify-center slds-flex-shrink-0">
                <Database className="slds-icon-size_x-small slds-text-white" />
              </div>
              <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Target DMO</h3>
              <span className="slds-text-size_small slds-text-neutral-7" style={{ marginLeft: 'auto' }}>{objectName}</span>
            </div>
            <div className="slds-flex-1 slds-overflow-y-auto">
              {Object.entries(dmoGroups).map(([dmoName, fields]) => (
                <div key={dmoName}>
                  <div className="slds-p-horizontal_medium slds-border_bottom slds-border-color_border-1" style={{ paddingTop: '10px', paddingBottom: '10px', backgroundColor: '#F9F9F9' }}>
                    <span className="slds-text-size_small slds-font-weight_semibold slds-text-brand">{dmoName}</span>
                  </div>
                  {fields.map((field) => {
                    const isActive = field.id === reviewFieldId;
                    return (
                      <button
                        key={field.id}
                        onClick={() => setReviewFieldId(field.id)}
                        className={`slds-w-full slds-text-left slds-p-horizontal_medium slds-flex slds-items-center slds-gap_small slds-border_bottom slds-border-color_border-1 slds-transition-colors ${isActive ? '' : 'sf-hover-bg-neutral'}`}
                        style={{ paddingTop: '10px', paddingBottom: '10px', ...(isActive ? { backgroundColor: '#EEF4FF' } : {}) }}
                      >
                        <div className={`slds-border-radius_pill slds-flex-shrink-0 ${field.mappingStatus === 'Auto-Mapped' ? 'slds-bg-success' : ''}`} style={{ width: '8px', height: '8px', ...(field.mappingStatus !== 'Auto-Mapped' ? { backgroundColor: '#FFB75D' } : {}) }} />
                        <div className="slds-flex-1 slds-min-w-0">
                          <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base slds-truncate" style={{ fontFamily: 'monospace' }}>{field.targetField}</div>
                          <div className="slds-text-neutral-7" style={{ fontSize: '10px' }}>{field.dataType}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="slds-bg-white slds-border_top slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_small slds-flex slds-items-center slds-justify-between">
          <div className="slds-flex slds-items-center slds-gap_medium">
            <button onClick={() => setReviewFieldId(null)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral">
              Back
            </button>
            <div className="slds-flex slds-items-center slds-gap_medium slds-text-size_small slds-text-neutral-7">
              <div className="slds-flex slds-items-center slds-gap_xx-small"><div className="slds-border-radius_pill slds-bg-success" style={{ width: '8px', height: '8px' }} /> Auto-Mapped ({autoMappedCount})</div>
              <div className="slds-flex slds-items-center slds-gap_xx-small"><div className="slds-border-radius_pill" style={{ width: '8px', height: '8px', backgroundColor: '#FFB75D' }} /> Review Needed</div>
              <div className="slds-flex slds-items-center slds-gap_xx-small"><div className="slds-border-radius_pill" style={{ width: '8px', height: '8px', backgroundColor: '#BA0517' }} /> Unmapped</div>
            </div>
          </div>
          <button className="slds-p-horizontal_large slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small" style={{ cursor: 'pointer' }}>
            Approve Mapping
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // DATA STREAM DETAIL VIEW (Image 2/3)
  // ──────────────────────────────────────────────────────────────────
  if (selectedStream) {
    const fields = selectedStream.fields || [];
    const autoMapped = fields.filter((f) => f.mappingStatus === 'Auto-Mapped').length;
    const hasMappingDatakit = hasDatakitForStream(selectedStream);
    const isInfaStream = selectedStream.sourceType === 'informatica';

    return (
      <div className="slds-h-full slds-flex slds-flex-col">
        {/* Breadcrumb */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_x-small slds-flex slds-items-center slds-gap_x-small">
          <button onClick={() => { setSelectedStream(null); setDetailTab('fields'); }} className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-brand sf-hover-underline">
            <ArrowLeft className="slds-icon-size_x-small" />
            Data Streams
          </button>
          <ChevronRight className="slds-icon-size_xx-small slds-text-neutral-7" />
          <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{selectedStream.name}</span>
        </div>

        {/* Header */}
        <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium">
          <div className="slds-flex slds-items-start slds-gap_medium">
            <div className={`slds-border-radius_large slds-flex slds-items-center slds-justify-center slds-flex-shrink-0 ${isInfaStream ? '' : 'slds-bg-brand-1'}`} style={{ width: '40px', height: '40px', ...(isInfaStream ? { backgroundColor: '#FF4A00' } : {}) }}>
              {isInfaStream ? (
                <svg viewBox="0 0 32 32" className="slds-icon-size_large"><text x="16" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">INFA</text></svg>
              ) : (
                <Database className="slds-icon-size_default slds-text-white" />
              )}
            </div>
            <div className="slds-flex-1">
              <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>{selectedStream.name}</h1>
              <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Data Stream &middot; {selectedStream.source}</p>
            </div>
            <div className="slds-flex slds-items-center slds-gap_x-small">
              <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                <RefreshCw className="slds-icon-size_x-small" style={{ display: 'inline', marginRight: '4px' }} />Refresh Now
              </button>
              <button className="slds-p-horizontal_small slds-text-size_small slds-font-weight_medium slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral slds-text-neutral-9" style={{ paddingTop: '6px', paddingBottom: '6px' }}>Edit</button>
            </div>
          </div>

          {/* Metadata strip */}
          <div className="slds-flex slds-flex-wrap slds-items-center slds-m-top_medium" style={{ columnGap: '32px', rowGap: '8px', paddingBottom: '4px' }}>
            {[
              ['Source', selectedStream.source],
              ['Object', selectedStream.object],
              ['Status', '__badge__'],
              ['Records Processed', fmt(selectedStream.recordsProcessed)],
              ['Last Refreshed', selectedStream.lastRefreshed],
              ['Refresh Frequency', selectedStream.refreshFrequency],
              ['Data Space', selectedStream.dataSpace],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7" style={{ fontSize: '10px' }}>{label}</p>
                {value === '__badge__' ? <div className="slds-m-top_xx-small">{statusBadge(selectedStream.status)}</div> : (
                  <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base" style={{ textTransform: 'capitalize' }}>{value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="slds-flex slds-items-center slds-m-top_x-small" style={{ gap: '0px', marginBottom: '-16px', borderBottom: '0' }}>
            {(['fields', 'details', 'refresh-history'] as const).map((tab) => {
              const labels: Record<string, string> = { 'fields': 'Fields', 'details': 'Details', 'refresh-history': 'Refresh History' };
              const active = detailTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-transition-colors ${
                    active ? 'slds-text-brand' : 'slds-text-neutral-7'
                  }`}
                  style={{ borderBottom: active ? '2px solid var(--slds-g-color-brand-1)' : '2px solid transparent' }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content + Data Mapping sidebar */}
        <div className="slds-flex-1 slds-overflow-y-auto slds-bg-neutral-2">
          <div className="slds-flex slds-gap_large slds-p-around_large">
            {/* Main content area */}
            <div className="slds-flex-1 slds-min-w-0">
              {detailTab === 'fields' && (
                <div className="sf-card">
                  <div className="sf-card-header">
                    <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
                      Fields <span className="slds-text-size_small slds-font-weight_regular slds-text-neutral-7">({fields.length})</span>
                    </h2>
                  </div>
                  {fields.length > 0 ? (
                    <div className="slds-overflow-x-auto">
                      <table className="sf-table">
                        <thead>
                          <tr>
                            <th><div className="slds-flex slds-items-center slds-gap_xx-small">Field Name <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                            <th>Data Type</th>
                            <th>Is Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((field) => (
                            <tr key={field.id}>
                              <td><span className="slds-text-size_medium" style={{ fontFamily: 'monospace' }}>{field.fieldName}</span></td>
                              <td><span className="slds-text-size_small slds-bg-neutral-2 slds-border-radius_small" style={{ fontFamily: 'monospace', paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px', paddingBottom: '2px' }}>{field.dataType}</span></td>
                              <td><span className="slds-text-size_small slds-text-neutral-7">{field.fieldName.includes('id') || field.fieldName.includes('name') ? 'Yes' : 'No'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="sf-card-body slds-text-center slds-p-vertical_x-large" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
                      <Database className="slds-text-neutral-7 slds-opacity_50 slds-m-bottom_small" style={{ width: '40px', height: '40px', margin: '0 auto 12px' }} />
                      <p className="slds-text-size_medium slds-text-neutral-7">No fields available for this data stream.</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'details' && (
                <div className="sf-card">
                  <div className="sf-card-header">
                    <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Stream Details</h2>
                  </div>
                  <div className="sf-card-body">
                    <div className="slds-css-grid slds-css-grid-cols-2 slds-text-size_medium" style={{ rowGap: '16px', columnGap: '32px' }}>
                      {[
                        ['Data Stream Name', selectedStream.name],
                        ['Source', selectedStream.source],
                        ['Object', selectedStream.object],
                        ['Status', selectedStream.status],
                        ['Data Space', selectedStream.dataSpace],
                        ['Refresh Frequency', selectedStream.refreshFrequency],
                        ['Records Processed', fmt(selectedStream.recordsProcessed)],
                        ['Last Refreshed', selectedStream.lastRefreshed],
                        ...(selectedStream.tenant ? [['Tenant', selectedStream.tenant]] : []),
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="slds-text-size_small slds-text-neutral-7 slds-m-bottom_xx-small">{label}</p>
                          <p className="slds-text-neutral-base slds-font-weight_medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'refresh-history' && (
                <div className="sf-card">
                  <div className="sf-card-header">
                    <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Refresh History</h2>
                  </div>
                  <div className="slds-overflow-x-auto">
                    <table className="sf-table">
                      <thead>
                        <tr>
                          <th>Refresh Date</th>
                          <th>Status</th>
                          <th>Records</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStream.status !== 'Pending' ? (
                          <>
                            <tr><td>{selectedStream.lastRefreshed}</td><td><span className="sf-badge sf-badge-success">Success</span></td><td>{fmt(selectedStream.recordsProcessed)}</td><td>2m 34s</td></tr>
                            <tr><td>02/24/2026, 3:45 PM</td><td><span className="sf-badge sf-badge-success">Success</span></td><td>{fmt(Math.floor(selectedStream.recordsProcessed * 0.98))}</td><td>2m 12s</td></tr>
                            <tr><td>02/23/2026, 3:45 PM</td><td><span className="sf-badge sf-badge-success">Success</span></td><td>{fmt(Math.floor(selectedStream.recordsProcessed * 0.95))}</td><td>2m 45s</td></tr>
                          </>
                        ) : (
                          <tr><td colSpan={4} className="slds-text-center slds-p-vertical_x-large slds-text-size_medium slds-text-neutral-7">No refresh history yet — stream is pending first refresh.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Data Mapping sidebar */}
            {isInfaStream && (
              <div className="slds-flex-shrink-0" style={{ width: '280px' }}>
                <div className="sf-card">
                  <div className="sf-card-header">
                    <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Data Mapping</h3>
                  </div>
                  <div className="sf-card-body">
                    {fields.length > 0 ? (
                      /* Populated state — fields available */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>Data Space</p>
                          <p className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base" style={{ textTransform: 'capitalize' }}>{selectedStream.dataSpace}</p>
                        </div>
                        <div>
                          <p className="slds-text-uppercase slds-tracking-wide slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>Mapping Status</p>
                          <div className="slds-flex slds-items-center slds-gap_x-small">
                            <div className="slds-flex-1 slds-border-radius_pill slds-overflow-hidden" style={{ height: '8px', backgroundColor: '#E0E0E0' }}>
                              <div className="slds-h-full slds-bg-success slds-border-radius_pill" style={{ width: fields.length ? `${(autoMapped / fields.length) * 100}%` : '0%' }} />
                            </div>
                            <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{autoMapped}/{fields.length}</span>
                          </div>
                          <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
                            {autoMapped} of {fields.length} fields auto-mapped
                          </p>
                        </div>
                        <button
                          onClick={() => setReviewFieldId(fields[0]?.id || '__all__')}
                          className="slds-w-full slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors slds-cursor-pointer"
                        >
                          Review Mapping
                        </button>
                      </div>
                    ) : (
                      /* Empty state — no fields yet */
                      <div className="slds-text-center slds-p-vertical_large">
                        <div className="slds-border-radius_pill slds-bg-neutral-2 slds-flex slds-items-center slds-justify-center slds-m-bottom_medium" style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}>
                          <svg viewBox="0 0 24 24" className="slds-text-neutral-7 slds-opacity_50" style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M4 6h16M4 12h16M4 18h8" strokeLinecap="round" />
                            <circle cx="19" cy="17" r="3" />
                            <path d="M19 15v4M17 17h4" strokeLinecap="round" />
                          </svg>
                        </div>
                        <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_xx-small">No Data Mapping Available</h4>
                        <p className="slds-text-size_small slds-text-neutral-7 slds-leading-relaxed">
                          Stream is pending first refresh. Mapping will be available once data is ingested.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="slds-h-full slds-flex slds-flex-col">
      {/* Page header */}
      <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-p-vertical_medium">
        <div className="slds-flex slds-items-start slds-gap_medium">
          <div className="slds-border-radius_large slds-bg-brand-1 slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '40px', height: '40px' }}>
            <Database className="slds-icon-size_default slds-text-white" />
          </div>
          <div className="slds-flex-1">
            <h1 className="slds-font-weight_bold slds-text-neutral-base" style={{ fontSize: '18px' }}>Data Streams</h1>
            <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Manage data ingestion streams from connected sources</p>
          </div>
          <button
            onClick={handleOpenNew}
            className="slds-flex slds-items-center slds-gap_xx-small slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-transition-colors slds-cursor-pointer"
          >
            <Plus className="slds-icon-size_small" />
            New Data Stream
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="slds-bg-white slds-border_bottom slds-border-color_border-1 slds-p-horizontal_large slds-flex slds-items-center slds-gap_small" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
        <div className="slds-pos-relative slds-flex-1" style={{ maxWidth: '384px' }}>
          <Search className="slds-pos-absolute slds-icon-size_x-small slds-text-neutral-7" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search data streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="slds-w-full slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small sf-input"
            style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px' }}
          />
        </div>
        <div className="slds-flex slds-items-center slds-gap_xx-small">
          <Filter className="slds-icon-size_x-small slds-text-neutral-7" />
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
          >
            <option value="all">All Sources</option>
            <option value="salesforce">Salesforce CRM</option>
            {is264Release && <option value="informatica">Informatica MDM</option>}
            <option value="api">Ingestion API</option>
          </select>
        </div>
        <div className="slds-flex slds-items-center slds-gap_x-small" style={{ marginLeft: 'auto' }}>
          <span className="slds-text-size_small slds-text-neutral-7">{filteredStreams.length} streams</span>
          <button className="slds-flex slds-items-center slds-justify-center slds-border-radius_small sf-hover-bg-neutral slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
            <RefreshCw className="slds-icon-size_x-small" />
          </button>
        </div>
      </div>

      {/* Data Streams Table */}
      <div className="slds-flex-1 slds-overflow-y-auto slds-bg-neutral-2">
        <div className="slds-p-around_large">
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
                All Data Streams <span className="slds-text-size_small slds-font-weight_regular slds-text-neutral-7">({filteredStreams.length})</span>
              </h2>
            </div>
            <div className="slds-overflow-x-auto">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th><div className="slds-flex slds-items-center slds-gap_xx-small">Data Stream Name <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                    <th><div className="slds-flex slds-items-center slds-gap_xx-small">Source <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div></th>
                    <th>Object</th>
                    <th>Status</th>
                    <th>Records Processed</th>
                    <th>Last Refreshed</th>
                    <th>Refresh Frequency</th>
                    <th>Data Space</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStreams.map((ds) => (
                    <tr key={ds.id} className="slds-cursor-pointer sf-hover-bg-neutral" onClick={() => setSelectedStream(ds)}>
                      <td>
                        <div className="slds-flex slds-items-center slds-gap_x-small">
                          <span>{sourceIcon(ds.sourceType)}</span>
                          <span className="sf-link slds-font-weight_medium">{ds.name}</span>
                        </div>
                      </td>
                      <td>{ds.source}</td>
                      <td>{ds.object}</td>
                      <td>{statusBadge(ds.status)}</td>
                      <td>{fmt(ds.recordsProcessed)}</td>
                      <td>{ds.lastRefreshed}</td>
                      <td>{ds.refreshFrequency}</td>
                      <td>{ds.dataSpace}</td>
                    </tr>
                  ))}
                  {filteredStreams.length === 0 && (
                    <tr>
                      <td colSpan={8} className="slds-text-center slds-p-vertical_x-large slds-text-size_medium slds-text-neutral-7">
                        No data streams found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: New Data Stream Wizard
         ═══════════════════════════════════════════════════════════ */}
      {newModalOpen && (
        <div className="slds-pos-fixed slds-inset-0 slds-z-50 slds-flex slds-items-center slds-justify-center">
          <div className="slds-pos-absolute slds-inset-0 sf-overlay" onClick={() => setNewModalOpen(false)} />
          <div className={`slds-pos-relative slds-bg-white slds-border-radius_large slds-shadow_large slds-flex slds-flex-col slds-transition-all`} style={{ maxHeight: '90vh', width: newModalStep === 1 || newModalStep === 2 ? '900px' : newModalStep === 4 ? '960px' : '640px' }}>
            {/* Header */}
            <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_bottom slds-border-color_border-1">
              <div>
                <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">New Data Stream</h2>
                <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
                  {newModalStep === 1 ? 'Select a data source to connect.' : newModalStep === 2 ? 'Configure your data stream.' : newModalStep === 3 ? 'Review and confirm.' : 'Put the finishing touches on your data stream(s).'}
                </p>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="slds-flex slds-items-center slds-justify-center slds-border-radius_small sf-hover-bg-neutral slds-text-neutral-7" style={{ width: '28px', height: '28px' }}>
                <X className="slds-icon-size_small" />
              </button>
            </div>

            {/* Body */}
            <div className="slds-flex-1 slds-overflow-y-auto slds-p-horizontal_large slds-p-vertical_large">
              {/* Step 1: Source selection — matches Salesforce reference layout */}
              {newModalStep === 1 && (() => {
                const filteredConnectors = explorerConnectors.filter((c) => {
                  const matchSearch = connectorSearch === '' || c.name.toLowerCase().includes(connectorSearch.toLowerCase()) || c.category.toLowerCase().includes(connectorSearch.toLowerCase());
                  const matchCat = connectorCategory === 'all' || c.category === connectorCategory;
                  return matchSearch && matchCat;
                });
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Info banner */}
                    <div className="slds-flex slds-items-start slds-gap_small slds-p-around_medium slds-border-radius_large" style={{ backgroundColor: '#E1F5FE' }}>
                      <Info className="slds-icon-size_default slds-text-brand slds-flex-shrink-0 slds-m-top_xx-small" />
                      <div className="slds-text-size_medium slds-text-neutral-9">
                        Select the data source from which you can ingest or federate data. Only sources that are already connected to Data Cloud appear on this list. <span className="sf-link">Learn More</span>
                      </div>
                    </div>

                    {/* ─── Connected Sources ─── */}
                    <div>
                      <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">Connected Sources</h3>
                      <div className="slds-css-grid slds-css-grid-cols-3 slds-gap_medium">
                        {/* Ingestion API */}
                        {(() => {
                          const isSelected = selectedSource === 'src-api';
                          return (
                            <button
                              onClick={() => setSelectedSource('src-api')}
                              className={`slds-pos-relative slds-flex slds-flex-col slds-items-center slds-text-center slds-border-radius_large slds-p-around_large slds-transition-all ${
                                isSelected ? 'slds-border-color_brand slds-shadow_small' : 'slds-bg-white'
                              }`}
                              style={{ border: isSelected ? '2px solid var(--slds-g-color-brand-1)' : '2px solid #D8DDE6', backgroundColor: isSelected ? '#EEF4FF' : undefined }}
                            >
                              {isSelected && (
                                <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '24px', height: '24px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                  <Check className="slds-text-white slds-pos-absolute" style={{ width: '10px', height: '10px', top: '2px', right: '2px' }} />
                                </div>
                              )}
                              <div className="slds-border-radius_large slds-flex slds-items-center slds-justify-center slds-m-bottom_small slds-bg-neutral-2" style={{ width: '56px', height: '56px' }}>
                                <Server className="slds-text-neutral-7" style={{ width: '32px', height: '32px' }} />
                              </div>
                              <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Ingestion API</div>
                              <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Stream and/or bulk upload data from external sources</div>
                            </button>
                          );
                        })()}

                        {/* Salesforce CRM */}
                        {(() => {
                          const isSelected = selectedSource === 'salesforce';
                          return (
                            <button
                              onClick={() => setSelectedSource('salesforce')}
                              className={`slds-pos-relative slds-flex slds-flex-col slds-items-center slds-text-center slds-border-radius_large slds-p-around_large slds-transition-all ${
                                isSelected ? 'slds-border-color_brand slds-shadow_small' : 'slds-bg-white'
                              }`}
                              style={{ border: isSelected ? '2px solid var(--slds-g-color-brand-1)' : '2px solid #D8DDE6', backgroundColor: isSelected ? '#EEF4FF' : undefined }}
                            >
                              {isSelected && (
                                <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '24px', height: '24px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                  <Check className="slds-text-white slds-pos-absolute" style={{ width: '10px', height: '10px', top: '2px', right: '2px' }} />
                                </div>
                              )}
                              <div className="slds-border-radius_large slds-flex slds-items-center slds-justify-center slds-m-bottom_small" style={{ width: '56px', height: '56px', backgroundColor: '#E8F4FD' }}>
                                <svg viewBox="0 0 48 48" style={{ width: '36px', height: '36px', color: '#00A1E0' }}><path fill="currentColor" d="M20.5 8.5c2.3-2.4 5.5-3.9 9-3.9 4.8 0 9 2.8 11 6.8 1.5-.6 3.1-1 4.8-1 7 0 12.7 5.7 12.7 12.7S52.3 35.8 45.3 35.8c-1.3 0-2.5-.2-3.7-.6-1.8 3.5-5.4 5.9-9.6 5.9-1.8 0-3.5-.4-5-1.2-1.8 2.8-4.9 4.6-8.5 4.6-4.5 0-8.3-3-9.6-7.1-.8.1-1.6.2-2.4.2C2.9 37.6 0 34.7 0 29.1s4.5-8.5 8.5-8.5c.6 0 1.2.1 1.8.2C11.2 14.7 15.4 10.3 20.5 8.5z" transform="scale(0.7) translate(2,5)"/></svg>
                              </div>
                              <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Salesforce CRM</div>
                              <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Import objects from Salesforce CRM</div>
                            </button>
                          );
                        })()}

                        {/* Server To Server */}
                        {(() => {
                          const isSelected = selectedSource === 'src-s2s';
                          return (
                            <button
                              onClick={() => setSelectedSource('src-s2s')}
                              className={`slds-pos-relative slds-flex slds-flex-col slds-items-center slds-text-center slds-border-radius_large slds-p-around_large slds-transition-all ${
                                isSelected ? 'slds-border-color_brand slds-shadow_small' : 'slds-bg-white'
                              }`}
                              style={{ border: isSelected ? '2px solid var(--slds-g-color-brand-1)' : '2px solid #D8DDE6', backgroundColor: isSelected ? '#EEF4FF' : undefined }}
                            >
                              {isSelected && (
                                <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '24px', height: '24px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                  <Check className="slds-text-white slds-pos-absolute" style={{ width: '10px', height: '10px', top: '2px', right: '2px' }} />
                                </div>
                              )}
                              <div className="slds-border-radius_large slds-flex slds-items-center slds-justify-center slds-m-bottom_small slds-bg-neutral-2" style={{ width: '56px', height: '56px' }}>
                                <Globe className="slds-text-neutral-7" style={{ width: '32px', height: '32px' }} />
                              </div>
                              <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Server To Server</div>
                              <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Manually configure an authenticated connection</div>
                            </button>
                          );
                        })()}

                        {/* Informatica MDM — always shown in 264 Release */}
                        {is264Release && (() => {
                          const isSelected = selectedSource === 'informatica';
                          return (
                            <button
                              onClick={() => setSelectedSource('informatica')}
                              className={`slds-pos-relative slds-flex slds-flex-col slds-items-center slds-text-center slds-border-radius_large slds-p-around_large slds-transition-all ${
                                isSelected ? 'slds-border-color_brand slds-shadow_small' : 'slds-bg-white'
                              }`}
                              style={{ border: isSelected ? '2px solid var(--slds-g-color-brand-1)' : '2px solid #D8DDE6', backgroundColor: isSelected ? '#EEF4FF' : undefined }}
                            >
                              {isSelected && (
                                <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '24px', height: '24px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                  <Check className="slds-text-white slds-pos-absolute" style={{ width: '10px', height: '10px', top: '2px', right: '2px' }} />
                                </div>
                              )}
                              <div className="slds-border-radius_small slds-flex slds-items-center slds-justify-center slds-m-bottom_small" style={{ width: '56px', height: '56px', backgroundColor: '#FF4A00' }}>
                                <svg viewBox="0 0 40 40" style={{ width: '36px', height: '36px' }}>
                                  <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">INFA</text>
                                </svg>
                              </div>
                              <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Informatica MDM</div>
                              <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">Ingest master data entities from Informatica MDM</div>
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* ─── Other Sources ─── */}
                    <div>
                      <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_xx-small">Other Sources</h3>
                      <p className="slds-text-size_small slds-text-neutral-7 slds-m-bottom_small">Load a sample file in order to teach the system about your file&apos;s structure, or connect additional data sources.</p>
                      <div className="slds-css-grid slds-css-grid-cols-3 slds-gap_medium">
                        {[
                          { id: 'src-upload', name: 'File Upload', icon: 'upload' as const, color: '#706E6B', desc: 'Upload CSV, JSON, or Parquet files' },
                          { id: 'src-kits', name: 'Installed Data Kits & Packages', icon: 'pkg' as const, color: '#00A1E0', desc: 'Installed data kits and managed packages' },
                          { id: 'c-snowflake', name: 'Snowflake', icon: 'sf-conn' as const, color: '#29B5E8', desc: 'Snowflake data warehouse connector' },
                        ].map((src) => {
                          const isSelected = selectedSource === src.id;
                          return (
                            <button
                              key={src.id}
                              onClick={() => setSelectedSource(src.id)}
                              className={`slds-pos-relative slds-flex slds-flex-col slds-items-center slds-text-center slds-border-radius_large slds-p-around_large slds-transition-all ${
                                isSelected ? 'slds-border-color_brand slds-shadow_small' : 'slds-bg-white'
                              }`}
                              style={{ border: isSelected ? '2px solid var(--slds-g-color-brand-1)' : '2px solid #D8DDE6', backgroundColor: isSelected ? '#EEF4FF' : undefined }}
                            >
                              {isSelected && (
                                <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '20px', height: '20px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                  <Check className="slds-text-white slds-pos-absolute" style={{ width: '8px', height: '8px', top: '2px', right: '2px' }} />
                                </div>
                              )}
                              <div className="slds-border-radius_large slds-flex slds-items-center slds-justify-center slds-m-bottom_small" style={{ width: '56px', height: '56px', backgroundColor: src.color + '18' }}>
                                {src.icon === 'upload' ? <Upload style={{ width: '32px', height: '32px', color: src.color }} /> :
                                 src.icon === 'pkg' ? <Database style={{ width: '32px', height: '32px', color: src.color }} /> :
                                 <svg viewBox="0 0 24 24" style={{ width: '32px', height: '32px' }}><circle cx="12" cy="12" r="10" fill={src.color} /><text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">SF</text></svg>}
                              </div>
                              <div className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">{src.name}</div>
                              <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">{src.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ─── Explore Other Connectors ─── */}
                    <div>
                      <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_small">
                        <h3 className="slds-text-size_small slds-font-weight_semibold slds-text-uppercase slds-tracking-wide slds-text-neutral-7">
                          Explore Other Connectors <span className="slds-font-weight_regular" style={{ fontSize: '10px', textTransform: 'none' }}>({filteredConnectors.length})</span>
                        </h3>
                      </div>
                      {/* Search + filter checkboxes */}
                      <div className="slds-flex slds-items-center slds-gap_small slds-m-bottom_small">
                        <div className="slds-pos-relative slds-flex-1">
                          <Search className="slds-pos-absolute slds-icon-size_x-small slds-text-neutral-7" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            placeholder="Filter Connectors"
                            value={connectorSearch}
                            onChange={(e) => setConnectorSearch(e.target.value)}
                            className="slds-w-full slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small sf-input"
                            style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px' }}
                          />
                        </div>
                        <label className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-neutral-9 slds-cursor-pointer">
                          <input type="checkbox" defaultChecked className="slds-border-radius_small slds-border-color_border-1" style={{ width: '14px', height: '14px', accentColor: 'var(--slds-g-color-brand-1)' }} />
                          Generally Available
                        </label>
                        <label className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-text-neutral-9 slds-cursor-pointer">
                          <input type="checkbox" defaultChecked className="slds-border-radius_small slds-border-color_border-1" style={{ width: '14px', height: '14px', accentColor: 'var(--slds-g-color-brand-1)' }} />
                          Beta
                        </label>
                        <select
                          value={connectorCategory}
                          onChange={(e) => setConnectorCategory(e.target.value)}
                          className="slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px', outline: 'none' }}
                        >
                          <option value="all">All Categories</option>
                          {connectorCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      {/* Scrollable connector grid */}
                      <div className="slds-overflow-y-auto slds-border_all slds-border-color_border-1 slds-border-radius_large slds-p-around_small" style={{ maxHeight: '260px', backgroundColor: '#FAFAF9' }}>
                        <div className="slds-css-grid slds-css-grid-cols-4 slds-gap_x-small">
                          {filteredConnectors.map((conn) => {
                            const isSelected = selectedSource === conn.id;
                            return (
                              <button
                                key={conn.id}
                                onClick={() => setSelectedSource(conn.id)}
                                className={`slds-pos-relative slds-flex slds-items-center slds-text-left slds-border-radius_large slds-transition-all ${
                                  isSelected
                                    ? 'slds-border-color_brand slds-shadow_small'
                                    : 'slds-border-color_border-1 slds-bg-white'
                                }`}
                                style={{ gap: '10px', padding: '10px', border: isSelected ? '2px solid var(--slds-g-color-brand-1)' : '2px solid var(--slds-g-color-border-1)', backgroundColor: isSelected ? '#EEF4FF' : undefined }}
                              >
                                {isSelected && (
                                  <div className="slds-pos-absolute slds-bg-brand slds-flex slds-items-center slds-justify-center" style={{ top: 0, right: 0, width: '20px', height: '20px', clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                                    <Check className="slds-text-white slds-pos-absolute" style={{ width: '8px', height: '8px', top: '2px', right: '2px' }} />
                                  </div>
                                )}
                                <div className="slds-border-radius_small slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: conn.color }}>
                                  <span className="slds-font-weight_bold slds-text-white" style={{ fontSize: '9px', lineHeight: '1' }}>{conn.icon}</span>
                                </div>
                                <div className="slds-flex-1 slds-min-w-0">
                                  <div className="slds-flex slds-items-center slds-gap_xx-small">
                                    <span className="slds-font-weight_medium slds-text-neutral-base slds-truncate" style={{ fontSize: '11px', lineHeight: 'tight' }}>{conn.name}</span>
                                    <span className="slds-font-weight_semibold slds-text-uppercase slds-tracking-wide slds-border_all slds-border-color_border-1 slds-text-neutral-7 slds-border-radius_small slds-flex-shrink-0" style={{ paddingLeft: '4px', paddingRight: '4px', paddingTop: '0', fontSize: '7px' }}>Beta</span>
                                  </div>
                                  <div className="slds-text-neutral-7 slds-truncate" style={{ fontSize: '9px' }}>{conn.category}</div>
                                </div>
                              </button>
                            );
                          })}
                          {filteredConnectors.length === 0 && (
                            <div className="slds-p-vertical_x-large slds-text-center slds-text-size_small slds-text-neutral-7" style={{ gridColumn: 'span 4' }}>
                              No connectors match your search.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Step 2: Configuration — Salesforce (Bundle/Object selection) */}
              {newModalStep === 2 && selectedSource === 'salesforce' && (() => {
                const filteredSfBundles = salesforceStandardBundles.filter((b) =>
                  sfBundleSearch === '' || b.name.toLowerCase().includes(sfBundleSearch.toLowerCase())
                );
                const focusedSfBundle = salesforceStandardBundles.find((b) => b.id === focusedSfBundleId);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Info banner */}
                    <div className="slds-flex slds-items-start slds-gap_small slds-p-around_medium slds-border-radius_large" style={{ backgroundColor: '#E1F5FE' }}>
                      <Info className="slds-icon-size_default slds-text-brand slds-flex-shrink-0 slds-m-top_xx-small" />
                      <div className="slds-text-size_medium slds-text-neutral-9">
                        To ensure data is ingested from fields and objects created in the future, we recommend granting <strong>View All Fields (Global)</strong> and <strong>View All Data</strong> permission to the integration user profile. <span className="sf-link">Learn More</span>
                      </div>
                    </div>

                    <p className="slds-text-size_small slds-text-neutral-7">
                      Select an org to ingest data from, then select an object or data bundle.
                    </p>

                    {/* Org selector + view toggle */}
                    <div className="slds-flex slds-items-end slds-gap_small">
                      <div className="slds-flex-1">
                        <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-m-bottom_xx-small" style={{ display: 'block' }}>* Salesforce Org</label>
                        <select className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ outline: 'none' }}>
                          <option>Data Cloud SG</option>
                        </select>
                      </div>
                      <div className="slds-flex slds-items-center slds-border_all slds-border-color_border-1 slds-border-radius_small slds-overflow-hidden">
                        <button
                          onClick={() => setSfViewMode('bundles')}
                          className={`slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_small slds-font-weight_medium ${sfViewMode === 'bundles' ? 'slds-bg-brand slds-text-white' : 'slds-bg-white slds-text-neutral-9 sf-hover-bg-neutral'}`}
                        >View Bundles</button>
                        <button
                          onClick={() => setSfViewMode('objects')}
                          className={`slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_small slds-font-weight_medium ${sfViewMode === 'objects' ? 'slds-bg-brand slds-text-white' : 'slds-bg-white slds-text-neutral-9 sf-hover-bg-neutral'}`}
                        >View Objects</button>
                      </div>
                    </div>

                    {/* Loading spinner state */}
                    {step2Loading ? (
                      <div className="slds-flex slds-flex-col slds-items-center slds-justify-center" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
                        <div className="slds-flex slds-gap_xx-small slds-m-bottom_small">
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '10px', height: '10px', animation: 'bounce 1s infinite', animationDelay: '0ms' }} />
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '10px', height: '10px', animation: 'bounce 1s infinite', animationDelay: '150ms' }} />
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '10px', height: '10px', animation: 'bounce 1s infinite', animationDelay: '300ms' }} />
                        </div>
                        <p className="slds-text-size_medium slds-text-neutral-7">Loading bundles...</p>
                      </div>
                    ) : (
                    <>
                    {/* Bundle view */}
                    {sfViewMode === 'bundles' && (
                      <div className="slds-flex slds-gap_medium">
                        {/* Bundle grid */}
                        <div className="slds-flex-1 slds-min-w-0">
                          <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_x-small">
                            <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Standard Bundles ({salesforceStandardBundles.length})</h4>
                            <div className="slds-pos-relative" style={{ width: '192px' }}>
                              <Search className="slds-pos-absolute slds-icon-size_xx-small slds-text-neutral-7" style={{ left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                              <input type="text" placeholder="Search..." value={sfBundleSearch} onChange={(e) => setSfBundleSearch(e.target.value)}
                                className="slds-w-full slds-text-size_small slds-border_all slds-border-color_border-1 slds-border-radius_small sf-input" style={{ paddingLeft: '28px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px' }} />
                            </div>
                          </div>
                          <div className="slds-overflow-y-auto slds-border_all slds-border-color_border-1 slds-border-radius_large" style={{ maxHeight: '320px' }}>
                            <div className="slds-css-grid slds-css-grid-cols-3" style={{ gap: '0px' }}>
                              {filteredSfBundles.map((bundle) => {
                                const isSelected = selectedSfBundles.has(bundle.id);
                                const isFocused = focusedSfBundleId === bundle.id;
                                return (
                                  <button
                                    key={bundle.id}
                                    onClick={() => {
                                      setFocusedSfBundleId(bundle.id);
                                      setSelectedSfBundles((prev) => { const n = new Set(prev); if (n.has(bundle.id)) n.delete(bundle.id); else n.add(bundle.id); return n; });
                                    }}
                                    onMouseEnter={() => setFocusedSfBundleId(bundle.id)}
                                    className={`slds-flex slds-items-center slds-gap_small slds-p-around_small slds-text-left slds-border_all slds-border-color_border-1 slds-transition-all ${
                                      isSelected ? 'slds-border-color_brand' : ''
                                    }`}
                                    style={{ backgroundColor: isSelected ? '#EEF4FF' : isFocused ? '#FAFAF9' : 'white' }}
                                  >
                                    <div className="slds-border-radius_small slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: bundle.iconColor }}>
                                      <span className="slds-font-weight_bold slds-text-white" style={{ fontSize: '9px' }}>{bundle.icon}</span>
                                    </div>
                                    <div className="slds-flex-1 slds-min-w-0">
                                      <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base slds-truncate">{bundle.name}</div>
                                      <div className="slds-text-neutral-7" style={{ fontSize: '10px' }}>{bundle.objectCount} Objects &middot; Created by Salesforce</div>
                                    </div>
                                    {isSelected && <Check className="slds-icon-size_small slds-text-brand slds-flex-shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Bundle detail sidebar */}
                        {focusedSfBundle && (
                          <div className="slds-flex-shrink-0" style={{ width: '220px' }}>
                            <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-bg-white slds-p-around_medium">
                              <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_xx-small">Bundle Details</h4>
                              <div className="slds-flex slds-items-center slds-gap_x-small slds-m-bottom_small">
                                <div className="slds-border-radius_small slds-flex slds-items-center slds-justify-center" style={{ width: '24px', height: '24px', backgroundColor: focusedSfBundle.iconColor }}>
                                  <span className="slds-font-weight_bold slds-text-white" style={{ fontSize: '7px' }}>{focusedSfBundle.icon}</span>
                                </div>
                                <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{focusedSfBundle.name}</span>
                              </div>
                              <div className="slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>Type: <span className="slds-text-neutral-9">Standard Data Bundle</span></div>
                              <div className="slds-text-neutral-7 slds-m-bottom_small" style={{ fontSize: '10px' }}>Description:</div>
                              <div className="slds-font-weight_medium slds-text-neutral-base slds-m-bottom_x-small" style={{ fontSize: '10px' }}>Objects included ({focusedSfBundle.objectCount})</div>
                              <div className="slds-flex slds-flex-wrap slds-gap_xx-small">
                                {focusedSfBundle.objects.map((obj) => (
                                  <span key={obj} className="slds-bg-neutral-2 slds-text-neutral-9 slds-border-radius_small" style={{ paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px', paddingBottom: '2px', fontSize: '9px', fontFamily: 'monospace' }}>{obj}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Object view (simple select) */}
                    {sfViewMode === 'objects' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>Salesforce Object</label>
                          <select className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ outline: 'none' }}>
                            <option>Account</option><option>Contact</option><option>Lead</option><option>Opportunity</option>
                            <option>Case</option><option>Campaign</option><option>EmailMessage</option><option>Event</option>
                            <option>Task</option><option>Order</option><option>Product2</option><option>PricebookEntry</option>
                          </select>
                        </div>
                        <div>
                          <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xx-small" style={{ display: 'block' }}>Refresh Frequency</label>
                          <select className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ outline: 'none' }}>
                            <option>Every 1 hour</option><option>Every 6 hours</option><option>Every 12 hours</option>
                            <option>Daily</option><option>Manual</option>
                          </select>
                        </div>
                      </div>
                    )}
                    </>
                    )}
                  </div>
                );
              })()}

              {/* Step 2: Configuration — Informatica bundles (matches Salesforce layout exactly) */}
              {newModalStep === 2 && selectedSource === 'informatica' && (() => {
                const focusedBundle = informaticaBundles.find((b) => b.id === focusedBundleId);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Info banner */}
                    <div className="slds-flex slds-items-start slds-gap_small slds-p-around_medium slds-border-radius_large" style={{ backgroundColor: '#E1F5FE' }}>
                      <Info className="slds-icon-size_default slds-text-brand slds-flex-shrink-0 slds-m-top_xx-small" />
                      <div className="slds-text-size_medium slds-text-neutral-9">
                        To ensure data is ingested from fields and objects created in the future, we recommend granting <strong>View All Fields (Global)</strong> system permission on the Data Cloud Informatica MDM Connector permission set. <span className="sf-link">Learn More</span>
                      </div>
                    </div>

                    <p className="slds-text-size_small slds-text-neutral-7">
                      Select a tenant to ingest data from, then select an object or data bundle.
                    </p>

                    {/* Tenant selector + view toggle */}
                    <div className="slds-flex slds-items-end slds-gap_small">
                      <div className="slds-flex-1">
                        <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-m-bottom_xx-small" style={{ display: 'block' }}>* Informatica Tenant</label>
                        <select
                          value={selectedTenant}
                          onChange={(e) => setSelectedTenant(e.target.value)}
                          className="slds-w-full slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border_all slds-border-color_border-1 slds-border-radius_small slds-bg-white" style={{ outline: 'none' }}
                        >
                          {sessionTenants.length > 0 ? (
                            sessionTenants.map((alias) => (
                              <option key={alias} value={alias}>{alias}</option>
                            ))
                          ) : (
                            <option value="" disabled>No tenants configured — connect in Data Cloud Setup</option>
                          )}
                        </select>
                      </div>
                      <div className="slds-flex slds-items-center slds-border_all slds-border-color_border-1 slds-border-radius_small slds-overflow-hidden">
                        <button className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_small slds-font-weight_medium slds-bg-brand slds-text-white">View Bundles</button>
                        <button className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_small slds-font-weight_medium slds-bg-white slds-text-neutral-9 sf-hover-bg-neutral">View Objects</button>
                      </div>
                    </div>

                    {/* Loading spinner state */}
                    {step2Loading ? (
                      <div className="slds-flex slds-flex-col slds-items-center slds-justify-center" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
                        <div className="slds-flex slds-gap_xx-small slds-m-bottom_small">
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '10px', height: '10px', animation: 'bounce 1s infinite', animationDelay: '0ms' }} />
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '10px', height: '10px', animation: 'bounce 1s infinite', animationDelay: '150ms' }} />
                          <div className="slds-border-radius_pill slds-bg-brand" style={{ width: '10px', height: '10px', animation: 'bounce 1s infinite', animationDelay: '300ms' }} />
                        </div>
                        <p className="slds-text-size_medium slds-text-neutral-7">Loading bundles...</p>
                      </div>
                    ) : (
                    <>
                    {/* Bundle grid + detail sidebar */}
                    <div className="slds-flex slds-gap_medium">
                      <div className="slds-flex-1 slds-min-w-0">
                        <div className="slds-flex slds-items-center slds-justify-between slds-m-bottom_x-small">
                          <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Standard Bundles ({informaticaBundles.length})</h4>
                        </div>
                        <div className="slds-overflow-y-auto slds-border_all slds-border-color_border-1 slds-border-radius_large" style={{ maxHeight: '320px' }}>
                          <div className="slds-css-grid slds-css-grid-cols-2" style={{ gap: '0px' }}>
                            {informaticaBundles.map((bundle) => {
                              const isSelected = selectedBundles.has(bundle.id);
                              const isFocused = focusedBundleId === bundle.id;
                              return (
                                <button
                                  key={bundle.id}
                                  onClick={() => { toggleBundle(bundle.id); setFocusedBundleId(bundle.id); }}
                                  onMouseEnter={() => setFocusedBundleId(bundle.id)}
                                  className={`slds-flex slds-items-center slds-gap_small slds-p-around_small slds-text-left slds-border_all slds-border-color_border-1 slds-transition-all ${
                                    isSelected ? 'slds-border-color_brand' : ''
                                  }`}
                                  style={{ backgroundColor: isSelected ? '#EEF4FF' : isFocused ? '#FAFAF9' : 'white' }}
                                >
                                  <div className="slds-border-radius_small slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#FF4A00' }}>
                                    <svg viewBox="0 0 32 32" className="slds-icon-size_default">
                                      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">INFA</text>
                                    </svg>
                                  </div>
                                  <div className="slds-flex-1 slds-min-w-0">
                                    <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base slds-truncate">{bundle.name}</div>
                                    <div className="slds-text-neutral-7" style={{ fontSize: '10px' }}>{bundle.entities.length} Entities &middot; Informatica MDM</div>
                                  </div>
                                  {isSelected && <Check className="slds-icon-size_small slds-text-brand slds-flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bundle detail sidebar */}
                      {focusedBundle && (
                        <div className="slds-flex-shrink-0" style={{ width: '220px' }}>
                          <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-bg-white slds-p-around_medium">
                            <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_xx-small">Bundle Details</h4>
                            <div className="slds-flex slds-items-center slds-gap_x-small slds-m-bottom_small">
                              <div className="slds-border-radius_small slds-flex slds-items-center slds-justify-center" style={{ width: '24px', height: '24px', backgroundColor: '#FF4A00' }}>
                                <svg viewBox="0 0 32 32" className="slds-icon-size_small">
                                  <text x="16" y="22" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">IN</text>
                                </svg>
                              </div>
                              <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base">{focusedBundle.name}</span>
                            </div>
                            <div className="slds-text-neutral-7 slds-m-bottom_xx-small" style={{ fontSize: '10px' }}>Type: <span className="slds-text-neutral-9">MDM Business Entity Bundle</span></div>
                            <div className="slds-text-neutral-7 slds-m-bottom_small" style={{ fontSize: '10px' }}>Description: <span className="slds-text-neutral-9">{focusedBundle.description}</span></div>
                            <div className="slds-font-weight_medium slds-text-neutral-base slds-m-bottom_x-small" style={{ fontSize: '10px' }}>Entities included ({focusedBundle.entities.length})</div>
                            <div className="slds-flex slds-flex-wrap slds-gap_xx-small">
                              {focusedBundle.entities.map((entity) => (
                                <span key={entity.name} className="slds-bg-neutral-2 slds-text-neutral-9 slds-border-radius_small" style={{ paddingLeft: '6px', paddingRight: '6px', paddingTop: '2px', paddingBottom: '2px', fontSize: '9px', fontFamily: 'monospace' }}>{entity.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    </>
                    )}
                  </div>
                );
              })()}

              {/* Step 3: Review */}
              {newModalStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="slds-flex slds-items-start slds-gap_small slds-p-around_medium slds-border-radius_large" style={{ backgroundColor: '#E1F5FE' }}>
                    <Info className="slds-icon-size_default slds-text-brand slds-flex-shrink-0 slds-m-top_xx-small" />
                    <div className="slds-text-size_medium slds-text-neutral-9">
                      Review the details below and click <strong>Next</strong> to configure the data space.
                    </div>
                  </div>
                  <div className="sf-card">
                    <div className="sf-detail-grid">
                      <div className="sf-detail-field">
                        <div className="sf-detail-label">Source</div>
                        <div className="sf-detail-value slds-font-weight_medium">{resolveSourceInfo(selectedSource).name}</div>
                      </div>
                      {selectedSource === 'informatica' && (
                        <>
                          <div className="sf-detail-field">
                            <div className="sf-detail-label">Tenant</div>
                            <div className="sf-detail-value">{selectedTenant}</div>
                          </div>
                          <div className="sf-detail-field">
                            <div className="sf-detail-label">Bundles</div>
                            <div className="sf-detail-value">
                              <div className="slds-flex slds-flex-wrap slds-gap_xx-small">
                                {Array.from(selectedBundles).map((id) => {
                                  const bundle = informaticaBundles.find((b) => b.id === id);
                                  return bundle ? (
                                    <span key={id} className="slds-text-size_small slds-font-weight_medium slds-border-radius_small" style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', backgroundColor: '#FFF3ED', color: '#FF4A00' }}>{bundle.name}</span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {!isCoreSource && (
                        <div className="sf-detail-field">
                          <div className="sf-detail-label">Category</div>
                          <div className="sf-detail-value">{resolveSourceInfo(selectedSource).category}</div>
                        </div>
                      )}
                      <div className="sf-detail-field">
                        <div className="sf-detail-label">Refresh Frequency</div>
                        <div className="sf-detail-value">Every 1 hour</div>
                      </div>
                      <div className="sf-detail-field">
                        <div className="sf-detail-label">Status</div>
                        <div className="sf-detail-value"><span className="sf-badge sf-badge-warning">Pending</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Data Space selection */}
              {newModalStep === 4 && (() => {
                const dataSpaces = [
                  { id: 'agentMemory', label: 'agentMemory', description: '' },
                  { id: 'default', label: 'default', description: "Your org's default data space. It can be renamed, but not deleted." },
                  { id: 'employee360', label: 'employee360', description: '' },
                  { id: 'ethicsModelTest', label: 'Ethics Model Test', description: 'Use this data space only for dedicated testing of Ethics for Identity Modeling' },
                ];
                // Build objects list from selected bundles / source
                const objectRows: { name: string; category: string }[] = [];
                if (selectedSource === 'informatica') {
                  selectedBundles.forEach((bundleId) => {
                    const bundle = informaticaBundles.find((b) => b.id === bundleId);
                    if (bundle) {
                      bundle.entities.forEach((entity) => {
                        objectRows.push({ name: `${entity.name}_Home`, category: 'MDM Entity' });
                      });
                    }
                  });
                } else if (selectedSource === 'salesforce') {
                  selectedSfBundles.forEach((bundleId) => {
                    const bundle = salesforceStandardBundles.find((b) => b.id === bundleId);
                    if (bundle) {
                      bundle.objects.forEach((obj) => {
                        objectRows.push({ name: `${obj}_Home`, category: 'Other' });
                      });
                    }
                  });
                  if (objectRows.length === 0) {
                    objectRows.push(
                      { name: 'Account_Home', category: 'Other' },
                      { name: 'Contact_Home', category: 'Other' },
                    );
                  }
                } else {
                  // Generic connector source — show placeholder objects
                  const info = resolveSourceInfo(selectedSource);
                  objectRows.push(
                    { name: `${info.name.replace(/\s+/g, '')}_Record`, category: info.category || 'Connector' },
                    { name: `${info.name.replace(/\s+/g, '')}_Event`, category: info.category || 'Connector' },
                  );
                }
                return (
                  <div className="slds-flex" style={{ gap: '20px' }}>
                    {/* Left content */}
                    <div className="slds-flex-1 slds-min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Data Space selector */}
                      <div>
                        <label className="slds-flex slds-items-center slds-gap_xx-small slds-text-size_small slds-font-weight_medium slds-text-neutral-base slds-m-bottom_xx-small">
                          <span style={{ color: '#C23934' }}>*</span> Data Space
                          <Info className="slds-icon-size_xx-small slds-text-neutral-7" />
                        </label>
                        <div className="slds-pos-relative">
                          <button
                            onClick={() => setDataSpaceDropdownOpen(!dataSpaceDropdownOpen)}
                            className="slds-w-full slds-flex slds-items-center slds-justify-between slds-p-horizontal_small slds-p-vertical_x-small slds-text-size_medium slds-border-radius_small slds-bg-white"
                            style={{ maxWidth: '384px', border: '2px solid var(--slds-g-color-brand-1)', outline: 'none' }}
                          >
                            <span className={selectedDataSpace ? 'slds-text-neutral-base' : 'slds-text-neutral-7'}>
                              {selectedDataSpace ? dataSpaces.find((d) => d.id === selectedDataSpace)?.label || selectedDataSpace : 'Select Data Space'}
                            </span>
                            <ChevronDown className="slds-icon-size_small slds-text-neutral-7" />
                          </button>
                          {dataSpaceDropdownOpen && (
                            <div className="slds-pos-absolute slds-z-10 slds-w-full slds-bg-white slds-border_all slds-border-color_border-1 slds-border-radius_large slds-shadow_large slds-overflow-hidden" style={{ top: '100%', left: 0, marginTop: '4px', maxWidth: '384px' }}>
                              {dataSpaces.map((ds) => (
                                <button
                                  key={ds.id}
                                  onClick={() => { setSelectedDataSpace(ds.id); setDataSpaceDropdownOpen(false); }}
                                  className={`slds-w-full slds-text-left slds-p-horizontal_medium slds-border_bottom slds-border-color_border-1 slds-transition-colors`}
                                  style={{ paddingTop: '10px', paddingBottom: '10px', backgroundColor: selectedDataSpace === ds.id ? '#EEF4FF' : undefined }}
                                >
                                  <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">{ds.label}</div>
                                  {ds.description && <div className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">{ds.description}</div>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Objects table */}
                      {objectRows.length > 0 && (
                        <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-overflow-hidden">
                          <table className="slds-w-full slds-text-size_small">
                            <thead>
                              <tr className="slds-border_bottom slds-border-color_border-1" style={{ backgroundColor: '#FAFAF9' }}>
                                <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-font-weight_medium slds-text-neutral-7" style={{ width: '32px' }}>
                                  <input type="checkbox" className="slds-border-radius_small slds-border-color_border-1" defaultChecked />
                                </th>
                                <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-font-weight_medium slds-text-neutral-7">
                                  <div className="slds-flex slds-items-center slds-gap_xx-small">Object <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div>
                                </th>
                                <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-font-weight_medium slds-text-neutral-7">
                                  <div className="slds-flex slds-items-center slds-gap_xx-small">Category <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div>
                                </th>
                                <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-font-weight_medium slds-text-neutral-7">
                                  <div className="slds-flex slds-items-center slds-gap_xx-small">Refresh Mode <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div>
                                </th>
                                <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-font-weight_medium slds-text-neutral-7">
                                  <div className="slds-flex slds-items-center slds-gap_xx-small">Full Refresh Interval <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div>
                                </th>
                                <th className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-left slds-font-weight_medium slds-text-neutral-7">
                                  <div className="slds-flex slds-items-center slds-gap_xx-small">Data Space Filtering <ChevronDown className="slds-icon-size_xx-small slds-opacity_50" /></div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="slds-overflow-y-auto" style={{ maxHeight: '220px' }}>
                              {objectRows.map((obj, i) => (
                                <tr key={i} className="slds-border_bottom slds-border-color_border-1 sf-hover-bg-neutral">
                                  <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-center slds-text-neutral-7">{i + 1}</td>
                                  <td className="slds-p-horizontal_small slds-p-vertical_x-small">
                                    <span className="slds-text-brand sf-hover-underline slds-cursor-pointer slds-font-weight_medium">{obj.name}</span>
                                  </td>
                                  <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-9">{obj.category}</td>
                                  <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-9">Upsert</td>
                                  <td className="slds-p-horizontal_small slds-p-vertical_x-small slds-text-neutral-9">None</td>
                                  <td className="slds-p-horizontal_small slds-p-vertical_x-small">
                                    <span className="slds-text-brand sf-hover-underline slds-cursor-pointer">Set Filters</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Right sidebar — FAQs */}
                    <div className="slds-flex-shrink-0" style={{ width: '260px' }}>
                      <div className="slds-border_all slds-border-color_border-1 slds-border-radius_large slds-bg-white slds-overflow-hidden">
                        <div className="slds-p-horizontal_medium slds-p-vertical_small slds-border_bottom slds-border-color_border-1" style={{ backgroundColor: '#FAFAF9' }}>
                          <h4 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">Frequently Asked Questions</h4>
                        </div>
                        <div className="slds-p-around_medium" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <h5 className="slds-text-size_small slds-font-weight_bold slds-text-neutral-base slds-m-bottom_xx-small">What are data space filters?</h5>
                            <p className="slds-text-neutral-7 slds-leading-relaxed" style={{ fontSize: '11px' }}>
                              Data space filters let you determine which records from the data lake object are available in the context of a data space.
                            </p>
                          </div>
                          <div>
                            <h5 className="slds-text-size_small slds-font-weight_bold slds-text-neutral-base slds-m-bottom_xx-small">What is a refresh mode?</h5>
                            <p className="slds-text-neutral-7 slds-leading-relaxed" style={{ fontSize: '11px' }}>
                              After the initial data ingestion, you can opt to replace only the fields for which new data was received (partial refresh) or to replace the entire record with the data received (incremental refresh). When refresh mode is incremental, existing values can be replaced by blank values.
                            </p>
                          </div>
                          <div>
                            <h5 className="slds-text-size_small slds-font-weight_bold slds-text-neutral-base slds-m-bottom_xx-small">What is the full refresh interval?</h5>
                            <p className="slds-text-neutral-7 slds-leading-relaxed" style={{ fontSize: '11px' }}>
                              The full refresh interval helps determine when a periodic full refresh is triggered. By default it's disabled, but you can enable and configure it to a desired interval.
                              <span className="slds-text-brand sf-hover-underline slds-cursor-pointer slds-m-left_xx-small">Learn more</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer with step indicator */}
            <div className="slds-flex slds-items-center slds-justify-between slds-p-horizontal_large slds-p-vertical_medium slds-border_top slds-border-color_border-1" style={{ backgroundColor: '#FAFAF9' }}>
              <div className="slds-flex slds-items-center slds-gap_x-small">
                {newModalStep > 1 && (
                  <button onClick={handleNewBack} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral">
                    Previous
                  </button>
                )}
                <div className="slds-flex slds-items-center slds-gap_xx-small slds-m-left_medium">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="slds-flex slds-items-center slds-gap_xx-small">
                      <div className={`slds-border-radius_pill slds-flex slds-items-center slds-justify-center slds-font-weight_medium ${
                        s < newModalStep ? 'slds-bg-success slds-text-white' :
                        s === newModalStep ? 'slds-bg-brand slds-text-white' :
                        'slds-bg-neutral-2 slds-text-neutral-7'
                      }`} style={{ width: '20px', height: '20px', fontSize: '10px' }}>
                        {s < newModalStep ? <Check style={{ width: '10px', height: '10px' }} /> : s}
                      </div>
                      {s < 4 && <div className={`${s < newModalStep ? 'slds-bg-success' : 'slds-bg-neutral-2'}`} style={{ width: '64px', height: '2px' }} />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="slds-flex slds-items-center slds-gap_small">
                {newModalStep === 1 && (
                  <>
                    <button onClick={() => setNewModalOpen(false)} className="slds-p-horizontal_medium slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-neutral-9 slds-border_all slds-border-color_border-1 slds-border-radius_small sf-hover-bg-neutral">Cancel</button>
                    <button
                      onClick={handleNewNext}
                      disabled={!selectedSource}
                      className="slds-p-horizontal_large slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-cursor-pointer"
                      style={{ opacity: !selectedSource ? 0.5 : 1, cursor: !selectedSource ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </>
                )}
                {newModalStep === 2 && (
                  <button
                    onClick={handleNewNext}
                    disabled={selectedSource === 'informatica' && selectedBundles.size === 0}
                    className="slds-p-horizontal_large slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-cursor-pointer"
                    style={{ opacity: (selectedSource === 'informatica' && selectedBundles.size === 0) ? 0.5 : 1, cursor: (selectedSource === 'informatica' && selectedBundles.size === 0) ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                )}
                {newModalStep === 3 && (
                  <button
                    onClick={handleNewNext}
                    className="slds-p-horizontal_large slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-cursor-pointer"
                  >
                    Next
                  </button>
                )}
                {newModalStep === 4 && (
                  <button
                    onClick={handleCreateStreams}
                    className="slds-p-horizontal_large slds-p-vertical_x-small slds-text-size_medium slds-font-weight_medium slds-text-white slds-bg-brand slds-border-radius_small slds-cursor-pointer"
                  >
                    Deploy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
