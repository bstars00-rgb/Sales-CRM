// ========== User & Auth (FR-001, BR-001-3 7직급 RBAC) ==========
export type UserRole =
  | 'ceo'
  | 'c_level'
  | 'regional_director'
  | 'director'
  | 'team_manager'
  | 'part_manager'
  | 'team_member'

export const ROLE_LABELS: Record<UserRole, string> = {
  ceo: 'CEO',
  c_level: 'C-Level',
  regional_director: 'Regional Director',
  director: 'Director',
  team_manager: 'Team Manager',
  part_manager: 'Part Manager',
  team_member: 'Team Member',
}

export const ROLE_RANK: Record<UserRole, number> = {
  ceo: 7,
  c_level: 6,
  regional_director: 5,
  director: 4,
  team_manager: 3,
  part_manager: 2,
  team_member: 1,
}

export type LangCode = 'ko' | 'en' | 'vi'
export type ThemePreference = 'light' | 'dark' | 'system'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  region?: 'EA' | 'SEA' | 'SA' | 'ME' | 'OC'
  partId?: string // Part Manager 동일 Part 조회용
  assignedClients?: string[] // PIC 매핑 (channel ids)
  language: LangCode
  themePreference: ThemePreference
  onboardedAt?: string // FR-025
  azureAdGroups?: string[] // Azure AD JWT claims (Phase 1.5)
}

// ========== Channel (구 Client, FR-006) ==========
export type ChannelType = 'OTA' | 'Wholesaler' | 'Corporate' | 'TMC' | 'Meta'
export type Region = 'EA' | 'SEA' | 'SA' | 'ME' | 'OC'
export type Tier = 1 | 2 | 3 // OQ-007: Tier 1(전략) / 2(성장) / 3(신규)
export type PipelineStage = 'Contact' | 'NDA' | 'InDev' | 'Testing' | 'Live'
export type ContractStatus = 'Active' | 'Pending' | 'Expired'
export type SettlementType = 'Weekly' | 'Monthly' | 'Net30' | 'Net60'

export interface Contact {
  id: string
  name: string
  title: string
  role: 'Primary' | 'Secondary' | 'Finance'
  email: string
  phone: string
  birthday?: string
}

export interface Channel {
  id: string
  name: string
  contacts: Contact[]

  // ===== 신규 (Spec) =====
  sellerNameAliases?: string[]
  countryCode?: string
  region: Region | 'East Asia' | 'SE Asia' | 'South Asia' | 'Middle East' | 'Oceania'
  tier?: Tier
  channelType?: ChannelType
  pipelineStage?: PipelineStage
  picUserId?: string

  ttvJPY?: number
  revenueJPY?: number
  rn?: number
  bookings?: number
  shareOfTTV?: number
  ttvWoW?: number
  bookingsWoW?: number

  contractStatus?: ContractStatus
  contractStartDate?: string
  settlement?: SettlementType
  creditLimitJPY?: number
  creditUsageJPY?: number

  notes?: string
  isFavorite?: boolean
  createdAt?: string
  updatedAt?: string

  // ===== Legacy (기존 페이지 점진 이행용) =====
  status?: ContractStatus
  autoTier?: Tier | 0 | 4 // alias 기존 0~4 호환
  targetTier?: Tier | 0 | 4 | null
  country?: string
  assignedManager?: string
  contractEntity?: string
  markupPercent?: number
  supplyCurrency?: string
  paymentTerms?: string
  depositType?: string
  depositAmount?: number
  opContacts?: { ours: string; theirs: string }
  creditLimit?: number
  creditUsage?: number
  creditUsagePercent?: number
  lastYearRevenue?: number
  ytdTTV?: number
  ytdRevenue?: number
  ytdRoomNights?: number
  ytdBookings?: number
  rank?: number
  sharePercent?: number
}

// 호환성 (기존 코드 점진 이행용)
export type Client = Channel
export type ClientStatus = ContractStatus
export type TierLevel = Tier

// ========== Activity (FR-003 HubSpot 스타일) ==========
export type ActivityType =
  | 'Email'
  | 'Call'
  | 'Meeting'
  | 'Note'
  | 'Contract'
  | 'Issue'
  | 'Promotion'
  | 'Visit'

export interface Activity {
  id: string
  channelId: string
  authorUserId: string
  type: ActivityType
  occurredAt: string
  durationMin?: number
  subject: string
  content: string
  action?: string
  note?: string
  relatedTaskId?: string
  relatedContactId?: string
  attachments?: string[]
  source: 'manual' | 'email-sync' | 'auto'
  createdAt: string
  updatedAt: string
}

// ========== Critical 6 Task (FR-002) ==========
export type TaskCategory =
  | 'NewDeal'
  | 'Promotion'
  | 'Issue'
  | 'Contract'
  | 'Pipeline'
  | 'Internal'
  | 'Follow-up'

