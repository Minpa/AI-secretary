# Requirements Document

## Introduction

The Intake Hub is a unified intake system for apartment complex operations that handles multiple communication channels (SMS, Email, Web Form, and Call Log). It serves as the entry point for all resident inquiries and issues, automatically classifying them into appropriate categories while protecting resident privacy through PII masking. The system ensures rapid processing and proper routing of incoming requests to maintain SLA compliance.

## Requirements

### Requirement 1

**User Story:** As a resident, I want to report issues through multiple channels (SMS, email, web form), so that I can use my preferred communication method to get help.

#### Acceptance Criteria

1. WHEN a resident sends an SMS to the system THEN the system SHALL receive and process the message within 3 seconds (p95)
2. WHEN a resident submits a web form THEN the system SHALL validate the submission and create an intake record
3. WHEN an email is received THEN the system SHALL parse and process it through the intake pipeline
4. WHEN a call log entry is created THEN staff SHALL be able to convert it to a ticket with one click

### Requirement 2

**User Story:** As a resident, I want my personal information to be protected, so that my privacy is maintained while still receiving help.

#### Acceptance Criteria

1. WHEN any message contains PII (phone, email, unit number) THEN the system SHALL mask it before any LLM processing
2. WHEN PII is detected THEN the system SHALL replace it with tokens (e.g., <PHONE_####>, <EMAIL_###>, <UNIT_$1-$2>)
3. WHEN storing data THEN the system SHALL store both masked and original versions with appropriate access controls
4. IF consent is not provided THEN the system SHALL only store masked versions

### Requirement 3

**User Story:** As a property manager, I want incoming requests to be automatically classified by category and urgency, so that I can prioritize and route them appropriately.

#### Acceptance Criteria

1. WHEN a message is received THEN the system SHALL classify it into one of 12 predefined categories
2. WHEN urgent keywords are detected THEN the system SHALL mark the intake as urgent regardless of LLM output
3. WHEN classification is complete THEN the system SHALL provide a Korean summary (≤140 chars) and evidence (≤40 chars)
4. IF LLM classification fails THEN the system SHALL retry once and fallback to rule-based classification

### Requirement 4

**User Story:** As a property manager, I want to avoid duplicate tickets and spam, so that staff time is used efficiently.

#### Acceptance Criteria

1. WHEN a message is received from the same unit with the same category within 30 minutes THEN the system SHALL flag it as a potential duplicate
2. WHEN spam indicators are detected THEN the system SHALL filter the message appropriately
3. WHEN rate limits are exceeded by a sender THEN the system SHALL apply rate limiting controls
4. WHEN deduplication occurs THEN the system SHALL log the decision for audit purposes

### Requirement 5

**User Story:** As a system administrator, I want secure message ingestion with proper validation, so that the system is protected from malicious inputs.

#### Acceptance Criteria

1. WHEN SMS webhooks are received THEN the system SHALL validate HMAC signatures
2. WHEN invalid HMAC signatures are detected THEN the system SHALL return 401 and log the attempt
3. WHEN web forms are submitted THEN the system SHALL validate against CAPTCHA
4. WHEN any rejection occurs THEN the system SHALL create an audit log entry

### Requirement 6

**User Story:** As a property manager, I want to receive immediate notifications for urgent issues, so that critical problems can be addressed quickly.

#### Acceptance Criteria

1. WHEN an urgent intake is classified THEN the system SHALL emit an IntakeCreated event within 3 seconds
2. WHEN urgent keywords are detected THEN the system SHALL force urgent=1 flag
3. WHEN IntakeCreated events are emitted THEN they SHALL include intake_id, channel, received_at, category, and urgent status
4. WHEN events are processed THEN downstream systems SHALL receive notifications for proper routing

### Requirement 7

**User Story:** As a system administrator, I want comprehensive logging and monitoring, so that I can track system performance and troubleshoot issues.

#### Acceptance Criteria

1. WHEN any intake is processed THEN the system SHALL log all processing steps with timestamps
2. WHEN admin edits are made THEN the system SHALL create audit log entries
3. WHEN classification rules are updated THEN the system SHALL maintain a weekly update pipeline
4. WHEN system performance is measured THEN intake-to-ticket processing SHALL meet p95 ≤3s SLA# AI Secretary (Ops Memory + Risk) — MVP Spec (KIRO-ready)
_Last updated: 2025-09-20 02:21_

This document provides a human-readable summary and the full **KIRO YAML spec** for the MVP (7 modules).
It is aligned with our goals: preserve operations memory across vendor changes, improve SLA hit rates, and deliver board-ready reports.

## Executive Summary
- **Modules (7)**: Intake Hub, Ticketing & SLA, Ops Memory Vault, Reports & Handover Pack, ERP Reader (CSV), Risk Brief v1, Admin & Security  
- **Customer-facing SLA**: First response ≤24h (general) / ≤2h (urgent); Resolution ≤72h / ≤24h  
- **Platform SLO**: Intake→Ticket p95 ≤3s; Notification p95 ≤60s; CSV ingest p95 ≤10m; PDF p95 ≤30s  
- **Privacy**: PII masked before any LLM call; Aggregates use k-anonymity (k≥10) + 30-day delay  
- **ERP**: Read-only (CSV). ERP stays the System of Record (SOR).

## Modules Overview (brief)
- **Intake Hub**: Multi-channel intake (SMS/Email/Web/Call), PII masking, rules+small-LLM classification, dedup/spam, `IntakeCreated` event.  
- **Ticketing & SLA**: State machine (received→assigned→in_progress→done→reopened), timers (due-soon/overdue), notifications, merge, CSV export.  
- **Ops Memory Vault**: Daily/Monthly aggregates with k-anonymity & 30-day delay, CSV exports (safe).  
- **Reports & Handover**: Branded PDF + CSV bundle (Top10, P50/P90, channel mix, peaks, reopen), one-click and scheduled.  
- **ERP Reader (CSV)**: Billing/Receipts/Metering CSV ingestion with schema validation and idempotency; read-only side context.  
- **Risk Brief v1**: Rule-based Top-3 risks + weekly action calendar; embedded into reports.  
- **Admin & Security**: Email+OTP, RBAC, tenant scoping, settings, audit logs, backups/monitoring.

---

## Full Specification (YAML)
> The following block is the machine-consumable spec used by KIRO.

```yaml

spec:
  id: ai-secretary-mvp-v0.3
  name: AI Secretary (Ops Memory + Risk)
  owner: Project D
  description: >
    Vendor-neutral operations layer for apartment complexes.
    Keeps operational history (complaints/issues), predicts upcoming risks,
    and provides action playbooks while reading accounting data from existing ERP.
    MVP consists of 7 modules defined below.

  goals:
    - Preserve "operations memory" across vendor changes (handover-ready)
    - Cut P50 handle time by 30% within 6 months
    - Reduce >24h unanswered share by 50% within 6 months
    - Reduce reopen rate by 20% within 6 months

  non_goals:
    - No accounting calculations; ERP remains the System of Record (SOR)
    - No resident app requirement; phone/SMS-first is sufficient
    - No Kakao official integration and no conversational call-bot in MVP

  stakeholders:
    - property_management_companies
    - site_managers (소장)
    - HOA/board (입대위)
    - residents (notification receivers)

  success_metrics:
    - p50_handle_time_hours
    - rate_over_24h_unanswered
    - reopen_rate
    - resident_update_rate

  categories:
    - { id: billing_ar,         ko: "관리비/연체",       en: "Billing/Delinquency" }
    - { id: metering_fees,      ko: "검침/요금",         en: "Metering/Fees" }
    - { id: parking_gate,       ko: "주차/차단기",       en: "Parking/Gate" }
    - { id: access_codes,       ko: "출입/카드/비밀번호", en: "Access/Card/Code" }
    - { id: elevator,           ko: "엘리베이터",        en: "Elevator" }
    - { id: noise_dispute,      ko: "소음/민원",         en: "Noise/Dispute" }
    - { id: cleaning,           ko: "청소/미화",         en: "Cleaning" }
    - { id: security_guard,     ko: "보안/경비",         en: "Security/Guard" }
    - { id: facility_repair,    ko: "시설/수선(하자)",   en: "Facility/Repair" }
    - { id: amenity_booking,    ko: "예약/공용시설",     en: "Amenity/Booking" }
    - { id: recycling_env,      ko: "분리수거/환경",     en: "Recycling/Environment" }
    - { id: parcel_lost,        ko: "택배/분실",         en: "Parcel/Lost" }

  slas:
    customer_facing:
      first_response_general: "≤24h"
      first_response_urgent:  "≤2h"
      resolution_general:     "≤72h"
      resolution_urgent:      "≤24h"
    platform_slos:
      availability_monthly: "≥99.5%"
      intake_to_ticket_p95: "≤3s"
      notification_dispatch_p95: "≤60s"
      csv_ingest_complete_p95: "≤10m"
      pdf_generate_p95: "≤30s"

  security_privacy:
    - "Mask PII before any LLM call (phone/email/unit)"
    - "Store originals only with consent and restricted access"
    - "Aggregation layer: k-anonymity k≥10; 30-day delay for public aggregates"
    - "TLS in transit; daily backups (30d retention); immutable audit logs (≥6m)"
    - "RBAC: admin/staff/viewer; tenant scoping per complex"

  dependencies:
    postgres: ">=15"
    redis: ">=6"
    object_storage: "S3-compatible (MinIO dev / AWS S3 prod)"
    llm_gateway: "Ollama (small LLM, e.g., Mistral-7B)"
    sms_gateway: "Dev: Twilio; Prod: NHN Toast or Aligo"
    email: "Inbound relay or IMAP; Outbound SES/SendGrid"
    pdf: "Playwright/Chromium; Noto Sans KR embedded"
    ci_cd: "GitHub Actions"
    runtime: "Docker; K8s/KIRO compatible"

  modules:

    - id: intake-hub
      name: Intake Hub
      description: >
        Unified intake for SMS, Email, Web Form, and Call Log.
        PII masking, rule+small-LLM classification into 12 categories, urgency detection,
        dedup/spam filtering, and IntakeCreated event emission.
      scope:
        in_scope:
          - SMS webhook (HMAC) ingestion
          - Email ingestion (relay webhook or IMAP poll)
          - Resident Web Form (captcha; anonymous allowed)
          - Call log (one-click "Create ticket")
          - PII masking & normalization
          - Rule-based urgent detection & synonyms
          - Small-LLM classify+summarize (fixed JSON schema)
          - Deduplication & spam filtering
          - APIs: POST /intake/{sms,email,web}, GET /intake/{id}
          - Event: IntakeCreated{intake_id, channel, category, urgent}
        out_of_scope:
          - Conversational call-bot
          - Kakao official integration
      rules:
        urgent_keywords: ["가스","누수","정전","화재","갇힘","엘리베이터 멈춤","붕괴","침수"]
        dedup_window_minutes: 30
        spam_indicators: ["repeated_links","banned_words","sender_rate_limit_exceeded"]
        synonyms:
          elevator: ["엘베","엘리","에레베이터"]
          parking_gate: ["차단기고장","차단기오류"]
      privacy_masking:
        phone_regex: "01[0-9]-?\d{3,4}-?\d{4}"
        email_regex: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
        unit_regex: "(\d{1,3})\s*동[\s-]*(\d{1,4})\s*호"
        tokens: { phone: "<PHONE_####>", email: "<EMAIL_###>", unit: "<UNIT_$1-$2>" }
      data_model:
        tables:
          intake_message:
            fields: [id, channel, received_at, provider_msg_id, message_id_hash, raw_payload, raw_text, remote_addr, signature_valid, status]
          intake_normalized:
            fields: [intake_id, text_clean, text_masked, phone_token, email_token, unit_token]
          intake_classification:
            fields: [intake_id, category, urgent, summary, evidence, score, model_version, source]
          intake_attachment:
            fields: [id, intake_id, filename, mime, size_bytes, storage_key]
          provider_secret:
            fields: [provider, hmac_secret]
      interfaces:
        apis:
          - { method: POST, path: "/intake/sms", security: "HMAC(X-Signature)" }
          - { method: POST, path: "/intake/web" }
          - { method: POST, path: "/intake/email" }
          - { method: GET,  path: "/intake/{id}", auth: "RBAC" }
        events:
          - { name: IntakeCreated, payload: "{intake_id, channel, received_at, category, urgent}" }
      llm_contract:
        input: [text_masked, rule_hits]
        output_schema:
          required: [category, urgent, summary_kr, evidence]
          properties:
            category: { type: string }
            urgent:   { type: integer, enum: [0,1] }
            summary_kr: { type: string, maxLength: 140 }
            evidence:   { type: string, maxLength: 40 }
        fallback: ["retry once on invalid JSON", "else category=other, urgent=rule_urgent"]
      acceptance_criteria:
        - "Ticket(classification row) created within 3s (p95) for SMS/web"
        - "Urgent keywords force urgent=1 even if LLM fails"
        - "Admin edits logged; weekly rules/few-shot update pipeline"
        - "Duplicates flagged (same <UNIT> + category within 30m)"
        - "Invalid HMAC → 401; all rejections audited"

    - id: ticketing-sla
      name: Ticketing & SLA
      description: >
        Lightweight ticket lifecycle and SLA engine with timers, notifications,
        templates, merge/linking, filters and CSV export.
      states: [received, assigned, in_progress, done, reopened]
      transitions:
        - { from: received, to: [assigned, in_progress, done] }
        - { from: assigned, to: [in_progress, done] }
        - { from: in_progress, to: [done, reopened] }
        - { from: done, to: [reopened] }
        - { from: reopened, to: [assigned, in_progress, done] }
      priorities: [P1, P2]
      default_sla_policy:
        clock: "24x7"
        first_response_minutes: { general: 1440, urgent: 120 }
        resolution_minutes:     { general: 4320, urgent: 1440 }
        due_soon_thresholds:    { first_response: 0.8, resolution: 0.8 }
        overdue_reminder_minutes: { first_response: 60, resolution: 240 }
      data_model:
        tables:
          ticket:
            fields: [id, created_at, intake_id, channel, category, priority, assignee_id, status, first_response_at, closed_at, reopen_flag, subject, summary, resident_contact_token]
          ticket_transition:
            fields: [id, ticket_id, actor_id, from_status, to_status, at, note]
          sla_policy:
            fields: [id, name, config_json, active]
          sla_timer:
            fields: [id, ticket_id, kind, due_at, due_soon_at, overdue_since, policy_name, state]
          notification_log:
            fields: [id, ticket_id, audience, channel, template_key, sent_at, status, provider_message_id, error]
          ticket_merge_map:
            fields: [parent_ticket_id, child_ticket_id, merged_at]
          template:
            fields: [key, lang, content]
      interfaces:
        apis:
          - { method: POST, path: "/tickets" }
          - { method: GET,  path: "/tickets" }
          - { method: GET,  path: "/tickets/{id}" }
          - { method: PATCH, path: "/tickets/{id}" }
          - { method: POST, path: "/tickets/{id}/assign" }
          - { method: POST, path: "/tickets/{id}/merge" }
          - { method: POST, path: "/tickets/{id}/notify" }
          - { method: GET,  path: "/sla/policies" }
          - { method: PUT,  path: "/sla/policies/{name}" }
        events:
          - TicketCreated
          - FirstResponseDueSoon
          - FirstResponseOverdue
          - ResolutionDueSoon
          - ResolutionOverdue
          - TicketStatusChanged
          - TicketMerged
      rules:
        assignment: ["if intake.urgent==1 then priority=P1", "default assignee by category map"]
        timers: ["create first_response & resolution timers on ticket creation", "stop timers at first_response_at/closed_at"]
        notifications: ["resident SMS on status change (optional)", "staff alerts on due_soon/overdue", "retry with backoff(3)"]
      acceptance_criteria:
        - "Valid transitions enforced; invalid rejected with 400 and audited"
        - "first_response_at set exactly once on first assign/in_progress"
        - "due-soon/overdue events emitted with jitter ≤60s (p95)"
        - "merge closes child and links to parent; audit trail present"
        - "CSV export with fixed columns"

    - id: ops-memory-vault
      name: Ops Memory Vault
      description: >
        Anonymous, aggregated operational history for each complex.
        Computes daily/monthly stats, enforces k-anonymity and 30-day delay,
        and exposes safe aggregates for dashboards/reports.
      scope:
        in_scope:
          - Daily & monthly aggregation jobs
          - k-anonymity filter (k≥10) and rare-category bucketing
          - 30-day delayed exposure for public/board views
          - CSV exports for aggregates
          - Optional heatmap (only if k≥10)
      data_model:
        tables:
          ops_stats_daily:
            fields: [day, category_id, total, p50_hours, p90_hours, reopen_rate, channel_mix_json]
          ops_stats_monthly:
            fields: [month, category_id, total, p50_hours, p90_hours, reopen_rate, channel_mix_json]
      interfaces:
        apis:
          - { method: GET, path: "/ops/stats/daily?from=&to=&category=" }
          - { method: GET, path: "/ops/stats/monthly?from=&to=&category=" }
          - { method: GET, path: "/ops/exports/{monthly|daily}.csv" }
      acceptance_criteria:
        - "02:00 daily job populates ops_stats_daily; counts reconcile with source (±0)"
        - "Cells below k hidden or grouped as 'Other'"
        - "Public exports honor 30-day delay"

    - id: reports-handover
      name: Reports & Handover Pack
      description: >
        One-click Monthly/Quarterly PDF and CSV bundle generation with branded template.
        Includes Top10 categories, P50/P90 times, channel mix, peak times, reopen rate,
        and a 1-page executive summary; optionally bundles Risk Brief.
      scope:
        in_scope:
          - HTML→PDF engine with embedded Noto Sans KR
          - Charts (Top10, P50/P90, channel mix, peaks)
          - CSV bundle: category×month.csv, sla.csv, channel_mix.csv
          - One-click export and scheduled generation
      interfaces:
        apis:
          - { method: POST, path: "/reports/generate?period=YYYY-MM" }
          - { method: GET,  path: "/reports/{id}.pdf" }
          - { method: GET,  path: "/reports/{id}/bundle.zip" }
      acceptance_criteria:
        - "PDF generated ≤30s (p95) and stored with checksum"
        - "Charts match aggregate data; print-friendly layout"
        - "Zip bundle validates column order and types"

    - id: erp-reader-csv
      name: ERP Reader (CSV Ingestor)
      description: >
        Read-only ingestion of ERP summary files (Billing, Receipts, Metering).
        Validate schemas, ensure idempotency, map item codes, and link context
        to tickets (read-only side panel).
      schemas:
        billing_csv: ["month(YYYY-MM)","item_code","amount(decimal)","unit_key(pseudo)","bill_id(hash)"]
        receipts_csv: ["receipt_id","unit_key","amount(decimal)","ts(ISO)","method(enum)"]
        metering_csv: ["type(enum)","period(YYYY-MM)","unit_key","value(decimal)"]
      data_model:
        tables:
          erp_billing:  { fields: [month, item_code, amount, unit_key, bill_id] }
          erp_receipt:  { fields: [receipt_id, unit_key, amount, ts, method] }
          erp_metering: { fields: [type, period, unit_key, value] }
      interfaces:
        apis:
          - { method: POST, path: "/erp/upload/{billing|receipts|metering}" }
          - { method: GET,  path: "/erp/batches/{id}" }
      rules:
        - "checksum + idempotency keys; duplicates ignored"
        - "line-numbered error report on parse failure"
        - "configurable mapping tables (item_code, unit_key) with audit"
      events:
        - { name: CsvImported, payload: "{type,batch_id,rows_ok,rows_error}" }
      acceptance_criteria:
        - "Re-upload does not create duplicates (idempotent)"
        - "Error CSV downloadable with precise line numbers"
        - "Ticket side panel shows read-only ERP context"

    - id: risk-brief-v1
      name: Risk Brief v1
      description: >
        Rule-based forecast of next month/quarter risks and a weekly Action Calendar.
        Scores and ranks Top-3 risks, proposes 3–5 actions each, and embeds into the report.
      rules:
        - "billing+72h inquiry spike"
        - "seasonality: cooling/heating, heavy rain"
        - "delinquency thresholds: D+7, D+30 reminders"
      interfaces:
        apis:
          - { method: GET, path: "/risk/brief?period=YYYY-MM" }
          - { method: GET, path: "/risk/calendar?week=YYYY-Www" }
      acceptance_criteria:
        - "Always returns 3 risks with titles, rationale, and 3–5 actions"
        - "Calendar view shows assignee/due and exports to PDF"

    - id: admin-security
      name: Admin & Security
      description: >
        Authentication (email+OTP), RBAC (admin/staff/viewer), tenant scoping,
        settings (SLA policy, SMS templates), audit log viewer, backups and monitoring.
      interfaces:
        apis:
          - { method: POST, path: "/auth/otp/request" }
          - { method: POST, path: "/auth/otp/verify" }
          - { method: GET,  path: "/audit/logs" }
          - { method: GET,  path: "/settings" }
          - { method: PUT,  path: "/settings" }
      acceptance_criteria:
        - "OTP expires in 10m; rate-limited; device remembered (opt-in)"
        - "RBAC enforced across all endpoints; permission tests pass"
        - "Nightly DB backups succeed; quarterly restore drill passes"
        - "Dashboards/alerts for ingest errors, SLA worker lag, SMS failures"

  kiro:
    directives:
      - "Spec-driven: generate unit tests before code; keep JSON schema strict"
      - "Mask PII before any LLM call; add schema validation & single retry"
      - "Add rate limits to all POST/PATCH endpoints; audit rejections"
      - "Emit metrics for latency, error rates, overdue counts; add Grafana panels"
    tasks_seed:
      - "Intake: /intake/sms with HMAC middleware + masking + rules + small-LLM classify"
      - "Ticketing: state-machine with tests; SLA timers worker; notifications with backoff"
      - "OpsVault: daily/monthly aggregations; k-anonymity filter; 30-day delay guard"
      - "Reports: HTML→PDF template; charts; bundle zip; schedule job"
      - "ERP Reader: CSV validator; checksum+idempotency; error CSV; mapping tables"
      - "Risk Brief: rules scorer; Top-3 selector; weekly action calendar"
      - "Admin/Security: email+OTP; RBAC; settings; audit viewer; backups/monitoring"

```

