export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User extends BaseEntity {
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator'
}

export interface IntakeMessage extends BaseEntity {
  channel: IntakeChannel;
  content: string;
  maskedContent: string;
  sender: string;
  maskedSender: string;
  classification?: MessageClassification;
  priority: Priority;
  status: IntakeStatus;
  ticketId?: string;
  apartmentUnit?: ApartmentUnitInfo;
}

export interface ApartmentUnitInfo {
  dong?: number;
  ho?: number;
  floor?: number;
  formatted: string;
  confidence: number;
  rawMatches: string[];
}

export enum IntakeChannel {
  SMS = 'sms',
  EMAIL = 'email',
  WEB = 'web',
  CALL = 'call',
  KAKAOTALK = 'kakaotalk'
}

export enum IntakeStatus {
  PENDING = 'pending',
  CLASSIFIED = 'classified',
  ASSIGNED = 'assigned',
  PROCESSED = 'processed'
}

export enum MessageClassification {
  MAINTENANCE = 'maintenance',
  COMPLAINT = 'complaint',
  INQUIRY = 'inquiry',
  EMERGENCY = 'emergency',
  BILLING = 'billing',
  NOISE = 'noise',
  PARKING = 'parking',
  SECURITY = 'security'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Ticket extends BaseEntity {
  number: string;
  title: string;
  description: string;
  category: MessageClassification;
  priority: Priority;
  status: TicketStatus;
  assigneeId?: string;
  reporterId: string;
  slaDeadline: Date;
  resolvedAt?: Date;
  intakeMessageId: string;
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}