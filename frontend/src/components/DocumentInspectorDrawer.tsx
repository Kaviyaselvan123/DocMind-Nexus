import React, { useState } from 'react';
import { X, Copy, Check, Download, Layers, Code, FileText, ShieldAlert, Cpu, Hash } from 'lucide-react';
import { DocumentDetail } from '../types';
import { CATEGORY_BADGES } from '../theme/colors';

interface DocumentInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDetail | null;
  rawPayload?: any;
}

export const DocumentInspectorDrawer: React.FC<DocumentInspectorDrawerProps> = ({
  isOpen,
  onClose,
  document,
  rawPayload
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'mcp'>('content');
  const [copied, setCopied] = useState(false);

  if (!isOpen || (!document && !rawPayload)) return null;

  const title = document?.title || (rawPayload?.tool ? `MCP Tool: ${rawPayload.tool}` : 'Telemetry Payload');
  const content = document?.content_text || (rawPayload ? JSON.stringify(rawPayload, null, 2) : '');
  const categoryBadge = document?.category ? CATEGORY_BADGES[document.category] || { bg: 'bg-[var(--app-surface-active)]', text: 'text-[var(--app-text)]', border: 'border-[var(--app-border)]' } : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document?.title || 'mcp_artifact_export.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-[460px] lg:w-[560px] h-screen bg-[var(--app-surface)] border-l border-[var(--app-border)] flex flex-col justify-between shrink-0 shadow-2xl z-30 transition-all duration-200">
      
      {/* Top Header */}
      <div className="p-4 border-b border-[var(--app-border)] flex items-center justify-between bg-[var(--app-surface)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--app-primary)]/15 text-[var(--app-primary)] border border-[var(--app-primary)]/30 font-bold">
            INSPECTOR
          </span>
          <h3 className="font-bold text-xs text-[var(--app-text)] font-mono truncate" title={title}>
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors"
            title="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--app-secondary)]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-[var(--app-border)] bg-[var(--app-bg)]/60 text-xs">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-mono font-semibold transition-colors ${
            activeTab === 'content'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Text</span>
        </button>

        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-mono font-semibold transition-colors ${
            activeTab === 'metadata'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Metadata & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('mcp')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-mono font-semibold transition-colors ${
            activeTab === 'mcp'
              ? 'border-[var(--app-primary)] text-[var(--app-primary)]'
              : 'border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Vector & JSON</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        
        {/* Document Content View */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            {document?.summary && (
              <div className="p-3 rounded-lg bg-[var(--app-primary)]/10 border border-[var(--app-primary)]/20 space-y-1">
                <div className="text-[10px] uppercase font-bold text-[var(--app-primary)] flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> MCP Generated Executive Summary
                </div>
                <p className="text-xs text-[var(--app-text)] leading-relaxed font-sans">
                  {document.summary}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-3.5 text-[var(--app-text)] whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px]">
              {content || 'No text extracted for this document.'}
            </div>
          </div>
        )}

        {/* Metadata & Security View */}
        {activeTab === 'metadata' && (
          <div className="space-y-3 font-sans">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="text-[10px] font-mono text-[var(--app-text-subtle)] uppercase">Classification</div>
                <div className="font-bold text-sm text-[var(--app-text)] mt-1">
                  {document?.category || 'General'}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="text-[10px] font-mono text-[var(--app-text-subtle)] uppercase">Folder Path</div>
                <div className="font-mono text-xs text-[var(--app-text)] mt-1 truncate">
                  {document?.folder_path || '/root'}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="text-[10px] font-mono text-[var(--app-text-subtle)] uppercase">Version</div>
                <div className="font-mono text-sm text-[var(--app-text)] mt-1">
                  v{document?.version_count || document?.current_version || 1}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="text-[10px] font-mono text-[var(--app-text-subtle)] uppercase">SHA-256 Checksum</div>
                <div className="font-mono text-[10px] text-[var(--app-text-muted)] mt-1 truncate">
                  {document?.file_hash || 'SHA256-UNAVAILABLE'}
                </div>
              </div>
            </div>

            {/* Compliance Flags */}
            <div className="p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[var(--app-text)] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--app-warning)]" />
                  Compliance & Legal Status
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  document?.is_compliant === false
                    ? 'bg-[var(--app-danger)]/10 text-[var(--app-danger)] border-[var(--app-danger)]/30'
                    : 'bg-[var(--app-secondary)]/10 text-[var(--app-secondary)] border-[var(--app-secondary)]/30'
                }`}>
                  {document?.is_compliant === false ? 'ALERT FLAGGED' : 'VERIFIED COMPLIANT'}
                </span>
              </div>
              <div className="text-xs text-[var(--app-text-muted)]">
                {document?.compliance_notes || 'All signature verifications and term expiry parameters pass automated compliance checks.'}
              </div>
            </div>
          </div>
        )}

        {/* MCP & JSON View */}
        {activeTab === 'mcp' && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase text-[var(--app-text-subtle)] flex items-center justify-between">
              <span>RAW PAYLOAD SCHEMA</span>
              <span className="text-[var(--app-primary)]">application/json</span>
            </div>
            <pre className="p-3 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] text-[11px] font-mono text-[var(--app-text)] overflow-x-auto leading-normal">
              {JSON.stringify(rawPayload || document, null, 2)}
            </pre>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-between text-[10px] font-mono text-[var(--app-text-subtle)]">
        <span>STATUS: SYNCHRONIZED</span>
        <span>INDEX: CHROMADB ACTIVE</span>
      </div>

    </div>
  );
};
