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
  // 공용 공간 및 시설 관련
  COMMON_FACILITY = 'common_facility',           // 복도·주차장·엘리베이터 등 공용시설 고장 또는 파손
  ACCESS_CONTROL = 'access_control',             // 공동현관 비밀번호 변경 및 출입 통제
  SECURITY = 'security',                         // 보안 관련 문의
  LANDSCAPING = 'landscaping',                   // 정원, 놀이터, 운동시설, 쓰레기장 등 청결, 환경, 조경 관리
  LIGHTING = 'lighting',                         // 공용 전기·조명 등 계절별 점등 시간, 소등·점검
  
  // 생활 불편 및 위생 관련
  NOISE = 'noise',                               // 소음(층간소음, 기계실 소음, 집회 소리 등) 민원·중재
  HYGIENE = 'hygiene',                           // 악취, 곰팡이, 해충·벌레 등 환경 위생 문제
  SMOKING = 'smoking',                           // 간접흡연(복도·베란다 등) 관련 피해
  
  // 주차·교통 관련
  PARKING = 'parking',                           // 주차장 무단 점유 및 불법 주차, 방문차량 등록, 전기차 충전소
  
  // 입주민·관리사무소 관련 분쟁 및 문의
  RESIDENT_DISPUTE = 'resident_dispute',         // 입주민 간 다툼, 폭언, 폭행, 인신공격
  STAFF_SERVICE = 'staff_service',               // 관리사무소나 경비·미화 직원의 서비스·복무 관련
  
  // 개인 공간 및 기타 문의
  UNIT_REPAIR = 'unit_repair',                   // 세대 내 하자·보수 요청
  BILLING = 'billing',                           // 공동 분담금(관리비, 청소비 등) 부과 내역
  ADMINISTRATION = 'administration',             // 회계, 인사, 시설 증개축 관련 행정 처리
  STATUS_INQUIRY = 'status_inquiry',             // 각종 민원이나 신고 처리 상태 문의
  
  // 기타 자주 접수되는 문의
  DELIVERY = 'delivery',                         // 택배/우편물 분실 또는 수령 관련
  SAFETY = 'safety',                             // 단지 내 안전(비상벨, CCTV 등) 점검
  EMERGENCY = 'emergency',                       // 정전, 단수, 급수 불량, 난방(온수) 불량 등 긴급 상황
  SCHEDULE = 'schedule',                         // 외주 공사, 도색, 소독 등 단지 정기 일정 공지
  
  // 기본 분류
  INQUIRY = 'inquiry',                           // 일반 문의
  COMPLAINT = 'complaint',                       // 일반 민원
  MAINTENANCE = 'maintenance'                    // 일반 시설 관리
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