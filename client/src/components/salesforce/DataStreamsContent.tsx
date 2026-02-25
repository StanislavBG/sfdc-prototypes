import { useState } from 'react';
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
  Eye,
  Edit3,
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

const informaticaBundles: InformaticaBundle[] = [
  { id: 'ib-1', name: 'Customer 360', description: 'Customer master data including demographics, preferences, and relationships', objectCount: 12, installed: false },
  { id: 'ib-2', name: 'Product 360', description: 'Product catalog, pricing, and category hierarchies', objectCount: 8, installed: false },
  { id: 'ib-3', name: 'Supplier 360', description: 'Supplier profiles, contacts, and compliance data', objectCount: 6, installed: false },
  { id: 'ib-4', name: 'Reference 360', description: 'Reference data including codes, lookups, and hierarchies', objectCount: 15, installed: false },
  { id: 'ib-5', name: 'Organization 360', description: 'Organization hierarchy, departments, and cost centers', objectCount: 9, installed: false },
  { id: 'ib-6', name: 'Finance 360', description: 'Chart of accounts, GL codes, and financial instruments', objectCount: 11, installed: false },
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

// ── Component ────────────────────────────────────────────────────────
export default function DataStreamsContent() {
  const [dataStreams, setDataStreams] = useState<DataStream[]>(mockDataStreams);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Detail view state
  const [selectedStream, setSelectedStream] = useState<DataStream | null>(null);
  const [reviewFieldId, setReviewFieldId] = useState<string | null>(null);

  // New Data Stream modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newModalStep, setNewModalStep] = useState<1 | 2 | 3>(1);
  const [selectedSource, setSelectedSource] = useState<'salesforce' | 'informatica' | null>(null);

  // Informatica bundle selection
  const [selectedTenant, setSelectedTenant] = useState('USA-1');
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());

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

  // Filter streams
  const filteredStreams = dataStreams.filter((ds) => {
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
    setSelectedTenant('USA-1');
    setSelectedBundles(new Set());
    setNewModalOpen(true);
  };

  const handleNewNext = () => {
    if (newModalStep === 1 && selectedSource) {
      setNewModalStep(2);
    } else if (newModalStep === 2) {
      if (selectedSource === 'informatica' && selectedBundles.size > 0) {
        setNewModalStep(3);
      } else if (selectedSource === 'salesforce') {
        setNewModalStep(3);
      }
    }
  };

  const handleNewBack = () => {
    if (newModalStep === 2) setNewModalStep(1);
    else if (newModalStep === 3) setNewModalStep(2);
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
    if (selectedSource === 'informatica') {
      const newStreams: DataStream[] = [];
      selectedBundles.forEach((bundleId) => {
        const bundle = informaticaBundles.find((b) => b.id === bundleId);
        if (bundle) {
          newStreams.push({
            id: `ds-infa-${Date.now()}-${bundleId}`,
            name: `${bundle.name} - Informatica MDM`,
            source: `Informatica MDM (${selectedTenant})`,
            sourceType: 'informatica',
            object: bundle.name,
            status: 'Pending',
            recordsProcessed: 0,
            lastRefreshed: '—',
            refreshFrequency: 'Every 1 hour',
            dataSpace: 'default',
            tenant: selectedTenant,
            fields: generateStreamFields(bundle.name),
          });
        }
      });
      setDataStreams((prev) => [...prev, ...newStreams]);
    }
    setNewModalOpen(false);
  };

  // ── Helper: get the reviewing field ──
  const reviewingField = selectedStream?.fields?.find((f) => f.id === reviewFieldId) || null;

  // ──────────────────────────────────────────────────────────────────
  // VISUAL MAPPING REVIEW SCREEN
  // ──────────────────────────────────────────────────────────────────
  if (selectedStream && reviewingField) {
    const allFields = selectedStream.fields || [];
    const sourceName = selectedStream.source;
    const objectName = selectedStream.object;
    // Group target fields by DMO for the right side
    const dmoGroups: Record<string, StreamField[]> = {};
    allFields.forEach((f) => { (dmoGroups[f.targetDMO] = dmoGroups[f.targetDMO] || []).push(f); });

    return (
      <div className="h-full flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-2 flex items-center gap-2">
          <button onClick={() => setReviewFieldId(null)} className="flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            {selectedStream.name}
          </button>
          <ChevronRight className="w-3 h-3 text-[var(--sf-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--sf-text-primary)]">Data Mapping Review</span>
        </div>

        {/* Mapping header */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">Data Mapping — {objectName}</h1>
              <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
                Source: <span className="font-medium text-[#FF4A00]">{sourceName}</span>
                {' '}&rarr;{' '}
                Target: <span className="font-medium text-[var(--sf-blue)]">Data Cloud DMOs</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[var(--sf-success)] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {allFields.filter((f) => f.mappingStatus === 'Auto-Mapped').length}/{allFields.length} fields auto-mapped
              </span>
            </div>
          </div>
        </div>

        {/* Visual mapper */}
        <div className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">
          <div className="p-6">
            <div className="flex gap-6">
              {/* LEFT: Source fields */}
              <div className="w-[340px] flex-shrink-0">
                <div className="sf-card">
                  <div className="px-4 py-3 border-b-2 border-[#FF4A00]">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                        <rect x="2" y="2" width="20" height="20" rx="3" fill="#FF4A00" />
                        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">INFA</text>
                      </svg>
                      <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">{objectName}</h3>
                      <span className="text-[10px] text-[var(--sf-text-tertiary)] ml-auto">{selectedStream.tenant}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--sf-border)]">
                    {allFields.map((field) => (
                      <div key={field.id} className={`px-4 py-2.5 flex items-center gap-2 text-xs transition-colors ${field.id === reviewFieldId ? 'bg-[#FFF3ED]' : 'hover:bg-[#FAFAF9]'}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${field.mappingStatus === 'Auto-Mapped' ? 'bg-[var(--sf-success)]' : field.mappingStatus === 'Unmapped' ? 'bg-[var(--sf-error)]' : 'bg-[#FFB75D]'}`} />
                        <span className="font-mono text-[var(--sf-text-primary)]">{field.fieldName}</span>
                        <span className="text-[var(--sf-text-tertiary)] ml-auto">{field.dataType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CENTER: Connector lines */}
              <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 100 }}>
                <svg className="w-full" viewBox="0 0 100 600" style={{ height: Math.max(allFields.length * 36, 400) }}>
                  {allFields.map((field, i) => {
                    // Find the target field's position in the right side
                    const dmoKeys = Object.keys(dmoGroups);
                    let rightY = 0;
                    let found = false;
                    let offset = 0;
                    for (const dmo of dmoKeys) {
                      offset += 36; // header
                      for (const f of dmoGroups[dmo]) {
                        if (f.id === field.id) {
                          rightY = offset + 14;
                          found = true;
                          break;
                        }
                        offset += 30;
                      }
                      if (found) break;
                      offset += 8; // gap
                    }
                    const leftY = i * 36 + 50;
                    const color = field.mappingStatus === 'Auto-Mapped' ? '#2E844A' : '#FFB75D';
                    return (
                      <path
                        key={field.id}
                        d={`M 0 ${leftY} C 50 ${leftY}, 50 ${rightY}, 100 ${rightY}`}
                        stroke={color}
                        strokeWidth={field.id === reviewFieldId ? 2.5 : 1.5}
                        fill="none"
                        opacity={field.id === reviewFieldId ? 1 : 0.4}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* RIGHT: Target DMOs */}
              <div className="w-[340px] flex-shrink-0 space-y-3">
                {Object.entries(dmoGroups).map(([dmoName, fields]) => (
                  <div key={dmoName} className="sf-card">
                    <div className="px-4 py-2.5 border-b-2 border-[var(--sf-blue)]">
                      <h4 className="text-xs font-semibold text-[var(--sf-blue)]">{dmoName}</h4>
                    </div>
                    <div className="divide-y divide-[var(--sf-border)]">
                      {fields.map((field) => (
                        <div key={field.id} className={`px-4 py-2 flex items-center gap-2 text-xs transition-colors ${field.id === reviewFieldId ? 'bg-[#EEF4FF]' : 'hover:bg-[#FAFAF9]'}`}>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${field.mappingStatus === 'Auto-Mapped' ? 'bg-[var(--sf-success)]' : 'bg-[#FFB75D]'}`} />
                          <span className="font-mono text-[var(--sf-text-primary)]">{field.targetField}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-xs text-[var(--sf-text-tertiary)]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#2E844A]" /> Auto-Mapped</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-[#FFB75D]" /> Manual / Review Needed</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--sf-error)]" /> Unmapped</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[var(--sf-border)] px-6 py-3 flex items-center justify-between">
          <button onClick={() => setReviewFieldId(null)} className="px-4 py-1.5 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">
            &larr; Back to Fields
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]">
            Approve Mapping
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // DATA STREAM DETAIL VIEW — Fields panel
  // ──────────────────────────────────────────────────────────────────
  if (selectedStream) {
    const fields = selectedStream.fields || [];
    const autoMapped = fields.filter((f) => f.mappingStatus === 'Auto-Mapped').length;

    return (
      <div className="h-full flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-2 flex items-center gap-2">
          <button onClick={() => setSelectedStream(null)} className="flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Data Streams
          </button>
          <ChevronRight className="w-3 h-3 text-[var(--sf-text-tertiary)]" />
          <span className="text-xs font-medium text-[var(--sf-text-primary)]">{selectedStream.name}</span>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedStream.sourceType === 'informatica' ? 'bg-[#FF4A00]' : 'bg-[#032D60]'}`}>
              <Database className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">{selectedStream.name}</h1>
              <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Data Stream from {selectedStream.source}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">Refresh Now</button>
              <button className="px-3 py-1.5 text-xs font-medium border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3] text-[var(--sf-text-secondary)]">Edit</button>
            </div>
          </div>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Source</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedStream.source}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Object</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedStream.object}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Status</p>
              <p className="text-sm">{statusBadge(selectedStream.status)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Records Processed</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{fmt(selectedStream.recordsProcessed)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Last Refreshed</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)]">{selectedStream.lastRefreshed}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sf-text-tertiary)]">Data Space</p>
              <p className="text-sm font-medium text-[var(--sf-text-primary)] capitalize">{selectedStream.dataSpace}</p>
            </div>
          </div>
        </div>

        {/* Fields table */}
        <div className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">
          <div className="p-6">
            {fields.length > 0 ? (
              <div className="sf-card">
                <div className="sf-card-header">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                      Fields <span className="text-xs font-normal text-[var(--sf-text-tertiary)]">({fields.length})</span>
                    </h2>
                    <span className="flex items-center gap-1 text-xs text-[var(--sf-success)] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {autoMapped} auto-mapped
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReviewFieldId(fields[0]?.id || null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review All Mappings
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="sf-table">
                    <thead>
                      <tr>
                        <th>Field Name</th>
                        <th>Data Type</th>
                        <th>Target DMO</th>
                        <th>Target Field</th>
                        <th>Mapping Status</th>
                        <th className="w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field) => (
                        <tr key={field.id}>
                          <td>
                            <span className="font-mono text-sm">{field.fieldName}</span>
                          </td>
                          <td>
                            <span className="text-xs px-1.5 py-0.5 bg-[#F3F3F3] rounded font-mono">{field.dataType}</span>
                          </td>
                          <td className="sf-link text-xs">{field.targetDMO}</td>
                          <td><span className="font-mono text-xs">{field.targetField}</span></td>
                          <td>
                            <span className={`sf-badge ${field.mappingStatus === 'Auto-Mapped' ? 'sf-badge-success' : field.mappingStatus === 'Unmapped' ? 'sf-badge-error' : 'sf-badge-warning'}`}>
                              {field.mappingStatus}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setReviewFieldId(field.id); }}
                              className="px-2.5 py-1 text-[11px] font-medium text-[var(--sf-link)] border border-[var(--sf-border)] rounded hover:bg-[#EEF4FF] transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="sf-card">
                <div className="sf-card-body text-center py-12">
                  <Database className="w-10 h-10 text-[var(--sf-text-tertiary)] mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-[var(--sf-text-tertiary)]">No field mappings available for this data stream.</p>
                  <p className="text-xs text-[var(--sf-text-tertiary)] mt-1">Field mappings are auto-created for Informatica MDM data streams.</p>
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
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="bg-white border-b border-[var(--sf-border)] px-6 py-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#032D60] flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[var(--sf-text-primary)]">Data Streams</h1>
            <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">Manage data ingestion streams from connected sources</p>
          </div>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Data Stream
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-[var(--sf-border)] px-6 py-2.5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search data streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue-light)] focus:ring-1 focus:ring-[rgba(27,150,255,0.2)]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2 py-1.5 text-xs border border-[var(--sf-border)] rounded bg-white focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="salesforce">Salesforce CRM</option>
            <option value="informatica">Informatica MDM</option>
            <option value="api">Ingestion API</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--sf-text-tertiary)]">{filteredStreams.length} streams</span>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Data Streams Table */}
      <div className="flex-1 overflow-y-auto bg-[var(--sf-content-bg)]">
        <div className="p-6">
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                All Data Streams <span className="text-xs font-normal text-[var(--sf-text-tertiary)]">({filteredStreams.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th><div className="flex items-center gap-1">Data Stream Name <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
                    <th><div className="flex items-center gap-1">Source <ChevronDown className="w-3 h-3 opacity-50" /></div></th>
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
                    <tr key={ds.id} className="cursor-pointer hover:bg-[#F3F3F3]" onClick={() => setSelectedStream(ds)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{sourceIcon(ds.sourceType)}</span>
                          <span className="sf-link font-medium">{ds.name}</span>
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
                      <td colSpan={8} className="text-center py-8 text-sm text-[var(--sf-text-tertiary)]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNewModalOpen(false)} />
          <div className={`relative bg-white rounded-lg shadow-2xl max-h-[85vh] flex flex-col transition-all ${newModalStep === 2 && selectedSource === 'informatica' ? 'w-[780px]' : 'w-[640px]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sf-border)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--sf-text-primary)]">New Data Stream</h2>
                <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
                  {newModalStep === 1 ? 'Select a data source to connect.' : newModalStep === 2 ? 'Configure your data stream.' : 'Review and create.'}
                </p>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F3F3] text-[var(--sf-text-tertiary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Step 1: Source selection */}
              {newModalStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Salesforce CRM */}
                  <button
                    onClick={() => setSelectedSource('salesforce')}
                    className={`relative flex flex-col items-center justify-center h-44 rounded-lg border-2 transition-all text-center px-4 ${
                      selectedSource === 'salesforce'
                        ? 'border-[var(--sf-blue)] bg-white shadow-sm'
                        : 'border-[#D8DDE6] bg-white hover:border-[#B0B0B0]'
                    }`}
                  >
                    {selectedSource === 'salesforce' && (
                      <div className="absolute top-0 right-0 w-7 h-7 bg-[var(--sf-blue)] flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                        <Check className="w-3 h-3 text-white absolute top-0.5 right-0.5" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedSource === 'salesforce' ? 'bg-[#EEF4FF]' : 'bg-[#F3F3F3]'}`}>
                      <svg viewBox="0 0 32 32" className="w-7 h-7">
                        <circle cx="16" cy="16" r="14" fill={selectedSource === 'salesforce' ? '#0070D2' : '#B0B0B0'} />
                        <text x="16" y="21" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontStyle="italic">sf</text>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[var(--sf-text-primary)]">Salesforce CRM</span>
                    <span className="text-xs text-[var(--sf-text-tertiary)] mt-1">Connect to standard and custom Salesforce objects</span>
                  </button>

                  {/* Informatica MDM — orange highlighted */}
                  <button
                    onClick={() => setSelectedSource('informatica')}
                    className={`relative flex flex-col items-center justify-center h-44 rounded-lg border-2 transition-all text-center px-4 ${
                      selectedSource === 'informatica'
                        ? 'border-[#FF4A00] bg-[#FFF8F5] shadow-sm'
                        : 'border-[#FF4A00]/40 bg-[#FFF8F5] hover:border-[#FF4A00]'
                    }`}
                  >
                    {selectedSource === 'informatica' && (
                      <div className="absolute top-0 right-0 w-7 h-7 bg-[#FF4A00] flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                        <Check className="w-3 h-3 text-white absolute top-0.5 right-0.5" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-[#FFF3ED]">
                      <svg viewBox="0 0 32 32" className="w-7 h-7">
                        <rect x="4" y="4" width="24" height="24" rx="4" fill="#FF4A00" />
                        <text x="16" y="21" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">INFA</text>
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#FF4A00]">Informatica MDM</span>
                    <span className="text-xs text-[#D95800] mt-1">Connect to Informatica MDM business entities</span>
                    <span className="mt-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#FF4A00] text-white rounded">New</span>
                  </button>
                </div>
              )}

              {/* Step 2: Configuration — Salesforce */}
              {newModalStep === 2 && selectedSource === 'salesforce' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-[#E1F5FE] rounded-lg">
                    <Info className="w-5 h-5 text-[var(--sf-blue)] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[var(--sf-text-secondary)]">
                      Select the Salesforce objects you want to stream into Data Cloud. Objects will be synced according to the refresh frequency you configure.
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Connected Org</label>
                    <select className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded bg-white focus:outline-none">
                      <option>Data Cloud SG (Home)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Salesforce Object</label>
                    <select className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded bg-white focus:outline-none">
                      <option>Account</option>
                      <option>Contact</option>
                      <option>Lead</option>
                      <option>Opportunity</option>
                      <option>Case</option>
                      <option>Campaign</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Refresh Frequency</label>
                    <select className="w-full px-3 py-2 text-sm border border-[var(--sf-border)] rounded bg-white focus:outline-none">
                      <option>Every 1 hour</option>
                      <option>Every 6 hours</option>
                      <option>Every 12 hours</option>
                      <option>Daily</option>
                      <option>Manual</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Configuration — Informatica bundles grid */}
              {newModalStep === 2 && selectedSource === 'informatica' && (
                <div className="space-y-4">
                  {/* Tenant selector */}
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">Informatica Tenant</label>
                      <select
                        value={selectedTenant}
                        onChange={(e) => setSelectedTenant(e.target.value)}
                        className="px-3 py-2 text-sm border border-[#FF4A00]/40 rounded bg-[#FFF8F5] text-[#FF4A00] font-medium focus:outline-none focus:border-[#FF4A00] focus:ring-1 focus:ring-[#FF4A00]/20"
                      >
                        <option value="USA-1">USA-1</option>
                        <option value="Europe-1">Europe-1</option>
                        <option value="APAC-1">APAC-1</option>
                      </select>
                    </div>
                    <div className="ml-auto text-xs text-[var(--sf-text-tertiary)]">
                      {selectedBundles.size} bundle{selectedBundles.size !== 1 ? 's' : ''} selected
                    </div>
                  </div>

                  {/* Bundles grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {informaticaBundles.map((bundle) => {
                      const isSelected = selectedBundles.has(bundle.id);
                      return (
                        <button
                          key={bundle.id}
                          onClick={() => toggleBundle(bundle.id)}
                          className={`relative text-left rounded-lg border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-[#FF4A00] bg-[#FFF8F5] shadow-sm'
                              : 'border-[var(--sf-border)] bg-white hover:border-[#FF4A00]/50'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-6 h-6 bg-[#FF4A00] flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
                              <Check className="w-2.5 h-2.5 text-white absolute top-0.5 right-0.5" />
                            </div>
                          )}
                          <div className="flex items-center gap-3 mb-2">
                            {/* Orange diamond icon */}
                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                              <svg viewBox="0 0 24 24" className="w-6 h-6">
                                <path d="M12 2 L22 12 L12 22 L2 12 Z" fill={isSelected ? '#FF4A00' : '#FFB088'} />
                                <text x="12" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{bundle.objectCount}</text>
                              </svg>
                            </div>
                            <div>
                              <div className={`text-sm font-semibold ${isSelected ? 'text-[#FF4A00]' : 'text-[var(--sf-text-primary)]'}`}>{bundle.name}</div>
                              <div className="text-[10px] text-[var(--sf-text-tertiary)]">{bundle.objectCount} objects</div>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed">{bundle.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {newModalStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-[#E1F5FE] rounded-lg">
                    <Info className="w-5 h-5 text-[var(--sf-blue)] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[var(--sf-text-secondary)]">
                      Review the details below and click <strong>Create</strong> to set up your data stream{selectedBundles.size > 1 ? 's' : ''}.
                    </div>
                  </div>
                  <div className="sf-card">
                    <div className="sf-detail-grid">
                      <div className="sf-detail-field">
                        <div className="sf-detail-label">Source</div>
                        <div className="sf-detail-value font-medium">{selectedSource === 'informatica' ? 'Informatica MDM' : 'Salesforce CRM'}</div>
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
                              <div className="flex flex-wrap gap-1">
                                {Array.from(selectedBundles).map((id) => {
                                  const bundle = informaticaBundles.find((b) => b.id === id);
                                  return bundle ? (
                                    <span key={id} className="px-2 py-0.5 text-xs font-medium bg-[#FFF3ED] text-[#FF4A00] rounded">{bundle.name}</span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="sf-detail-field">
                        <div className="sf-detail-label">Data Space</div>
                        <div className="sf-detail-value">default</div>
                      </div>
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
            </div>

            {/* Footer with step indicator */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--sf-border)] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      s < newModalStep ? 'bg-[var(--sf-success)] text-white' :
                      s === newModalStep ? 'bg-[var(--sf-blue)] text-white' :
                      'bg-[#E5E5E5] text-[var(--sf-text-tertiary)]'
                    }`}>
                      {s < newModalStep ? <Check className="w-3 h-3" /> : s}
                    </div>
                    {s < 3 && <div className={`w-6 h-0.5 ${s < newModalStep ? 'bg-[var(--sf-success)]' : 'bg-[#E5E5E5]'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {newModalStep === 1 ? (
                  <>
                    <button onClick={() => setNewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Cancel</button>
                    <button
                      onClick={handleNewNext}
                      disabled={!selectedSource}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                ) : newModalStep === 2 ? (
                  <>
                    <button onClick={handleNewBack} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Back</button>
                    <button
                      onClick={handleNewNext}
                      disabled={selectedSource === 'informatica' && selectedBundles.size === 0}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleNewBack} className="px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] border border-[var(--sf-border)] rounded hover:bg-[#F3F3F3]">Back</button>
                    <button
                      onClick={handleCreateStreams}
                      className="px-5 py-2 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)]"
                    >
                      Create
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
