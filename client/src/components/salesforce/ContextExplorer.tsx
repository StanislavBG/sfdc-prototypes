import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  TreePine,
  List,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// ---------------------------------------------------------------------------
// Types (mirror server schemas)
// ---------------------------------------------------------------------------

interface StoredArticle {
  articleId: string;
  title: string;
  url: string;
  parentId: string | null;
  chunkCount: number;
}

interface TreeNode {
  title: string;
  url: string;
  parentId: string | null;
  children: string[];
}

interface CrawlProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  total: number;
  crawled: number;
  stored: number;
  skipped: number;
  errors: string[];
  startedAt: string | null;
  completedAt: string | null;
}

interface QueryResult {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// Default seed URL for Identity Resolution docs
const IDENTITY_RESOLUTION_ROOT =
  'https://help.salesforce.com/s/articleView?id=data.c360_a_identity_resolution_unify_source_profiles.htm&type=5';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ContextExplorer() {
  const [tab, setTab] = useState<'crawl' | 'tree' | 'search'>('crawl');
  const [articles, setArticles] = useState<StoredArticle[]>([]);
  const [tree, setTree] = useState<Record<string, TreeNode>>({});
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [loading, setLoading] = useState(false);

  // Crawl form
  const [seedUrl, setSeedUrl] = useState(IDENTITY_RESOLUTION_ROOT);
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxArticles, setMaxArticles] = useState(50);

  // Article detail / approval
  const [selectedArticle, setSelectedArticle] = useState<StoredArticle | null>(null);
  const [articleChunks, setArticleChunks] = useState<QueryResult[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QueryResult[]>([]);
  const [searching, setSearching] = useState(false);

  // ---- Data fetchers ----

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/crawler/articles');
      if (res.ok) setArticles(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch('/api/crawler/tree');
      if (res.ok) setTree(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/crawler/progress');
      if (res.ok) setProgress(await res.json());
    } catch { /* ignore */ }
  }, []);

  // Initial load
  useEffect(() => {
    fetchArticles();
    fetchTree();
    fetchProgress();
  }, [fetchArticles, fetchTree, fetchProgress]);

  // Poll progress while crawl is running
  useEffect(() => {
    if (progress?.status !== 'running') return;
    const interval = setInterval(() => {
      fetchProgress();
      fetchArticles();
    }, 3000);
    return () => clearInterval(interval);
  }, [progress?.status, fetchProgress, fetchArticles]);

  // ---- Actions ----

  const startCrawl = async () => {
    setLoading(true);
    try {
      await apiRequest('POST', '/api/crawler/start', {
        urls: [seedUrl],
        maxDepth,
        maxArticles,
        articleIdPrefix: 'c360_a',
      });
      // Start polling
      setTimeout(fetchProgress, 1000);
    } catch (err: any) {
      console.error('Failed to start crawl:', err);
    }
    setLoading(false);
  };

