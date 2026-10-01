# 🚀 UICMS Creative Workflow & Management System — Master System Guide & ReadMe
**Enterprise Operations, Production Tracking, Quality Assurance & Digital Sign-off Platform**  
*Version 2026.2 · Full-Stack React 19 + PHP 8.2 + MySQL 8.0 & AWS Cloud Native*

---

## 📑 Table of Contents
1. [System Overview & Core Philosophy](#1-system-overview--core-philosophy)
2. [Quick-Start User Onboarding Walkthrough](#2-quick-start-user-onboarding-walkthrough)
3. [The 11-Stage Creative Lifecycle Workflow](#3-the-11-stage-creative-lifecycle-workflow)
4. [Section-by-Section Usage Manual](#4-section-by-section-usage-manual)
   - [4.1 Executive Dashboard](#41-executive-dashboard)
   - [4.2 Weekly Department Work Summary](#42-weekly-department-work-summary)
   - [4.3 New Request Wizard & Dynamic Briefs](#43-new-request-wizard--dynamic-briefs)
   - [4.4 All Projects (Kanban Board)](#44-all-projects-kanban-board)
   - [4.5 Dedicated Project Workspace (8-Tab Workspace)](#45-dedicated-project-workspace-8-tab-workspace)
   - [4.6 Task Management & Checklists](#46-task-management--checklists)
   - [4.7 Quality Assurance (QA) Pre-Flight Audits](#47-quality-assurance-qa-pre-flight-audits)
   - [4.8 Approvals & Digital Sign-off Center](#48-approvals--digital-sign-off-center)
   - [4.9 Project Tracker (Live Spreadsheet View)](#49-project-tracker-live-spreadsheet-view)
   - [4.10 Deadlines & Calendar Timeline](#410-deadlines--calendar-timeline)
   - [4.11 Client CI Books & Vector Guidelines](#411-client-ci-books--vector-guidelines)
   - [4.12 Asset Vault & File Repository](#412-asset-vault--file-repository)
   - [4.13 Reports, Analytics & Velocity Metrics](#413-reports-analytics--velocity-metrics)
   - [4.14 Administration, RBAC & Immutable Audit Logs](#414-administration-rbac--immutable-audit-logs)
   - [4.15 Local Database API Sync & AWS Hosting](#415-local-database-api-sync--aws-hosting)
5. [Role-Based Access Control (RBAC) Guides](#5-role-based-access-control-rbac-guides)
6. [Keyboard Shortcuts & Navigation Hotkeys](#6-keyboard-shortcuts--navigation-hotkeys)
7. [Database Schema & Architecture Reference](#7-database-schema--architecture-reference)

---

## 1. System Overview & Core Philosophy

The **UICMS Creative Workflow & Management System** is an enterprise-grade platform designed to streamline end-to-end creative operations across four specialized departments:
1. **Marketing & Creative Production:** Brand campaigns, social carousels, motion graphics, and marketing collateral.
2. **Incentive Travel & Events Logistics:** Luxury itineraries, luggage tags, emergency PVC care cards, and VIP document packs.
3. **Online (RAM) & Rewards Engineering:** Dealer sprint banners, cash vouchers, till graphics, and digital point platforms.
4. **Technology & Systems Engineering:** Custom web portals, API bridges, and workflow automation.

---

## 2. Quick-Start User Onboarding Walkthrough

Follow these 6 steps to take any creative deliverable from idea to verified release:

```
[ Step 1: Submit Request ] ➔ [ Step 2: Validate & Lock Brief ] ➔ [ Step 3: Design Production ]
           │                                                                 │
           ▼                                                                 ▼
[ Step 6: Final Release & Publish ] ◄─ [ Step 5: Client Sign-Off ] ◄─ [ Step 4: QA Inspection ]
```

1. **Step 1 — Create a Request:** Click the **`+ New Request`** button in the sidebar or top navbar. Select the client and request type (e.g., *Instagram Carousel*, *Printed Travel Suite*, or *Dealer Sprint Banner*). Fill in the tailored brief fields.
2. **Step 2 — Validate & Lock Brief:** Open the project workspace in stage `BRIEF_VALIDATION`. Verify all specifications, sizes, copy, and deadlines. Once approved, click **"Lock Brief into Production"** to prevent scope creep.
3. **Step 3 — Production & Uploading Deliverables:** The design team produces the artwork and uploads Version proofs (`V1.0`, `V1.1`, etc.) with high-res PDFs and preview assets into the **Deliverables** tab.
4. **Step 4 — Quality Assurance Pre-Flight Audit:** The QA Lead conducts a 14-point pre-flight compliance check (Logo clear zones, CMYK/RGB color profiles, 300 DPI pre-flight, emergency contact accuracy). If passed, the project advances to **Client Review**.
5. **Step 5 — Client Sign-Off with Digital Hash:** The client executive reviews the artwork proof and enters their formal decision. Approved sign-offs are stamped with a cryptographic SHA-256 signature hash recorded in the audit trail.
6. **Step 6 — Final Pre-Flight & Release:** The team packages the final asset bundle, performs the release checklist, and marks the project as **COMPLETED / ARCHIVED**.

---

## 3. The 11-Stage Creative Lifecycle Workflow

Each creative project advances through 11 strict operational stages:

| Stage Code | Stage Name | Action Required to Advance |
| :--- | :--- | :--- |
| `REQUESTED` | **New Request Submitted** | Account manager reviews initial brief and assigns project owner. |
| `BRIEF_VALIDATION` | **Brief Validation** | Department manager validates technical specs and completeness. |
| `BRIEF_LOCKED` | **Brief Locked** | Formal brief lock declaration committed. Production commences. |
| `PRODUCTION` | **Artwork Production** | Designers create deliverable mockups and initial artwork proofs. |
| `INTERNAL_QA` | **Internal Pre-Flight QA** | QA user verifies 14 pre-flight criteria (bleeds, DPI, hex codes). |
| `CLIENT_REVIEW` | **Client Review** | Proof presented to client stakeholder for review and feedback. |
| `REVISION` | **Client Revision** | Designers incorporate revision notes and generate `V1.1+` proof. |
| `CLIENT_APPROVAL` | **Client Approval** | Formal client sign-off declaration and cryptographic signature. |
| `FINAL_QA` | **Final Quality Assurance** | Final pre-flight verification on packaging and master files. |
| `RELEASE_PUBLISH` | **Final Release & Publish** | Master ZIP / PDF uploaded to CDN or sent to litho print partner. |
| `ARCHIVE` | **Archived & Complete** | Project archived with immutable audit log for compliance. |

---

## 4. Section-by-Section Usage Manual

### 4.1 Executive Dashboard
* **Dynamic Time Greeting:** Adapts in real-time to your system clock (`Good morning` / `Good afternoon` / `Good evening`).
* **KPI Pipeline:** Real-time counters of active projects, awaiting brief validation, in production, in QA, pending approval, overdue, and completed.
* **Department Filtering:** Switch between All Departments, Marketing, Incentive Travel, and Online RAM.
* **Direct Shortcuts:** Click any KPI card or overdue alert to immediately open that filtered view.

### 4.2 Weekly Department Work Summary
* **Progress Velocity:** Departmental on-track percentage, completed deliverables, and sprint points.
* **🚨 Urgent Issues Queue:** Shows active blockers, overdue target deadlines, QA rejections, and review delays. Includes quick **"Open Project"** and **"Ping Owner"** buttons.
* **🏆 Major Achievements:** Highlights completed project releases, signed client approvals, and zero-defect QA audits.
* **Copy Markdown Brief:** One-click copy of an executive summary formatted for Slack channels or management emails.

### 4.3 New Request Wizard & Dynamic Briefs
* **Client Selection:** Auto-loads client CI guidelines, primary color swatches, and contact information.
* **Department-Tailored Forms:** Form fields dynamically change based on request type:
  - *Social / Marketing:* Handles aspect ratios, target hashtags, CTA URLs, copy drafts.
  - *Incentive Travel:* Luggage tag specs, booklet Wire-O bindings, emergency care cards, flight manifests.
  - *Online RAM:* Leaderboard dimensions, prize pool points, voucher values, NFC specifications.
* **Priority Flags:** Set priority to *Urgent*, *High*, *Medium*, or *Low*.

### 4.4 All Projects (Kanban Board)
* **11-Column Visual Pipeline:** See all projects organized horizontally by stage.
* **Drag-and-Drop / Stage Transitions:** Click stage change buttons to advance or roll back projects.
* **Visual Status Indicators:** Badges for On Track (Green), Due Soon (Amber), Overdue (Red), and Blocked (Purple).

### 4.5 Dedicated Project Workspace (8-Tab Workspace)
Click any project card or table row to open the 8-tab workspace:
1. **Overview:** Project summary, accountable stakeholders, dependencies, risks, and next required action.
2. **Brief:** Dynamic brief specifications with the **"Lock Brief"** security mechanism.
3. **Deliverables & Proofs:** Artwork proofs (`V1.0`, `V1.1`), high-res previews, and version comparison.
4. **QA Checklist:** Interactive 14-point audit inspection with Pass/Fail buttons and pre-flight notes.
5. **Approvals:** Client sign-off declaration, decision buttons, and cryptographic signature hash badge.
6. **Tasks:** Granular sub-tasks with estimated hours, actual hours, and checklists.
7. **Files & Assets:** Downloadable project attachments, vector logos, and font files.
8. **Audit Trail:** Immutable activity logs with timestamps and stage change history.

### 4.6 Task Management & Checklists
* **My Tasks View:** Filter tasks assigned to you by status (*Todo*, *In Progress*, *Review*, *Completed*).
* **Interactive Checklist:** Check off sub-items to auto-update task progress bars.
* **Hours Logging:** Track estimated vs. actual production hours for capacity planning.

### 4.7 Quality Assurance (QA) Pre-Flight Audits
* **14 Pre-Flight Checkpoints:**
  - Typography & Brand Font Licences
  - Hex & Pantone Color Verification
  - Minimum 300 DPI Asset Resolution
  - 3mm Bleed and Die-cut Lines
  - Barcode 128 / Dynamic QR Code Readability
  - Legal Disclaimers & Expiry Clauses
* **Automated Stage Gating:** Failed QA prevents advancement to client review until remediation is approved.

### 4.8 Approvals & Digital Sign-off Center
* **Client Self-Service Portal:** Client stakeholders review artwork proofs in full resolution.
* **Digital Signature:** Generates SHA-256 cryptographic proof (`hash(project_id + version + decision + timestamp)`).
* **Decision Options:** `APPROVED`, `APPROVED WITH NOTES`, `CHANGES REQUESTED`, or `REJECTED`.

### 4.9 Project Tracker (Live Spreadsheet View)
* **Excel-Style Data Grid:** Sortable columns, full-text search, and multi-filter dropdowns.
* **Export Options:** Export to CSV, Excel, or JSON backup snapshots.

### 4.10 Deadlines & Calendar Timeline
* **Monthly & Weekly Calendars:** Color-coded milestone badges for Brief Due, QA Due, Client Sign-off, and Target Release.
* **Gantt Timeline:** Visual bar representation of stage durations and dependencies.

### 4.11 Client CI Books & Vector Guidelines
* **Corporate Identity Vault:** Store official PDF brand manuals, approved color swatches, typography rules, and vector logos for clients (Discovery, Nissan, Standard Bank, Bidvest, Woolworths).

### 4.12 Asset Vault & File Repository
* **Central File Management:** Search and filter files across categories: *Proofs*, *Briefs*, *CI Guidelines*, *Approved Masters*, and *Release Packages*.

### 4.13 Reports, Analytics & Velocity Metrics
* **Department Throughput Charts:** Visual analysis of turnaround speed, stage bottlenecks, and on-time delivery percentages.
* **Workload Distribution:** Team member capacity meters to prevent designer burnout.

### 4.14 Administration, RBAC & Immutable Audit Logs (🔒 Superuser Only)
> **Security Notice:** This module is strictly restricted to authenticated **Superusers (`super_admin`) only**. It is hidden from standard navigation for all other roles and protected with cryptographic role verification.

* **User Management & Provisioning:** Superusers can create user accounts, assign roles across all departments, modify titles, reset passwords, and enforce security suspensions with mandatory audit reasons.
* **Immutable Audit Trail:** Superusers can inspect and search through the 100% immutable event stream auditing every brief lock, stage transition, client approval, QA certificate, and administrative change with UTC timestamps, actor names, and IP references.
* **System Policies & Governance:** Superusers can enforce brief lock thresholds, configure department SLA turnaround targets, or re-seed the system demo state.
* **Database Snapshots & Local Sync:** Superusers can export complete JSON snapshots of all application collections or connect to the PHP REST API bridge for MySQL synchronization.

### 4.15 Local Database API Sync & AWS Hosting (🔒 Superuser Only)
* **JSON Backup / Restore:** One-click full export and import of all application collections.
* **Local PHP/MySQL Bridge:** The app reads and saves application records in the relational tables in `uicms_workflow`. XAMPP defaults to MySQL `root` with no password; set `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_PORT` in the PHP environment when your local credentials differ.
* **Local API startup:** From the workspace root, run `php -S 127.0.0.1:8088 -t .`; Vite proxies `/php-backend` to this server. Set `PHP_API_TARGET` to change the proxy target.
* **Stored files:** `project_files` stores file metadata and URLs; the file contents remain at those URLs.
* **AWS Deployment Specs:** Full architectural blueprints and sizing for ECS Fargate, RDS MySQL, S3, and EC2 (recommended `t3.small` / Ubuntu 24.04 LTS).

---

## 5. Role-Based Access Control (RBAC) & Superuser Manual

### 5.1 Role Clearance Matrix & Security Boundaries

| Role | Clearance Level | Admin Settings & Audit Access | Key Operational Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin (Superuser)** | **Level 5 (Unrestricted)** | **✅ FULL EXCLUSIVE ACCESS** | System governance, user provisioning/suspension, immutable audit logs, database snapshots, policy overrides |
| **Department Manager** | Level 4 (Departmental) | ❌ Restricted (Hidden) | Brief locking, stage overrides, workload re-balancing, departmental velocity summaries |
| **Account Manager** | Level 3 (Client Operations) | ❌ Restricted (Hidden) | Create requests, submit briefs, coordinate client reviews and sign-offs, manage approvals |
| **Designer** | Level 2 (Creative Production) | ❌ Restricted (Hidden) | Upload artwork proofs (V1.0, V1.1), manage sub-tasks, log hours, address client revision feedback |
| **QA User** | Level 3 (Quality Governance) | ❌ Restricted (Hidden) | 14-point pre-flight checklist auditing, issue QA certifications (PASS / PASS WITH NOTES / FAIL) |
| **Client** | Level 1 (Portal Sign-off) | ❌ Restricted (Hidden) | High-res proof inspection, revision change requests, SHA-256 cryptographic sign-off approvals |

---

### 5.2 Superuser Operations Manual (Step-by-Step for Superusers)

As a **Superuser (`super_admin`)**, follow these procedures for platform governance:

#### 1. Managing Users & Account Security
1. In the left sidebar, navigate to **System Config & Help ➔ Admin Settings & Audit** (this link is only rendered for Superusers).
2. Under the **User Management** panel:
   - Click **"+ Add User"** to provision a new team member with their email, name, department, and role.
   - Click the **Edit** icon next to any user to change their role title, department, or update avatar credentials.
   - Click the **Ban / Suspend** icon to temporarily or permanently suspend a user account. Enter a mandatory reason (e.g., *Contract expiration* or *Security audit*) which gets logged to the immutable audit trail.
   - Click **Reset Password** to send a one-time credential reset link.

#### 2. Auditing Immutable Platform Activity
1. Inside **Admin Settings & Audit**, scroll to the **Immutable Audit Trail** section.
2. Filter logs by action type:
   - `BRIEF_LOCKED`: Track when managers formally committed project scopes.
   - `CLIENT_APPROVED`: Inspect client digital approvals and SHA-256 signature tokens.
   - `QA_CERTIFIED`: Review pre-flight inspection passes or failures.
   - `USER_SUSPENDED` / `USER_CREATED`: Audit user account administrative modifications.
3. Use the search input to filter by project number (e.g. `PRJ-MKT-001`) or user name.

#### 3. Database Snapshots & MySQL/PHP Synchronization
1. Under **Database & Sync Manager**:
   - Click **"Export JSON Database Snapshot"** to download an encrypted backup of all 12 relational collections.
   - Click **"Import JSON Backup"** to restore system data to a previous point in time.
   - Click **"Test PHP/MySQL API Bridge"** to read the configured data endpoint; use **Push to API** to write current application state to MySQL.

#### 4. Resetting Demo State
- Click **"Reset Demo System State"** in the top right of the Admin Settings header to re-seed pristine demo projects, tasks, proofs, and QA records across all 4 departments.

---

## 6. Keyboard Shortcuts & Navigation Hotkeys

* `Cmd + K` or `Ctrl + K`: Open Spotlight Global Search (search projects, clients, tasks, and users).
* `Cmd + N` or `Ctrl + N`: Open New Request Wizard modal.
* `Esc`: Close any open modal, dialog, or project workspace.
* `Alt + 1` to `Alt + 4`: Fast switch between main workflow views.

---

## 7. Database Schema & Architecture Reference

The relational database (`database_seed.sql`) contains 14 operational tables:
* `departments`: Department registry and routing.
* `users`: Team credentials, roles, and avatar URLs.
* `clients`: Enterprise client CI rules and color codes.
* `projects`: Master project records, stage gates, and brief JSON payloads.
* `tasks`: Stage tasks with checklist progress and hours logged.
* `project_files`: Project file metadata and storage URLs.
* `deliverable_versions`: Artwork proofs with changelogs and QA results.
* `qa_submissions`: 14-point pre-flight QA records.
* `client_approvals`: Client digital sign-offs with SHA-256 signature hashes.
* `feedback_items`: Version-pinned revision requests.
* `notifications`: Real-time user event notifications.
* `chat_messages`: Project team collaboration logs.
* `activity_logs`: Immutable audit trail records.
