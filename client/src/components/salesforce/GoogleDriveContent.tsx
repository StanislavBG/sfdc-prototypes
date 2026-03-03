import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  Folder,
  FolderPlus,
  FileText,
  FileImage,
  FileCode,
  FileSpreadsheet,
  File,
  Trash2,
  Star,
  Loader2,
  X,
  Eye,
  ChevronRight,
  HardDrive,
  Grid3X3,
  List,
  Search,
  MoreVertical,
  Download,
  Pencil,
  FolderOpen,
  Home,
  ArrowLeft,
  Plus,
  Clock,
  StarOff,
  ClipboardPaste,
  ChevronDown,
  FilePlus2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriveFile {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  isFolder: boolean;
  parentId: number | null;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DriveFileFull extends DriveFile {
  content: string | null;
}

type ViewMode = 'grid' | 'list';
type SidebarView = 'my-drive' | 'starred' | 'recent';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(file: DriveFile) {
  if (file.isFolder) return <Folder className="w-5 h-5" style={{ color: '#5F6368' }} />;

  const name = file.name.toLowerCase();
  const mime = file.mimeType;

  if (mime.startsWith('image/')) return <FileImage className="w-5 h-5" style={{ color: '#EA4335' }} />;
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return <FileText className="w-5 h-5" style={{ color: '#EA4335' }} />;
  if (mime.includes('spreadsheet') || mime === 'text/csv' || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className="w-5 h-5" style={{ color: '#0F9D58' }} />;
  if (mime.includes('javascript') || mime.includes('typescript') || mime.includes('json') || mime.includes('xml') || mime.includes('yaml') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.json') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.go') || name.endsWith('.rs') || name.endsWith('.cpp') || name.endsWith('.c') || name.endsWith('.rb')) return <FileCode className="w-5 h-5" style={{ color: '#4285F4' }} />;
  if (mime.startsWith('text/') || name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.mhtml') || name.endsWith('.mht')) return <FileText className="w-5 h-5" style={{ color: '#4285F4' }} />;

  return <File className="w-5 h-5" style={{ color: '#5F6368' }} />;
}

function getLargeFileIcon(file: DriveFile) {
  if (file.isFolder) return <FolderOpen className="w-12 h-12" style={{ color: '#5F6368' }} />;

  const name = file.name.toLowerCase();
  const mime = file.mimeType;

  if (mime.startsWith('image/')) return <FileImage className="w-12 h-12" style={{ color: '#EA4335' }} />;
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return <FileText className="w-12 h-12" style={{ color: '#EA4335' }} />;
  if (mime.includes('spreadsheet') || name.endsWith('.csv') || name.endsWith('.xlsx')) return <FileSpreadsheet className="w-12 h-12" style={{ color: '#0F9D58' }} />;
  if (mime.includes('javascript') || mime.includes('json') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.json') || name.endsWith('.html') || name.endsWith('.css')) return <FileCode className="w-12 h-12" style={{ color: '#4285F4' }} />;
  if (mime.startsWith('text/') || name.endsWith('.md') || name.endsWith('.txt')) return <FileText className="w-12 h-12" style={{ color: '#4285F4' }} />;

  return <File className="w-12 h-12" style={{ color: '#5F6368' }} />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GoogleDriveContent() {
  // Files state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Navigation
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: 'My Drive' },
  ]);
  const [sidebarView, setSidebarView] = useState<SidebarView>('my-drive');

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Preview
  const [preview, setPreview] = useState<DriveFileFull | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Rename
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // New folder
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ fileId: number; x: number; y: number } | null>(null);

  // New menu (dropdown from New button)
  const [showNewMenu, setShowNewMenu] = useState(false);

  // Paste-to-file modal
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteFileName, setPasteFileName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteSaving, setPasteSaving] = useState(false);

  // Errors
  const [error, setError] = useState<string | null>(null);

  // ------ Data fetching ------

  const loadFiles = useCallback(async (parentId: number | null = currentFolderId) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/drive/files';
      const params = new URLSearchParams();

      if (sidebarView === 'starred') {
        params.set('starred', 'true');
      } else if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      } else if (parentId !== null) {
        params.set('parentId', String(parentId));
      }

      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setFiles(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    }
    setLoading(false);
  }, [currentFolderId, sidebarView, searchQuery]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ------ Navigation ------

  const navigateToFolder = (folderId: number | null, folderName: string) => {
    if (sidebarView !== 'my-drive') {
      setSidebarView('my-drive');
    }
    setSearchQuery('');
    setIsSearching(false);
    setPreview(null);

    if (folderId === null) {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
    } else {
      setCurrentFolderId(folderId);
      const existingIdx = breadcrumbs.findIndex(b => b.id === folderId);
      if (existingIdx >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIdx + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
    } else {
      openPreview(file.id);
    }
  };

  // ------ Upload ------

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      for (const f of Array.from(fileList)) {
        form.append('files', f);
      }
      if (currentFolderId !== null) {
        form.append('parentId', String(currentFolderId));
      }

      const res = await fetch('/api/drive/files/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message);
      }
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleUpload(e.dataTransfer.files);
    },
    [currentFolderId],
  );

  // ------ Create Folder ------

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: currentFolderId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to create folder' }));
        throw new Error(err.message);
      }
      setShowNewFolder(false);
      setNewFolderName('');
      await loadFiles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ------ Preview ------

  const openPreview = async (id: number) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/drive/files/${id}`);
      const data: DriveFileFull = await res.json();
      setPreview(data);
    } catch {
      /* ignore */
    }
    setPreviewLoading(false);
  };

  // ------ Delete ------

  const deleteFile = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`/api/drive/files/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      if (preview?.id === id) setPreview(null);
      await loadFiles();
    } catch (err: any) {
      setError(err.message);
    }
    setContextMenu(null);
  };

  // ------ Star ------

  const toggleStar = async (id: number) => {
    try {
      await fetch(`/api/drive/files/${id}/star`, { method: 'POST' });
      await loadFiles();
    } catch { /* ignore */ }
    setContextMenu(null);
  };

  // ------ Rename ------

  const startRename = (file: DriveFile) => {
    setRenaming(file.id);
    setRenameValue(file.name);
    setContextMenu(null);
  };

  const submitRename = async (id: number) => {
    if (!renameValue.trim()) {
      setRenaming(null);
      return;
    }
    try {
      await fetch(`/api/drive/files/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      await loadFiles();
    } catch { /* ignore */ }
    setRenaming(null);
  };

  // ------ Download ------

  const downloadFile = (id: number, name: string) => {
    const link = document.createElement('a');
    link.href = `/api/drive/files/${id}/download`;
    link.download = name;
    link.click();
    setContextMenu(null);
  };

  // ------ Search ------

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      loadFiles();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  // ------ Paste-to-file ------

  const openPasteModal = () => {
    setShowPasteModal(true);
    setPasteFileName('');
    setPasteContent('');
    setPasteSaving(false);
    setShowNewMenu(false);
  };

  const saveTextFile = async () => {
    if (!pasteFileName.trim() || !pasteContent.trim()) return;
    setPasteSaving(true);
    setError(null);
    try {
      // Auto-append .txt if no extension
      let name = pasteFileName.trim();
      if (!name.includes('.')) {
        name += '.txt';
      }

      const res = await fetch('/api/drive/files/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          content: pasteContent,
          parentId: currentFolderId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Save failed' }));
        throw new Error(err.message);
      }
      setShowPasteModal(false);
      setPasteFileName('');
      setPasteContent('');
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to save file');
    }
    setPasteSaving(false);
  };

  // Separate folders and files
  const folders = files.filter(f => f.isFolder);
  const regularFiles = files.filter(f => !f.isFolder);

  // ------ Render ------

  return (
    <div
      className="h-full flex"
      onClick={() => { setContextMenu(null); setShowNewMenu(false); }}
    >
      {/* ---- Drive sidebar ---- */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--slds-g-color-border-2)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* New button with dropdown */}
        <div style={{ padding: '16px 16px 8px', position: 'relative' }}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="sf-btn sf-btn-brand"
            style={{ width: '100%', gap: 8, justifyContent: 'center', borderRadius: 24, height: 40, fontSize: 14, fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            New
            <ChevronDown className="w-3.5 h-3.5" style={{ marginLeft: 2 }} />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sf-hidden"
            onChange={(e) => { handleUpload(e.target.files); setShowNewMenu(false); }}
          />

          {/* New menu dropdown */}
          {showNewMenu && (
            <div
              className="sf-drive-context-menu"
              style={{ position: 'absolute', top: '100%', left: 16, right: 16, marginTop: 4, zIndex: 50 }}
            >
              <button onClick={() => { fileRef.current?.click(); }}>
                <Upload className="w-4 h-4" /> Upload file
              </button>
              <button onClick={() => { setShowNewFolder(true); setShowNewMenu(false); }}>
                <FolderPlus className="w-4 h-4" /> New folder
              </button>
              <div style={{ height: 1, background: 'var(--slds-g-color-border-2)', margin: '4px 0' }} />
              <button onClick={openPasteModal}>
                <ClipboardPaste className="w-4 h-4" /> Paste text to file
              </button>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => {
              setSidebarView('my-drive');
              setCurrentFolderId(null);
              setBreadcrumbs([{ id: null, name: 'My Drive' }]);
              setSearchQuery('');
              setIsSearching(false);
            }}
            className={`sf-drive-nav-item ${sidebarView === 'my-drive' ? 'active' : ''}`}
          >
            <HardDrive className="w-4 h-4" />
            My Drive
          </button>
          <button
            onClick={() => {
              setSidebarView('starred');
              setSearchQuery('');
              setIsSearching(false);
              setPreview(null);
            }}
            className={`sf-drive-nav-item ${sidebarView === 'starred' ? 'active' : ''}`}
          >
            <Star className="w-4 h-4" />
            Starred
          </button>
        </nav>

        {/* Storage info */}
        <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--slds-g-color-border-2)' }}>
          <div className="slds-text-size_small slds-text-neutral-7">
            {files.length} item{files.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ---- Main content area ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#F8F9FA' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--slds-g-color-border-2)', background: '#fff' }}>
          {/* Breadcrumbs / title */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            {isSearching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={clearSearch} className="sf-action-btn"><ArrowLeft className="w-4 h-4" /></button>
                <span className="slds-text-size_medium slds-font-weight_semibold">
                  Search results for "{searchQuery}"
                </span>
              </div>
            ) : sidebarView === 'starred' ? (
              <span className="slds-text-size_medium slds-font-weight_semibold slds-flex slds-items-center" style={{ gap: 8 }}>
                <Star className="w-4 h-4" style={{ color: '#FBBC04' }} />
                Starred
              </span>
            ) : (
              breadcrumbs.map((bc, i) => (
                <span key={bc.id ?? 'root'} className="slds-flex slds-items-center" style={{ gap: 4 }}>
                  {i > 0 && <ChevronRight className="w-3 h-3 slds-text-neutral-7" />}
                  <button
                    onClick={() => navigateToFolder(bc.id, bc.name)}
                    className={`slds-text-size_medium ${i === breadcrumbs.length - 1 ? 'slds-font-weight_semibold slds-text-neutral-base' : 'slds-text-neutral-7 hover:slds-text-brand'}`}
                    style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '2px 4px', borderRadius: 4 }}
                  >
                    {i === 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><HardDrive className="w-4 h-4" />{bc.name}</span> : bc.name}
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative' }}>
              <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--slds-g-color-neutral-7)' }} />
              <input
                type="text"
                placeholder="Search in Drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sf-input"
                style={{ paddingLeft: 32, width: 240, height: 36, borderRadius: 24, fontSize: 13 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <X className="w-3 h-3 slds-text-neutral-7" />
                </button>
              )}
            </div>
          </form>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--slds-g-color-neutral-2)', borderRadius: 6, padding: 2 }}>
            <button
              onClick={() => setViewMode('grid')}
              className="sf-action-btn"
              style={{ background: viewMode === 'grid' ? '#fff' : 'transparent', borderRadius: 4, boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="sf-action-btn"
              style={{ background: viewMode === 'list' ? '#fff' : 'transparent', borderRadius: 4, boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New folder */}
          <button
            onClick={() => setShowNewFolder(true)}
            className="sf-action-btn"
            title="New folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="sf-alert-error" style={{ margin: '12px 24px 0' }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* New folder dialog */}
        {showNewFolder && (
          <div style={{ padding: '12px 24px 0' }}>
            <div className="sf-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, maxWidth: 400 }}>
              <Folder className="w-5 h-5" style={{ color: '#5F6368', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Untitled folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createFolder();
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
                }}
                className="sf-input"
                style={{ flex: 1, height: 32 }}
                autoFocus
              />
              <button onClick={createFolder} className="sf-btn sf-btn-brand" style={{ height: 32, fontSize: 12 }}>
                Create
              </button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="sf-action-btn">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* File content area — drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            position: 'relative',
            ...(dragOver ? { background: 'rgba(66, 133, 244, 0.05)', outline: '2px dashed #4285F4', outlineOffset: -8 } : {}),
          }}
        >
          {/* Drop overlay */}
          {dragOver && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(66, 133, 244, 0.08)', zIndex: 10, borderRadius: 8,
            }}>
              <div style={{ textAlign: 'center' }}>
                <Upload className="w-12 h-12" style={{ color: '#4285F4', margin: '0 auto 8px' }} />
                <div className="slds-text-size_medium slds-font-weight_medium" style={{ color: '#4285F4' }}>
                  Drop files to upload
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--slds-g-color-brand)' }}>
              <Loader2 className="w-4 h-4 sf-spin" />
              <span className="slds-text-size_small slds-font-weight_medium">Uploading...</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
              <Loader2 className="w-8 h-8 slds-text-brand sf-spin" />
            </div>
          ) : files.length === 0 ? (
            /* Empty state */
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 64, cursor: 'pointer', borderRadius: 12,
                border: '2px dashed var(--slds-g-color-border-1)',
                background: '#fff',
              }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: '#E8F0FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Upload className="w-8 h-8" style={{ color: '#4285F4' }} />
              </div>
              <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base" style={{ marginBottom: 4 }}>
                {sidebarView === 'starred' ? 'No starred files' : isSearching ? 'No results found' : 'Drop files here or click to upload'}
              </div>
              <div className="slds-text-size_small slds-text-neutral-7">
                {sidebarView === 'starred' ? 'Star files to find them easily later' : isSearching ? 'Try different search terms' : 'Or use the New button to create folders'}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid view */
            <div>
              {folders.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7" style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Folders
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {folders.map(file => (
                      <div
                        key={file.id}
                        onClick={() => handleFileClick(file)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY }); }}
                        className="sf-drive-folder-card"
                      >
                        <Folder className="w-5 h-5" style={{ color: '#5F6368', flexShrink: 0 }} />
                        {renaming === file.id ? (
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitRename(file.id); if (e.key === 'Escape') setRenaming(null); }}
                            onBlur={() => submitRename(file.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="sf-input"
                            style={{ flex: 1, height: 28, fontSize: 13 }}
                            autoFocus
                          />
                        ) : (
                          <span className="slds-truncate slds-text-size_small slds-font-weight_medium" style={{ flex: 1 }}>
                            {file.name}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY }); }}
                          className="sf-drive-more-btn"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {regularFiles.length > 0 && (
                <div>
                  <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7" style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Files
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {regularFiles.map(file => (
                      <div
                        key={file.id}
                        onClick={() => handleFileClick(file)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY }); }}
                        className="sf-drive-file-card"
                      >
                        <div className="sf-drive-file-card-preview">
                          {getLargeFileIcon(file)}
                        </div>
                        <div className="sf-drive-file-card-footer">
                          {getFileIcon(file)}
                          {renaming === file.id ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(file.id); if (e.key === 'Escape') setRenaming(null); }}
                              onBlur={() => submitRename(file.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="sf-input"
                              style={{ flex: 1, height: 24, fontSize: 12 }}
                              autoFocus
                            />
                          ) : (
                            <span className="slds-truncate slds-text-size_small" style={{ flex: 1 }}>
                              {file.name}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY }); }}
                            className="sf-drive-more-btn"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* List view */
            <div className="sf-card" style={{ overflow: 'hidden' }}>
              <table className="sf-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Name</th>
                    <th style={{ width: 120 }}>Modified</th>
                    <th style={{ width: 100 }}>Size</th>
                    <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => (
                    <tr
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY }); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ width: 32, paddingRight: 0 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleStar(file.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
                        >
                          <Star
                            className="w-4 h-4"
                            style={{ color: file.starred ? '#FBBC04' : '#C4C7C5', fill: file.starred ? '#FBBC04' : 'none' }}
                          />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {getFileIcon(file)}
                          {renaming === file.id ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(file.id); if (e.key === 'Escape') setRenaming(null); }}
                              onBlur={() => submitRename(file.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="sf-input"
                              style={{ height: 28, fontSize: 13, maxWidth: 300 }}
                              autoFocus
                            />
                          ) : (
                            <span className="slds-truncate slds-font-weight_medium" style={{ maxWidth: 400 }}>
                              {file.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="slds-text-size_small slds-text-neutral-7">
                        {formatDate(file.updatedAt)}
                      </td>
                      <td className="slds-text-size_small slds-text-neutral-7">
                        {file.isFolder ? '—' : formatFileSize(file.size)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          {!file.isFolder && (
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadFile(file.id, file.name); }}
                              className="sf-action-btn"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setContextMenu({ fileId: file.id, x: e.clientX, y: e.clientY }); }}
                            className="sf-action-btn"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ---- Preview panel ---- */}
      {(preview || previewLoading) && (
        <div style={{
          width: 360, flexShrink: 0, borderLeft: '1px solid var(--slds-g-color-border-2)',
          background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--slds-g-color-border-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="slds-text-size_medium slds-font-weight_semibold slds-truncate" style={{ maxWidth: 260 }}>
              {preview?.name || 'Loading...'}
            </span>
            <button onClick={() => setPreview(null)} className="sf-action-btn"><X className="w-4 h-4" /></button>
          </div>

          {previewLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
              <Loader2 className="w-6 h-6 slds-text-brand sf-spin" />
            </div>
          ) : preview ? (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* File info */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--slds-g-color-border-2)' }}>
                {getLargeFileIcon(preview)}
                <div style={{ textAlign: 'center' }}>
                  <div className="slds-text-size_medium slds-font-weight_medium">{preview.name}</div>
                  <div className="slds-text-size_small slds-text-neutral-7">{preview.mimeType}</div>
                </div>
              </div>

              {/* Metadata */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid var(--slds-g-color-border-2)' }}>
                <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px' }}>
                  <span className="slds-text-size_small slds-text-neutral-7">Type</span>
                  <span className="slds-text-size_small">{preview.isFolder ? 'Folder' : preview.mimeType}</span>
                  {!preview.isFolder && (
                    <>
                      <span className="slds-text-size_small slds-text-neutral-7">Size</span>
                      <span className="slds-text-size_small">{formatFileSize(preview.size)}</span>
                    </>
                  )}
                  <span className="slds-text-size_small slds-text-neutral-7">Created</span>
                  <span className="slds-text-size_small">{formatDate(preview.createdAt)}</span>
                  <span className="slds-text-size_small slds-text-neutral-7">Modified</span>
                  <span className="slds-text-size_small">{formatDate(preview.updatedAt)}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => toggleStar(preview.id)}
                    className="sf-btn sf-btn-neutral"
                    style={{ flex: 1, gap: 6, justifyContent: 'center', fontSize: 12 }}
                  >
                    <Star className="w-3.5 h-3.5" style={{ color: preview.starred ? '#FBBC04' : undefined, fill: preview.starred ? '#FBBC04' : 'none' }} />
                    {preview.starred ? 'Unstar' : 'Star'}
                  </button>
                  {!preview.isFolder && (
                    <button
                      onClick={() => downloadFile(preview.id, preview.name)}
                      className="sf-btn sf-btn-neutral"
                      style={{ flex: 1, gap: 6, justifyContent: 'center', fontSize: 12 }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => deleteFile(preview.id)}
                    className="sf-btn sf-btn-neutral sf-btn-danger-hover"
                    style={{ gap: 6, justifyContent: 'center', fontSize: 12 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content preview for text files */}
              {preview.content && !preview.isFolder && (preview.mimeType.startsWith('text/') || preview.mimeType.includes('json') || preview.mimeType.includes('xml') || preview.mimeType.includes('javascript') || preview.mimeType.includes('yaml') || preview.name.endsWith('.md') || preview.name.endsWith('.txt') || preview.name.endsWith('.json') || preview.name.endsWith('.csv') || preview.name.endsWith('.mhtml')) && (
                <div style={{ padding: 16, flex: 1 }}>
                  <div className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Content Preview
                  </div>
                  <pre style={{
                    fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: '#F8F9FA', border: '1px solid var(--slds-g-color-border-2)', borderRadius: 8,
                    padding: 12, maxHeight: 400, overflow: 'auto', fontFamily: 'monospace',
                  }}>
                    {preview.content.slice(0, 10000)}
                    {preview.content.length > 10000 ? '\n\n... (truncated)' : ''}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (() => {
        const file = files.find(f => f.id === contextMenu.fileId);
        if (!file) return null;
        return (
          <div
            className="sf-drive-context-menu"
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100 }}
            onClick={(e) => e.stopPropagation()}
          >
            {!file.isFolder && (
              <button onClick={() => { openPreview(file.id); setContextMenu(null); }}>
                <Eye className="w-4 h-4" /> Preview
              </button>
            )}
            {!file.isFolder && (
              <button onClick={() => downloadFile(file.id, file.name)}>
                <Download className="w-4 h-4" /> Download
              </button>
            )}
            <button onClick={() => startRename(file)}>
              <Pencil className="w-4 h-4" /> Rename
            </button>
            <button onClick={() => toggleStar(file.id)}>
              {file.starred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              {file.starred ? 'Remove star' : 'Add star'}
            </button>
            <div style={{ height: 1, background: 'var(--slds-g-color-border-2)', margin: '4px 0' }} />
            <button onClick={() => deleteFile(file.id)} style={{ color: 'var(--slds-g-color-error-1)' }}>
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        );
      })()}

      {/* ---- Paste-to-file modal ---- */}
      {showPasteModal && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { if (!pasteSaving) setShowPasteModal(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%', maxWidth: 720,
              maxHeight: '85vh',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--slds-g-color-border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ClipboardPaste className="w-5 h-5" style={{ color: '#4285F4' }} />
                </div>
                <div>
                  <div className="slds-text-size_medium slds-font-weight_semibold">Create file from text</div>
                  <div className="slds-text-size_small slds-text-neutral-7">Paste or type content to save as a file</div>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                disabled={pasteSaving}
                className="sf-action-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 24, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* File name */}
              <div>
                <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7" style={{ display: 'block', marginBottom: 6 }}>
                  File name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FilePlus2 className="w-5 h-5" style={{ color: '#4285F4', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="my-notes.txt"
                    value={pasteFileName}
                    onChange={(e) => setPasteFileName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && pasteFileName.trim() && pasteContent.trim()) saveTextFile(); }}
                    className="sf-input"
                    style={{ flex: 1, height: 40, fontSize: 14 }}
                    autoFocus
                  />
                </div>
                <div className="slds-text-size_small slds-text-neutral-7" style={{ marginTop: 4, marginLeft: 28 }}>
                  Include an extension (.txt, .md, .json, .csv, etc.) or .txt will be added automatically
                </div>
              </div>

              {/* Content area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7" style={{ display: 'block', marginBottom: 6 }}>
                  Content
                </label>
                <textarea
                  placeholder="Paste or type your content here..."
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: 280,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: 'monospace',
                    border: '1px solid var(--slds-g-color-border-1)',
                    borderRadius: 8,
                    resize: 'vertical',
                    background: '#FAFAF9',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--slds-g-color-brand)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(1, 118, 211, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--slds-g-color-border-1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {pasteContent && (
                  <div className="slds-text-size_small slds-text-neutral-7" style={{ marginTop: 6, textAlign: 'right' }}>
                    {pasteContent.length.toLocaleString()} characters &middot; {formatFileSize(new Blob([pasteContent]).size)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--slds-g-color-border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
              background: '#FAFAF9',
            }}>
              <button
                onClick={() => setShowPasteModal(false)}
                disabled={pasteSaving}
                className="sf-btn sf-btn-neutral"
                style={{ height: 36, minWidth: 80 }}
              >
                Cancel
              </button>
              <button
                onClick={saveTextFile}
                disabled={pasteSaving || !pasteFileName.trim() || !pasteContent.trim()}
                className="sf-btn sf-btn-brand"
                style={{ height: 36, minWidth: 120, gap: 8 }}
              >
                {pasteSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 sf-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FilePlus2 className="w-4 h-4" />
                    Save file
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
