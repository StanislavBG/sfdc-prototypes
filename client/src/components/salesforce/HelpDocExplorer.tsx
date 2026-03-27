import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  Search,
  Trash2,
  FileText,
  Loader2,
  X,
  Eye,
  Database,
  RefreshCw,
  Stethoscope,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpDoc {
  id: number;
  fileName: string;
  createdAt: string | null;
  chunkCount: number;
}

interface HelpDocFull {
  id: number;
  fileName: string;
  content: string;
  createdAt: string | null;
}

interface SearchResult {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

interface DiagStep {
  step: string;
  status: 'ok' | 'error';
  detail: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HelpDocExplorer() {
  // Documents
  const [docs, setDocs] = useState<HelpDoc[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const diagFileRef = useRef<HTMLInputElement>(null);

  // Preview
  const [preview, setPreview] = useState<HelpDocFull | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Diagnostics
  const [diagSteps, setDiagSteps] = useState<DiagStep[] | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagContentPreview, setDiagContentPreview] = useState<string | null>(null);

  // Republish
  const [republishing, setRepublishing] = useState<number | null>(null);
  const [republishResult, setRepublishResult] = useState<string | null>(null);

  // ------ Data fetching ------

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('/api/help-documents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDocs(data);
      }
      setDocsLoaded(true);
    } catch {
      setDocsLoaded(true);
    }
    setDocsLoading(false);
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // ------ Upload ------

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/help-documents/upload', {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          let message = 'Upload failed';
          try {
            const err = await res.json();
            message = err.message || message;
          } catch {
            // Server returned non-JSON (e.g. plain text "Internal Server Error")
          }
          throw new Error(message);
        }
      } catch (err: any) {
        setUploadError(err.message);
      }
    }

    setUploading(false);
    loadDocs();
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ------ Preview ------

  const openPreview = async (id: number) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/help-documents/${id}`);
      const data: HelpDocFull = await res.json();
      setPreview(data);
    } catch {
      /* ignore */
    }
    setPreviewLoading(false);
  };

  // ------ Delete ------

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteDoc = async (id: number) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/help-documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Delete failed (${res.status})`);
      }
      if (preview?.id === id) setPreview(null);
      await loadDocs();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete document');
    }
  };

  // ------ Diagnose ------

  const runDiagnose = async (files: FileList | null) => {
    setDiagRunning(true);
    setDiagSteps(null);
    setDiagContentPreview(null);

    const form = new FormData();
    if (files && files.length > 0) {
      form.append('file', files[0]);
    }

    try {
      const res = await fetch('/api/help-documents/diagnose', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      setDiagSteps(data.steps || []);
      setDiagContentPreview(data.contentPreview || null);
    } catch (err: any) {
      setDiagSteps([{ step: 'Request failed', status: 'error', detail: err.message }]);
    }
    setDiagRunning(false);
  };

  // ------ Republish ------

  const republishDoc = async (id: number) => {
    setRepublishing(id);
    setRepublishResult(null);

    try {
      const res = await fetch(`/api/help-documents/${id}/republish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Republish failed');
      const msg = `Stored ${data.chunksStored}/${data.totalChunks} chunks`;
      setRepublishResult(data.errors ? `${msg} | Errors: ${data.errors.join('; ')}` : msg);
      await loadDocs();
    } catch (err: any) {
      setRepublishResult(`Error: ${err.message}`);
    }
    setRepublishing(null);
  };

  // ------ Search ------

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await apiRequest('POST', '/api/help-documents/search', {
        query: searchQuery,
        limit: 10,
      });
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
    } catch {
      /* ignore */
    }
    setSearching(false);
  };

  // ------ Render ------

  return (
    <div className="slds-p-around_large" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header row */}
      <div className="slds-grid slds-grid_vertical-align-center slds-grid_align-spread">
        <div className="slds-grid slds-grid_vertical-align-center slds-gap_small">
          <div className="slds-flex slds-items-center slds-justify-center slds-border-radius_large" style={{ width: '36px', height: '36px', background: 'var(--slds-g-color-brand-1)' }}>
            <Database className="slds-square_x-small slds-text-white" />
          </div>
          <div>
            <h1 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">
              Salesforce Help Documents
            </h1>
            <p className="slds-text-size_small slds-text-neutral-7">
              Upload documents to index and search (PDF, MHTML, CSV, Markdown, text)
            </p>
          </div>
        </div>
        <div className="slds-grid slds-grid_vertical-align-center slds-gap_x-small">
          <span className="slds-text-size_small slds-text-neutral-7">
            {docs.length} document{docs.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => runDiagnose(null)}
            disabled={diagRunning}
            className="sf-btn sf-btn-neutral"
            title="Run pipeline diagnostics"
          >
            {diagRunning ? (
              <Loader2 className="slds-icon-size_x-small sf-spin" />
            ) : (
              <Stethoscope className="slds-icon-size_x-small" />
            )}
            Diagnose
          </button>
          <input
            ref={diagFileRef}
            type="file"
            accept=".pdf,.mhtml,.mht,.csv,.tsv,.md,.markdown,.txt,.text,.html,.htm,.json,.xml,.log"
            className="sf-hidden"
            onChange={(e) => {
              runDiagnose(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => diagFileRef.current?.click()}
            disabled={diagRunning}
            className="sf-btn sf-btn-neutral"
            title="Diagnose with a file upload"
          >
            {diagRunning ? (
              <Loader2 className="slds-icon-size_x-small sf-spin" />
            ) : (
              <Stethoscope className="slds-icon-size_x-small" />
            )}
            Diagnose with File
          </button>
        </div>
      </div>

      {/* Diagnostic results */}
      {diagSteps && (
        <div className="sf-card slds-overflow-hidden">
          <div className="sf-card-header">
            <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-grid slds-grid_vertical-align-center slds-gap_xx-small">
              <Stethoscope className="slds-icon-size_small" />
              Pipeline Diagnostics
            </h2>
            <button
              onClick={() => { setDiagSteps(null); setDiagContentPreview(null); }}
              className="sf-action-btn"
            >
              <X className="slds-icon-size_x-small" />
            </button>
          </div>
          <div className="slds-p-around_medium" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diagSteps.map((s, i) => (
              <div
                key={i}
                className={`slds-grid slds-grid_vertical-align-start slds-gap_x-small slds-p-around_x-small slds-border-radius_small slds-text-size_small ${
                  s.status === 'ok' ? 'sf-status-ok' : 'sf-status-error'
                }`}
              >
                {s.status === 'ok' ? (
                  <CheckCircle2 className="slds-icon-size_small sf-status-ok-icon slds-flex-shrink-0" style={{ marginTop: '2px' }} />
                ) : (
                  <XCircle className="slds-icon-size_small sf-status-error-icon slds-flex-shrink-0" style={{ marginTop: '2px' }} />
                )}
                <div>
                  <span className="slds-font-weight_semibold">{s.step}:</span>{' '}
                  <span className={s.status === 'ok' ? 'sf-status-ok-text' : 'sf-status-error-text'}>
                    {s.detail}
                  </span>
                </div>
              </div>
            ))}
            {diagContentPreview && (
              <div className="slds-m-top_small slds-p-around_small slds-border-radius_small slds-text-size_small slds-text-neutral-9" style={{ background: '#FAFAF9', border: '1px solid var(--slds-g-color-border-2)', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                <div className="slds-text-size_small slds-font-weight_semibold slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xxx-small">
                  Parsed Content Preview
                </div>
                {diagContentPreview}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="slds-css-grid slds-css-grid-cols-3 slds-gap_large">
        {/* ---- Left 2/3: Drop zone + Document table ---- */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`sf-card sf-dropzone ${dragOver ? 'drag-over' : ''}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.mhtml,.mht,.csv,.tsv,.md,.markdown,.txt,.text,.html,.htm,.json,.xml,.log"
              multiple
              className="sf-hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <Upload className="slds-square_large slds-text-brand sf-spin slds-m-bottom_x-small" />
            ) : (
              <Upload className="slds-square_large slds-text-neutral-7 slds-m-bottom_x-small" />
            )}
            <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">
              {uploading ? 'Processing...' : 'Drop files here or click to browse'}
            </span>
            <span className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
              PDF, MHTML, CSV, Markdown, plain text — up to 50 MB
            </span>
          </div>

          {uploadError && (
            <div className="sf-alert-error">{uploadError}</div>
          )}

          {deleteError && (
            <div className="sf-alert-error">Delete failed: {deleteError}</div>
          )}

          {republishResult && (
            <div className={republishResult.startsWith('Error') ? 'sf-alert-error' : 'sf-alert-success'}>
              {republishResult}
            </div>
          )}

          {/* Document table */}
          <div className="sf-card slds-overflow-hidden">
            <div className="sf-card-header">
              <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
                Indexed Documents
              </h2>
              {docsLoading && (
                <Loader2 className="slds-icon-size_x-small slds-text-neutral-7 sf-spin" />
              )}
            </div>
            {docs.length === 0 ? (
              <div className="slds-p-horizontal_medium slds-p-vertical_x-large slds-text-center slds-text-size_medium slds-text-neutral-7">
                No documents uploaded yet
              </div>
            ) : (
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>File Name</th>
                    <th>Chunks</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="sf-tabular-nums" style={{ color: 'var(--slds-g-color-neutral-7)' }}>
                        {doc.id}
                      </td>
                      <td>
                        <div className="slds-grid slds-grid_vertical-align-center slds-gap_x-small">
                          <FileText className="slds-icon-size_small slds-text-brand slds-flex-shrink-0" />
                          <span className="slds-text-brand slds-font-weight_medium slds-truncate" style={{ maxWidth: '300px' }}>
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={doc.chunkCount === 0 ? 'slds-text-warning slds-font-weight_medium' : 'slds-text-neutral-7'}>
                          {doc.chunkCount}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="slds-grid slds-grid_vertical-align-center slds-grid_align-end slds-gap_xx-small">
                          {doc.chunkCount === 0 && (
                            <button
                              onClick={() => republishDoc(doc.id)}
                              disabled={republishing === doc.id}
                              className="sf-action-btn sf-action-btn-warning"
                              title="Re-publish (re-chunk and re-embed)"
                            >
                              {republishing === doc.id ? (
                                <Loader2 className="slds-icon-size_small sf-spin" />
                              ) : (
                                <RefreshCw className="slds-icon-size_small" style={{ color: 'var(--slds-g-color-warning-1)' }} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openPreview(doc.id)}
                            className="sf-action-btn"
                            title="Preview"
                          >
                            <Eye className="slds-icon-size_small" />
                          </button>
                          <button
                            onClick={() => deleteDoc(doc.id)}
                            className="sf-action-btn sf-action-btn-danger"
                            title="Delete"
                          >
                            <Trash2 className="slds-icon-size_small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ---- Right 1/3: Search + Preview ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search */}
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
                Semantic Search
              </h2>
            </div>
            <div className="slds-p-around_medium" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="slds-grid slds-gap_x-small">
                <input
                  type="text"
                  placeholder="Search help documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  className="sf-input slds-col"
                />
                <button
                  onClick={runSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="sf-btn sf-btn-brand"
                >
                  {searching ? (
                    <Loader2 className="slds-icon-size_x-small sf-spin" />
                  ) : (
                    <Search className="slds-icon-size_x-small" />
                  )}
                </button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {searchResults.map((r, i) => (
                    <div
                      key={r.id}
                      className="slds-p-around_small slds-border-radius_small slds-border_all slds-border-color_border-2 slds-hover-border-brand-2 slds-transition-colors"
                    >
                      <div className="slds-grid slds-grid_vertical-align-center slds-grid_align-spread slds-m-bottom_xxx-small">
                        <span className="slds-text-size_small slds-font-weight_medium slds-text-brand">
                          {(r.metadata as any)?.file_name || `Result ${i + 1}`}
                        </span>
                        <span className="slds-text-size_small slds-text-neutral-7">
                          {(r.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="slds-text-size_small slds-text-neutral-9 sf-line-clamp-4">
                        {r.content.slice(0, 300)}
                        {r.content.length > 300 ? '...' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview panel */}
          {(preview || previewLoading) && (
            <div className="sf-card">
              <div className="sf-card-header">
                <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-grid slds-grid_vertical-align-center slds-gap_xx-small">
                  <Eye className="slds-icon-size_x-small" />
                  Preview
                </h2>
                <button
                  onClick={() => setPreview(null)}
                  className="sf-action-btn"
                >
                  <X className="slds-icon-size_x-small" />
                </button>
              </div>
              <div className="slds-p-around_medium">
                {previewLoading ? (
                  <div className="slds-grid slds-grid_vertical-align-center slds-grid_align-center slds-p-vertical_large">
                    <Loader2 className="slds-square_x-small slds-text-brand sf-spin" />
                  </div>
                ) : preview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xxx-small">
                        File Name
                      </div>
                      <div className="slds-text-size_medium slds-text-neutral-base slds-font-weight_medium">
                        {preview.fileName}
                      </div>
                    </div>
                    <div>
                      <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide slds-m-bottom_xxx-small">
                        Content
                      </div>
                      <div className="slds-text-size_small slds-text-neutral-9 slds-leading-relaxed slds-border-radius_small slds-p-around_small" style={{ maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', background: '#FAFAF9', border: '1px solid var(--slds-g-color-border-2)' }}>
                        {preview.content.slice(0, 5000)}
                        {preview.content.length > 5000 ? '\n\n... (truncated)' : ''}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
