import React from 'react';
import { Message } from '../types';
import { User } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
  botAvatarUrl?: string; // Optional custom bot avatar
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, botAvatarUrl }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[75%] gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center 
          shadow-sm border transition-colors duration-300 overflow-hidden
          ${isModel 
            ? 'bg-white dark:bg-slate-800 border-blue-100 dark:border-slate-700' 
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}
        `}>
          {isModel ? (
            // Use the bot avatar if provided, otherwise fallback
            botAvatarUrl ? (
              <img src={botAvatarUrl} alt="Aayush.bot" className="w-full h-full object-cover" />
            ) : (
              <div className="bg-primary w-full h-full flex items-center justify-center text-white font-bold">A</div>
            )
          ) : (
            <User size={22} strokeWidth={1.5} />
          )}
        </div>

        {/* Bubble */}
        <div className={`
          flex flex-col
          ${isModel ? 'items-start' : 'items-end'}
        `}>
          <div className={`
            px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm transition-colors duration-300
            ${isModel 
              ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none' 
              : 'bg-primary text-white rounded-tr-none shadow-md shadow-blue-500/20'
            }
            ${message.isError ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-300' : ''}
          `}>
             {isModel ? (
               <div className="w-full min-w-[200px] prose prose-slate dark:prose-invert max-w-none">
                 <MarkdownRenderer content={message.text} />
               </div>
             ) : (
               <div className="whitespace-pre-wrap font-medium">{message.text}</div>
             )}
          </div>
          
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-1 font-medium">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  );
};