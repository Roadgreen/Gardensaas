'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-green-50">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-green-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 last:mb-0 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 last:mb-0 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-green-50 mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-green-50 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-green-100 mb-1">{children}</h3>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1 py-0.5 bg-green-900/50 text-green-200 rounded text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-green-900/40 rounded-lg p-2.5 text-xs font-mono text-green-200 overflow-x-auto mb-2">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-green-600/50 pl-3 italic text-green-300/80 mb-2 last:mb-0">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-400 underline underline-offset-2 hover:text-green-300 transition-colors"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-green-800/40 my-2" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-green-800/40 px-2 py-1 bg-green-900/30 text-green-100 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-green-800/40 px-2 py-1 text-green-200">
      {children}
    </td>
  ),
};

const userMarkdownComponents: Components = {
  ...markdownComponents,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-green-100">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-200 underline underline-offset-2 hover:text-white transition-colors"
    >
      {children}
    </a>
  ),
};

export function MarkdownMessage({
  content,
  isUser = false,
}: {
  content: string;
  isUser?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={isUser ? userMarkdownComponents : markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
