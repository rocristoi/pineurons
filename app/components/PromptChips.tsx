import { Question } from "../lib/types";

export function PromptChips({
  questions,
  onSelect,
  disabled,
  isCentered = false,
}: {
  questions: Question[];
  onSelect: (q: Question) => void;
  disabled: boolean;
  isCentered?: boolean;
}) {
  if (questions.length === 0) return null;

  if (isCentered) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 w-full max-w-2xl px-2 md:px-4">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q)}
            disabled={disabled}
            className={`p-3 md:p-6 bg-[#111111] hover:bg-[#1a1a1a] rounded-xl md:rounded-2xl border border-[#222] transition-colors shadow-sm
              flex flex-col items-start gap-1 md:gap-2 max-w-full
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div className="text-zinc-200 font-sans font-medium text-xs md:text-base text-left leading-snug break-words whitespace-normal break-words w-full">
              {q.chipLabel}
            </div>
            <div className="text-[#888] font-sans text-[10px] md:text-xs">
              Talk to PiNeurons...
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-12">
      <div className="flex flex-wrap items-end justify-center gap-2 max-w-4xl mx-auto">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q)}
            disabled={disabled}
            className={`px-3 py-1.5 md:px-4 md:py-2.5 text-xs md:text-sm font-sans rounded-xl border border-[#3f3f3f] transition-all
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed bg-transparent text-[#888]"
                  : "text-zinc-200 cursor-pointer bg-[#2a2a2a] hover:bg-[#3f3f3f] shadow-sm"
              }
            `}
          >
            {q.chipLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
