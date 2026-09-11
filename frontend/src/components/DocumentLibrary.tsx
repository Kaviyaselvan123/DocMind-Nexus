import React, { useState, useEffect } from 'react';
import { DocumentItem, UserRole } from '../types';
import { CATEGORY_BADGES } from '../theme/colors';
import { 
  Search, 
  Filter, 
  FileText, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  FolderOpen,
  FolderTree,
  Database,
  Layers
} from 'lucide-react';
import { UploadModal } from './UploadModal';

interface DocumentLibraryProps {
  currentUserRole: UserRole;
  onOpenDocArtifact?: (docId: string) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  currentUserRole,
  onOpenDocArtifact
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents/');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error('Failed to load documents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId: string, title: string) => {
    if (currentUserRole !== 'admin') {
      setActionNotice({
        msg: `Permission Denied: Role '${currentUserRole}' cannot delete documents. Requires 'admin' privileges.`,
        type: 'error'
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    if (!window.confirm(`Are you sure you want to soft-delete '${title}'?`)) return;

    try {
      await fetch(`/api/documents/${docId}/delete`, { method: 'POST' }).catch(() => null);
      setActionNotice({
        msg: `Document '${title}' soft-deleted and removed from vector index.`,
        type: 'success'
      });
      fetchDocuments();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ['All', 'Contract', 'Financial', 'Policy', 'Technical', 'HR', 'Invoice'];
  const folders = ['All', '/Contracts', '/Finance', '/Policies', '/Engineering', '/HR'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags && doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesFolder = selectedFolder === 'All' || doc.folder_path.startsWith(selectedFolder);
    return matchesSearch && matchesCategory && matchesFolder;
  });

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 font-sans">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={`p-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
            actionNotice.type === 'error'
              ? 'bg-[var(--app-danger)]/15 border-[var(--app-danger)]/40 text-[var(--app-danger)]'
              : 'bg-[var(--app-secondary)]/15 border-[var(--app-secondary)]/40 text-[var(--app-secondary)]'
          }`}
        >
          <span>{actionNotice.msg}</span>
          <button onClick={() => setActionNotice(null)} className="ml-2 font-bold text-sm">×</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--app-border)]">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-[var(--app-primary)]" />
            <h2 className="font-bold text-2xl text-[var(--app-text)] tracking-tight">
              Enterprise Document Matrix
            </h2>
          </div>
          <p className="text-xs text-[var(--app-text-muted)] mt-1 font-mono">
            {documents.length} archival assets indexed in ChromaDB vector repository • Granular RBAC permissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--app-text-subtle)]" />
            <input
              type="text"
              placeholder="Search documents or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg text-[var(--app-text)] focus:outline-hidden focus:border-[var(--app-primary)] w-64 shadow-2xs font-sans"
            />
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--app-primary)] text-black text-xs font-bold hover:bg-[var(--app-primary-hover)] transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Document</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar Folders & Categories */}
        <div className="space-y-4">
          <div className="bg-[var(--app-surface)] p-3.5 rounded-xl border border-[var(--app-border)] space-y-2 shadow-2xs">
            <h4 className="font-mono font-bold text-xs text-[var(--app-text-subtle)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-[var(--app-primary)]" />
              Directory Tree
            </h4>
            <div className="space-y-1">
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono flex items-center justify-between transition-colors ${
                    selectedFolder === f
                      ? 'bg-[var(--app-primary)]/15 text-[var(--app-primary)] font-bold border border-[var(--app-primary)]/30'
                      : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)]'
                  }`}
                >
                  <span className="truncate">{f}</span>
                  <span className="text-[10px] text-[var(--app-text-subtle)]">
                    {f === 'All' ? documents.length : documents.filter(d => d.folder_path.startsWith(f)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          <div className="bg-[var(--app-surface)] p-3.5 rounded-xl border border-[var(--app-border)] space-y-2 shadow-2xs">
            <h4 className="font-mono font-bold text-xs text-[var(--app-text-subtle)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--app-primary)]" />
              Classifications
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
                    selectedCategory === c
                      ? 'bg-[var(--app-primary)] text-black border-[var(--app-primary)] font-bold'
                      : 'border-[var(--app-border)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document Cards */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="p-12 text-center text-[var(--app-text-muted)] font-mono">
              Loading document matrix from ChromaDB...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl">
              <p className="text-[var(--app-text-muted)] text-sm font-mono">
                No documents match the current search or folder filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {filteredDocs.map((doc) => {
                const badgeStyle = CATEGORY_BADGES[doc.category] || {
                  bg: 'bg-[var(--app-primary)]/10',
                  text: 'text-[var(--app-primary)]',
                  border: 'border-[var(--app-primary)]/30',
                };
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-primary)]/60 shadow-2xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} font-semibold`}
                        >
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--app-text-subtle)]">
                          {doc.folder_path}
                        </span>
                      </div>

                      <h3
                        onClick={() => onOpenDocArtifact && onOpenDocArtifact(doc.id)}
                        className="font-bold text-sm text-[var(--app-text)] group-hover:text-[var(--app-primary)] cursor-pointer transition-colors line-clamp-1"
                        title={doc.title}
                      >
                        {doc.title}
                      </h3>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags?.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.2 rounded bg-[var(--app-bg)] text-[var(--app-text-muted)] border border-[var(--app-border)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3.5 mt-3 border-t border-[var(--app-border)] flex items-center justify-between text-[11px] text-[var(--app-text-muted)]">
                      <div className="flex items-center gap-2">
                        {doc.has_signature ? (
                          <span className="flex items-center gap-1 text-[var(--app-secondary)] text-[10px] font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Signed</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[var(--app-warning)] text-[10px] font-mono font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Unsigned</span>
                          </span>
                        )}

                        {doc.expiration_date && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--app-text-subtle)]">
                            <Calendar className="w-3 h-3" />
                            <span>{doc.expiration_date}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenDocArtifact && onOpenDocArtifact(doc.id)}
                          className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-primary)]"
                          title="Open in Document Inspector"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-danger)]"
                          title="Delete (Requires Admin Role)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchDocuments();
          setIsUploadOpen(false);
        }}
        currentUserRole={currentUserRole}
      />

    </div>
  );
};
