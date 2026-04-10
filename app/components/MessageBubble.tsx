"use client";

import Image from "next/image";
import React, { useState, ComponentPropsWithoutRef } from "react";
import { Message } from "../lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CodeBlockProps extends ComponentPropsWithoutRef<"code"> {
  node?: unknown;
}

const CodeBlock = ({ className, children, ...rest }: CodeBlockProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { node, ...props } = rest;
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] shadow-lg overflow-hidden my-6 not-prose">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
          <span className="text-xs font-mono text-zinc-400 capitalize">
            {match[1]}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
          >
            {copied ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>{" "}
                Copied!
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>{" "}
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-4 overflow-x-auto text-zinc-300">
          <pre className="!m-0 !p-0 !bg-transparent text-sm font-mono">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <code
      className="bg-[#222] px-1.5 py-0.5 rounded-md text-sm text-zinc-300 font-mono"
      {...props}
    >
      {children}
    </code>
  );
};

export function MessageBubble({
  message,
  children,
}: {
  message: Message;
  children?: React.ReactNode;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const fullContent = message.originalContent || message.content;
  const hasMiddleVideo = fullContent.includes("{{VIDEO}}");

  return (
    <div
      className={`py-8 px-4 md:px-8 ${isUser ? "bg-[#1a1a1a]" : isSystem ? "bg-[#0f0f0f] border-b border-[#222]" : "bg-[#0a0a0a]"}`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 md:gap-6">
        <div
          className={`shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full font-mono text-[8px] md:text-[10px] font-bold self-start mt-1 md:mt-1
          ${isUser ? "bg-[#2f2f2f] text-white" : isSystem ? "bg-[var(--term-dim)] text-white" : "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"}
        `}
        >
          {isUser ? (
            "USR"
          ) : isSystem ? (
            "SYS"
          ) : (
            <Image
              alt="AI Image"
              src="/AI-logo.png"
              width={50}
              height={50}
              className="rounded-full"
            />
          )}
        </div>
        <div className="flex-1 text-zinc-100 leading-relaxed font-sans text-[15px] md:text-base min-w-0">
          {message.content.split("{{VIDEO}}").map((part, index, arr) => (
            <React.Fragment key={index}>
              <div
                className={`prose prose-invert prose-zinc max-w-none prose-sm md:prose-base prose-p:my-2 prose-p:first-of-type:mt-0 prose-p:leading-relaxed prose-headings:my-4 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 break-words ${message.isStreaming && index === arr.length - 1 ? "streaming-cursor" : ""}`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ children }: { children?: React.ReactNode }) => (
                      <>{children}</>
                    ),
                    code: CodeBlock as React.ElementType,
                  }}
                >
                  {part}
                </ReactMarkdown>
              </div>
              {index === 0 && arr.length > 1 && message.video && (
                <div className="my-8 w-full max-w-3xl overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-lg">
                  <video
                    src={message.video}
                    className="w-full h-auto object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              )}
            </React.Fragment>
          ))}

          {message.image && (
            <div className="mt-6 w-full max-w-2xl overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-lg">
              <div className="aspect-[2/1] relative w-full">
                <Image
                  src={message.image}
                  alt="Attachment"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
          {message.video && !hasMiddleVideo && (
            <div className="mt-8 w-full max-w-3xl overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-lg">
              <video
                src={message.video}
                className="w-full h-auto object-cover"
                controls
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          )}

          {message.button && !message.isStreaming && (
            <div className="mt-8">
              <a
                href={message.button.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[#c21c4a] hover:bg-[#a0173d] text-white font-mono text-sm tracking-wider transition-colors duration-200 uppercase border border-white/10 shadow-[0_0_15px_rgba(194,28,74,0.3)] hover:shadow-[0_0_20px_rgba(194,28,74,0.5)]"
              >
                {message.button.text}
              </a>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
