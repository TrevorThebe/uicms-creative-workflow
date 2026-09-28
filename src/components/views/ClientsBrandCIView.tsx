import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientRecord } from '../../types';
import {
  Building2,
  Check,
  Download,
  ExternalLink,
  FileText,
  Plus,
  Search,
} from 'lucide-react';

interface ClientsBrandCIViewProps {
  onOpenProject: (id: string, initialTab?: string) => void;
}

export const ClientsBrandCIView: React.FC<ClientsBrandCIViewProps> = ({
  onOpenProject,
}) => {
  const { clients, projects } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const clientProjects = projects.filter((p) => p.clientId === selectedClient?.id);

  const filteredClients = clients.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Clients & Corporate Identity (CI) Library
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              {clients.length} Registered Accounts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Section 33: Client brand guideline manuals, official hex color palettes, font stacks, and active project associations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Clients List */}
        <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter clients..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.map((c) => {
              const isSelected = selectedClient?.id === c.id;
              const count = projects.filter((p) => p.clientId === c.id).length;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className={`font-bold text-xs block truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {c.name}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-100 font-semibold' : 'text-slate-400'}`}>
                      {c.code}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-indigo-700 text-white border border-indigo-400/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count} prjs
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Client CI Detail Book */}
        {selectedClient && (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                    Client Account Profile
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedClient.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead Approver: <strong className="text-slate-200">{typeof selectedClient.primaryContact === 'object' ? selectedClient.primaryContact.name : selectedClient.primaryContact}</strong> ({typeof selectedClient.primaryContact === 'object' ? selectedClient.primaryContact.email : selectedClient.primaryEmail || 'contact@client.com'})
                  </p>
                </div>
              </div>

              {/* Brand CI Specifications */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Brand Corporate Identity (CI) Guidelines
                </h4>

                {/* Brand Colors Swatches */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Approved Hex Color Palette:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(selectedClient.defaultCiColors || selectedClient.brandColors || ['#4F46E5', '#06B6D4']).map((color: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                      >
                        <div
                          className="w-7 h-7 rounded-lg shadow border border-white/10 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Color {i + 1}</span>
                          <span className="font-mono text-xs font-bold text-white">{color}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography / Font Stack */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Approved Typography Family
                  </span>
                  <p className="font-mono font-bold text-indigo-300 text-sm">
                    {selectedClient.fontRequirements || selectedClient.fontFamily || 'Helvetica Neue, Inter, sans-serif'}
                  </p>
                </div>

                {/* Brand Notes */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Key Brand Guidelines & Restrictions
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedClient.brandGuidelines || selectedClient.guidelinesNotes || selectedClient.notes || 'Strict adherence to client branding guidelines required.'}
                  </p>
                </div>
              </div>

              {/* Associated Active Projects */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Projects for {selectedClient.name.split('(')[0]} ({clientProjects.length})
                </h4>
                <div className="space-y-2">
                  {clientProjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No projects created for this client yet.</p>
                  ) : (
                    clientProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onOpenProject(p.id)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white block">{p.projectName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.id} • {p.version}</span>
                        </div>
                        <span className="text-xs font-semibold text-indigo-400">Open →</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
