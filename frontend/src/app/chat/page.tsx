import type { Metadata } from "next";
import ChatWrapper from "./ChatWrapper";

export const metadata: Metadata = {
  title: "AI Assistant & Support Chat | PriceShield",
  description:
    "Chat with the PriceShield AI assistant. Ask questions about automatic invoice auditing, supplier price tracking, and margin protection.",
  alternates: { canonical: "https://trypriceshield.com/chat" },
};

export default function ChatPage() {
  return <ChatWrapper />;
}
