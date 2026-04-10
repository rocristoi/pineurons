"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { PromptChips } from "./PromptChips";
import { MessageBubble } from "./MessageBubble";
import { useTokenStream } from "../hooks/useTokenStream";
import { ContentData, Message, Question, Chat } from "../lib/types";
import Image from "next/image";
import { motion } from "framer-motion";
import localFont from "next/font/local";

const horizonFont = localFont({
  src: "../../public/fonts/Horizon.otf",
});

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export interface Model {
  id: string;
  name: string;
  desc: string;
  imageUrl?: string | null;
  authorName?: string;
  authorPfp?: string;
  submitDate?: string;
  url?: string;
  sequenceLength?: number;
  repoUrl?: string;
  [key: string]: unknown;
}

export function ChatContainer({ data }: { data: ContentData }) {
  const [models, setModels] = useState<Model[]>([]);
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "model-library-chat",
      title: "What projects have people built?",
      model: "pineurons-default",
      messages: [
        {
          id: "m-u-1",
          role: "user",
          content: "What projects have people built already?",
        },
        {
          id: "m-ai-1",
          role: "ai",
          content:
            "Here are some of the popular models built by our community:",
        },
      ],
      updatedAt: Date.now(),
    },
  ]);
  const [activeChatId, setActiveChatId] = useState<string>("new");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pineurons-chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved chats", e);
      }
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("pineurons-chats", JSON.stringify(chats));
  }, [chats]);

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>(
    data.questions,
  );
  const [ctaTriggered, setCtaTriggered] = useState(false);

  const { streamedText, isStreaming, startStream } = useTokenStream();
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const response = await fetch(
          "https://api.github.com/repos/rocristoi/pineurons/contents/submissions",
        );
        if (!response.ok) return;
        const contents = await response.json();
        if (Array.isArray(contents)) {
          const loadedModels = [];
          for (const item of contents) {
            if (item.type === "dir") {
              const manifestUrl = `https://raw.githubusercontent.com/rocristoi/pineurons/main/submissions/${item.name}/manifest.json`;
              try {
                const manifestRes = await fetch(manifestUrl);
                if (manifestRes.ok) {
                  const manifest = await manifestRes.json();

                  let imageUrl = null;
                  if (manifest.image) {
                    imageUrl = manifest.image;
                  }

                  let authorName = "";
                  let authorPfp = "";
                  let submitDate = "";

                  try {
                    const commitsRes = await fetch(
                      `https://api.github.com/repos/rocristoi/pineurons/commits?path=submissions/${item.name}&per_page=1`,
                    );
                    if (commitsRes.ok) {
                      const commits = await commitsRes.json();
                      if (commits && commits.length > 0) {
                        authorName =
                          commits[0].author?.login ||
                          commits[0].commit?.author?.name ||
                          "";
                        authorPfp = commits[0].author?.avatar_url || "";
                        submitDate = commits[0].commit?.author?.date || "";
                      }
                    }
                  } catch (e) {
                    console.error(`Failed to load commits for ${item.name}`, e);
                  }

                  loadedModels.push({
                    id: item.name,
                    name: manifest.name || item.name,
                    desc: manifest.description || "",
                    ...manifest,
                    imageUrl: imageUrl,
                    authorName,
                    authorPfp,
                    submitDate,
                    url: `https://github.com/rocristoi/pineurons/blob/main/submissions/${item.name}/${item.name}.pth`,
                    sequenceLength: manifest.sequence_length || 50,
                    repoUrl: manifest.repository || "",
                  });
                }
              } catch (e) {
                console.error(`Failed to load manifest for ${item.name}`, e);
              }
            }
          }
          if (loadedModels.length > 0) {
            setModels(loadedModels);
          }
        }
      } catch (error) {
        console.error("Failed to load submissions", error);
      }
    }
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && !userScrolledRef.current) {
      const el = scrollContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [chats, streamedText]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
      });
      userScrolledRef.current = false;
    }
  }, [activeChatId]);

  const handleSelectHistory = (chatId: string) => {
    if (isStreaming) return;
    if (chatId === "new-reset") {
      setActiveChatId("new");
      setAvailableQuestions(data.questions);
      setCtaTriggered(false);
      return;
    }
    setActiveChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (chatId === "model-library-chat") return;
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId("new");
    }
  };

  const currentChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  const activeChat = chats.find((c) => c.id === activeChatId);
  const displayedMessages = activeChat ? activeChat.messages : [];

  const handleSelectQuestion = (q: Question) => {
    if (isStreaming) return;

    let chatId = activeChatId;
    const isFresh = !activeChat;
    if (isFresh) {
      chatId = generateId();
      const newChat: Chat = {
        id: chatId,
        title: q.chipLabel || q.text,
        model: "pineurons-default",
        messages: [],
        updatedAt: Date.now(),
      };
      setChats((prev) => [...prev, newChat]);
      setActiveChatId(chatId);
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId && c.messages.length === 0
            ? { ...c, title: q.chipLabel || q.text, updatedAt: Date.now() }
            : { ...c, updatedAt: Date.now() },
        ),
      );
    }

    const userMsg: Message = {
      id: `m-u-${Date.now()}`,
      role: "user",
      content: q.text,
    };

    if (q.id === "cta-trigger") {
      setCtaTriggered(true);
    } else {
      setAvailableQuestions((prev) => prev.filter((item) => item.id !== q.id));
    }

    setActiveQuestion(q);

    const aiMsgId = `m-ai-${Date.now()}`;
    const aiMsg: Message = {
      id: aiMsgId,
      role: "ai",
      content: "",
      image: q.image,
      video: q.video,
      button: q.button,
      isStreaming: true,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, userMsg, aiMsg],
              updatedAt: Date.now(),
            }
          : c,
      ),
    );

    startStream(q.answer, () => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: q.answer, isStreaming: false }
                    : m,
                ),
              }
            : c,
        ),
      );

      setActiveQuestion(null);
    });
  };

  const handleLaunchModel = (mod: Model) => {
    const newChatId = generateId();
    const newChat: Chat = {
      id: newChatId,
      title: mod.name,
      model: mod.id,
      modelUrl: mod.url,
      sequenceLength: mod.sequenceLength || 50,
      repoUrl: mod.repoUrl || "",
      messages: [
        {
          id: generateId(),
          role: "ai",
          content: `You've loaded '${mod.name}'. Please enter a seed phrase to generate.`,
        },
      ],
      updatedAt: Date.now(),
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChatId);
  };

  const currentChips = [...availableQuestions];
  if (!ctaTriggered) {
    currentChips.push({
      id: "cta-trigger",
      chipLabel: "How do I submit?",
      text: "How do I submit my project?",
      answer: data.protocol.triggerText,
      button: {
        text: data.protocol.ctaText,
        link: data.protocol.ctaLink,
      },
    });
  }

  const isModelLibraryChat = activeChatId === "model-library-chat";

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden bg-black text-[#e5e5e5]">
      <Sidebar
        onSelectHistory={(id) => {
          handleSelectHistory(id);
          setIsSidebarOpen(false);
        }}
        onDeleteChat={handleDeleteChat}
        activeChatId={activeChatId}
        chats={currentChats}
        isLoading={!isMounted}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative h-[100dvh] min-w-0">
        <header className="py-3 md:py-4 border-b border-[#222] tracking-widest text-zinc-400 text-xs md:text-sm px-4 md:px-6 bg-[#0a0a0a] z-10 sticky top-0 shrink-0 flex items-center gap-3 md:gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden flex items-center justify-center p-2 -ml-2 rounded-md hover:bg-[#222] text-zinc-400 transition-colors"
            title="Toggle Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className={`${horizonFont.className} uppercase mt-1 md:mt-0`}>
            <span className="text-[#c21c4a]">PI</span>NEURONS
          </span>
        </header>

        {!activeChat && activeChatId === "new" ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 w-full">
            <div className="m-auto flex flex-col items-center justify-center text-center max-w-4xl w-full py-2 md:py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-[120px] md:w-[200px]">
                  <Image
                    src="/logo.png"
                    alt="PiNeurons Logo"
                    width={200}
                    height={50}
                    style={{ width: "auto", height: "auto" }}
                    priority
                  />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl md:text-5xl font-bold font-sans text-zinc-100 mb-2 md:mb-4 tracking-tight mt-4"
              >
                Welcome to <span className="text-[#c21c4a]">PiNeurons</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-zinc-400 font-sans text-sm md:text-xl mb-4 md:mb-12"
              >
                Will you accept the challenge?
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="w-full mt-2 md:mt-4 flex justify-center min-h-[100px] md:min-h-[160px]"
              >
                <PromptChips
                  questions={currentChips}
                  onSelect={handleSelectQuestion}
                  disabled={isStreaming}
                  isCentered={true}
                />
              </motion.div>
            </div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto pb-4"
            onScroll={(e) => {
              const el = e.currentTarget;
              userScrolledRef.current =
                el.scrollHeight - el.scrollTop - el.clientHeight > 20;
            }}
          >
            {displayedMessages.map((m) => {
              const isStreamingMessage = m.isStreaming;

              const isModelCardsTarget =
                isModelLibraryChat && m.id === "m-ai-1";

              return (
                <MessageBubble
                  key={m.id}
                  message={{
                    ...m,
                    content: isStreamingMessage ? streamedText : m.content,
                    originalContent: isStreamingMessage
                      ? activeQuestion?.answer
                      : m.originalContent,
                  }}
                >
                  {isModelCardsTarget && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {models.map((mod) => (
                        <div
                          key={mod.id}
                          onClick={() => handleLaunchModel(mod)}
                          className="p-5 bg-[#111] border border-[#333] rounded-xl hover:bg-[#1a1a1a] hover:border-[#444] transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/30 overflow-hidden shrink-0">
                                {mod.imageUrl ? (
                                  <Image
                                    src={mod.imageUrl}
                                    alt={mod.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <h3 className="font-bold text-sm text-zinc-200">
                                {mod.name}
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black text-zinc-500 border border-[#333]">
                              {mod.id}.pth
                            </span>
                          </div>
                          <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
                            {mod.desc}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#222]">
                            <div className="flex items-center gap-2">
                              {mod.authorPfp && (
                                <Image
                                  src={mod.authorPfp}
                                  alt={mod.authorName || "Author"}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 rounded-full object-cover"
                                  unoptimized
                                />
                              )}
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-300 font-medium">
                                  {mod.authorName || "Unknown"}
                                </span>
                                {mod.submitDate && (
                                  <span className="text-[9px] text-zinc-500">
                                    {new Date(
                                      mod.submitDate,
                                    ).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                              {mod.repoUrl && (
                                <a
                                  href={mod.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-zinc-400 hover:text-white transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  title="View Repository"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            <span className="text-xs font-medium text-[#c21c4a] opacity-0 group-hover:opacity-100 transition-opacity">
                              Launch Chat &rarr;
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </MessageBubble>
              );
            })}

            <div className="h-1 pb-32" />
          </div>
        )}

        {activeChat &&
          activeChat.model === "pineurons-default" &&
          !isModelLibraryChat && (
            <div className="mt-auto absolute bottom-0 left-0 right-0 z-20 animate-fade-slide delay-100">
              <PromptChips
                questions={currentChips}
                onSelect={handleSelectQuestion}
                disabled={isStreaming}
                isCentered={false}
              />
            </div>
          )}

        {activeChat && activeChat.model !== "pineurons-default" && (
          <div className="mt-auto sticky bottom-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem(
                  "prompt",
                ) as HTMLInputElement;
                if (!input.value) return;

                const prompt = input.value;
                input.value = "";
                setIsGenerating(true);

                const userMsg: Message = {
                  id: generateId(),
                  role: "user",
                  content: prompt,
                };
                setChats((prev) =>
                  prev.map((c) =>
                    c.id === activeChatId
                      ? {
                          ...c,
                          messages: [...c.messages, userMsg],
                          updatedAt: Date.now(),
                        }
                      : c,
                  ),
                );

                try {
                  const res = await fetch("http://localhost:8000/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      model_id: activeChat.model,
                      model_url: activeChat.modelUrl,
                      seed_phrase: prompt,
                      sequence_length: activeChat.sequenceLength || 50,
                    }),
                  });
                  const data = await res.json();

                  const aiMsgId = generateId();
                  const aiMsg: Message = {
                    id: aiMsgId,
                    role: "ai",
                    content: "",
                    isStreaming: true,
                  };

                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === activeChatId
                        ? {
                            ...c,
                            messages: [...c.messages, aiMsg],
                            updatedAt: Date.now(),
                          }
                        : c,
                    ),
                  );

                  startStream(data.response, () => {
                    setChats((prev) =>
                      prev.map((c) =>
                        c.id === activeChatId
                          ? {
                              ...c,
                              messages: c.messages.map((m) =>
                                m.id === aiMsgId
                                  ? {
                                      ...m,
                                      content: data.response,
                                      isStreaming: false,
                                    }
                                  : m,
                              ),
                            }
                          : c,
                      ),
                    );
                  });
                } catch {
                  const errorMsg: Message = {
                    id: generateId(),
                    role: "ai",
                    content: "Backend connection failed.",
                  };
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === activeChatId
                        ? {
                            ...c,
                            messages: [...c.messages, errorMsg],
                            updatedAt: Date.now(),
                          }
                        : c,
                    ),
                  );
                } finally {
                  setIsGenerating(false);
                }
              }}
              className="flex items-center transition gap-2 max-w-4xl mx-auto w-full bg-[#111] p-2 rounded-2xl border border-[#333] focus-within:border-[#c21c4a] focus-within:ring-1 focus-within:ring-[#c21c4a]/50 p-2 md:p-3"
            >
              <input
                name="prompt"
                type="text"
                autoComplete="off"
                placeholder="Enter seed phrase..."
                disabled={isGenerating || isStreaming}
                className="flex-1 bg-transparent text-white px-4 py-2 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isGenerating || isStreaming}
                className="bg-[#c21c4a] px-6 py-2 rounded-xl font-bold hover:bg-[#a0153c] disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
