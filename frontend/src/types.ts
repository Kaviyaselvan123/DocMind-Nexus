export type UserRole = 'admin' | 'editor' | 'viewer';

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  folder_path: string;
  tags: string[];
  file_size: number;
  mime_type: string;
  expiration_date: string | null;
  has_signature: boolean;
  created_at: string;
  updated_at: string;
  version_count: number;
}

export interface DocumentDetail extends DocumentItem {
  content_text: string;
  summary?: string;
  file_hash?: string;
  is_compliant?: boolean;
  compliance_notes?: string;
  current_version?: number;
  versions: {
    version_num: number;
    summary_diff: string;
    created_by: string;
    created_at: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  tool_name: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  diff_summary: string;
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
}

export interface ComplianceIssue {
  doc_id: string;
  title: string;
  category: string;
  folder_path: string;
  issues: string[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  tool_calls?: {
    tool: string;
    args: Record<string, any>;
    result: Record<string, any>;
  }[];
  cards?: {
    doc_id?: string;
    title: string;
    category?: string;
    badge?: string;
    badge_type?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  }[];
}
