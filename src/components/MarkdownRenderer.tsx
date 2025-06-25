import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <ReactMarkdown
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      components={{
        // Customize heading styles
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 mt-2 first:mt-0">
            {children}
          </h3>
        ),
        // Customize paragraph styles
        p: ({ children }) => (
          <p className="text-gray-900 dark:text-white mb-2 last:mb-0 leading-relaxed">
            {children}
          </p>
        ),
        // Customize list styles
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1 text-gray-900 dark:text-white">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-900 dark:text-white">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-900 dark:text-white">
            {children}
          </li>
        ),
        // Customize emphasis styles
        strong: ({ children }) => (
          <strong className="font-bold text-gray-900 dark:text-white">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-900 dark:text-white">
            {children}
          </em>
        ),
        // Customize code styles
        code: ({ children }) => (
          <code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-1 py-0.5 rounded text-xs font-mono">
            {children}
          </code>
        ),
        // Customize blockquote styles
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-orange-500 pl-4 italic text-gray-700 dark:text-gray-300 mb-2">
            {children}
          </blockquote>
        ),
        // Customize link styles
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;