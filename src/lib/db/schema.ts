import {
  pgTable, uuid, text, boolean, integer, numeric,
  timestamp, jsonb, serial, primaryKey, uniqueIndex, index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────
export const members = pgTable('members', {
  id:                 uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email:              text('email').unique().notNull(),
  displayName:        text('display_name').notNull(),
  timezone:           text('timezone').default('UTC'),
  targetHourlyRate:   numeric('target_hourly_rate', { precision: 8, scale: 2 }),
  minProjectBudget:   numeric('min_project_budget', { precision: 10, scale: 2 }),
  hoursPerWeek:       integer('hours_per_week'),
  yearsExperience:    integer('years_experience'),
  workPreference:     text('work_preference'),
  about:              text('about'),
  githubUrl:          text('github_url'),
  portfolio:          jsonb('portfolio').default([]),
  profileEmbedding:   text('profile_embedding'),  // stored as JSON string of number[]
  digestOptOut:       boolean('digest_opt_out').default(false),
  privacyAgreedAt:    timestamp('privacy_agreed_at', { withTimezone: true }),
  role:               text('role').default('member'),
  isActive:           boolean('is_active').default(true),
  createdAt:          timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  lastActiveAt:       timestamp('last_active_at', { withTimezone: true }),
})

// ─────────────────────────────────────────────
// SKILLS TAXONOMY
// ─────────────────────────────────────────────
export const skills = pgTable('skills', {
  id:        serial('id').primaryKey(),
  name:      text('name').unique().notNull(),
  cluster:   text('cluster').notNull(),
  embedding: text('embedding'),  // JSON string of number[]
})

export const skillAliases = pgTable('skill_aliases', {
  alias:   text('alias').primaryKey(),
  skillId: integer('skill_id').references(() => skills.id),
})

export const memberSkills = pgTable('member_skills', {
  memberId:   uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  skillId:    integer('skill_id').references(() => skills.id),
  selfRating: integer('self_rating'),
  isVerified: boolean('is_verified').default(false),
  proofText:  text('proof_text'),
  status:     text('status').default('active'),
}, (t) => [primaryKey({ columns: [t.memberId, t.skillId] })])

// ─────────────────────────────────────────────
// PLATFORMS
// ─────────────────────────────────────────────
export const platforms = pgTable('platforms', {
  id:                serial('id').primaryKey(),
  name:              text('name').unique().notNull(),
  slug:              text('slug').unique().notNull(),
  url:               text('url').notNull(),
  platformType:      text('platform_type'),
  trustTier:         integer('trust_tier'),
  trustScore:        integer('trust_score'),
  rateMinAiml:       numeric('rate_min_aiml', { precision: 8, scale: 2 }),
  rateMaxAiml:       numeric('rate_max_aiml', { precision: 8, scale: 2 }),
  paymentModel:      text('payment_model'),
  hasEscrow:         boolean('has_escrow'),
  hasIdVerification: boolean('has_id_verification'),
  typicalTimeToPay:  text('typical_time_to_pay'),
  setupGuide:        text('setup_guide'),
  applicationGuide:  text('application_guide'),
  platformTips:      text('platform_tips'),
  redFlags:          text('red_flags'),
  isActive:          boolean('is_active').default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
})

export const memberPlatformAccounts = pgTable('member_platform_accounts', {
  memberId:            uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  platformId:          integer('platform_id').references(() => platforms.id),
  hasAccount:          boolean('has_account').default(false),
  profileUrl:          text('profile_url'),
  profileCompleteness: integer('profile_completeness'),
  interestLevel:       text('interest_level'),
}, (t) => [primaryKey({ columns: [t.memberId, t.platformId] })])

export const platformReviews = pgTable('platform_reviews', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  platformId: integer('platform_id').references(() => platforms.id),
  memberId:   uuid('member_id').references(() => members.id),
  reviewText: text('review_text').notNull(),
  rating:     integer('rating'),
  createdAt:  timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
})

// ─────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id:                 uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  platformId:         integer('platform_id').references(() => platforms.id),
  sourceJobId:        text('source_job_id'),
  sourceUrl:          text('source_url').notNull(),
  title:              text('title').notNull(),
  company:            text('company'),
  description:        text('description'),
  descriptionExcerpt: text('description_excerpt'),
  rateMin:            numeric('rate_min', { precision: 8, scale: 2 }),
  rateMax:            numeric('rate_max', { precision: 8, scale: 2 }),
  rateType:           text('rate_type'),
  jobType:            text('job_type'),
  isRemote:           boolean('is_remote').default(true),
  location:           text('location'),
  postedAt:           timestamp('posted_at', { withTimezone: true }),
  ingestedAt:         timestamp('ingested_at', { withTimezone: true }).default(sql`NOW()`),
  status:             text('status').default('pending'),
  reliabilityScore:   integer('reliability_score'),
  reliabilitySignals: jsonb('reliability_signals'),
  extractedSkills:    text('extracted_skills').array(),
  jobEmbedding:       text('job_embedding'),  // JSON string of number[]
  dedupHash:          text('dedup_hash').unique(),
  applicationCount:   integer('application_count'),
})