export type TaskStatus = 'Planned' | 'InProgress' | 'Done' | 'Skipped'
export type TaskRank = 1 | 2 | 3 | 4 | 5 | 6

export interface Task {
  id: string
  ownerUserId: string
  date: string // YYYY-MM-DD
  rank: TaskRank
  channelId?: string
  category: TaskCategory
  title: string
  expectedOutcome?: string
  status: TaskStatus
  doneAt?: string
  doneActivityIds?: string[]
  resultNote?: string
  carryOver?: boolean
  createdAt: string
  updatedAt: string
}

// ========== Daily Briefing (FR-004) ==========
// 'EditRequested'는 Submitted 후 24h 초과 + 수정 요청 시 Manager 승인 대기 상태
export type BriefingStatus = 'Draft' | 'Submitted' | 'EditRequested'

export interface DailyBriefing {
  id?: string
  userId?: string
  date: string
  status?: BriefingStatus
  generatedAt?: string
  submittedAt?: string

  // 자동 집계 (loose to allow both old/new shapes)
  kpiChanges: {
    metric: string
    yesterday: number
    today: number
    change?: number
    changePercent: number
  }[]
  completedTasks?: string[]
  registeredActivities?: string[]
  channelsTouched?: number

  // 수동 입력
  issues?: string
  tomorrowActions?: string
  comment?: string

  // legacy fields
  urgentClients?: {
    clientId: string
    clientName: string
    reason: string
    severity: AlertSeverity
  }[]
  todaySchedule?: {
    time: string
    title: string
    type: string
  }[]
  actionItems?: {
    priority: 'high' | 'medium' | 'low'
    description: string
    clientName?: string
  }[]

  // new fields
  urgentChannels?: {
    channelId: string
    channelName: string
    reason: string
    severity: AlertSeverity
  }[]
}

// ========== Weekly Sales Brief (FR-005) ==========
export type BriefStatus = 'Draft' | 'UnderReview' | 'Confirmed' | 'Published'

export interface BriefItem {
  channelId?: string
  userId: string
  category: string
  title: string
  detail: string
  sourceActivityIds: string[]
}

export interface WeeklySalesBrief {
  id: string
  weekStartDate: string // YYYY-MM-DD (토요일)
  weekEndDate: string

  kpi: {
    bookings: number
    rn: number
    ttvJPY: number
    revenueJPY: number
    ctripSharePct: number
    chinaSharePct: number
    top3NonCtripPct: number
    bookingsWoW: number
    rnWoW: number
    ttvWoW: number
    revenueWoW: number
  }

  sections: {
    newChannelDeals: BriefItem[]
    openTesting: BriefItem[]
    promotionsSales: BriefItem[]
    issueResponses: BriefItem[]
    regionalHighlights: BriefItem[]
    nextWeekFocus: BriefItem[]
  }

  teamContribution: {
    userId: string
    activityCount: number
    taskDoneCount: number
    channelsTouched: number
  }[]

  decisionRequestIds: string[]

  status: BriefStatus
  generatedAt: string
  reviewedByUserId?: string
  confirmedAt?: string
  publishedAt?: string
  pdfUrl?: string
  pdfInternalUrl?: string
  shareToken?: string
  shareTokenExpiresAt?: string
}

// ========== Pipeline (FR-012) ==========
export interface PipelineStageHistory {
  id: string
  channelId: string
  fromStage: PipelineStage | null
  toStage: PipelineStage
  changedAt: string
  changedByUserId: string
  durationDays?: number
  notes?: string
}

// ========== Contract Change / SG Flip (FR-009) ==========
export type ContractChangeType =
  | 'SG-Flip'
  | 'Settlement-Change'
  | 'CreditLimit-Change'
  | 'Renewal'
export type ContractChangeStatus = 'Pending' | 'InProgress' | 'Completed' | 'Rejected'

export interface ContractChange {
  id: string
  channelId: string
  type: ContractChangeType
  oldValue?: string
  newValue?: string
  contractDate: string
  followUpDate?: string
  completedDate?: string
  citiBankRef?: string
  status: ContractChangeStatus
  ownerUserId: string
  notes?: string
  rejectionReason?: string
}

// ========== Decision Request (FR-014) ==========
export type DecisionCategory = 'Pricing' | 'Contract' | 'Resource' | 'Strategy'
export type DecisionStatus = 'Open' | 'UnderReview' | 'Decided' | 'Deferred'
export type DecisionByRole = 'director' | 'ceo'

