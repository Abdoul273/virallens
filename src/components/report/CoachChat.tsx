import { useEffect, useRef, useState } from "react";
import { Aperture, MessageCircle, Send, X } from "lucide-react";
import { CHAT_INITIAL, CHAT_SUGGESTIONS } from "@/data/mockData";
import { askCoach } from "@/services/api";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const coach = message.role === "coach";
  return (
    <div className={cn("flex gap-2.5 animate-fade-up", !coach && "justify-end")}>
      {coach && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white">
          <Aperture className="size-4" aria-hidden />
        </span>
      )}
      <p
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
          coach
            ? "rounded-tl-md border border-line bg-surface-2 text-fg"
            : "rounded-tr-md bg-brand text-white",
        )}
      >
        {message.text}
      </p>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5" aria-label="Le coach écrit">
      <span className="grid size-8 place-items-center rounded-full bg-brand text-white">
        <Aperture className="size-4" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-surface-2 px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted [animation:blink_1.2s_infinite]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CoachChat({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_INITIAL);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, typing, open]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setTyping(true);
    const reply = await askCoach(videoId, text);
    setTyping(false);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "coach", text: reply }]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed right-4 bottom-24 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-brand pr-5 pl-4 font-semibold text-white shadow-[0_12px_32px_-8px_rgba(217,15,112,0.8)] transition hover:brightness-110 active:scale-95 lg:right-8 lg:bottom-8"
        aria-haspopup="dialog"
      >
        <MessageCircle className="size-5" aria-hidden />
        Demande au coach
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal aria-label="Coach IA">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col rounded-t-3xl border border-line-strong bg-solid shadow-2xl animate-slide-up md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[420px] md:rounded-none md:rounded-l-3xl md:animate-slide-left">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="font-semibold text-fg">Coach ViralLens</p>
                <p className="text-xs text-muted">À propos de « Je teste le pain viral »</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
                aria-label="Fermer le chat"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              {typing && <TypingIndicator />}
              <div ref={endRef} />
            </div>
            <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
                {CHAT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="h-9 shrink-0 rounded-full border border-line bg-surface px-3.5 text-sm text-fg hover:border-accent/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pose ta question…"
                  aria-label="Message"
                  className="h-12 flex-1 rounded-xl border border-line bg-surface px-4 text-[15px] text-fg outline-none placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className="grid size-12 place-items-center rounded-xl bg-brand text-white disabled:opacity-40"
                  aria-label="Envoyer"
                >
                  <Send className="size-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
