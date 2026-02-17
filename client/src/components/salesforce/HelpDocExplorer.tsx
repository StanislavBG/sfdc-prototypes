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
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#032D60] flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--sf-text-primary)]">
              Salesforce Help Documents
            </h1>
            <p className="text-xs text-[var(--sf-text-tertiary)]">
              Upload MHTML files to index and search Salesforce documentation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--sf-text-tertiary)]">
            {docs.length} document{docs.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              // Run diagnose without file to check env
              runDiagnose(null);
            }}
            disabled={diagRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#54698D] rounded hover:bg-[#4a5f7d] disabled:opacity-50 transition-colors"
            title="Run pipeline diagnostics"
          >
            {diagRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Stethoscope className="w-3.5 h-3.5" />
            )}
            Diagnose
          </button>
          <input
            ref={diagFileRef}
            type="file"
            accept=".mhtml,.mht"
            className="hidden"
            onChange={(e) => {
              runDiagnose(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => diagFileRef.current?.click()}
            disabled={diagRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#54698D] rounded hover:bg-[#4a5f7d] disabled:opacity-50 transition-colors"
            title="Diagnose with a file upload"
          >
            {diagRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Stethoscope className="w-3.5 h-3.5" />
            )}
            Diagnose with File
          </button>
        </div>
      </div>

      {/* Diagnostic results */}
      {diagSteps && (
        <div className="sf-card overflow-hidden">
          <div className="sf-card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--sf-text-primary)] flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4" />
              Pipeline Diagnostics
            </h2>
            <button
              onClick={() => { setDiagSteps(null); setDiagContentPreview(null); }}
              className="p-1 rounded hover:bg-[#E5E5E5] text-[var(--sf-text-tertiary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {diagSteps.map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2.5 rounded border text-xs ${
                  s.status === 'ok'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {s.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold">{s.step}:</span>{' '}
                  <span className={s.status === 'ok' ? 'text-green-800' : 'text-red-800'}>
                    {s.detail}
                  </span>
                </div>
              </div>
            ))}
            {diagContentPreview && (
              <div className="mt-3 p-3 bg-[#FAFAF9] rounded border border-[var(--sf-border-light)] text-xs text-[var(--sf-text-secondary)] whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                <div className="text-xs font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                  Parsed Content Preview
                </div>
                {diagContentPreview}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* ---- Left 2/3: Drop zone + Document table ---- */}
        <div className="col-span-2 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`sf-card flex flex-col items-center justify-center py-8 cursor-pointer transition-all border-2 border-dashed ${
              dragOver
                ? 'border-[var(--sf-blue)] bg-[#EEF4FF]'
                : 'border-[var(--sf-border)] hover:border-[var(--sf-blue-light)] hover:bg-[#F9FAFF]'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".mhtml,.mht"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[var(--sf-blue)] animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-[var(--sf-text-tertiary)] mb-2" />
            )}
            <span className="text-sm font-medium text-[var(--sf-text-primary)]">
              {uploading ? 'Processing...' : 'Drop MHTML files here or click to browse'}
            </span>
            <span className="text-xs text-[var(--sf-text-tertiary)] mt-1">
              Accepts .mhtml and .mht files up to 20 MB
            </span>
          </div>

          {uploadError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {uploadError}
            </div>
          )}

          {deleteError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              Delete failed: {deleteError}
            </div>
          )}

          {republishResult && (
            <div className={`text-xs rounded px-3 py-2 border ${
              republishResult.startsWith('Error')
                ? 'text-red-600 bg-red-50 border-red-200'
                : 'text-green-700 bg-green-50 border-green-200'
            }`}>
              {republishResult}
            </div>
          )}

          {/* Document table */}
          <div className="sf-card overflow-hidden">
            <div className="sf-card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                Indexed Documents
              </h2>
              {docsLoading && (
                <Loader2 className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)] animate-spin" />
              )}
            </div>
            {docs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--sf-text-tertiary)]">
                No documents uploaded yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--sf-border-light)] bg-[#FAFAF9]">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide">
                      Id
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide">
                      File Name
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide">
                      Chunks
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sf-border-light)]">
                  {docs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-[#F3F3F3] transition-colors"
                    >
                      <td className="px-4 py-2.5 text-[var(--sf-text-tertiary)] tabular-nums">
                        {doc.id}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[var(--sf-blue)] flex-shrink-0" />
                          <span className="text-[var(--sf-link)] font-medium truncate max-w-[300px]">
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={doc.chunkCount === 0 ? 'text-[var(--sf-warning)] font-medium' : 'text-[var(--sf-text-tertiary)]'}>
                          {doc.chunkCount}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.chunkCount === 0 && (
                            <button
                              onClick={() => republishDoc(doc.id)}
                              disabled={republishing === doc.id}
                              className="p-1.5 rounded hover:bg-[#EEF4FF] text-[var(--sf-warning)] hover:text-[var(--sf-blue)] transition-colors disabled:opacity-50"
                              title="Re-publish (re-chunk and re-embed)"
                            >
                              {republishing === doc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openPreview(doc.id)}
                            className="p-1.5 rounded hover:bg-[#E5E5E5] text-[var(--sf-text-tertiary)] hover:text-[var(--sf-blue)] transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDoc(doc.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-[var(--sf-text-tertiary)] hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="space-y-4">
          {/* Search */}
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
                Semantic Search
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search help documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  className="flex-1 px-3 py-1.5 text-sm border border-[var(--sf-border)] rounded focus:border-[var(--sf-blue)] focus:ring-1 focus:ring-[var(--sf-blue)] outline-none"
                />
                <button
                  onClick={runSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--sf-blue)] rounded hover:bg-[var(--sf-blue-hover)] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {searching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <div
                      key={r.id}
                      className="p-3 rounded border border-[var(--sf-border-light)] hover:border-[var(--sf-blue-light)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--sf-blue)]">
                          {(r.metadata as any)?.file_name || `Result ${i + 1}`}
                        </span>
                        <span className="text-xs text-[var(--sf-text-tertiary)]">
                          {(r.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-[var(--sf-text-secondary)] line-clamp-4">
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
              <div className="sf-card-header flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--sf-text-primary)] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </h2>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1 rounded hover:bg-[#E5E5E5] text-[var(--sf-text-tertiary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-[var(--sf-blue)] animate-spin" />
                  </div>
                ) : preview ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                        File Name
                      </div>
                      <div className="text-sm text-[var(--sf-text-primary)] font-medium">
                        {preview.fileName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1">
                        Content
                      </div>
                      <div className="text-xs text-[var(--sf-text-secondary)] max-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed bg-[#FAFAF9] rounded p-3 border border-[var(--sf-border-light)]">
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
