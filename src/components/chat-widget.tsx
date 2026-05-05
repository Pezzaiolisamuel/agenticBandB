"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/locales";

const chatSessionStorageKey = "bnb_chat_session_id";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type ChatWidgetProps = {
  locale: Locale;
};

function createSessionId() {
  return crypto.randomUUID();
}

function getOrCreateSessionId() {
  const existing = window.localStorage.getItem(chatSessionStorageKey);

  if (existing) {
    return existing;
  }

  const sessionId = createSessionId();
  window.localStorage.setItem(chatSessionStorageKey, sessionId);
  return sessionId;
}

function readApiErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return null;
}

export function ChatWidget({ locale }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () =>
      locale === "en"
        ? {
            button: "Ask us",
            title: "AI booking assistant",
            disclosure: "AI assistant. Please verify important booking details before confirming.",
            placeholder: "Write your message...",
            send: "Send",
            sending: "Sending...",
            reset: "Start new chat",
            resetting: "Resetting...",
            welcome:
              "Hello. I can help with rooms, policies, availability, and booking requests.",
            error: "Sorry, the assistant is unavailable right now. Please try again shortly.",
          }
        : {
            button: "Chiedi info",
            title: "Assistente AI prenotazioni",
            disclosure:
              "Assistente AI. Verifica sempre i dettagli importanti prima di confermare una prenotazione.",
            placeholder: "Scrivi il tuo messaggio...",
            send: "Invia",
            sending: "Invio...",
            reset: "Nuova chat",
            resetting: "Reset in corso...",
            welcome:
              "Ciao. Posso aiutarti con camere, policy, disponibilita e richieste di prenotazione.",
            error: "Mi dispiace, l'assistente non e disponibile in questo momento. Riprova tra poco.",
          },
    [locale],
  );

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  useEffect(() => {
    if (!isOpen || messages.length > 0) {
      return;
    }

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: copy.welcome,
      },
    ]);
  }, [copy.welcome, isOpen, messages.length]);

  async function handleResetChat() {
    if (!sessionId || isResetting) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      await fetch("/api/chat/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });
    } catch (resetError) {
      console.error("Failed to reset chat session:", resetError);
    } finally {
      const nextSessionId = createSessionId();
      window.localStorage.setItem(chatSessionStorageKey, nextSessionId);
      setSessionId(nextSessionId);
      setMessages([]);
      setInput("");
      setIsResetting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || !sessionId || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: trimmedMessage,
          language: locale,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      const assistantMessage = typeof payload.message === "string" ? payload.message : null;

      if (!response.ok || !assistantMessage) {
        throw new Error(readApiErrorMessage(payload) || copy.error);
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: assistantMessage,
        },
      ]);
    } catch {
      setError(copy.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <section className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white shadow-[0_30px_80px_-40px_rgba(39,29,21,0.55)]">
          <div className="border-b border-stone-200 bg-stone-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base text-brand-900">{copy.title}</h2>
                <p className="mt-1 text-xs leading-5 text-stone-600">{copy.disclosure}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetChat}
                  disabled={!sessionId || isResetting}
                  className="inline-flex rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold text-brand-900 transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResetting ? copy.resetting : copy.reset}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-sm text-stone-700 transition hover:border-brand-500 hover:text-brand-900"
                  aria-label="Close chat"
                >
                  x
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.3rem] px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-brand-700 text-white"
                      : "bg-stone-100 text-stone-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-[1.3rem] bg-stone-100 px-4 py-3 text-sm text-stone-600">
                  {copy.sending}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-stone-200 p-4">
            <div className="flex items-end gap-3">
              <label className="sr-only" htmlFor="chat-widget-message">
                Message
              </label>
              <textarea
                id="chat-widget-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={copy.placeholder}
                rows={2}
                className="min-h-20 flex-1 resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                disabled={isLoading || !sessionId}
              />
              <button
                type="submit"
                disabled={isLoading || !sessionId || input.trim().length === 0}
                className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {copy.send}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ml-auto inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(39,29,21,0.8)] transition hover:bg-brand-800"
      >
        {copy.button}
      </button>
    </div>
  );
}
