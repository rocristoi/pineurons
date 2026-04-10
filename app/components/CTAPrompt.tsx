import { ProtocolData } from "../lib/types";

export function CTAPrompt({
  protocol,
  show,
}: {
  protocol: ProtocolData;
  show: boolean;
}) {
  if (!show) return null;

  const handleCTA = () => {
    window.open(protocol.ctaLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="py-16 px-4 md:px-8 bg-[#0a0a0a] border-t-2 border-[#16a34a] shadow-[0_-20px_40px_rgba(22,163,74,0.05)] mt-12 mb-32 flex flex-col items-center justify-center">
      <button
        onClick={handleCTA}
        className="text-white bg-[#16a34a] hover:bg-[#15803d] font-sans font-medium text-lg py-3.5 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 tracking-wide flex items-center gap-2"
      >
        {protocol.ctaText}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </svg>
      </button>
    </div>
  );
}
