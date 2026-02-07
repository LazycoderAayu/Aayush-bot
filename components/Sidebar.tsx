import React from 'react';
import { MessageSquare, Plus, LogOut, Trash2, X, Shield } from 'lucide-react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void; // New prop for admin
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  user,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLogout,
  onOpenAdmin
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-[280px] bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl md:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header / New Chat */}
        <div className="p-4 flex-none">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="font-bold text-slate-700 dark:text-slate-200">Menu</h2>
            <button onClick={onClose} className="p-1 text-slate-500">
              <X size={24} />
            </button>
          </div>
          
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm text-slate-700 dark:text-slate-200 font-medium group"
          >
            <Plus size={20} className="text-primary group-hover:scale-110 transition-transform" />
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Recent Chats
          </div>
          
          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400 text-center italic">
              No history yet.
            </div>
          ) : (
            sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                  ${currentSessionId === session.id 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white font-medium ring-1 ring-slate-200 dark:ring-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <MessageSquare size={18} className={currentSessionId === session.id ? 'text-primary' : 'opacity-70'} />
                
                <span className="truncate text-sm pr-6 flex-1">
                  {session.title || 'New Chat'}
                </span>

                {/* Delete Button (visible on hover or if active) */}
                <button
                  onClick={(e) => onDeleteSession(e, session.id)}
                  className={`
                    absolute right-2 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all
                    md:opacity-0 md:group-hover:opacity-100
                    ${currentSessionId === session.id ? 'opacity-100' : ''}
                  `}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Admin Dashboard Button - Dedicated Section */}
        {user.isAdmin && (
          <div className="px-4 pb-2">
             <button
              onClick={onOpenAdmin}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md shadow-indigo-500/20 uppercase tracking-wide group"
            >
              <Shield size={14} className="group-hover:scale-110 transition-transform" />
              Admin Dashboard
            </button>
          </div>
        )}

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm
               ${user.provider === 'guest' ? 'bg-slate-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'}
             `}>
                {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                 {user.name}
               </p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                 {user.email === 'guest' ? 'Guest Access' : user.email}
               </p>
             </div>
             <button
               onClick={onLogout}
               className="p-2 text-slate-400 hover:text-red-500 transition-colors"
               title="Sign Out"
             >
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </aside>
    </>
  );
};