import React, { lazy, Suspense, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { NewRequestWizard } from './components/requests/NewRequestWizard';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';

const ExecutiveDashboard = lazy(() => import('./components/dashboard/ExecutiveDashboard').then((module) => ({ default: module.ExecutiveDashboard })));
const StageWorkflowBoard = lazy(() => import('./components/kanban/StageWorkflowBoard').then((module) => ({ default: module.StageWorkflowBoard })));
const ProjectDetailWorkspace = lazy(() => import('./components/project/ProjectDetailWorkspace').then((module) => ({ default: module.ProjectDetailWorkspace })));
const MyTasksView = lazy(() => import('./components/views/MyTasksView').then((module) => ({ default: module.MyTasksView })));
const ProjectTrackerView = lazy(() => import('./components/views/ProjectTrackerView').then((module) => ({ default: module.ProjectTrackerView })));
const ApprovalsCenterView = lazy(() => import('./components/views/ApprovalsCenterView').then((module) => ({ default: module.ApprovalsCenterView })));
const CalendarDeadlinesView = lazy(() => import('./components/views/CalendarDeadlinesView').then((module) => ({ default: module.CalendarDeadlinesView })));
const TeamWorkloadView = lazy(() => import('./components/views/TeamWorkloadView').then((module) => ({ default: module.TeamWorkloadView })));
const ClientsBrandCIView = lazy(() => import('./components/views/ClientsBrandCIView').then((module) => ({ default: module.ClientsBrandCIView })));
const ReportsAnalyticsView = lazy(() => import('./components/views/ReportsAnalyticsView').then((module) => ({ default: module.ReportsAnalyticsView })));
const WeeklyDepartmentSummaryView = lazy(() => import('./components/views/WeeklyDepartmentSummaryView').then((module) => ({ default: module.WeeklyDepartmentSummaryView })));
const UserGuideReadmeView = lazy(() => import('./components/views/UserGuideReadmeView').then((module) => ({ default: module.UserGuideReadmeView })));
const AdministrationAuditView = lazy(() => import('./components/views/AdministrationAuditView').then((module) => ({ default: module.AdministrationAuditView })));
const FileRepositoryView = lazy(() => import('./components/views/FileRepositoryView').then((module) => ({ default: module.FileRepositoryView })));
const DepartmentsWorkflowView = lazy(() => import('./components/views/DepartmentsWorkflowView').then((module) => ({ default: module.DepartmentsWorkflowView })));
const MessagesChatView = lazy(() => import('./components/views/MessagesChatView').then((module) => ({ default: module.MessagesChatView })));
const NotificationsCenterView = lazy(() => import('./components/views/NotificationsCenterView').then((module) => ({ default: module.NotificationsCenterView })));

const AppContent: React.FC = () => {
  const { activeNavSection, setActiveNavSection, selectedProjectId, setSelectedProjectId } = useApp();
  const [projectInitialTab, setProjectInitialTab] = useState<string>('overview');

  const handleOpenProject = (id: string, initialTab: string = 'overview') => {
    setSelectedProjectId(id);
    setProjectInitialTab(initialTab);
  };

  const handleCloseProject = () => {
    setSelectedProjectId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenProject={handleOpenProject} />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Navigation Sidebar */}
        <Sidebar />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-16">
          {/* Global Spotlight Search Modal */}
          <GlobalSearchModal onOpenProject={handleOpenProject} />

          {/* Authentication & User Recovery Modal */}
          <AuthModal />

          {/* User Profile & Password Security Modal */}
          <UserProfileModal />

          {/* New Request Modal */}
          <NewRequestWizard />

          <Suspense fallback={<div className="p-6 text-sm text-slate-400" role="status">Loading view...</div>}>
            {/* View Routing */}
            {activeNavSection === 'dashboard' && (
              <ExecutiveDashboard onOpenProject={handleOpenProject} />
            )}

          {activeNavSection === 'all_projects' && (
            <StageWorkflowBoard onOpenProject={handleOpenProject} />
          )}

          {(activeNavSection === 'tracker' || activeNavSection === 'my_requests') && (
            <ProjectTrackerView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'departments' && (
            <DepartmentsWorkflowView />
          )}

          {activeNavSection === 'my_tasks' && (
            <MyTasksView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'messages' && (
            <MessagesChatView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'notifications' && (
            <NotificationsCenterView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'approvals' && (
            <ApprovalsCenterView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'calendar' && (
            <CalendarDeadlinesView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'team' && (
            <TeamWorkloadView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'clients' && (
            <ClientsBrandCIView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'files' && (
            <FileRepositoryView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'reports' && (
            <ReportsAnalyticsView />
          )}

          {activeNavSection === 'weekly_summary' && (
            <WeeklyDepartmentSummaryView onOpenProject={handleOpenProject} />
          )}

          {activeNavSection === 'user_guide' && (
            <UserGuideReadmeView />
          )}

          {(activeNavSection === 'administration' || activeNavSection === 'settings') && (
            <AdministrationAuditView />
          )}

            {/* Dedicated 8-Tab Project Workspace Overlay */}
            {selectedProjectId && (
              <ProjectDetailWorkspace
                projectId={selectedProjectId}
                initialTab={projectInitialTab}
                onClose={handleCloseProject}
              />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
