import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const languageMap: Record<string, string> = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  python: 'py',
  py: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'cs',
  cs: 'cs',
  html: 'html',
  css: 'css',
  json: 'json',
  go: 'go',
  rust: 'rs',
  php: 'php',
  ruby: 'rb',
  swift: 'swift',
  kotlin: 'kt',
  sql: 'sql',
  shell: 'sh',
  bash: 'sh',
  yaml: 'yaml',
  xml: 'xml',
  markdown: 'md',
  md: 'md',
  text: 'txt',
};

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1].toLowerCase() : 'text';
  const extension = languageMap[language] || 'txt';

  const handleCopy = async () => {
    if (!children) return;
    const textToCopy = String(children).replace(/\n$/, '');
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    if (!children) return;
    const code = String(children).replace(/\n$/, '');
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (inline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] font-medium border border-slate-200 dark:border-slate-700" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-[#1e293b]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f172a] border-b border-slate-700/50">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          {language !== 'text' ? language : 'code'}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
            title="Download code"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
            title="Copy code"
          >
            {isCopied ? (
              <>
                <Check size={13} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-5 overflow-x-auto custom-scrollbar">
        <code className="font-mono text-[13.5px] text-slate-200 leading-relaxed whitespace-pre block" {...props}>
          {children}
        </code>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-pre:m-0 prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        components={{
          code: CodeBlock,
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-7 text-slate-700 dark:text-slate-300">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300 marker:text-slate-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300 marker:text-slate-400">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-slate-900 dark:text-slate-100 border-b dark:border-slate-800 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-slate-900 dark:text-slate-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-slate-800 dark:text-slate-200">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 py-2 pr-2 my-4 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline decoration-blue-300 dark:decoration-blue-700 underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-5 rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
