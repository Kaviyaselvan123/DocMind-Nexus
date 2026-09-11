import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../types';
import { PLATFORM_COLORS } from '../theme/colors';
import { 
  ReceiptText, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  RefreshCw,
  Layers,
  Lock,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface AuditDashboardProps {
  onInspectPayload?: (payload: any) => void;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ onInspectPayload }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [toolFilter, setToolFilter] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        fetch('/api/audit/logs?limit=50'),
        fetch('/api/audit/stats')
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (e) {
      console.error('Failed to fetch audit data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchStatus = statusFilter === 'All' || log.status === statusFilter;
    const matchTool = toolFilter === 'All' || log.tool_name === toolFilter;
    return matchStatus && matchTool;
  });

  const uniqueTools = ['All', ...Array.from(new Set(logs.map((l) => l.tool_name)))];

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--app-border)]">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-[var(--app-primary)]" />
            <h2 className="font-bold text-2xl text-[var(--app-text)] tracking-tight">
              Audit & Governance Ledger
            </h2>
          </div>
          <p className="text-xs text-[var(--app-text-muted)] mt-1 font-mono">
            Cryptographically sealed forensic trail of all MCP tool executions, RBAC enforcement decisions, and document mutations.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-semibold text-[var(--app-text)] hover:border-[var(--app-primary)] shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[var(--app-primary)]" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Telemetry KPI Card */}
          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
            <h4 className="font-mono text-xs font-bold text-[var(--app-text-subtle)] uppercase tracking-wider mb-2">
              Execution Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[var(--app-bg)] p-3 rounded-lg border border-[var(--app-border)]">
                <span className="text-[10px] font-mono text-[var(--app-text-subtle)]">TOTAL CALLS</span>
                <p className="font-mono font-bold text-xl text-[var(--app-text)] mt-0.5">
                  {stats.total_executions}
                </p>
              </div>
              <div className="bg-[var(--app-bg)] p-3 rounded-lg border border-[var(--app-border)]">
                <span className="text-[10px] font-mono text-[var(--app-secondary)]">SUCCESS RATE</span>
                <p className="font-mono font-bold text-xl text-[var(--app-secondary)] mt-0.5">
                  {stats.success_rate}%
                </p>
              </div>
              <div className="bg-[var(--app-bg)] p-3 rounded-lg border border-[var(--app-border)]">
                <span className="text-[10px] font-mono text-[var(--app-danger)]">DENIED (RBAC)</span>
                <p className="font-mono font-bold text-xl text-[var(--app-danger)] mt-0.5">
                  {stats.denied_count}
                </p>
              </div>
              <div className="bg-[var(--app-bg)] p-3 rounded-lg border border-[var(--app-border)]">
                <span className="text-[10px] font-mono text-[var(--app-warning)]">PROTOCOL</span>
                <p className="font-mono font-bold text-xl text-[var(--app-primary)] mt-0.5">
                  MCP v1.2
                </p>
              </div>
            </div>
          </div>

          {/* Bar Chart: Industrial Amber */}
          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-4 shadow-2xs">
            <h4 className="font-mono text-xs font-bold text-[var(--app-text-subtle)] uppercase tracking-wider mb-2">
              MCP Tools Execution Volume
            </h4>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.tool_distribution?.slice(0, 5) || []}>
                  <XAxis dataKey="tool" tick={{ fontSize: 9, fill: 'var(--app-text-subtle)' }} interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--app-text-subtle)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', fontSize: 11, fontFamily: 'monospace', color: 'var(--app-text)', borderRadius: 8 }}
                  />
                  <Bar dataKey="count" fill={PLATFORM_COLORS.amberPrimary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Trend: Cyber Emerald */}
          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-4 shadow-2xs">
            <h4 className="font-mono text-xs font-bold text-[var(--app-text-subtle)] uppercase tracking-wider mb-2">
              7-Day Activity Trend
            </h4>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timeline || []}>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--app-text-subtle)' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--app-text-subtle)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', fontSize: 11, fontFamily: 'monospace', color: 'var(--app-text)', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="executions" stroke={PLATFORM_COLORS.emerald} fill={PLATFORM_COLORS.emerald} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-[var(--app-surface)] p-3 rounded-xl border border-[var(--app-border)] shadow-2xs">
        <span className="text-xs font-semibold text-[var(--app-text-muted)] flex items-center gap-1 font-mono">
          <Filter className="w-3.5 h-3.5 text-[var(--app-primary)]" /> Filter Ledger:
        </span>

        <div className="flex items-center gap-1 text-xs">
          {['All', 'SUCCESS', 'DENIED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors border ${
                statusFilter === st
                  ? 'bg-[var(--app-primary)] text-black border-[var(--app-primary)] font-bold'
                  : 'border-[var(--app-border)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={toolFilter}
          onChange={(e) => setToolFilter(e.target.value)}
          className="ml-auto bg-[var(--app-bg)] border border-[var(--app-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--app-text)] font-mono focus:outline-none focus:border-[var(--app-primary)]"
        >
          {uniqueTools.map((t) => (
            <option key={t} value={t}>
              Tool: {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--app-bg)] border-b border-[var(--app-border)] text-[var(--app-text-subtle)]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">TIMESTAMP</th>
                <th className="py-2.5 px-4 font-semibold">TOOL NAME</th>
                <th className="py-2.5 px-4 font-semibold">ACTOR / ROLE</th>
                <th className="py-2.5 px-4 font-semibold">STATUS</th>
                <th className="py-2.5 px-4 font-semibold">DIFF SUMMARY</th>
                <th className="py-2.5 px-4 font-semibold text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]/60 text-[var(--app-text)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--app-text-muted)]">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--app-text-muted)]">
                    No ledger entries match active filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--app-surface-hover)] transition-colors">
                    <td className="py-2.5 px-4 text-[var(--app-text-subtle)] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[var(--app-primary)]">
                      {log.tool_name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span>{log.user_name}</span>
                      <span className="ml-1.5 px-1.5 py-0.2 rounded bg-[var(--app-bg)] text-[10px] uppercase border border-[var(--app-border)]">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[var(--app-secondary)] font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--app-danger)] font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> DENIED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-xs text-[var(--app-text-muted)] max-w-xs truncate" title={log.diff_summary}>
                      {log.diff_summary || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(log)}
                        className="p-1.5 rounded-md text-[var(--app-text-muted)] hover:text-[var(--app-primary)] hover:bg-[var(--app-bg)]"
                        title="View Full Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Inspector Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col justify-between">
            
            <div className="pb-3 border-b border-[var(--app-border)] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--app-primary)] text-black font-bold">
                  AUDIT ID: {selectedEntry.id.slice(0, 8)}
                </span>
                <h3 className="font-bold text-lg text-[var(--app-text)] font-mono mt-1">
                  Tool: {selectedEntry.tool_name}
                </h3>
                <p className="text-xs text-[var(--app-text-muted)] font-mono">
                  Caller: {selectedEntry.user_name} ({selectedEntry.user_role}) • Time: {selectedEntry.timestamp}
                </p>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-[var(--app-text-muted)] hover:text-[var(--app-primary)] text-lg">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {selectedEntry.diff_summary && (
                <div>
                  <h5 className="font-mono text-xs font-bold text-[var(--app-text-subtle)] uppercase mb-1">
                    State Diff:
                  </h5>
                  <div className="p-2.5 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] text-xs font-mono text-[var(--app-primary)]">
                    {selectedEntry.diff_summary}
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-mono text-xs font-bold text-[var(--app-text-subtle)] uppercase mb-1">
                  Input Parameters:
                </h5>
                <pre className="p-3 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] text-xs font-mono overflow-x-auto text-[var(--app-text)]">
                  {JSON.stringify(selectedEntry.input_payload, null, 2)}
                </pre>
              </div>

              <div>
                <h5 className="font-mono text-xs font-bold text-[var(--app-text-subtle)] uppercase mb-1">
                  Output Result:
                </h5>
                <pre className="p-3 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] text-xs font-mono overflow-x-auto text-[var(--app-text)]">
                  {JSON.stringify(selectedEntry.output_payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--app-border)] flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 bg-[var(--app-primary)] text-black rounded-lg text-xs font-bold hover:bg-[var(--app-primary-hover)]"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
