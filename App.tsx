import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { Message, User, ChatSession } from './types';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { 
  Moon, Sun, Menu, X, Users, Activity, Shield, 
  MessageSquare, Mail, Apple, Globe, Sparkles, 
  Send, Trash2, LogOut, ChevronRight, Settings, 
  User as UserIcon, Clock, Zap, Search, Bell
} from 'lucide-react';

const BOT_AVATAR_URL = "https://avatars.githubusercontent.com/u/153844634?v=4";

interface UserActivity extends User {
  lastActive: number;
  status: 'online' | 'offline';
  ip?: string;
  device?: string;
  totalChats?: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved === 'dark';
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [userHistory, setUserHistory] = useState<UserActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<number>(3);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  const syncUserToCloud = async (userData: User) => {
    try {
      await fetch('/api/user/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, lastActive: Date.now(), status: 'online' }),
      });
    } catch (err) { console.error(err); }
  };

  const saveChatToCloud = async (email: string, text: string, role: string) => {
    try {
      await fetch('/api/user/save-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, text, role, timestamp: Date.now() }),
      });
    } catch (err) { console.error(err); }
  };

  const refreshAdminData = async () => {
    try {
      const response = await fetch('/api/admin/get-users');
      const cloudData = await response.json();
      if (Array.isArray(cloudData)) {
        setUserHistory(cloudData);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const storedHistory = localStorage.getItem('app_user_history');
    let history: UserActivity[] = storedHistory ? JSON.parse(storedHistory) : [];

    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));
      syncUserToCloud(user);
      
      const now = Date.now();
      const existingIndex = history.findIndex(u => u.email === user.email);
      const currentUserActivity: UserActivity = { ...user, lastActive: now, status: 'online' };
      
      if (existingIndex >= 0) { history[existingIndex] = currentUserActivity; } 
      else { history.push(currentUserActivity); }

      const savedSessions = localStorage.getItem(`chat_sessions_${user.id}`);
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          setSessions(parsed);
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
          else createNewSession();
        } catch (e) { createNewSession(); }
      } else { createNewSession(); }
    } else {
      localStorage.removeItem('user_session');
      setSessions([]);
      setCurrentSessionId(null);
    }
    setUserHistory(history);
    localStorage.setItem('app_user_history', JSON.stringify(history));
  }, [user]);
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`chat_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [currentMessages, currentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) geminiService.initializeChat(session.messages);
    }
  }, [currentSessionId]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{
        id: 'welcome',
        role: 'model',
        text: "Alright, I'm awake. What broke this time? Or are we actually building something useful for once?",
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    geminiService.initializeChat(newSession.messages);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    if (currentSessionId === sessionId) {
      if (newSessions.length > 0) setCurrentSessionId(newSessions[0].id);
      else createNewSession();
    }
  };

  const updateCurrentSessionMessages = (newMessages: Message[], newTitle?: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: newMessages, title: newTitle || session.title, updatedAt: Date.now() };
      }
      return session;
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    saveChatToCloud(user.email, userMessage.text, 'user');

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const updatedMessages = [...currentSession.messages, userMessage];
    let newTitle = currentSession.title;
    if (currentSession.messages.length <= 1) {
      newTitle = userMessage.text.slice(0, 30) + (userMessage.text.length > 30 ? '...' : '');
    }

    updateCurrentSessionMessages(updatedMessages, newTitle);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = { id: modelMessageId, role: 'model', text: '', timestamp: Date.now() };
    updateCurrentSessionMessages([...updatedMessages, modelMessage], newTitle);

    try {
      const stream = geminiService.sendMessageStream(userMessage.text);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const msgs = s.messages.map(m => m.id === modelMessageId ? { ...m, text: fullText } : m);
            return { ...s, messages: msgs, updatedAt: Date.now() };
          }
          return s;
        }));
      }
      saveChatToCloud(user.email, fullText, 'model');
    } catch (error: any) {
      let errorMessage = "Something went wrong. My brain hurts.";
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes('quota')) errorMessage = "API quota exhausted.";
      
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'model',
        text: errorMessage,
        timestamp: Date.now(),
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };
  const getProviderIcon = (provider: string) => {
    switch(provider) {
      case 'google': return <svg className="w-3 h-3" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.04-3.24 2.053-2.053 2.68-5.2 2.68-7.84 0-.76-.067-1.48-.173-2h-10.53z" fill="currentColor"/></svg>;
      case 'apple': return <Apple size={12} />;
      case 'guest': return <Users size={12} />;
      default: return <Mail size={12} />;
    }
  };

  const formatLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  const onlineCount = userHistory.filter(u => u.status === 'online').length;

  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} overflow-hidden bg-texture`}>
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          setIsAdminOpen(true);
          refreshAdminData();
        }}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        <header className="flex-none transition-colors duration-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm z-10 sticky top-0">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu size={24} />
              </button>

              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <img src={BOT_AVATAR_URL} alt="Bot" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Aayush.bot
                </h1>
                <span className="text-[10px] text-slate-500 font-medium">
                  {sessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 gap-2 border border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{onlineCount} Online</span>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth w-full bg-gradient-to-b from-transparent to-slate-100/30 dark:to-slate-900/30">
          <div className="max-w-3xl mx-auto space-y-6">
            {currentMessages.length === 1 && (
              <div className="py-10 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400 shadow-lg rotate-3">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">How can I help you today?</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">I'm your personal AI assistant, ready to help with coding, writing, or just to have a chat.</p>
              </div>
            )}
            {currentMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} botAvatarUrl={BOT_AVATAR_URL} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>
        <footer className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-colors duration-300 border-t border-slate-200/50 dark:border-slate-800/50">
          <InputArea 
            input={input} 
            setInput={setInput} 
            onSend={handleSend} 
            isLoading={isLoading} 
          />
        </footer>
      </div>

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 flex-none">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Control Center</h2>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Live • MongoDB Cloud Active</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/50 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <Users size={20} />
                    </div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">+12% total</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{userHistory.length}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Registered Users</p>
                </div>

                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800/50 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <Activity size={20} />
                    </div>
                    <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{onlineCount}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Active Sessions</p>
                </div>

                <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-800/50 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                      <MessageSquare size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {sessions.reduce((acc, s) => acc + s.messages.length, 0)}
                  </p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Interactions</p>
                </div>

                <div className="p-6 bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-800/50 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                      <Zap size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">99.9%</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">System Uptime</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">User Management</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs border-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-4 pl-8 font-black uppercase text-[10px] tracking-widest">Identified User</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-widest text-center">Authorization</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Live Status</th>
                        <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right pr-8">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {userHistory.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-100 dark:shadow-none group-hover:scale-110 transition-transform">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded text-[8px] text-slate-500 flex items-center gap-1">
                                    {getProviderIcon(u.id.includes('google') ? 'google' : 'guest')} {u.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.isAdmin ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                              {u.isAdmin ? 'Root Admin' : 'Standard User'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-2 text-[11px] font-bold ${u.status === 'online' ? 'text-emerald-500' : 'text-slate-400'}`}>
                              <span className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-slate-300'}`}></span>
                              {u.status === 'online' ? 'ACTIVE NOW' : 'OFFLINE'}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-8">
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{formatLastActive(u.lastActive)}</div>
                            <div className="text-[10px] text-slate-400 font-medium">UTC Offset +5:30</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center flex items-center justify-center gap-6">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                 <Globe size={12} className="text-indigo-500" />
                 Encrypted Node: 0x442A • {new Date().getFullYear()} Aayush.bot Enterprise
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
