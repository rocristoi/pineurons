import { ContentData } from "./lib/types";
import contentRaw from "../public/content/content.json";
import { ChatContainer } from "./components/ChatContainer";

export default function Home() {
  const data = contentRaw as unknown as ContentData;
  return (
    <main className="min-h-screen bg-black">
      <ChatContainer data={data} />
    </main>
  );
}
