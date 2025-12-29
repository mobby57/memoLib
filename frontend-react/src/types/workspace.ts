export interface Workspace {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  messages_count?: number;
  completion_percentage?: number;
  channel?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  workspace_id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