// ─────────────────────────────────────────────
// MATCHING
// ─────────────────────────────────────────────
export const memberJobMatches = pgTable('member_job_matches', {
  memberId:      uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  jobId:         uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  matchScore:    numeric('match_score', { precision: 5, scale: 2 }),
  skillScore:    numeric('skill_score', { precision: 5, scale: 2 }),
  semanticScore: numeric('semantic_score', { precision: 5, scale: 2 }),
  rateScore:     numeric('rate_score', { precision: 5, scale: 2 }),
  expScore:      numeric('exp_score', { precision: 5, scale: 2 }),
  availScore:    numeric('avail_score', { precision: 5, scale: 2 }),
  missingSkills: text('missing_skills').array(),
  matchedSkills: text('matched_skills').array(),
  isNearMiss:    boolean('is_near_miss').default(false),
  computedAt:    timestamp('computed_at', { withTimezone: true }).default(sql`NOW()`),
}, (t) => [primaryKey({ columns: [t.memberId, t.jobId] })])

// ─────────────────────────────────────────────
// APPLICATION TRACKING
// ─────────────────────────────────────────────
export const applications = pgTable('applications', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  memberId:       uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  jobId:          uuid('job_id').references(() => jobs.id),
  platformId:     integer('platform_id').references(() => platforms.id),
  status:         text('status').default('saved'),
  appliedAt:      timestamp('applied_at', { withTimezone: true }),
  rateProposed:   numeric('rate_proposed', { precision: 8, scale: 2 }),
  rateAgreed:     numeric('rate_agreed', { precision: 8, scale: 2 }),
  daysToResponse: integer('days_to_response'),
  notes:          text('notes'),
  checklistState: jsonb('checklist_state'),
  createdAt:      timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).default(sql`NOW()`),
})

// ─────────────────────────────────────────────
// PROPOSALS
// ─────────────────────────────────────────────
export const proposalLogs = pgTable('proposal_logs', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  memberId:    uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  jobId:       uuid('job_id').references(() => jobs.id),
  platformId:  integer('platform_id').references(() => platforms.id),
  generatedAt: timestamp('generated_at', { withTimezone: true }).default(sql`NOW()`),
  // proposal text NOT stored — privacy
})

// ─────────────────────────────────────────────
// LEARNING RESOURCES
// ─────────────────────────────────────────────
export const learningResources = pgTable('learning_resources', {
  id:           serial('id').primaryKey(),
  skillId:      integer('skill_id').references(() => skills.id),
  title:        text('title').notNull(),
  provider:     text('provider'),
  url:          text('url').notNull(),
  cost:         text('cost').default('free'),
  estHours:     numeric('est_hours', { precision: 4, scale: 1 }),
  format:       text('format'),
  qualityScore: integer('quality_score').default(80),
})

// ─────────────────────────────────────────────
// SYSTEM
// ─────────────────────────────────────────────
export const ingestionRuns = pgTable('ingestion_runs', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sourceName:  text('source_name').notNull(),
  startedAt:   timestamp('started_at', { withTimezone: true }).default(sql`NOW()`),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  jobsFetched: integer('jobs_fetched').default(0),
  jobsNew:     integer('jobs_new').default(0),
  jobsDuped:   integer('jobs_duped').default(0),
  status:      text('status'),
  errorMsg:    text('error_msg'),
})

export const scamReports = pgTable('scam_reports', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  jobId:      uuid('job_id').references(() => jobs.id),
  reportedBy: uuid('reported_by').references(() => members.id),
  reason:     text('reason'),
  createdAt:  timestamp('created_at', { withTimezone: true }).default(sql`NOW()`),
  resolved:   boolean('resolved').default(false),
})

// ─────────────────────────────────────────────
// RATE BENCHMARKS (Phase 4 — seeded static data)
// ─────────────────────────────────────────────
export const rateBenchmarks = pgTable('rate_benchmarks', {
  id:           serial('id').primaryKey(),
  platformId:   integer('platform_id').references(() => platforms.id),
  skillCluster: text('skill_cluster'),
  p25:          numeric('p25', { precision: 8, scale: 2 }),
  p50:          numeric('p50', { precision: 8, scale: 2 }),
  p75:          numeric('p75', { precision: 8, scale: 2 }),
  source:       text('source'),
  asOfDate:     text('as_of_date'),
})

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Skill = typeof skills.$inferSelect
export type Platform = typeof platforms.$inferSelect
export type Job = typeof jobs.$inferSelect
export type Application = typeof applications.$inferSelect
export type MemberJobMatch = typeof memberJobMatches.$inferSelect
export type LearningResource = typeof learningResources.$inferSelect
