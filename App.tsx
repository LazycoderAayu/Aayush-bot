import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { Message, User, ChatSession } from './types';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Moon, Sun, Menu, X, Users, Activity, Shield, MessageSquare, Mail, Apple, Globe } from 'lucide-react';

const BOT_AVATAR_URL = "https://avatars.githubusercontent.com/u/153844634?v=4";

// Extended interface for tracking history
interface UserActivity extends User {
  lastActive: number;
  status: 'online' | 'offline';
}

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved === 'dark';
  });

  // --- Chat Data State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  // --- Admin / User History State ---
  const [userHistory, setUserHistory] = useState<UserActivity[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Derived State ---
  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  // 1. Handle User Session Persistence & History Tracking
  useEffect(() => {
    // Load existing history
    const storedHistory = localStorage.getItem('app_user_history');
    let history: UserActivity[] = storedHistory ? JSON.parse(storedHistory) : [];

    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));

      // Update current user in history
      const now = Date.now();
      const existingIndex = history.findIndex(u => u.email === user.email);
      
      const currentUserActivity: UserActivity = {
        ...user,
        lastActive: now,
        status: 'online'
      };

      if (existingIndex >= 0) {
        history[existingIndex] = currentUserActivity;
      } else {
        history.push(currentUserActivity);
      }

      // Load sessions for this specific user
      const savedSessions = localStorage.getItem(`chat_sessions_${user.id}`);
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          setSessions(parsed);
          if (parsed.length > 0) {
            setCurrentSessionId(parsed[0].id);
          } else {
            createNewSession();
          }
        } catch (e) {
          console.error("Failed to parse sessions", e);
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } else {
      localStorage.removeItem('user_session');
      setSessions([]);
      setCurrentSessionId(null);
    }

    // Update statuses: Only the current user is 'online', everyone else is 'offline'
    history = history.map(u => ({
      ...u,
      status: (user && u.email === user.email) ? 'online' : 'offline',
      // If it's the current user, update lastActive to now
      lastActive: (user && u.email === user.email) ? Date.now() : u.lastActive
    }));

    // Sort by most recently active
    history.sort((a, b) => b.lastActive - a.lastActive);

    setUserHistory(history);
    localStorage.setItem('app_user_history', JSON.stringify(history));

  }, [user]);

  // 2. Persist Sessions whenever they change
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`chat_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  // 3. Handle Theme
  useEffect(() => {
    localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 4. Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, currentSessionId]);

  // 5. Initialize AI Service when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        geminiService.initializeChat(session.messages);
      }
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const updateCurrentSessionMessages = (newMessages: Message[], newTitle?: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: newMessages,
          title: newTitle || session.title,
          updatedAt: Date.now()
        };
      }
      return session;
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    // Optimistically update UI
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Auto-generate title if this is the first user message
    let newTitle = currentSession.title;
    if (currentSession.messages.length <= 1) {
      newTitle = userMessage.text.slice(0, 30) + (userMessage.text.length > 30 ? '...' : '');
    }

    updateCurrentSessionMessages(updatedMessages, newTitle);
    setInput('');
    setIsLoading(true);

    // Prepare Model Message Placeholder
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
    };

    // Add empty model message to state
    updateCurrentSessionMessages([...updatedMessages, modelMessage], newTitle);

    try {
      const stream = geminiService.sendMessageStream(userMessage.text);
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const msgs = s.messages.map(m => 
              m.id === modelMessageId ? { ...m, text: fullText } : m
            );
            return { ...s, messages: msgs, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorMessage = "Something went wrong. My brain hurts.";
      
      // Flatten error to string for easy checking
      const errorStr = JSON.stringify(error).toLowerCase();
      
      // Robust checks for different error formats (JSON object vs Error object)
      const errObj = error?.error || error;
      const code = errObj?.code || errObj?.status;

      if (
        code === 429 || 
        errorStr.includes('"code":429') || 
        errorStr.includes('quota') || 
        errorStr.includes('resource_exhausted')
      ) {
        errorMessage = "You've exhausted your API quota. I'm too expensive for you right now. Check your billing or wait a bit.";
      } else if (
        code === 503 || 
        errorStr.includes('503') || 
        errorStr.includes('overloaded')
      ) {
        errorMessage = "Servers are overloaded. Everyone wants a piece of me. Try again in a sec.";
      }
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const msgs = s.messages.map(m => 
            m.id === modelMessageId ? { ...m, text: errorMessage, isError: true } : m
          );
          return { ...s, messages: msgs, updatedAt: Date.now() };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Helper to get provider icon
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
    if (diff < 60000) return 'Just now'; // < 1 min
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
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Header */}
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
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth w-full">
          <div className="max-w-3xl mx-auto space-y-6">
            {currentMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} botAvatarUrl={BOT_AVATAR_URL} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Input Area */}
        <footer className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-colors duration-300">
          <InputArea 
            input={input} 
            setInput={setInput} 
            onSend={handleSend} 
            isLoading={isLoading} 
          />
        </footer>
      </div>

      {/* --- Admin Dashboard Modal --- */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
                  <p className="text-xs text-slate-500">System Overview & User Management</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                    <Users size={18} />
                    <span className="font-semibold text-sm">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{userHistory.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Unique Logins Detected</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                   <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                    <Activity size={18} />
                    <span className="font-semibold text-sm">Online Now</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{onlineCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Current Session</p>
                </div>
                 <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50">
                   <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                    <MessageSquare size={18} />
                    <span className="font-semibold text-sm">System Messages</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {sessions.reduce((acc, s) => acc + s.messages.length, 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Total Interactions</p>
                </div>
              </div>

              {/* Users Table */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  User History (Local)
                </h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Update
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 pl-4 font-semibold">User</th>
                      <th className="p-3 font-semibold">Email</th>
                      <th className="p-3 font-semibold text-center">Provider</th>
                      <th className="p-3 font-semibold text-center">Role</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right pr-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {userHistory.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                           No user history found.
                         </td>
                       </tr>
                    ) : (
                      userHistory.map((u, index) => (
                        <tr key={u.id} className={`
                          hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                          ${u.email === user.email ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                        `}>
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                                ${u.email === user.email ? 'bg-indigo-600' : 
                                  u.provider === 'guest' ? 'bg-slate-400' : 
                                  u.provider === 'google' ? 'bg-blue-500' : 
                                  u.provider === 'apple' ? 'bg-slate-800 dark:bg-white dark:text-black' : 'bg-emerald-500'}
                              `}>
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                  {u.name}
                                  {u.email === user.email && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800">YOU</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {u.email}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {getProviderIcon(u.provider)}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                              ${u.isAdmin 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                                : u.provider === 'guest'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'}
                            `}>
                              {u.isAdmin ? 'Admin' : (u.provider === 'guest' ? 'Guest' : 'User')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`flex items-center gap-1.5 text-xs font-medium
                              ${u.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}
                            `}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                              {u.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="p-3 text-right pr-4 text-xs text-slate-500">
                            {formatLastActive(u.lastActive)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
               <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                 <Globe size={10} />
                 System Region: US-EAST-1 • Database Sync: Local Storage
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}