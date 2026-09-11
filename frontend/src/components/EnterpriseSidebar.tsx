import React from 'react';
import { UserRole } from '../types';
import { NexusIcon } from '../theme/colors';
import { 
  Terminal, 
  FolderKanban, 
  ReceiptText, 
  ShieldAlert, 
  Sun, 
  Moon, 
  UserCheck, 
  PanelLeftClose, 
  PanelLeftOpen,
  Plus,
  Cpu,
  Database,
  Lock,
  Search
} from 'lucide-react';

interface EnterpriseSidebarProps {
  currentTab: 'chat' | 'documents' | 'audit' | 'compliance';
  setCurrentTab: (tab: 'chat' | 'documents' | 'audit' | 'compliance') => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  complianceCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onNewChat: () => void;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
  complianceCount,
  darkMode,
  setDarkMode,
  isOpen,
  setIsOpen,
  onNewChat,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-40 p-2 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] shadow-xs transition-colors"
        title="Open Navigation Rail"
      >
        <PanelLeftOpen className="w-4 h-4" />
      </button>
    );
  }

  const roleClearance = {
    admin: { label: 'Admin (Full Clearance)', badge: 'ALL_PERMS', color: 'text-[var(--app-primary)] border-[var(--app-primary)]/40 bg-[var(--app-primary)]/10' },
    editor: { label: 'Editor (Read / Write)', badge: 'WRITE_AUTH', color: 'text-[var(--app-secondary)] border-[var(--app-secondary)]/40 bg-[var(--app-secondary)]/10' },
    viewer: { label: 'Viewer (Read Only)', badge: 'READ_ONLY', color: 'text-[var(--app-text-subtle)] border-[var(--app-border)] bg-[var(--app-surface-hover)]' }
  };

  return (
    <aside className="w-64 h-screen bg-[var(--app-sidebar)] border-r border-[var(--app-border)] flex flex-col justify-between p-3 select-none shrink-0 z-40 transition-all duration-200">
      
      {/* Top Section */}
      <div className="space-y-4">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--app-primary)]/15 border border-[var(--app-primary)]/30 flex items-center justify-center text-[var(--app-primary)] shadow-xs">
              <NexusIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-[var(--app-text)] flex items-center gap-1.5">
                <span>DocMind</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--app-primary)] text-black font-extrabold uppercase">
                  NEXUS
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--app-text-subtle)] tracking-wider">
                MCP ENTERPRISE OS
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface)] transition-colors"
            title="Collapse Navigation"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Action Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] hover:border-[var(--app-primary)]/60 text-xs font-semibold text-[var(--app-text)] shadow-2xs transition-all group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--app-primary)] group-hover:scale-110 transition-transform" />
            <span>New Intelligence Session</span>
          </div>
          <kbd className="text-[10px] font-mono text-[var(--app-text-subtle)] bg-[var(--app-bg)] px-1.5 py-0.5 rounded border border-[var(--app-border)]">
            ⌘K
          </kbd>
        </button>

        {/* Navigation Rail */}
        <nav className="space-y-3 pt-1">
          
          {/* Operations Section */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-mono uppercase tracking-widest text-[var(--app-text-subtle)] font-bold">
              OPERATIONS
            </div>

            <button
              onClick={() => setCurrentTab('chat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'chat'
                  ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              <Terminal className="w-4 h-4 text-[var(--app-primary)]" />
              <span>Intelligence Console</span>
            </button>

            <button
              onClick={() => setCurrentTab('documents')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'documents'
                  ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-[var(--app-secondary)]" />
                <span>Document Matrix</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--app-surface-active)] text-[var(--app-text-subtle)]">
                6
              </span>
            </button>
          </div>

          {/* Governance & Risk Section */}
          <div className="space-y-1 pt-2">
            <div className="px-2 text-[10px] font-mono uppercase tracking-widest text-[var(--app-text-subtle)] font-bold">
              GOVERNANCE & RISK
            </div>

            <button
              onClick={() => setCurrentTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'audit'
                  ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              <ReceiptText className="w-4 h-4 text-[var(--app-text-muted)]" />
              <span>Audit Ledger</span>
            </button>

            <button
              onClick={() => setCurrentTab('compliance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'compliance'
                  ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[var(--app-danger)]" />
                <span>Compliance Radar</span>
              </div>
              {complianceCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[var(--app-danger)] text-white">
                  {complianceCount}
                </span>
              )}
            </button>
          </div>

        </nav>

      </div>

      {/* Bottom Section: RBAC Clearance & Telemetry */}
      <div className="space-y-3 pt-3 border-t border-[var(--app-border)]">
        
        {/* Role Selector Card */}
        <div className="p-2.5 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-[var(--app-text-subtle)]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" /> RBAC CONTEXT
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] border font-mono ${roleClearance[currentUserRole].color}`}>
              {roleClearance[currentUserRole].badge}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-[var(--app-bg)] border border-[var(--app-border)]">
            {(['admin', 'editor', 'viewer'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setCurrentUserRole(r)}
                className={`py-1 text-[11px] font-mono font-bold rounded uppercase transition-all ${
                  currentUserRole === r
                    ? 'bg-[var(--app-surface)] text-[var(--app-primary)] shadow-xs border border-[var(--app-border)]'
                    : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Live System Diagnostics */}
        <div className="p-2 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] text-[10px] font-mono space-y-1 text-[var(--app-text-subtle)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-secondary)] animate-pulse" />
              MCP Server
            </span>
            <span className="text-[var(--app-secondary)] font-bold">11 Tools Online</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3" /> ChromaDB
            </span>
            <span className="text-[var(--app-text-muted)]">Active Vector Store</span>
          </div>
        </div>

        {/* Theme & Profile Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--app-surface-active)] border border-[var(--app-border)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--app-text)]">
              {currentUserRole.substring(0, 1).toUpperCase()}
            </div>
            <div className="text-[11px] font-medium text-[var(--app-text)]">
              {currentUserRole === 'admin' ? 'Kaviy (Lead)' : currentUserRole === 'editor' ? 'Legal Editor' : 'Audit Viewer'}
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-md hover:bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-[var(--app-warning)]" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </aside>
  );
};
