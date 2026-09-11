import React from 'react';
import { UserRole } from '../types';
import { NexusIcon } from '../theme/colors';
import { 
  FolderKanban, 
  Terminal, 
  ReceiptText, 
  ShieldAlert, 
  Sun, 
  Moon, 
  PanelLeft,
  ChevronDown,
  Upload,
  Lock
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'chat' | 'documents' | 'audit' | 'compliance';
  setCurrentTab: (tab: 'chat' | 'documents' | 'audit' | 'compliance') => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  complianceCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  onOpenUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
  complianceCount,
  darkMode,
  setDarkMode,
  sidebarOpen,
  setSidebarOpen,
  onOpenUpload,
}) => {
  return (
    <header className="border-b border-[var(--app-border)] bg-[var(--app-surface)]/95 backdrop-blur-md sticky top-0 z-20 h-14 flex items-center justify-between px-4">
      
      {/* Left: Sidebar Toggle + Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-md text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-hover)] transition-colors"
          title="Toggle Navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('chat')}>
          <div className="w-7 h-7 rounded-lg bg-[var(--app-primary)]/15 border border-[var(--app-primary)]/30 text-[var(--app-primary)] flex items-center justify-center">
            <NexusIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[var(--app-text)] tracking-tight flex items-center gap-1.5">
              <span>DocMind Nexus</span>
              <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--app-primary)] text-black">
                CORE
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[var(--app-border)]">
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--app-text-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded border border-[var(--app-border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-secondary)]" />
            11 MCP Tools Online
          </span>
          <span className="text-[10px] font-mono text-[var(--app-text-subtle)]">
            ChromaDB Synced
          </span>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-[var(--app-bg)] p-1 rounded-lg border border-[var(--app-border)] text-xs">
        <button
          onClick={() => setCurrentTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
            currentTab === 'chat'
              ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Intelligence Console</span>
        </button>

        <button
          onClick={() => setCurrentTab('documents')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
            currentTab === 'documents'
              ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Document Matrix</span>
        </button>

        <button
          onClick={() => setCurrentTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
            currentTab === 'audit'
              ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>Audit Ledger</span>
        </button>

        <button
          onClick={() => setCurrentTab('compliance')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
            currentTab === 'compliance'
              ? 'bg-[var(--app-surface)] text-[var(--app-primary)] border border-[var(--app-border)] shadow-xs'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Compliance Radar</span>
          {complianceCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[var(--app-danger)] text-white">
              {complianceCount}
            </span>
          )}
        </button>
      </nav>

      {/* Right Controls: Role Switcher, Upload, Theme */}
      <div className="flex items-center gap-2.5">
        
        {/* Quick Ingest Button */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--app-primary)] text-black font-bold text-xs hover:bg-[var(--app-primary-hover)] transition-all shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Document</span>
          </button>
        )}

        {/* Role Quick Selector */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] text-xs">
          <Lock className="w-3 h-3 text-[var(--app-text-muted)]" />
          <select
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-mono font-bold uppercase text-[var(--app-text)] cursor-pointer outline-hidden"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors border border-[var(--app-border)]"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-[var(--app-warning)]" /> : <Moon className="w-4 h-4" />}
        </button>

      </div>

    </header>
  );
};
