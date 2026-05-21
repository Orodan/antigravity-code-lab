export interface Note {
  id: string;
  title: string;
  content: string;
  color: string; // e.g., 'yellow', 'blue', 'green', 'pink', 'purple', 'rose'
  category?: string;
  tags?: string[];
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeColor?: string | null;
  createdAt: number;
  updatedAt: number;
  lastEditedBy: string;
  lastEditedById: string;
  isLocked: boolean;
  lockedBy: string | null;
  lockedByName: string | null;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  color: string;
}

export interface Participant {
  id: string;
  name: string;
  color: string; // Tailwind tint color e.g., '#F87171'
  typingNoteId: string | null;
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  userName: string;
  userColor: string;
  action: string; // e.g., "a créé la note 'Projet A'", "a modifié le texte", etc.
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  notes: Note[];
  participants: Participant[];
  users?: WorkspaceUser[];
  chat: ChatMessage[];
  activityLog: ActivityLog[];
}
