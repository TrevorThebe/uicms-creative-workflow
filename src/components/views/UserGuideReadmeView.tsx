import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveNavSection, UserRole } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  FolderKanban,
  Folders,
  HelpCircle,
  Inbox,
  Info,
  Key,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Milestone,
  Palette,
  Plane,
  PlusCircle,
  Printer,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

export const UserGuideReadmeView: React.FC = () => {
  const { setActiveNavSection, setIsNewRequestOpen, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('getting_started');
  const [selectedRoleGuide, setSelectedRoleGuide] = useState<UserRole>('super_admin');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState<number>(0);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleNavigate = (section: ActiveNavSection) => {
    setActiveNavSection(section);
  };

  // 6-Step Visual Walkthrough Steps
  const walkthroughSteps = [
    {
      step: 1,
      title: 'Submit Creative Request',
      badge: 'Step 1 of 6',
      icon: PlusCircle,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description:
        'Account Managers or Clients submit a new project request. The wizard automatically renders client brand colors and tailored dynamic brief fields according to the department request type.',
      keyActions: [
        'Select Client (e.g. Discovery Group, Nissan, Standard Bank)',
        'Choose Request Type (e.g. Instagram Carousel, Printed Travel Suite, RAM Voucher)',
        'Fill required brief parameters (Dimensions, copy drafts, deadline targets)',
      ],
      targetSection: 'new_request' as ActiveNavSection,
      buttonText: 'Open Request Wizard',
    },
    {
      step: 2,
      title: 'Validate & Lock Brief',
      badge: 'Step 2 of 6',
      icon: Lock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description:
        'The Department Manager validates all technical parameters, supplier dependencies, and target dates. Once complete, they trigger the formal Brief Lock to protect the scope against changes.',
      keyActions: [
        'Review brief completeness score (must reach minimum threshold)',
        'Confirm mandatory die-cut, bleed, or resolution requirements',
        'Commit digital lock declaration into immutable audit log',
      ],
      targetSection: 'all_projects' as ActiveNavSection,
      buttonText: 'View Kanban Board',
    },
    {
      step: 3,
      title: 'Artwork Production & Proofs',
      badge: 'Step 3 of 6',
      icon: Palette,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      description:
        'Designers and art directors create deliverable assets and upload multi-version proofs (V1.0, V1.1) with high-res PDFs and visual comparison previews in the Deliverables tab.',
      keyActions: [
        'Upload version proof with changelog description',
        'Break down production sub-tasks and log actual working hours',
        'Submit artwork to Internal QA inspection queue',
      ],
      targetSection: 'my_tasks' as ActiveNavSection,
      buttonText: 'Go to My Tasks',
    },
    {
      step: 4,
      title: '14-Point Pre-Flight QA Audit',
      badge: 'Step 4 of 6',
      icon: ShieldCheck,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description:
        'The dedicated QA Lead runs a 14-point pre-flight compliance check across brand colors (#Hex/Pantone), typography licenses, 300 DPI resolution, and barcode/QR readability.',
      keyActions: [
        'Verify logo clear spacing and client corporate identity rules',
        'Validate print die-lines, 3mm bleed, and CMYK calibration',
        'Certify with QA PASS to unlock client review stage',
      ],
      targetSection: 'all_projects' as ActiveNavSection,
      buttonText: 'Inspect QA Queue',
    },
    {
      step: 5,
      title: 'Client Sign-Off & Digital Signature',
      badge: 'Step 5 of 6',
      icon: FileCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description:
        'Client executives review full-res artwork proofs in the client self-service portal. Approvals generate a verifiable SHA-256 cryptographic signature hash saved directly to the database.',
      keyActions: [
        'Client inspects artwork proof and annotations',
        'Select decision: APPROVED, APPROVED WITH NOTES, or CHANGES REQUESTED',
        'Cryptographic SHA-256 hash stamped with timestamp',
      ],
      targetSection: 'approvals' as ActiveNavSection,
      buttonText: 'View Approvals Center',
    },
    {
      step: 6,
      title: 'Final Pre-Flight & Release Package',
      badge: 'Step 6 of 6',
      icon: Award,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description:
        'The release package (master vectors, high-res PDF/X-1a, print specs) is published to the central file repository or transmitted directly to litho print suppliers, concluding the workflow.',
      keyActions: [
        'Run final release pre-flight audit checklist',
        'Transmit package to client CDN, social CMS, or print house',
        'Advance project to COMPLETED & ARCHIVED state',
      ],
      targetSection: 'files' as ActiveNavSection,
      buttonText: 'Browse File Vault',
    },
  ];

  // Section Manual Catalog
  const manualSections = [
    {
      id: 'dashboard',
      title: '1. Executive Dashboard',
      icon: LayoutDashboard,
      category: 'Core Operations',
      tag: 'Executive Overview',
      summary: 'Central mission control with dynamic time greeting, 11-stage KPI metrics, and live alerts.',
      details: [
        'Time-of-day greeting dynamically synchronizes with local system clock ("Good morning, David 👋", "Good afternoon", etc.).',
        'Lifecycle KPI Pipeline displays real-time counts across all 11 stages from Requested to Archive.',
        'Overdue & At-Risk warning banners with one-click direct filtering.',
        'Department selector buttons for Marketing, Incentive Travel, and Online RAM.',
      ],
      navTarget: 'dashboard' as ActiveNavSection,
    },
    {
      id: 'weekly_summary',
      title: '2. Weekly Department Work Summary',
      icon: Milestone,
      category: 'Core Operations',
      tag: 'Progress & Urgent Issues',
      summary: 'Executive weekly progress summary, major achievements, and critical blocker resolution queue.',
      details: [
        'Urgent Attention Queue: Highlights active blockers, overdue target deadlines, QA defects, and client review delays.',
        'Major Achievements: Displays completed project releases, signed client approvals, and 100% QA passes.',
        'Department Health Score: Live comparative matrix showing on-track turnaround % for all 4 operational units.',
        'Copy Markdown Brief: One-click export formatted for Slack leadership channels and executive emails.',
      ],
      navTarget: 'weekly_summary' as ActiveNavSection,
    },
    {
      id: 'new_request',
      title: '3. New Request Wizard & Dynamic Briefs',
      icon: PlusCircle,
      category: 'Intake & Scoping',
      tag: 'Dynamic Form Engine',
      summary: 'Multi-department request wizard with automated client CI loading and department-specific schemas.',
      details: [
        'Marketing Requests: Handles social carousels, hashtags, dimensions, and CTA URLs.',
        'Incentive Travel Requests: Accommodates printed doc suites, luggage tags, itinerary booklets, and emergency PVC cards.',
        'Online RAM Requests: Configures dealership flash sprint contest banners, countdown tickers, and cash vouchers.',
        'Calculates real-time brief completeness percentage to ensure all mandatory specs are provided.',
      ],
      navTarget: 'new_request' as ActiveNavSection,
    },
    {
      id: 'all_projects',
      title: '4. Kanban 11-Stage Workflow Board',
      icon: FolderKanban,
      category: 'Production & Tracking',
      tag: 'Visual Pipeline',
      summary: 'Interactive 11-column stage board with drag-and-drop support and automated stage gating.',
      details: [
        'Visual status badges: On Track (Green), Due Soon (Amber), Overdue (Red), Blocked (Purple).',
        'Quick stage advancement buttons with automated validation checks.',
        'Filter projects by Department, Client, Priority, Status, or Assigned Owner.',
      ],
      navTarget: 'all_projects' as ActiveNavSection,
    },
    {
      id: 'workspace',
      title: '5. Dedicated Project Workspace (8 Tabs)',
      icon: Layers,
      category: 'Production & Tracking',
      tag: '8-Tab Deep Dive',
      summary: 'Full-screen project management environment with 8 dedicated functional tabs.',
      details: [
        'Overview Tab: Project metadata, accountable director, risks, blockers, and next action.',
        'Brief Tab: Scoped brief parameters with the cryptographic Brief Lock mechanism.',
        'Deliverables Tab: Version control (V1.0, V1.1), proof uploads, high-res previews, and changelogs.',
        'QA Tab: 14-point interactive pre-flight compliance inspection.',
        'Approvals Tab: Client review records with SHA-256 cryptographic signature hashes.',
        'Tasks Tab: Sub-tasks with checklist progress and estimated vs. actual hours.',
        'Files Tab: Project vector assets, brand guides, and printer proofs.',
        'Audit Tab: Immutable log of every action with before/after stage changes.',
      ],
      navTarget: 'all_projects' as ActiveNavSection,
    },
    {
      id: 'approvals',
      title: '6. Approvals & Sign-off Center',
      icon: FileCheck2,
      category: 'Governance & Quality',
      tag: 'Digital Signatures',
      summary: 'Formal client approval portal with SHA-256 cryptographic digital signature hashes.',
      details: [
        'Client review cards with full artwork proof preview and download links.',
        'Formal sign-off form requiring full client name, corporate position, and confirmation text.',
        'Generates cryptographic SHA-256 hash stamp for legally verified audit compliance.',
        'Automated workflow progression: Approval moves project to Final QA; Rejections route to Revision.',
      ],
      navTarget: 'approvals' as ActiveNavSection,
    },
    {
      id: 'tracker',
      title: '7. Project Tracker (Excel Spreadsheet View)',
      icon: Table,
      category: 'Reporting & Analysis',
      tag: 'Data Grid',
      summary: 'High-density Excel-style data table with multi-column sorting, search, and CSV export.',
      details: [
        'Full tabular view of all projects with real-time column sorting and filtering.',
        'Export table data to CSV, Excel, or formatted JSON snapshots.',
        'Inline stage and status indicators with fast project opening.',
      ],
      navTarget: 'tracker' as ActiveNavSection,
    },
    {
      id: 'calendar',
      title: '8. Deadlines & Calendar Timeline',
      icon: Calendar,
      category: 'Scheduling & Planning',
      tag: 'Gantt & Calendar',
      summary: 'Interactive calendar and Gantt schedule of all deliverable due dates and milestone targets.',
      details: [
        'Color-coded milestones for Brief Due, Internal QA, Client Review, and Final Release.',
        'Monthly calendar grid and weekly agenda view.',
        'Gantt bar visualizer for multi-week campaign schedules.',
      ],
      navTarget: 'calendar' as ActiveNavSection,
    },
    {
      id: 'clients',
      title: '9. Clients & CI Brand Books Vault',
      icon: Building2,
      category: 'Asset Management',
      tag: 'Brand Guidelines',
      summary: 'Central corporate identity repository with color swatches, font rules, and vector logos.',
      details: [
        'Profiles for enterprise clients: Discovery Group, Nissan SA, Standard Bank Wealth, Bidvest, Woolworths.',
        'Interactive hex color swatches with one-click clipboard copying.',
        'Downloadable official Corporate Identity PDF manuals and vector logo kits.',
      ],
      navTarget: 'clients' as ActiveNavSection,
    },
    {
      id: 'files',
      title: '10. Local File Repository & Proof Vault',
      icon: Folders,
      category: 'Asset Management',
      tag: 'Asset Storage',
      summary: 'Organized file vault for artwork proofs, vector logos, brief attachments, and print packages.',
      details: [
        'Categorized storage: Deliverable Proofs, Brief Attachments, CI Guidelines, Approved Masters, Release Packages.',
        'Add local files with custom MIME types, versions, sizes, and proof notes.',
        'Real-time search across filenames, project codes, and file categories.',
      ],
      navTarget: 'files' as ActiveNavSection,
    },
    {
      id: 'administration',
      title: '11. Admin Settings, Audit & MySQL/PHP Bridge',
      icon: Shield,
      category: 'System Governance',
      tag: 'Admin & Database',
      summary: 'User role management, immutable audit trail, database sync, and AWS hosting specs.',
      details: [
        'User Management: Role assignments, suspension toggles, and security credentials.',
        'JSON Database Backup & Restore: One-click export/import of all 12 system collections.',
        'PHP / MySQL REST API Bridge: Ready-to-run PHP scripts for local XAMPP or Docker MySQL sync.',
        'AWS Hosting Specs: Complete architecture and compute sizing for ECS Fargate, RDS, and EC2.',
      ],
      navTarget: 'administration' as ActiveNavSection,
    },
  ];

  // Role Guides
  const roleGuides: Record<
    UserRole,
    {
      roleName: string;
      title: string;
      icon: React.ElementType;
      color: string;
      responsibilities: string[];
      keyWorkflowSteps: string[];
      recommendedViews: ActiveNavSection[];
    }
  > = {
    super_admin: {
      roleName: 'Super Admin',
      title: 'Chief Operations & Systems Administrator',
      icon: Shield,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      responsibilities: [
        'System governance, user account provisioning, and security management.',
        'Enforcing brief locking policies and multi-department workflow rules.',
        'Database backup snapshots, local PHP/MySQL synchronization, and audit log inspection.',
      ],
      keyWorkflowSteps: [
        'Review global throughput metrics on Executive Dashboard.',
        'Inspect immutable audit logs in Administration view for compliance.',
        'Manage user roles and workload quotas in User Management panel.',
      ],
      recommendedViews: ['dashboard', 'weekly_summary', 'administration', 'all_projects', 'reports'],
    },
    department_manager: {
      roleName: 'Department Manager',
      title: 'Head of Creative / Travel / RAM Production',
      icon: Users,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      responsibilities: [
        'Intake validation of incoming creative briefs from Account Managers.',
        'Formally locking brief specifications to prevent scope creep during production.',
        'Workload balancing across designers and resolving departmental blockers.',
      ],
      keyWorkflowSteps: [
        'Open projects in stage BRIEF_VALIDATION and verify technical feasibility.',
        'Click "Lock Brief into Production" once all required specs are confirmed.',
        'Review Weekly Department Work Summary to clear blockers and monitor team capacity.',
      ],
      recommendedViews: ['dashboard', 'weekly_summary', 'all_projects', 'team', 'tracker'],
    },
    account_manager: {
      roleName: 'Account Manager',
      title: 'Senior Account Director & Client Liaison',
      icon: Inbox,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      responsibilities: [
        'Client intake, brief creation, and timeline coordination.',
        'Coordinating client review deadlines and feedback revisions.',
        'Ensuring client digital sign-offs are secured prior to final release.',
      ],
      keyWorkflowSteps: [
        'Click "+ New Request" to create brief for assigned enterprise client.',
        'Monitor My Requests view for active deliverables in progress.',
        'Send artwork proofs to client and track review status in Approvals Center.',
      ],
      recommendedViews: ['my_requests', 'approvals', 'calendar', 'clients', 'messages'],
    },
    designer: {
      roleName: 'Designer / Art Director',
      title: 'Senior Art Director, Motion Designer, UI Specialist',
      icon: Palette,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      responsibilities: [
        'Deliverable production in Figma, Photoshop, Illustrator, and InDesign.',
        'Uploading deliverable artwork proofs (V1.0, V1.1) and high-res master packages.',
        'Logging actual hours and checking off sub-tasks.',
      ],
      keyWorkflowSteps: [
        'Check My Tasks view daily for assigned sub-tasks and deadlines.',
        'Upload version proofs in Deliverables tab of Project Workspace.',
        'Incorporate client feedback from Revisions tab and submit for QA check.',
      ],
      recommendedViews: ['my_tasks', 'all_projects', 'files', 'clients', 'messages'],
    },
    qa_user: {
      roleName: 'QA User',
      title: 'Quality Assurance & CI Compliance Lead',
      icon: ShieldCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      responsibilities: [
        'Pre-flight quality assurance and corporate identity compliance auditing.',
        'Validating bleeds, color spaces, DPI resolutions, barcodes, and legal clauses.',
        'Gating workflow advancement to ensure only 100% compliant work reaches clients.',
      ],
      keyWorkflowSteps: [
        'Filter Kanban board for projects in stage INTERNAL_QA or FINAL_QA.',
        'Open QA Checklist tab and evaluate all 14 pre-flight criteria.',
        'Submit QA Certification (PASS, PASS WITH NOTES, or FAIL).',
      ],
      recommendedViews: ['all_projects', 'weekly_summary', 'files', 'clients', 'tracker'],
    },
    client: {
      roleName: 'Client Stakeholder',
      title: 'VP Marketing / Brand Director (Client Portal)',
      icon: Award,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      responsibilities: [
        'Reviewing artwork proofs in high resolution.',
        'Submitting revision feedback or change requests.',
        'Providing formal executive digital approval with cryptographic verification.',
      ],
      keyWorkflowSteps: [
        'Open Approvals & Sign-off Center to view pending proofs.',
        'Inspect artwork in full resolution and enter revision comments if needed.',
        'Submit formal approval declaration to advance project to Final Release.',
      ],
      recommendedViews: ['approvals', 'my_requests', 'files', 'messages'],
    },
  };

  // Filtered manual sections
  const filteredSections = manualSections.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.tag.toLowerCase().includes(q) ||
      s.details.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                  UICMS System Manual & How-To-Use Guide
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  v2026.2
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete operational documentation, 6-step walkthroughs, role-based responsibilities, and stage guides.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/README.md"
              download="UICMS_System_README.md"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Guide</span>
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search system manual (e.g. Brief lock, QA criteria, digital signature, AWS EC2, CSV export)..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>
      </div>

      {/* 2. Interactive 6-Step Visual Walkthrough Stepper */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>End-to-End Creative Lifecycle (6-Step Walkthrough)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click each step to explore how creative assets move from intake to validated release.
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-300">Step {activeWalkthroughStep + 1} of 6</span>
        </div>

        {/* Step Navigation Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {walkthroughSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeWalkthroughStep === idx;
            return (
              <button
                key={step.step}
                type="button"
                onClick={() => setActiveWalkthroughStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {step.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <span
                  className={`text-[11px] font-bold line-clamp-1 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Showcase Card */}
        {(() => {
          const currentStepData = walkthroughSteps[activeWalkthroughStep];
          const Icon = currentStepData.icon;

          return (
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${currentStepData.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                      {currentStepData.badge}
                    </span>
                    <h3 className="text-base font-bold text-white">{currentStepData.title}</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (currentStepData.targetSection === 'new_request') {
                      setIsNewRequestOpen(true);
                    } else {
                      handleNavigate(currentStepData.targetSection);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>{currentStepData.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{currentStepData.description}</p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Key Actions & Standards:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {currentStepData.keyActions.map((action, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-300 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <button
                  type="button"
                  disabled={activeWalkthroughStep === 0}
                  onClick={() => setActiveWalkthroughStep((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-colors"
                >
                  ← Previous Step
                </button>
                <button
                  type="button"
                  disabled={activeWalkthroughStep === walkthroughSteps.length - 1}
                  onClick={() => setActiveWalkthroughStep((prev) => Math.min(walkthroughSteps.length - 1, prev + 1))}
                  className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-colors"
                >
                  Next Step →
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Section-by-Section Usage Manual Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Section-by-Section Detailed User Manual ({filteredSections.length} Modules)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore operational features, usage instructions, and jump directly into each module.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;

            return (
              <div
                key={sec.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-semibold text-indigo-300">{sec.category}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {sec.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{sec.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{sec.summary}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Key Capabilities:
                    </span>
                    <ul className="text-[11px] text-slate-300 space-y-1">
                      {sec.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span className="leading-snug">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopy(sec.details.join('\n'), sec.id)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedSection === sec.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSection === sec.id ? 'Copied' : 'Copy Tips'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (sec.navTarget === 'new_request') {
                        setIsNewRequestOpen(true);
                      } else {
                        handleNavigate(sec.navTarget);
                      }
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Open Section</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Role-Based Access Control (RBAC) & Responsibilities Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Role-Based Responsibilities & Action Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your system role to see standard operating procedures and recommended daily views.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Current User: {currentUser.role}</span>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              'super_admin',
              'department_manager',
              'account_manager',
              'designer',
              'qa_user',
              'client',
            ] as UserRole[]
          ).map((roleKey) => {
            const roleData = roleGuides[roleKey];
            const isSelected = selectedRoleGuide === roleKey;
            const isMyRole = currentUser.role === roleKey;

            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRoleGuide(roleKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>{roleData.roleName}</span>
                {isMyRole && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                    You
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Role Deep Dive */}
        {(() => {
          const activeRole = roleGuides[selectedRoleGuide];
          const Icon = activeRole.icon;

          return (
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
                <div className={`p-2.5 rounded-xl border ${activeRole.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeRole.roleName}</h3>
                  <p className="text-xs text-slate-400">{activeRole.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Primary Responsibilities */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Core Operational Responsibilities:
                  </span>
                  <ul className="text-slate-300 space-y-1.5">
                    {activeRole.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Daily Workflow Steps */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Daily Workflow Sequence:
                  </span>
                  <ul className="text-slate-300 space-y-1.5">
                    {activeRole.keyWorkflowSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Views Quick Nav */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Recommended Views for {activeRole.roleName}:</span>
                {activeRole.recommendedViews.map((viewKey) => (
                  <button
                    key={viewKey}
                    type="button"
                    onClick={() => handleNavigate(viewKey)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-800 transition-colors text-[11px] font-medium"
                  >
                    {viewKey.replace('_', ' ')} →
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 5. Keyboard Shortcuts & Global Hotkeys Reference */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Keyboard Shortcuts & Power Hotkeys
            </h3>
          </div>
          <span className="text-xs text-slate-400">Desktop Optimized</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Global Spotlight Search</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
              Cmd / Ctrl + K
            </kbd>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">New Request Wizard</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
              Cmd / Ctrl + N
            </kbd>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Close Open Modal</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
              Esc
            </kbd>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Switch Theme Mode</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
              Top Nav ☼ / ☽
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
