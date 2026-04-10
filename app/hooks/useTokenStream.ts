import { useState, useEffect, useRef } from "react";

export function useTokenStream() {
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startStream = (fullText: string, onComplete?: () => void) => {
    setIsStreaming(true);
    setStreamedText("");

    const words = fullText.split(/({{VIDEO}}|[ \n])/);
    let currentIndex = 0;
    let currentText = "";

    const streamNext = () => {
      if (currentIndex < words.length) {
        currentText += words[currentIndex];
        setStreamedText(currentText);
        currentIndex++;

        const delay = Math.random() * 30 + 10;
        streamTimeoutRef.current = setTimeout(streamNext, delay);
      } else {
        setIsStreaming(false);
        if (onComplete) onComplete();
      }
    };

    streamNext();
  };

  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    };
  }, []);

  return { streamedText, isStreaming, startStream };
}
