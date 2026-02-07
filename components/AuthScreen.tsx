import React, { useState } from 'react';
import { Mail, ArrowRight, Apple, AlertCircle, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const BOT_AVATAR_URL = "https://avatars.githubusercontent.com/u/153844634?v=4";
  const ADMIN_EMAIL = "aayushsonkar45@gmail.com";

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(() => {
      // Basic validation
      if (!email.includes('@')) {
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }
      
      if (password.length < 4) {
        setError("Password is too short.");
        setIsLoading(false);
        return;
      }

      // "Real" login simulation - accepts the input as valid
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
      
      onLogin({
        id: `email_${Date.now()}`,
        name: email.split('@')[0], // Use part of email as name
        email: email,
        provider: 'email',
        isAdmin: isAdmin
      });
      
      setIsLoading(false);
    }, 1200);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: `guest_${Date.now()}`,
        name: 'Guest User',
        email: 'guest',
        provider: 'guest',
        isAdmin: false
      });
    }, 800);
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setIsLoading(true);
    // Simulate the OAuth popup delay
    setTimeout(() => {
      // In a real app, this would get data from the provider
      // Here we simulate a successful "token" exchange
      onLogin({
        id: `${provider}_${Date.now()}`,
        name: provider === 'google' ? 'Google User' : 'Apple User',
        email: `${provider}.user@example.com`,
        provider: provider,
        isAdmin: false
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative bg-texture">
      
      {/* --- Main Login Card --- */}
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden relative z-10">
        
        {/* Header Section */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-8 text-center border-b border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-slate-300/40 dark:shadow-slate-900/40 mb-4 overflow-hidden border border-slate-200 dark:border-slate-700">
             <img src={BOT_AVATAR_URL} alt="Aayush.bot" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
            Aayush.bot
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Sign in to sync your roasts.
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          
          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
            <button
               onClick={() => handleSocialLogin('apple')}
               className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Apple size={20} />
              <span>Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">or with email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-300 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5 ml-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-4">
            {/* Toggle Login/Signup */}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? "No account? " : "Have an account? "}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setEmail('');
                  setPassword('');
                }}
                className="text-slate-900 dark:text-white font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>

            {/* Guest Mode */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <UserIcon size={12} />
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};