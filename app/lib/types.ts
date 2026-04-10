export type Question = {
  id: string;
  chipLabel: string;
  text: string;
  answer: string;
  image?: string;
  video?: string;
  button?: {
    text: string;
    link: string;
  };
};

export type ProtocolData = {
  triggerText: string;
  ctaText: string;
  ctaLink: string;
  metaJoke: string;
};

export type ContentData = {
  questions: Question[];
  protocol: ProtocolData;
};

export type Message = {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  originalContent?: string;
  image?: string;
  video?: string;
  button?: {
    text: string;
    link: string;
  };
  isStreaming?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  model: string;
  modelUrl?: string;
  sequenceLength?: number;
  repoUrl?: string;
  messages: Message[];
  updatedAt: number;
};
