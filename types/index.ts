export interface Message {
  id: string;
  user_id: string;
  sender_name: string;
  sender_type: 'family' | 'global';
  type: 'video' | 'audio' | 'letter';
  media_url?: string;
  thumbnail_url?: string;
  transcript?: string;
  content_text?: string;
  duration?: number;
  recipient_type?: 'individual' | 'global';
  creator_user_id?: string;
  created_at: unknown;
}

export interface Contact {
  id: string;
  owner_user_id: string;
  name: string;
  email?: string;
  relationship_type: 'family' | 'close';
  created_at: unknown;
}

export interface SavedMessage {
  id: string;
  user_id: string;
  message_id: string;
}

export interface ReadStatus {
  id: string;
  user_id: string;
  message_id: string;
  is_read: boolean;
}
