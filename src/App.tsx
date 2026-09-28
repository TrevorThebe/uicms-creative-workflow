import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { StageWorkflowBoard } from './components/kanban/StageWorkflowBoard';
import { ProjectDetailWorkspace } from './components/project/ProjectDetailWorkspace';
import { NewRequestWizard } from './components/requests/NewRequestWizard';
import { MyTasksView } from './components/views/MyTasksView';
import { ProjectTrackerView } from './components/views/ProjectTrackerView';
import { ApprovalsCenterView } from './components/views/ApprovalsCenterView';
import { CalendarDeadlinesView } from './components/views/CalendarDeadlinesView';
import { TeamWorkloadView } from './components/views/TeamWorkloadView';
import { ClientsBrandCIView } from './components/views/ClientsBrandCIView';
import { ReportsAnalyticsView } from './components/views/ReportsAnalyticsView';
import { WeeklyDepartmentSummaryView } from './components/views/WeeklyDepartmentSummaryView';
import { UserGuideReadmeView } from './components/views/UserGuideReadmeView';
import { AdministrationAuditView } from './components/views/AdministrationAuditView';
import { FileRepositoryView } from './components/views/FileRepositoryView';
import { DepartmentsWorkflowView } from './components/views/DepartmentsWorkflowView';
import { MessagesChatView } from './components/views/MessagesChatView';
import { NotificationsCenterView } from './components/views/NotificationsCenterView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';

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
