import React, { useRef, useEffect } from 'react';
import { Send, StopCircle, Sparkles } from 'lucide-react';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ input, setInput, onSend, isLoading }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 md:pb-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className={`
          relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-3xl border transition-all duration-200 shadow-sm
          ${isLoading ? 'border-slate-200 dark:border-slate-700' : 'border-slate-300 dark:border-slate-700 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/30 focus-within:shadow-md'}
        `}>
          
          <div className="pl-3 pb-3.5 text-slate-400 dark:text-slate-500">
             <Sparkles size={20} className={isLoading ? "animate-spin text-secondary" : ""} />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Generating excuses..." : "Ask something, don't be shy..."}
            className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 max-h-[180px] overflow-y-auto min-h-[48px]"
            rows={1}
            disabled={isLoading}
          />
          
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className={`
              p-3 rounded-2xl flex items-center justify-center transition-all duration-200 mb-0.5 mr-0.5
              ${!input.trim() || isLoading 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-primary hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }
            `}
          >
            {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
        
        <div className="text-center mt-3">
           <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
             Aayush.bot might roast you • Don't take it personally
           </p>
        </div>
      </div>
    </div>
  );
};