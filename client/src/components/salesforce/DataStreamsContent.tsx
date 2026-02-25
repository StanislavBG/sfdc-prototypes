import { useState } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  X,
  Check,
  Info,
  Database,
  RefreshCw,
  ArrowRight,
  Filter,
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

// ── Component ────────────────────────────────────────────────────────
export default function DataStreamsContent() {
  const [dataStreams, setDataStreams] = useState<DataStream[]>(mockDataStreams);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

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
          });
        }
      });
      setDataStreams((prev) => [...prev, ...newStreams]);
    }
    setNewModalOpen(false);
  };

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
                    <tr key={ds.id}>
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
