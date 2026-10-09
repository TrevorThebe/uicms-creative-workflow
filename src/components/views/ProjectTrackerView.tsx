import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DepartmentId, PriorityLevel, Project, ProjectStatus } from '../../types';
import { StageBadge, StatusBadge } from '../common/StatusBadge';
import {
  ArrowUpDown,
  Download,
  ExternalLink,
  Filter,
  Layers,
  Search,
  Table,
} from 'lucide-react';
import { getRequestTypeConfig } from '../../data/briefSchemas';

interface ProjectTrackerViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const ProjectTrackerView: React.FC<ProjectTrackerViewProps> = ({
  onOpenProject,
}) => {
  const { projects, clients, users, activeNavSection, currentUser } = useApp();

  const isMyRequests = activeNavSection === 'my_requests';
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<DepartmentId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortField, setSortField] = useState<keyof Project>('releaseDate');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredProjects = projects
    .filter((p) => {
      if (isMyRequests) {
        const isAssociated =
          p.projectOwnerId === currentUser.id ||
          p.accountableUserId === currentUser.id ||
          p.approverId === currentUser.id ||
          p.qaOwnerId === currentUser.id;
        if (!isAssociated && projects.length > 3) return false;
      }
      if (deptFilter !== 'all' && p.departmentId !== deptFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = clients.find((c) => c.id === p.clientId);
        const matches =
          p.projectName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.campaignName.toLowerCase().includes(q) ||
          (client?.name.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Project ID',
      'Project Name',
      'Client',
      'Department',
      'Request Type',
      'Stage',
      'Status',
      'Version',
      'Priority',
      'Accountable Lead',
      'Project Owner',
      'QA Lead',
      'Client Approver',
      'Release Due Date',
      'Next Action Task',
      'Next Action Owner',
    ];

    const rows = filteredProjects.map((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const accUser = users.find((u) => u.id === p.accountableUserId);
      const ownUser = users.find((u) => u.id === p.projectOwnerId);
      const qaUser = users.find((u) => u.id === p.qaOwnerId);
      const appUser = users.find((u) => u.id === p.approverId);
      const reqConf = getRequestTypeConfig(p.requestTypeId);

      return [
        `"${p.id}"`,
        `"${p.projectName.replace(/"/g, '""')}"`,
        `"${client?.name || p.clientId}"`,
        `"${p.departmentId}"`,
        `"${reqConf?.name || p.requestTypeId}"`,
        `"${p.stage}"`,
        `"${p.status}"`,
        `"${p.version}"`,
        `"${p.priority}"`,
        `"${accUser?.name || ''}"`,
        `"${ownUser?.name || ''}"`,
        `"${qaUser?.name || ''}"`,
        `"${appUser?.name || ''}"`,
        `"${p.releaseDate}"`,
        `"${p.nextAction.task.replace(/"/g, '""')}"`,
        `"${p.nextAction.ownerName}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UICMS_Project_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      data-page={isMyRequests ? 'my_requests' : 'tracker'}
      className={`p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-150 ${
        isMyRequests ? 'my-requests-page' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              {isMyRequests ? 'My Creative Requests & Active Briefs' : 'Master Project Tracker (Excel Grid View)'}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                isMyRequests
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500/20 text-indigo-300'
              }`}
            >
              {filteredProjects.length} Projects
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isMyRequests
              ? 'Consolidated view of your requested campaigns, active deliverables, and real-time review statuses.'
              : 'Section 9: Consolidated high-density overview with live filter, sort, milestone tracking, and CSV export.'}
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV / Excel</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative min-w-[240px] flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, client, ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Departments</option>
          <option value="marketing">Marketing</option>
          <option value="incentive_travel">Incentive Travel</option>
          <option value="online_ram">Online RAM</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="on_track">🟢 On Track</option>
          <option value="due_soon">🟡 Due Soon</option>
          <option value="overdue">🔴 Overdue</option>
          <option value="waiting">🔵 Waiting</option>
          <option value="revision_required">🟠 Revision Required</option>
          <option value="blocked">⚫ Blocked</option>
          <option value="completed">🟢 Complete</option>
        </select>
      </div>

      {/* Excel Style High-Density Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-800">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider select-none">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Project ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('projectName')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Project Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Department</th>
                <th
                  onClick={() => handleSort('stage')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Stage</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Version</th>
                <th className="py-3 px-3">Accountable</th>
                <th className="py-3 px-3">Lead Designer</th>
                <th
                  onClick={() => handleSort('releaseDate')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Release Due</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Next Action Task</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredProjects.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                const accUser = users.find((u) => u.id === p.accountableUserId);
                const ownUser = users.find((u) => u.id === p.projectOwnerId);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {p.id}
                    </td>
                    <td className="py-3 px-3 font-bold text-white group-hover:text-indigo-300 transition-colors max-w-xs truncate">
                      {p.projectName}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                      {client?.name ? client.name.split('(')[0].trim() : p.clientId}
                    </td>
                    <td className="py-3 px-3 text-slate-400 capitalize whitespace-nowrap">
                      {p.departmentId.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StageBadge stage={p.stage} size="sm" />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {p.version}
                    </td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {accUser?.name.split(' ')[0]}
                    </td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {ownUser?.name.split(' ')[0]}
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-300 whitespace-nowrap">
                      {p.releaseDate}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={p.nextAction.task}>
                      {p.nextAction.task}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject(p.id);
                        }}
                        className="p-1.5 rounded-lg transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm inline-flex items-center justify-center"
                        title="Open Project Workspace"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
