import React, { useState, useEffect } from 'react';
import { ComplianceIssue } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface CompliancePanelProps {
  onSelectDoc?: (docId: string) => void;
  onRefreshBadge?: () => void;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  onSelectDoc,
  onRefreshBadge
}) => {
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [lastScanTime, setLastScanTime] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);

  const runScan = async () => {
    try {
      setScanning(true);
      const res = await fetch('/api/audit/compliance/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
        setScannedCount(data.total_documents_scanned || 0);
        setLastScanTime(data.timestamp || new Date().toLocaleString());
        if (onRefreshBadge) onRefreshBadge();
      }
    } catch (e) {
      console.error('Error running compliance scan', e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const highSeverity = issues.filter((i) => i.severity === 'HIGH');
  const mediumSeverity = issues.filter((i) => i.severity === 'MEDIUM');

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--app-border)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[var(--app-danger)]" />
            <h2 className="font-bold text-2xl text-[var(--app-text)] tracking-tight">
              Compliance & Legal Risk Radar
            </h2>
          </div>
          <p className="text-xs text-[var(--app-text-muted)] mt-1 font-mono">
            Autonomous background compliance engine detecting expiring SLAs, missing authorized signatures, and contractual liabilities.
          </p>
        </div>

        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--app-primary)] text-black text-xs font-bold hover:bg-[var(--app-primary-hover)] disabled:opacity-50 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Auditing Vault...' : 'Trigger Compliance Scan'}</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[var(--app-text-subtle)] font-bold">SCANNED DOCUMENTS</span>
          <p className="font-bold text-2xl text-[var(--app-text)] font-mono mt-1">
            {scannedCount}
          </p>
          <p className="text-[10px] font-mono text-[var(--app-text-subtle)] mt-1">
            Last audit: {lastScanTime || 'Active cycle'}
          </p>
        </div>

        <div className="bg-[var(--app-surface)] border border-[var(--app-danger)]/30 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[var(--app-danger)] font-bold">CRITICAL EXPOSURES</span>
          <p className="font-bold text-2xl text-[var(--app-danger)] font-mono mt-1">
            {highSeverity.length}
          </p>
          <p className="text-[10px] font-mono text-[var(--app-text-subtle)] mt-1">
            Expired clauses or missing signatures
          </p>
        </div>

        <div className="bg-[var(--app-surface)] border border-[var(--app-warning)]/30 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[var(--app-warning)] font-bold">UPCOMING EXPIRATIONS</span>
          <p className="font-bold text-2xl text-[var(--app-warning)] font-mono mt-1">
            {mediumSeverity.length}
          </p>
          <p className="text-[10px] font-mono text-[var(--app-text-subtle)] mt-1">
            Expiring within next 90 days
          </p>
        </div>

      </div>

      {/* Flagged Issues List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--app-text)] font-mono uppercase tracking-wider">
            Active Vault Compliance Flags ({issues.length})
          </h3>
          <span className="text-[10px] font-mono text-[var(--app-text-subtle)]">
            Continuous background surveillance
          </span>
        </div>

        {issues.length === 0 ? (
          <div className="p-8 text-center bg-[var(--app-secondary)]/10 border border-[var(--app-secondary)]/30 rounded-xl text-[var(--app-secondary)]">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-90" />
            <p className="font-bold text-sm">All documents pass regulatory compliance checks.</p>
            <p className="text-xs font-mono mt-1">Zero missing signatures or imminent expirations identified.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue, idx) => {
              const isHigh = issue.severity === 'HIGH';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all bg-[var(--app-surface)] shadow-2xs ${
                    isHigh
                      ? 'border-[var(--app-danger)]/40 hover:border-[var(--app-danger)]'
                      : 'border-[var(--app-warning)]/40 hover:border-[var(--app-warning)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          isHigh
                            ? 'bg-[var(--app-danger)]/15 text-[var(--app-danger)] border-[var(--app-danger)]/40'
                            : 'bg-[var(--app-warning)]/15 text-[var(--app-warning)] border-[var(--app-warning)]/40'
                        }`}
                      >
                        {issue.severity} EXPOSURE
                      </span>
                      <span className="text-[10px] font-mono text-[var(--app-text-subtle)]">
                        {issue.folder_path}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[var(--app-text)] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[var(--app-primary)] shrink-0" />
                      <span className="truncate">{issue.title}</span>
                    </h4>

                    <ul className="mt-3 space-y-1.5">
                      {issue.issues.map((iss, iIdx) => (
                        <li
                          key={iIdx}
                          className="text-xs font-mono flex items-start gap-1.5 text-[var(--app-text)]"
                        >
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHigh ? 'text-[var(--app-danger)]' : 'text-[var(--app-warning)]'}`} />
                          <span>{iss}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--app-border)] flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-[var(--app-text-subtle)]">
                      Classification: {issue.category}
                    </span>
                    <button
                      onClick={() => onSelectDoc && onSelectDoc(issue.doc_id)}
                      className="text-[var(--app-primary)] hover:underline font-mono text-[11px] font-bold flex items-center gap-1"
                    >
                      <span>Inspect Document</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
