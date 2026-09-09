"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

const GREETING =
  'I keep the books here. Tell me what you spent — "coffee 4.50" or "taxi to the office, 18" — ' +
  'and I\'ll log it, categorize it, and keep a running total. Ask me "how much this month?" any time.';

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function ChatPanel({
  initialMessages,
  onTurnFinished,
}: {
  initialMessages: UIMessage[];
  onTurnFinished: () => void;
}) {
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: onTurnFinished,
  });

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage({ text });
  }

  return (
    <section
      aria-label="Conversation with your bookkeeper"
      className="flex min-h-[480px] max-h-[78vh] flex-col overflow-hidden rounded-[10px] border border-rule bg-paper-2 shadow-[0_1px_0_rgba(29,35,30,0.06)]"
    >
      <div ref={logRef} className="chat-log flex flex-1 flex-col gap-3.5 overflow-y-auto px-5.5 pt-5.5 pb-2">
        {messages.length === 0 ? (
          <AssistantBubble text={GREETING} />
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} text={textOf(m)} />
            ) : (
              <AssistantBubble key={m.id} text={textOf(m) || "…"} />
            ),
          )
        )}
        {status === "submitted" && <AssistantBubble text="Thinking…" pending />}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2.5 border-t border-rule bg-paper-2 px-4.5 py-3.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          autoComplete="off"
          maxLength={400}
          placeholder="e.g. taxi to the airport, 24.50"
          className="flex-1 rounded-[7px] border border-rule-strong bg-paper px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-[7px] bg-accent px-5 text-[13.5px] font-semibold text-accent-ink hover:bg-accent-2 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      <p className="min-h-[16px] px-5.5 pb-3.5 text-xs text-ink-faint empty:hidden data-[warn=true]:text-expense" data-warn={!!error}>
        {error ? copyForError(error) : ""}
      </p>
    </section>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="bubble-in max-w-[80%] self-end whitespace-pre-wrap rounded-[10px] rounded-br-[3px] bg-accent px-3.5 py-2.5 text-[14.5px] leading-relaxed text-accent-ink">
      {text}
    </div>
  );
}

function AssistantBubble({ text, pending }: { text: string; pending?: boolean }) {
  return (
    <div
      className={`bubble-in max-w-[80%] self-start whitespace-pre-wrap rounded-[10px] rounded-bl-[3px] border border-rule bg-paper px-3.5 py-2.5 text-[14.5px] leading-relaxed ${pending ? "text-ink-dim" : "text-ink"}`}
    >
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
        Bookkeeper
      </span>
      {text}
    </div>
  );
}

function copyForError(error: Error): string {
  const message = (error.message || "").toLowerCase();
  if (message.includes("api key") || message.includes("api-key") || message.includes("authentication")) {
    return "The server can't reach Claude — add a valid ANTHROPIC_API_KEY to .env.local and restart.";
  }
  return "Something went wrong reaching the bookkeeper — try again.";
}
