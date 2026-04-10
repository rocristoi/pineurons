import { Chat } from "../lib/types";

export function Sidebar({
  onSelectHistory,
  onDeleteChat,
  activeChatId,
  chats,
  isLoading,
  isOpen,
  onClose,
}: {
  onSelectHistory: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  activeChatId: string;
  chats: Chat[];
  isLoading?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-20"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-30
        w-[80%] max-w-[300px] md:w-72 
        border-b md:border-b-0 md:border-r border-[#222] bg-[#0a0a0a] 
        p-4 md:p-6 flex flex-col gap-4 md:gap-6 md:h-screen shrink-0 
        whitespace-normal overflow-y-auto transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 shadow-2xl md:shadow-none
      `}
      >
        <div className="flex items-center justify-between md:hidden mb-2">
          <span className="text-xs font-mono tracking-widest text-[#666]">
            MENU
          </span>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-[#222]"
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <button
          onClick={() => onSelectHistory("new-reset")}
          className="text-zinc-200 cursor-pointer border border-[#333] hover:bg-[#1a1a1a] rounded-lg px-4 py-2.5 text-sm font-sans font-medium transition-colors text-left flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          New Chat
        </button>

        <div className="flex flex-col gap-1.5 w-full mt-4 overflow-y-auto">
          <div className="text-[#a1a1aa] mb-2 tracking-wider text-[10px] font-bold font-mono uppercase px-2">
            History
          </div>

          {isLoading ? (
            <>
              <div className="h-10 bg-zinc-800/40 animate-pulse rounded-lg w-full mb-1"></div>
              <div className="h-10 bg-zinc-800/30 animate-pulse rounded-lg w-full mb-1"></div>
              <div className="h-10 bg-zinc-800/20 animate-pulse rounded-lg w-full"></div>
            </>
          ) : (
            chats.map((chat) => (
              <div key={chat.id} className="relative group flex items-center">
                <button
                  onClick={() => onSelectHistory(chat.id)}
                  className={`rounded-lg px-3 py-2.5 cursor-pointer text-sm font-sans transition-colors text-left truncate w-full text-ellipsis overflow-hidden pr-8 ${activeChatId === chat.id ? "bg-[#1a1a1a] text-zinc-100 font-medium" : "text-zinc-400 hover:bg-[#111] hover:text-zinc-300"}`}
                  title={chat.title}
                >
                  {chat.title}
                </button>
                {chat.id !== "model-library-chat" && onDeleteChat && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute cursor-pointer right-2 text-zinc-500 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
                    title="Delete chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-auto md:border-t border-[#222] md:pt-4 ml-auto md:ml-0 flex items-center md:items-start text-[#666]">
          <div className="text-[10px] md:text-xs font-mono tracking-widest leading-[1.2] md:leading-loose">
            HACKCLUB_OS.v1.0.4
            <br />
          </div>
        </div>
      </aside>
    </>
  );
}
