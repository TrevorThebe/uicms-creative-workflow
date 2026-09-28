import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, PriorityLevel, Project, User } from '../../types';
import { StageBadge, StatusBadge } from '../common/StatusBadge';
import {
  AlertCircle,
  AtSign,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Hash,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Layers,
  Lock,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Plus,
  Search,
  Send,
  Shield,
  Smile,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';

interface MessagesChatViewProps {
  onOpenProject?: (id: string, initialTab?: string) => void;
}

type ChannelType = 'project' | 'direct' | 'department';

interface ChannelItem {
  id: string;
  type: ChannelType;
  title: string;
  subtitle?: string;
  avatar?: string;
  icon?: React.ElementType;
  badge?: number;
  isOnline?: boolean;
  projectRef?: Project;
  userRef?: User;
  lastMessage?: ChatMessage;
}

const DEPARTMENT_CHANNELS = [
  { id: 'general', name: 'general-announcements', desc: 'Company-wide updates, milestones and releases', icon: Sparkles },
  { id: 'dept-marketing', name: 'marketing-ops', desc: 'Creative production, social media, copy and brand assets', icon: Layers },
  { id: 'dept-incentive-travel', name: 'travel-logistics', desc: 'Itineraries, ticketing, PVC badges and print collateral', icon: Building2 },
  { id: 'dept-online-ram', name: 'ram-rewards-sprints', desc: 'Dealer sprint challenges, leaderboards and digital vouchers', icon: Flame },
  { id: 'dept-qa-compliance', name: 'qa-compliance-lead', desc: 'Pre-flight audits, CI checks, and resolution tracking', icon: Shield },
];

export const MessagesChatView: React.FC<MessagesChatViewProps> = ({ onOpenProject }) => {
  const {
    currentUser,
    users,
    projects,
    tasks,
    chatMessages,
    sendChatMessage,
    deleteChatMessage,
    toggleImportantMessage,
    setSelectedProjectId,
    setActiveProjectTab,
  } = useApp();

  // Channel Selection State
  const [selectedChannelType, setSelectedChannelType] = useState<ChannelType>('project');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('PRJ-TRV-2026-004'); // default to active Dubai project
  const [channelFilterTab, setChannelFilterTab] = useState<'all' | 'project' | 'direct' | 'department'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Message Composer State
  const [messageText, setMessageText] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [referencedTaskId, setReferencedTaskId] = useState<string>('');
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll on message list update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedChannelId]);

  // Build channels list
  const projectChannels: ChannelItem[] = useMemo(() => {
    return projects.map((p) => {
      const projMsgs = chatMessages.filter((m) => m.projectId === p.id);
      const lastMsg = projMsgs[projMsgs.length - 1];
      return {
        id: p.id,
        type: 'project',
        title: `# ${p.id}`,
        subtitle: p.projectName,
        projectRef: p,
        lastMessage: lastMsg,
      };
    });
  }, [projects, chatMessages]);

  const directChannels: ChannelItem[] = useMemo(() => {
    return users
      .filter((u) => u.id !== currentUser.id)
      .map((u) => {
        const dmMessages = chatMessages.filter(
          (m) =>
            (m.senderId === currentUser.id && m.recipientId === u.id) ||
            (m.senderId === u.id && m.recipientId === currentUser.id)
        );
        const lastMsg = dmMessages[dmMessages.length - 1];
        return {
          id: u.id,
          type: 'direct',
          title: u.name,
          subtitle: u.roleTitle,
          avatar: u.avatar,
          userRef: u,
          isOnline: u.active,
          lastMessage: lastMsg,
        };
      });
  }, [users, currentUser, chatMessages]);

  const departmentChannels: ChannelItem[] = useMemo(() => {
    return DEPARTMENT_CHANNELS.map((d) => {
      const deptMsgs = chatMessages.filter((m) => m.channelId === d.id);
      const lastMsg = deptMsgs[deptMsgs.length - 1];
      return {
        id: d.id,
        type: 'department',
        title: `# ${d.name}`,
        subtitle: d.desc,
        icon: d.icon,
        lastMessage: lastMsg,
      };
    });
  }, [chatMessages]);

  // Filtered Channels List
  const allChannels = useMemo(() => {
    let list: ChannelItem[] = [];
    if (channelFilterTab === 'all' || channelFilterTab === 'project') {
      list = [...list, ...projectChannels];
    }
    if (channelFilterTab === 'all' || channelFilterTab === 'direct') {
      list = [...list, ...directChannels];
    }
    if (channelFilterTab === 'all' || channelFilterTab === 'department') {
      list = [...list, ...departmentChannels];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.subtitle && c.subtitle.toLowerCase().includes(q))
      );
    }
    return list;
  }, [channelFilterTab, projectChannels, directChannels, departmentChannels, searchQuery]);

  // Find active channel object
  const activeChannel = useMemo(() => {
    if (selectedChannelType === 'project') {
      return projectChannels.find((c) => c.id === selectedChannelId) || projectChannels[0];
    } else if (selectedChannelType === 'direct') {
      return directChannels.find((c) => c.id === selectedChannelId) || directChannels[0];
    } else {
      return departmentChannels.find((c) => c.id === selectedChannelId) || departmentChannels[0];
    }
  }, [selectedChannelType, selectedChannelId, projectChannels, directChannels, departmentChannels]);

  // Filter Messages for Current Channel
  const currentMessages = useMemo(() => {
    if (selectedChannelType === 'project') {
      return chatMessages.filter((m) => m.projectId === selectedChannelId);
    } else if (selectedChannelType === 'direct') {
      return chatMessages.filter(
        (m) =>
          (m.senderId === currentUser.id && m.recipientId === selectedChannelId) ||
          (m.senderId === selectedChannelId && m.recipientId === currentUser.id)
      );
    } else {
      return chatMessages.filter((m) => m.channelId === selectedChannelId);
    }
  }, [chatMessages, selectedChannelType, selectedChannelId, currentUser.id]);

  // Available tasks in current project (for linking)
  const activeProjectTasks = useMemo(() => {
    if (selectedChannelType === 'project') {
      return tasks.filter((t) => t.projectId === selectedChannelId);
    }
    return [];
  }, [tasks, selectedChannelType, selectedChannelId]);

  // Available team members for mention
  const activeChannelMembers = useMemo(() => {
    if (selectedChannelType === 'project' && activeChannel?.projectRef) {
      const p = activeChannel.projectRef;
      const ids = new Set([
        p.accountableUserId,
        p.projectOwnerId,
        p.qaOwnerId,
        p.approverId,
        ...(p.contributorIds || []),
      ]);
      return users.filter((u) => ids.has(u.id));
    }
    return users;
  }, [selectedChannelType, activeChannel, users]);

  // Handle Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;

    // Detect @mentions in message text
    const mentionedUserIds: string[] = [];
    users.forEach((u) => {
      if (messageText.includes(`@${u.name}`)) {
        mentionedUserIds.push(u.id);
      }
    });

    sendChatMessage({
      projectId: selectedChannelType === 'project' ? selectedChannelId : undefined,
      recipientId: selectedChannelType === 'direct' ? selectedChannelId : undefined,
      channelId: selectedChannelType === 'department' ? selectedChannelId : undefined,
      senderId: currentUser.id,
      message: messageText.trim(),
      isImportant,
      referencedTaskId: referencedTaskId || undefined,
      mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
    });

    setMessageText('');
    setIsImportant(false);
    setReferencedTaskId('');
    setAttachedFiles([]);
    setShowMentionPicker(false);
    setShowTaskPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenProjectWorkspace = (projectId: string, tab: string = 'overview') => {
    if (onOpenProject) {
      onOpenProject(projectId, tab);
    } else {
      setSelectedProjectId(projectId);
      setActiveProjectTab(tab);
    }
  };

  const addMention = (userName: string) => {
    setMessageText((prev) => `${prev}@${userName} `);
    setShowMentionPicker(false);
    textareaRef.current?.focus();
  };

  const addQuickEmoji = (emoji: string) => {
    setMessageText((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const attachSampleFile = (type: 'pdf' | 'figma' | 'image') => {
    const filename =
      type === 'pdf'
        ? `Flight_Manifest_Dubai_V2.pdf`
        : type === 'figma'
        ? `Luggage_Tag_DieLine_CopperFoil.fig`
        : `Hero_Banner_1920x600_Proof.png`;
    setAttachedFiles((prev) => [...prev, filename]);
  };

  return (
    <div className="h-[calc(100vh-61px)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* View Header Bar */}
      <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Messages & Live Project Discussions
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-functional communication tagged by project, task, and deliverable version.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeChannel?.projectRef && (
            <button
              type="button"
              onClick={() => handleOpenProjectWorkspace(activeChannel.projectRef!.id, 'chat')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Project Workspace</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showRightPanel
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle details panel"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Chat Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Channels & DMs Sidebar */}
        <div className="w-72 sm:w-80 bg-slate-900/90 border-r border-slate-800 flex flex-col flex-shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms, projects, team..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-400">
              <button
                type="button"
                onClick={() => setChannelFilterTab('all')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  channelFilterTab === 'all' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setChannelFilterTab('project')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  channelFilterTab === 'project' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'hover:text-slate-200'
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setChannelFilterTab('direct')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  channelFilterTab === 'direct' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'hover:text-slate-200'
                }`}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => setChannelFilterTab('department')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  channelFilterTab === 'department' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'hover:text-slate-200'
                }`}
              >
                Depts
              </button>
            </div>
          </div>

          {/* Channels Scroll List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
            {/* Section: Project Channels */}
            {(channelFilterTab === 'all' || channelFilterTab === 'project') && (
              <div className="pt-1 pb-2">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Project Channels ({projectChannels.length})</span>
                  <Tag className="w-3 h-3 text-slate-400" />
                </div>
                <div className="space-y-0.5 mt-1">
                  {projectChannels
                    .filter(
                      (p) =>
                        !searchQuery ||
                        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.subtitle && p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((channel) => {
                      const isSelected =
                        selectedChannelType === 'project' && selectedChannelId === channel.id;
                      const proj = channel.projectRef!;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => {
                            setSelectedChannelType('project');
                            setSelectedChannelId(channel.id);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-xs'
                              : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                            <Hash className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold truncate text-white">
                                {proj.id}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {channel.lastMessage
                                  ? new Date(channel.lastMessage.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate font-medium">
                              {proj.projectName}
                            </p>
                            {channel.lastMessage ? (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                <span className="text-slate-400 font-medium">
                                  {channel.lastMessage.senderName.split(' ')[0]}:{' '}
                                </span>
                                {channel.lastMessage.message}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">No messages yet</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Section: Direct Messages */}
            {(channelFilterTab === 'all' || channelFilterTab === 'direct') && (
              <div className="pt-2 pb-2">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Direct Messages ({directChannels.length})</span>
                  <Users className="w-3 h-3 text-slate-400" />
                </div>
                <div className="space-y-0.5 mt-1">
                  {directChannels
                    .filter(
                      (u) =>
                        !searchQuery ||
                        u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.subtitle && u.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((channel) => {
                      const isSelected =
                        selectedChannelType === 'direct' && selectedChannelId === channel.id;
                      const user = channel.userRef!;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => {
                            setSelectedChannelType('direct');
                            setSelectedChannelId(channel.id);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-xs'
                              : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                            />
                            {user.active && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900 absolute bottom-0 right-0" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold truncate text-white">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {channel.lastMessage
                                  ? new Date(channel.lastMessage.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{user.roleTitle}</p>
                            {channel.lastMessage ? (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {channel.lastMessage.message}
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">Start conversation</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Section: Department Channels */}
            {(channelFilterTab === 'all' || channelFilterTab === 'department') && (
              <div className="pt-2 pb-2">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Departments ({departmentChannels.length})</span>
                  <Layers className="w-3 h-3 text-slate-400" />
                </div>
                <div className="space-y-0.5 mt-1">
                  {departmentChannels.map((dept) => {
                    const isSelected =
                      selectedChannelType === 'department' && selectedChannelId === dept.id;
                    const IconComp = dept.icon || Layers;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setSelectedChannelType('department');
                          setSelectedChannelId(dept.id);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-xs'
                            : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold truncate block text-white">
                            {dept.title}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate">{dept.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Active Conversation Feed */}
        <div className="flex-1 flex flex-col bg-slate-950/60 overflow-hidden">
          {/* Active Channel Header */}
          <div className="p-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {selectedChannelType === 'project' && activeChannel?.projectRef ? (
                <>
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {activeChannel.projectRef.projectName}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {activeChannel.projectRef.id}
                      </span>
                      <StageBadge stage={activeChannel.projectRef.stage} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      Client: {activeChannel.projectRef.clientId} • Due:{' '}
                      {activeChannel.projectRef.releaseDate} • Owner:{' '}
                      {users.find((u) => u.id === activeChannel.projectRef?.projectOwnerId)?.name || 'Owner'}
                    </p>
                  </div>
                </>
              ) : selectedChannelType === 'direct' && activeChannel?.userRef ? (
                <>
                  <div className="relative flex-shrink-0">
                    <img
                      src={activeChannel.userRef.avatar}
                      alt={activeChannel.userRef.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/40"
                    />
                    {activeChannel.userRef.active && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 absolute bottom-0 right-0" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {activeChannel.userRef.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {activeChannel.userRef.roleTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {activeChannel.userRef.email} • Department: {activeChannel.userRef.departmentId}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">
                      {activeChannel?.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{activeChannel?.subtitle}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedChannelType === 'project' && activeChannel?.projectRef && (
                <button
                  type="button"
                  onClick={() => handleOpenProjectWorkspace(activeChannel.projectRef!.id, 'tasks')}
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tasks ({activeProjectTasks.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                  <MessageCircle className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold text-white">No messages yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Start the conversation! Tag team members with <code className="text-indigo-300">@name</code> or reference tasks with <code className="text-emerald-300">#task</code>.
                </p>
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const referencedTask = tasks.find((t) => t.id === msg.referencedTaskId);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group transition-all ${
                      isMe ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Sender Avatar */}
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-800 flex-shrink-0 mt-0.5"
                    />

                    {/* Message Bubble Container */}
                    <div className={`max-w-xl min-w-[200px] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Sender Info Bar */}
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-200">{msg.senderName}</span>
                        <span>•</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {msg.isImportant && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            Important
                          </span>
                        )}
                      </div>

                      {/* Main Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed border relative shadow-md ${
                          isMe
                            ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-xs'
                            : msg.isImportant
                            ? 'bg-slate-900 border-amber-500/40 text-slate-100 rounded-tl-xs'
                            : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {/* Body Message */}
                        <div className="whitespace-pre-wrap break-words">
                          {msg.message}
                        </div>

                        {/* Referenced Task Badge */}
                        {referencedTask && (
                          <div
                            onClick={() => handleOpenProjectWorkspace(referencedTask.projectId, 'tasks')}
                            className={`mt-2.5 p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                              isMe
                                ? 'bg-indigo-700/60 border-indigo-400/50 hover:bg-indigo-700 text-white'
                                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="truncate font-medium">
                                Task: {referencedTask.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono opacity-80 uppercase">
                              {referencedTask.status}
                            </span>
                          </div>
                        )}

                        {/* Attached Files list */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2.5 space-y-1">
                            {msg.attachments.map((att, i) => (
                              <div
                                key={i}
                                className={`p-1.5 px-2 rounded border text-[11px] flex items-center justify-between gap-2 ${
                                  isMe
                                    ? 'bg-indigo-700/50 border-indigo-400/40'
                                    : 'bg-slate-950 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="w-3.5 h-3.5 opacity-80" />
                                  <span className="truncate font-mono text-[10px]">{att}</span>
                                </div>
                                <Download className="w-3 h-3 cursor-pointer opacity-80 hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => toggleImportantMessage(msg.id)}
                          className="p-1 hover:text-amber-400 transition-colors"
                          title="Flag as Important"
                        >
                          <Star className={`w-3.5 h-3.5 ${msg.isImportant ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        {(isMe || currentUser.role === 'super_admin') && (
                          <button
                            type="button"
                            onClick={() => deleteChatMessage(msg.id)}
                            className="p-1 hover:text-rose-400 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Composer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            {/* Mention Picker Dropdown */}
            {showMentionPicker && (
              <div className="mb-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-1 max-h-40 overflow-y-auto text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                  Mention Team Member
                </p>
                {activeChannelMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => addMention(m.name)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-600 hover:text-white flex items-center gap-2 text-slate-300 transition-colors"
                  >
                    <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-medium text-xs">{m.name}</span>
                    <span className="text-[10px] opacity-70 ml-auto">{m.roleTitle}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Task Picker Dropdown */}
            {showTaskPicker && activeProjectTasks.length > 0 && (
              <div className="mb-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-1 max-h-40 overflow-y-auto text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                  Attach Project Task Reference
                </p>
                {activeProjectTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setReferencedTaskId(t.id);
                      setShowTaskPicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-emerald-600 hover:text-white flex items-center justify-between text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate font-medium">{t.name}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">{t.status}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Emoji Quick Picker */}
            {showEmojiPicker && (
              <div className="mb-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-wrap gap-2 text-base">
                {['👍', '❤️', '🚀', '🎯', '🔥', '✅', '👀', '🎉', '💡', '⚠️'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addQuickEmoji(emoji)}
                    className="p-1.5 hover:bg-slate-800 rounded transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Active Attachment Chips Bar */}
            {(referencedTaskId || attachedFiles.length > 0 || isImportant) && (
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {isImportant && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    Important Notice
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer hover:text-white"
                      onClick={() => setIsImportant(false)}
                    />
                  </span>
                )}

                {referencedTaskId && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Task: {tasks.find((t) => t.id === referencedTaskId)?.name || referencedTaskId}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer hover:text-white"
                      onClick={() => setReferencedTaskId('')}
                    />
                  </span>
                )}

                {attachedFiles.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    <Paperclip className="w-3 h-3 text-indigo-400" />
                    {f}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer hover:text-white"
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Composer Box */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder={`Message ${activeChannel?.title || 'channel'}... (Enter to send, Shift+Enter for new line)`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-400 focus:outline-none resize-none transition-colors"
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowMentionPicker(!showMentionPicker)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    title="Mention team member (@)"
                  >
                    <AtSign className="w-4 h-4" />
                  </button>

                  {selectedChannelType === 'project' && activeProjectTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTaskPicker(!showTaskPicker)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                      title="Link Project Task (#)"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => attachSampleFile('pdf')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    title="Attach proof PDF"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    title="Add reaction emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsImportant(!isImportant)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isImportant
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                    title="Flag as Important notice"
                  >
                    <Star className={`w-4 h-4 ${isImportant ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!messageText.trim() && attachedFiles.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Context & Project Dossier (Collapsible) */}
        {showRightPanel && (
          <div className="w-72 bg-slate-900/95 border-l border-slate-800 flex flex-col overflow-y-auto p-4 space-y-5 flex-shrink-0 animate-in fade-in slide-in-from-right duration-200">
            {selectedChannelType === 'project' && activeChannel?.projectRef ? (
              <>
                {/* Project Summary Card */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Project Context
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Project Title</span>
                      <span className="font-semibold text-white">
                        {activeChannel.projectRef.projectName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stage</span>
                        <StageBadge stage={activeChannel.projectRef.stage} size="sm" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Version</span>
                        <span className="font-mono font-bold text-indigo-400">
                          {activeChannel.projectRef.version}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Release Deadline</span>
                      <span className="text-slate-200 font-medium">
                        {activeChannel.projectRef.releaseDate}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenProjectWorkspace(activeChannel.projectRef!.id, 'overview')}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Participants ({activeChannelMembers.length})
                  </h4>
                  <div className="space-y-1.5">
                    {activeChannelMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block text-[11px]">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {m.roleTitle}
                            </span>
                          </div>
                        </div>

                        {m.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChannelType('direct');
                              setSelectedChannelId(m.id);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                            title="Direct Message"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pinned / Important Messages in this channel */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Pinned Notes ({currentMessages.filter((m) => m.isImportant).length})
                  </h4>
                  <div className="space-y-2">
                    {currentMessages.filter((m) => m.isImportant).length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No pinned messages yet</p>
                    ) : (
                      currentMessages
                        .filter((m) => m.isImportant)
                        .map((pinned) => (
                          <div
                            key={pinned.id}
                            className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] text-amber-300/80">
                              <span className="font-bold">{pinned.senderName}</span>
                              <span>
                                {new Date(pinned.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-200 line-clamp-3">
                              {pinned.message}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            ) : selectedChannelType === 'direct' && activeChannel?.userRef ? (
              <>
                {/* User Profile Card */}
                <div className="text-center p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <img
                    src={activeChannel.userRef.avatar}
                    alt={activeChannel.userRef.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-indigo-500/50 shadow-lg"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeChannel.userRef.name}</h4>
                    <p className="text-xs text-indigo-400 font-medium">
                      {activeChannel.userRef.roleTitle}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-left text-xs space-y-1.5 text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Email
                      </span>
                      <span className="text-slate-200">{activeChannel.userRef.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Department
                      </span>
                      <span className="text-slate-200 capitalize">
                        {activeChannel.userRef.departmentId}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider">
                  Department Guidelines
                </h4>
                <p className="text-[11px] leading-relaxed">
                  Use this department channel to sync on shared resources, design system standards, pre-flight audits, and client delivery SLA tracking.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
