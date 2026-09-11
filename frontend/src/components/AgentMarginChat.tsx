import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserRole } from '../types';
import { NexusIcon, CATEGORY_BADGES } from '../theme/colors';
import { 
  Terminal, 
  Send, 
  Cpu, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  ShieldAlert, 
  GitCompare, 
  Trash2, 
  Sparkles,
  Paperclip,
  ExternalLink,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Lock
} from 'lucide-react';

interface AgentMarginChatProps {
  currentUserRole: UserRole;
  initialQuery?: string;
  onOpenArtifact?: (docId: string, rawPayload?: any) => void;
  onOpenUpload?: () => void;
}

export const AgentMarginChat: React.FC<AgentMarginChatProps> = ({
  currentUserRole,
  initialQuery,
  onOpenArtifact,
  onOpenUpload,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuery || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [agentStatus, setAgentStatus] = useState<string>('Ready');

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setAgentStatus('Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setAgentStatus(data.content);
        } else if (data.type === 'message') {
          setIsProcessing(false);
          setAgentStatus('Ready');
          setMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              sender: 'agent',
              text: data.content,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              tool_calls: data.tool_calls || [],
              cards: data.cards || []
            }
          ]);
        }
      } catch (e) {
        console.error('Error parsing agent message', e);
      }
    };

    ws.onerror = (e) => {
      console.warn('WebSocket error, will use fallback HTTP agent if needed', e);
      setAgentStatus('Reconnecting...');
    };

    ws.onclose = () => {
      setAgentStatus('Disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setAgentStatus(`Executing MCP Pipeline [Role: ${currentUserRole}]...`);

    const payload = {
      message: query,
      user_role: currentUserRole,
      user_name: currentUserRole === 'admin' ? 'Kaviy (Admin)' : currentUserRole === 'editor' ? 'Editor' : 'Viewer',
      user_id: `user-${currentUserRole}`,
      history: messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        setAgentStatus('Ready');
      }, 800);
    }
  };

  const toggleToolExpand = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 11 Registered MCP Tools in DocMind Server
  const registeredTools = [
    'search_documents',
    'get_document',
    'summarize_document',
    'classify_document',
    'update_metadata',
    'list_folder',
    'move_document',
    'delete_document',
    'compare_documents',
    'get_audit_log',
    'flag_compliance_issues'
  ];

  // Enterprise Command Presets
  const commandPresets = [
    {
      title: 'Full Compliance Audit',
      desc: 'Scan all documents in vault for expired terms & missing signatures',
      query: 'Flag compliance issues: scan for expiring contracts and missing signatures',
      icon: ShieldAlert,
      tag: 'LEGAL GUARD'
    },
    {
      title: 'Vendor Contract Comparison',
      desc: 'Evaluate liability, SLA commitments, and payment terms across agreements',
      query: 'Compare vendor contracts on payment terms, liability, and duration',
      icon: GitCompare,
      tag: 'CROSS-DOC DIFF'
    },
    {
      title: 'Focused Clause Summary',
      desc: 'Extract key clauses and risk exposure parameters from Master Services Agreement',
      query: 'Summarize Master_Services_Agreement_AcmeCorp.txt with focus on payment terms',
      icon: FileText,
      tag: 'NLP ANALYSIS'
    },
    {
      title: 'RBAC Security Mutation Test',
      desc: 'Verify non-destructive permission enforcement and immutable audit logging',
      query: 'Delete document Information_Security_Policy_2026.txt',
      icon: Lock,
      tag: 'POLICY CHECK'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 justify-between">
      
      {/* Top Telemetry Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--app-border)] text-xs font-mono text-[var(--app-text-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--app-secondary)] animate-pulse" />
          <span className="font-bold text-[var(--app-text)]">MCP ENGINE: ACTIVE</span>
          <span className="text-[var(--app-text-subtle)] hidden sm:inline">|</span>
          <span className="text-[var(--app-text-subtle)] hidden sm:inline">ChromaDB Vector Synced</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]">
            AUTH ROLE: {currentUserRole.toUpperCase()}
          </span>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1 rounded hover:bg-[var(--app-surface-hover)] text-[var(--app-text-subtle)] hover:text-[var(--app-text)]"
              title="Reset Session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main View: Empty State vs Message Stream */}
      {messages.length === 0 ? (
        <div className="my-auto py-6 space-y-6 max-w-3xl mx-auto w-full">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--app-primary)]/10 border border-[var(--app-primary)]/30 text-[var(--app-primary)] font-mono text-xs font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Model Context Protocol (MCP) v1.2 Protocol Stack</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--app-text)]">
              Autonomous Document Intelligence Console
            </h1>
            <p className="text-xs sm:text-sm text-[var(--app-text-muted)] max-w-xl mx-auto">
              Execute multi-document semantic queries, cross-contract clause comparisons, compliance audits, and role-enforced mutations directly through the MCP tool matrix.
            </p>
          </div>

          {/* MCP Registered Tools Arsenal */}
          <div className="p-3.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--app-text-subtle)] uppercase">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--app-primary)]" />
                Registered MCP Tool Arsenal ({registeredTools.length} Online)
              </span>
              <span className="text-[var(--app-secondary)]">RBAC GUARDED</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {registeredTools.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded font-mono text-[10px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text-muted)] hover:border-[var(--app-primary)]/50 transition-colors cursor-default"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Command Presets */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--app-text-subtle)]">
              DIRECT EXECUTION PRESETS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {commandPresets.map((c, idx) => {
                const Icon = c.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(c.query)}
                    className="p-3.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-primary)]/60 hover:bg-[var(--app-surface-hover)] shadow-2xs transition-all text-left flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[var(--app-primary)]/10 text-[var(--app-primary)] flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-[var(--app-text)] group-hover:text-[var(--app-primary)] transition-colors">
                            {c.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--app-bg)] text-[var(--app-text-subtle)] border border-[var(--app-border)]">
                          {c.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--app-text-muted)] mt-2 line-clamp-2">
                        {c.desc}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-[var(--app-primary)] opacity-80 group-hover:opacity-100">
                      <span>Execute via MCP</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Message Stream */
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-4 max-h-[calc(100vh-220px)]">
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id || idx}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--app-primary)]/15 border border-[var(--app-primary)]/30 text-[var(--app-primary)] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <NexusIcon className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-3 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Sender Header */}
                  <div className={`flex items-center gap-2 text-[10px] font-mono ${isUser ? 'justify-end text-[var(--app-text-subtle)]' : 'text-[var(--app-text-muted)]'}`}>
                    <span className="font-bold">{isUser ? `OPERATOR [${currentUserRole.toUpperCase()}]` : 'DOCMIND MCP ENGINE'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  {/* Message Bubble / Console Box */}
                  <div
                    className={`rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[var(--app-primary)] text-black font-medium shadow-xs'
                        : 'bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text)] shadow-xs select-text'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>

                  {/* Multi-Stage MCP Execution DAG Trace */}
                  {!isUser && m.tool_calls && m.tool_calls.length > 0 && (
                    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-3 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--app-text-subtle)] uppercase">
                        <span className="font-bold flex items-center gap-1.5">
                          <Cpu className="w-3 h-3 text-[var(--app-primary)]" />
                          MCP Execution Pipeline ({m.tool_calls.length} Stage{m.tool_calls.length > 1 ? 's' : ''})
                        </span>
                        <span className="text-[var(--app-secondary)] font-bold">200 OK</span>
                      </div>

                      {m.tool_calls.map((tc, tIdx) => {
                        const callId = `${m.id}-tool-${tIdx}`;
                        const isExpanded = expandedTools[callId] ?? false;
                        return (
                          <div key={tIdx} className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-mono">
                            <button
                              onClick={() => toggleToolExpand(callId)}
                              className="w-full flex items-center justify-between p-2 hover:bg-[var(--app-surface-hover)] text-left"
                            >
                              <div className="flex items-center gap-2 text-[11px]">
                                <ChevronRight className={`w-3.5 h-3.5 text-[var(--app-text-subtle)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <span className="font-bold text-[var(--app-primary)]">{tc.tool}</span>
                                <span className="text-[10px] text-[var(--app-text-subtle)]">({Object.keys(tc.args || {}).length} arguments)</span>
                              </div>

                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--app-bg)] text-[var(--app-text-muted)] border border-[var(--app-border)]">
                                payload
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="p-2.5 border-t border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] space-y-2 overflow-x-auto">
                                <div>
                                  <div className="text-[var(--app-text-subtle)] uppercase font-bold">Parameters:</div>
                                  <pre className="p-1.5 rounded bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text)] mt-1">
                                    {JSON.stringify(tc.args, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-[var(--app-text-subtle)] uppercase font-bold">Output Matrix:</div>
                                  <pre className="p-1.5 rounded bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text)] mt-1">
                                    {JSON.stringify(tc.result, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Document Action Cards */}
                  {!isUser && m.cards && m.cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 w-full">
                      {m.cards.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-primary)]/60 transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[var(--app-primary)] shrink-0" />
                              <span className="font-bold text-xs text-[var(--app-text)] truncate" title={c.title}>
                                {c.title}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[var(--app-text-muted)] mt-1">
                              {c.category} • {c.badge}
                            </div>
                          </div>

                          {onOpenArtifact && (
                            <button
                              onClick={() => onOpenArtifact(c.doc_id)}
                              className="px-2 py-1 rounded bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--app-primary)] text-[10px] font-mono font-bold text-[var(--app-text)] flex items-center gap-1 shrink-0"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex gap-3.5 items-center text-xs font-mono text-[var(--app-text-muted)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--app-primary)]/15 border border-[var(--app-primary)]/30 text-[var(--app-primary)] flex items-center justify-center animate-spin">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>{agentStatus}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-primary)] animate-ping" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Bottom Command Execution Bar */}
      <div className="pt-3 border-t border-[var(--app-border)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] focus-within:border-[var(--app-primary)] shadow-md transition-all"
        >
          <div className="pl-3 pr-2 text-[var(--app-text-subtle)] font-mono text-xs">
            <Terminal className="w-4 h-4 text-[var(--app-primary)]" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command or semantic query (e.g. 'Compare vendor contracts' or 'Flag compliance issues')..."
            className="flex-1 bg-transparent py-3 text-xs sm:text-sm text-[var(--app-text)] placeholder-[var(--app-text-subtle)] outline-hidden font-sans"
            disabled={isProcessing}
          />

          <div className="pr-2 flex items-center gap-1.5">
            {onOpenUpload && (
              <button
                type="button"
                onClick={onOpenUpload}
                className="p-1.5 rounded-md hover:bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors"
                title="Ingest document to vault"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`p-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                input.trim() && !isProcessing
                  ? 'bg-[var(--app-primary)] text-black hover:bg-[var(--app-primary-hover)] shadow-xs'
                  : 'bg-[var(--app-surface-hover)] text-[var(--app-text-subtle)] cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--app-text-subtle)] mt-2 px-1">
          <span>Press Enter to execute • Shift+Enter for newline</span>
          <span className="text-[var(--app-secondary)]">Strict RBAC Authorization Active</span>
        </div>
      </div>

    </div>
  );
};