export interface DecisionRequest {
  id: string
  weeklyBriefId?: string
  requestedByUserId: string
  category: DecisionCategory
  title: string
  detail: string
  options: string[]
  decisionByRole: DecisionByRole
  status: DecisionStatus
  decidedAt?: string
  decision?: string
  decisionNote?: string
  createdAt: string
}

// ========== Promotion / GroupBooking (FR-018) ==========
export interface Promotion {
  id: string
  channelId: string
  name: string
  periodStart: string
  periodEnd: string
  discountPct: number
  expectedRN?: number
  status: 'Planned' | 'Active' | 'Ended' | 'Cancelled'
  createdByUserId: string
}

export interface GroupBooking {
  id: string
  channelId: string
  groupName: string
  checkIn: string
  checkOut: string
  roomCount: number
  totalTTV: number
  status: 'Pending' | 'Confirmed' | 'Cancelled'
  createdByUserId: string
}

// ========== KPI (캐스케이드 + 실적) ==========
export interface KPIData {
  ttv: number
  revenue: number
  roomNights: number
  bookings: number
  ttvYoY: number | null
  ttvMoM: number | null
  ttvWoW: number | null
  revenueYoY: number | null
  revenueMoM: number | null
  revenueWoW: number | null
  roomNightsYoY: number | null
  roomNightsMoM: number | null
  roomNightsWoW: number | null
  bookingsYoY: number | null
  bookingsMoM: number | null
  bookingsWoW: number | null
}

export interface KPITarget {
  annualTTV: number
  annualRevenue: number
  annualRoomNights: number
  quarters: {
    q1: { target: number; current: number }
    q2: { target: number; current: number }
    q3: { target: number; current: number }
    q4: { target: number; current: number }
  }
}

// FR-008 KPI Cascade
export interface CascadeL1 {
  year: number
  ttvTarget: number
  revenueTarget: number
  ctripCapPct: number // ≤35%
  chinaCapPct: number // ≤65%
}

export interface CascadeL2 {
  year: number
  region: Region
  pct: number // L1 대비 %
}

export interface TierWeight {
  tier: Tier
  weight: number // 50/30/20
}

export interface SeasonalityWeight {
  year: number
  month: number // 1~12
  weight: number // SCM CRM read-only (BR-008-5)
  source: 'SCM' | 'fallback'
  lastSyncedAt: string
}

// ========== Alert / Notification (FR-010) ==========
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'info' | 'warning' /* legacy */
export type AlertStatus = 'created' | 'read' | 'resolved'
export type AlertType =
  | 'credit_usage'
  | 'credit_overdue'
  | 'booking_surge'
  | 'booking_drop'
  | 'cancel_rate'
  | 'capacity_risk'
  | 'pipeline_stale'
  | 'ctrip_threshold_breach'
  | 'china_threshold_breach'
  | 'contract_expiring'
  | 'task_overdue'

export interface Alert {
  id: string
  channelId: string
  channelName: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  message: string
  value?: number
  threshold?: number
  streakDays?: number // BR-010-8 N일 연속
  createdAt: string
  readAt?: string
  resolvedAt?: string
  resolutionMemo?: string
}

export interface Notification {
  id: string
  userId: string
  type: 'credit' | 'booking' | 'pipeline' | 'contract' | 'okr' | 'task' | 'system'
  title: string
  body: string
  severity: AlertSeverity
  read: boolean
  link?: string
  createdAt: string
  linkedAlertId?: string
  linkedChannelId?: string
}

// ========== Performance ==========
export type ChannelLegacy = 'OTA' | 'API' | 'Wholesale'

export interface ChannelData {
  channel: ChannelLegacy
  ttv: number
  revenue: number
  roomNights: number
  mixPercent: number
}

export interface MonthlyData {
  month: number
  ttv: number
  revenue: number
  roomNights: number
}

export interface QuarterData {
  quarter: string
  months: MonthlyData[]
  totalTTV: number
  totalRevenue: number
  totalRoomNights: number
}

// ========== Filters ==========
export interface GlobalFilters {
  clients: string[]
  countries: string[]
  hotels: string[]
  regions: Region[]
  tiers: Tier[]
  dateRange: { start: string; end: string }
  currency: 'JPY'
}

// ========== Comment ==========
export interface InlineComment {
  id: string
  targetType: 'kpi_card' | 'chart' | 'data_element'
  targetId: string
  authorId: string
  authorName: string
  content: string
  mentions: string[]
  createdAt: string
  updatedAt?: string
  isOrphan: boolean
}

// ========== Hotel / Market News ==========
export interface Hotel {
  id: string
  name: string
  country: string
  region: Region
  code: string
}

export interface MarketNews {
  id: string
  fetchedAt: string
  category: 'Macro' | 'Competitor'
  competitor?: string
  title: string
  summary: string
  sourceUrl: string
  publishedAt: string
  language: LangCode
}