  const deleteArticle = async (articleId: string) => {
    try {
      await apiRequest('DELETE', `/api/crawler/articles/${articleId}`);
      setArticles((prev) => prev.filter((a) => a.articleId !== articleId));
      if (selectedArticle?.articleId === articleId) {
        setSelectedArticle(null);
        setArticleChunks([]);
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
    }
  };

  const viewArticleChunks = async (article: StoredArticle) => {
    setSelectedArticle(article);
    try {
      // Use the article title as a semantic query to pull its chunks
      const res = await apiRequest('POST', '/api/crawler/query', {
        query: article.title,
        limit: 20,
      });
      const results: QueryResult[] = await res.json();
      // Filter to only chunks from this article
      setArticleChunks(
        results.filter((r) => r.metadata?.article_id === article.articleId)
      );
    } catch { /* ignore */ }
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await apiRequest('POST', '/api/crawler/query', {
        query: searchQuery,
        limit: 10,
      });
      setSearchResults(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  };

  // ---- Render helpers ----

  const tabClass = (t: string) =>
    `flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-[#2E844A] text-[#2E844A]'
        : 'border-transparent text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)]'
    }`;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel: tabs + content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-[var(--sf-border)] bg-white px-4">
          <button className={tabClass('crawl')} onClick={() => setTab('crawl')}>
            <Play className="w-3.5 h-3.5" /> Crawler
          </button>
          <button className={tabClass('tree')} onClick={() => setTab('tree')}>
            <TreePine className="w-3.5 h-3.5" /> Article Tree
          </button>
          <button className={tabClass('search')} onClick={() => setTab('search')}>
            <Search className="w-3.5 h-3.5" /> Search
          </button>

          <div className="ml-auto flex items-center gap-2 text-xs text-[var(--sf-text-tertiary)]">
            <Database className="w-3.5 h-3.5" />
            {articles.length} article{articles.length !== 1 ? 's' : ''} stored
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'crawl' && (
            <CrawlTab
              seedUrl={seedUrl}
              setSeedUrl={setSeedUrl}
              maxDepth={maxDepth}
              setMaxDepth={setMaxDepth}
              maxArticles={maxArticles}
              setMaxArticles={setMaxArticles}
              progress={progress}
              loading={loading}
              onStartCrawl={startCrawl}
              onRefresh={() => { fetchArticles(); fetchTree(); fetchProgress(); }}
              articles={articles}
              onView={viewArticleChunks}
              onDelete={deleteArticle}
            />
          )}
          {tab === 'tree' && (
            <TreeTab tree={tree} articles={articles} onView={viewArticleChunks} onRefresh={fetchTree} />
          )}
          {tab === 'search' && (
            <SearchTab
              query={searchQuery}
              setQuery={setSearchQuery}
              results={searchResults}
              searching={searching}
              onSearch={doSearch}
            />
          )}
        </div>
      </div>

      {/* Right panel: article detail / chunk preview */}
      <div className="w-[420px] border-l border-[var(--sf-border)] bg-white flex flex-col overflow-hidden">
        {selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            chunks={articleChunks}
            onClose={() => { setSelectedArticle(null); setArticleChunks([]); }}
            onDelete={() => deleteArticle(selectedArticle.articleId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Eye className="w-8 h-8 text-[var(--sf-text-tertiary)] mx-auto mb-3" />
              <p className="text-sm text-[var(--sf-text-tertiary)]">
                Select an article to preview its content chunks
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crawl Tab
// ---------------------------------------------------------------------------

function CrawlTab({
  seedUrl, setSeedUrl,
  maxDepth, setMaxDepth,
  maxArticles, setMaxArticles,
  progress, loading,
  onStartCrawl, onRefresh,
  articles, onView, onDelete,
}: {
  seedUrl: string; setSeedUrl: (v: string) => void;
  maxDepth: number; setMaxDepth: (v: number) => void;
  maxArticles: number; setMaxArticles: (v: number) => void;
  progress: CrawlProgress | null; loading: boolean;
  onStartCrawl: () => void; onRefresh: () => void;
  articles: StoredArticle[];
  onView: (a: StoredArticle) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Crawl controls */}
      <div className="sf-card">
        <div className="sf-card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
            Start Crawler
          </h2>
          <button
            className="sf-icon-btn !text-[var(--sf-text-tertiary)]"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--sf-text-primary)] mb-1">
              Seed URL
            </label>
            <input
              type="url"
              value={seedUrl}
              onChange={(e) => setSeedUrl(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue)] bg-white"
              placeholder="https://help.salesforce.com/s/articleView?id=..."
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--sf-text-primary)] mb-1">
                Max Depth
              </label>
              <input
                type="number"
                min={0}
                max={5}
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--sf-text-primary)] mb-1">
                Max Articles
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxArticles}
                onChange={(e) => setMaxArticles(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue)]"
              />
            </div>
          </div>
          <button
            onClick={onStartCrawl}
            disabled={loading || progress?.status === 'running'}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#2E844A] hover:bg-[#246B3C] disabled:opacity-50 rounded transition-colors"
          >
            {progress?.status === 'running' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {progress?.status === 'running' ? 'Crawling...' : 'Start Crawl'}
          </button>
        </div>
      </div>

      {/* Progress card */}
      {progress && progress.status !== 'idle' && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
              Crawl Progress
            </h2>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                progress.status === 'running' ? 'bg-blue-100 text-blue-700' :
                progress.status === 'completed' ? 'bg-green-100 text-green-700' :
                progress.status === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {progress.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                {progress.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {progress.status === 'error' && <XCircle className="w-3 h-3" />}
                {progress.status}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-[var(--sf-text-primary)]">{progress.crawled}</div>
                <div className="text-xs text-[var(--sf-text-tertiary)]">Crawled</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--sf-text-primary)]">{progress.stored}</div>
                <div className="text-xs text-[var(--sf-text-tertiary)]">Stored</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--sf-text-primary)]">{progress.skipped}</div>
                <div className="text-xs text-[var(--sf-text-tertiary)]">Skipped</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--sf-text-primary)]">{progress.errors.length}</div>
                <div className="text-xs text-[var(--sf-text-tertiary)]">Errors</div>
              </div>
            </div>
            {progress.status === 'running' && progress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-[#2E844A] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (progress.crawled / progress.total) * 100)}%` }}
                />
              </div>
            )}
            {progress.errors.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 max-h-24 overflow-y-auto">
                {progress.errors.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stored articles list */}
      <div className="sf-card">
        <div className="sf-card-header">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
            Stored Articles ({articles.length})
          </h2>
        </div>
        <div className="divide-y divide-[var(--sf-border-light)]">
          {articles.length === 0 ? (
            <div className="p-4 text-xs text-[var(--sf-text-tertiary)] text-center">
              No articles stored yet. Run the crawler or import articles.
            </div>
          ) : (
            articles.map((a) => (
              <div
                key={a.articleId}
                className="px-4 py-2.5 flex items-center gap-2 hover:bg-[#F3F3F3] transition-colors group"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)] flex-shrink-0" />
                <button
                  className="flex-1 text-left text-xs text-[var(--sf-link)] hover:underline truncate"
                  onClick={() => onView(a)}
                  title={a.articleId}
                >
                  {a.title || a.articleId}
                </button>
                <span className="text-xs text-[var(--sf-text-tertiary)] flex-shrink-0">
                  {a.chunkCount} chunk{a.chunkCount !== 1 ? 's' : ''}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                  onClick={() => onDelete(a.articleId)}
                  title="Delete article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tree Tab
// ---------------------------------------------------------------------------

function TreeTab({
  tree, articles, onView, onRefresh,
}: {
  tree: Record<string, TreeNode>;
  articles: StoredArticle[];
  onView: (a: StoredArticle) => void;
  onRefresh: () => void;
}) {
  // Find root nodes (no parent or parent not in tree)
  const rootIds = Object.keys(tree).filter(
    (id) => !tree[id].parentId || !tree[tree[id].parentId!]
  );

  return (
    <div className="p-4">
      <div className="sf-card">
        <div className="sf-card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
            Documentation Tree
          </h2>
          <button
            className="sf-icon-btn !text-[var(--sf-text-tertiary)]"
            onClick={onRefresh}
            title="Refresh tree"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-2">
          {rootIds.length === 0 ? (
            <div className="p-4 text-xs text-[var(--sf-text-tertiary)] text-center">
              No articles in the tree yet.
            </div>
          ) : (
            rootIds.map((id) => (
              <TreeNodeRow
                key={id}
                nodeId={id}
                tree={tree}
                articles={articles}
                depth={0}
                onView={onView}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TreeNodeRow({
  nodeId, tree, articles, depth, onView,
}: {
  nodeId: string;
  tree: Record<string, TreeNode>;
  articles: StoredArticle[];
  depth: number;
  onView: (a: StoredArticle) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const node = tree[nodeId];
  if (!node) return null;

  const hasChildren = node.children.length > 0;
  const article = articles.find((a) => a.articleId === nodeId);

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-1 rounded hover:bg-[#F3F3F3] cursor-pointer text-xs transition-colors"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          if (article) onView(article);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-[var(--sf-text-tertiary)] flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-[var(--sf-text-tertiary)] flex-shrink-0" />
          )
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <FileText className="w-3 h-3 text-[#2E844A] flex-shrink-0" />
        <span className="text-[var(--sf-text-primary)] truncate flex-1">
          {node.title || nodeId}
        </span>
        {article && (
          <span className="text-[var(--sf-text-tertiary)] flex-shrink-0">
            {article.chunkCount}ch
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((childId) => (
            <TreeNodeRow
              key={childId}
              nodeId={childId}
              tree={tree}
              articles={articles}
              depth={depth + 1}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Tab
// ---------------------------------------------------------------------------

function SearchTab({
  query, setQuery, results, searching, onSearch,
}: {
  query: string;
  setQuery: (v: string) => void;
  results: QueryResult[];
  searching: boolean;
  onSearch: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="sf-card">
        <div className="sf-card-header">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
            Semantic Search
          </h2>
        </div>
        <div className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="flex-1 px-3 py-1.5 text-xs border border-[var(--sf-border)] rounded focus:outline-none focus:border-[var(--sf-blue)]"
              placeholder="Ask a question about Salesforce Data Cloud..."
            />
            <button
              onClick={onSearch}
              disabled={searching || !query.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#2E844A] hover:bg-[#246B3C] disabled:opacity-50 rounded transition-colors"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
              Results ({results.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--sf-border-light)]">
            {results.map((r) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--sf-text-primary)]">
                    {(r.metadata?.title as string) || 'Untitled'}
                  </span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-mono">
                    {(r.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed line-clamp-4 whitespace-pre-wrap">
                  {r.content}
                </p>
                {typeof r.metadata?.url === 'string' && (
                  <a
                    href={r.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> View source
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article Detail Panel (right side)
// ---------------------------------------------------------------------------

function ArticleDetail({
  article, chunks, onClose, onDelete,
}: {
  article: StoredArticle;
  chunks: QueryResult[];
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--sf-border)] flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] truncate">
              {article.title || article.articleId}
            </h3>
            <p className="text-xs text-[var(--sf-text-tertiary)] mt-0.5 font-mono truncate">
              {article.articleId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[var(--sf-text-tertiary)] hover:text-[var(--sf-text-primary)] flex-shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-[var(--sf-text-tertiary)]">
            {article.chunkCount} chunk{article.chunkCount !== 1 ? 's' : ''}
          </span>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--sf-link)] hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Source
            </a>
          )}
          <button
            onClick={onDelete}
            className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>

      {/* Chunk list with approve / reject per chunk */}
      <div className="flex-1 overflow-y-auto">
        {chunks.length === 0 ? (
          <div className="p-4 text-xs text-[var(--sf-text-tertiary)] text-center">
            No matching chunks found for this article.
          </div>
        ) : (
          chunks.map((chunk, idx) => (
            <ChunkCard key={chunk.id} chunk={chunk} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Chunk Card with approve/reject
// ---------------------------------------------------------------------------

function ChunkCard({ chunk, index }: { chunk: QueryResult; index: number }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <div className={`border-b border-[var(--sf-border-light)] p-3 ${
      status === 'approved' ? 'bg-green-50' :
      status === 'rejected' ? 'bg-red-50 opacity-60' :
      ''
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[var(--sf-text-tertiary)]">
          Chunk {index + 1}
          {typeof chunk.metadata?.section === 'string' && (
            <span className="ml-1 text-[var(--sf-text-primary)]">
              — {chunk.metadata.section}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatus(status === 'approved' ? 'pending' : 'approved')}
            className={`p-0.5 rounded transition-colors ${
              status === 'approved'
                ? 'text-green-600'
                : 'text-gray-300 hover:text-green-500'
            }`}
            title="Approve"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStatus(status === 'rejected' ? 'pending' : 'rejected')}
            className={`p-0.5 rounded transition-colors ${
              status === 'rejected'
                ? 'text-red-600'
                : 'text-gray-300 hover:text-red-500'
            }`}
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-[var(--sf-text-primary)] leading-relaxed whitespace-pre-wrap line-clamp-6">
        {chunk.content}
      </p>
      <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
        {chunk.metadata?.chunk_strategy as string}
      </span>
    </div>
  );
}
