"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CLOSE_VOICE_EVENT,
  OPEN_CHAT_EVENT,
  OPEN_VOICE_EVENT,
  openVoiceAssistant,
} from "@/lib/assistant-ui";
import type { Locale } from "@/lib/locales";

type VoiceAssistantProps = {
  locale: Locale;
};

type VoiceSessionResponse = {
  clientSecret?: string;
  client_secret?: {
    value?: string;
  };
  error?: string;
};

type VoiceToolResponse = {
  output?: unknown;
  error?: string;
};

type RealtimeServerEvent = {
  type?: string;
  transcript?: string;
  text?: string;
  name?: string;
  arguments?: string;
  call_id?: string;
};

type ConnectionState = "idle" | "requesting-mic" | "connecting" | "connected" | "error";

const maxActivityLines = 6;
const voiceSessionStorageKey = "bnb_voice_session_id";
const automaticGreeting = "Salve, come posso aiutarti?";

function appendActivity(current: string[], nextLine: string) {
  return [...current, nextLine].slice(-maxActivityLines);
}

function extractEphemeralKey(payload: VoiceSessionResponse) {
  return payload.clientSecret ?? payload.client_secret?.value ?? null;
}

function createVoiceSessionId() {
  return crypto.randomUUID();
}

function getOrCreateVoiceSessionId() {
  const existing = window.localStorage.getItem(voiceSessionStorageKey);

  if (existing) {
    return existing;
  }

  const sessionId = createVoiceSessionId();
  window.localStorage.setItem(voiceSessionStorageKey, sessionId);
  return sessionId;
}

function getFriendlyEventLine(event: RealtimeServerEvent) {
  if (typeof event.type !== "string") {
    return null;
  }

  if (
    event.type === "conversation.item.input_audio_transcription.completed" &&
    typeof event.transcript === "string"
  ) {
    return `Tu: ${event.transcript}`;
  }

  if (event.type === "response.audio_transcript.done" && typeof event.transcript === "string") {
    return `Assistente: ${event.transcript}`;
  }

  if (event.type === "response.text.done" && typeof event.text === "string") {
    return `Assistente: ${event.text}`;
  }

  if (event.type === "error") {
    return "La sessione voce ha segnalato un errore.";
  }

  return null;
}

export function VoiceAssistant({ locale }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<string[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const handledToolCallsRef = useRef<Set<string>>(new Set());
  const greetingSentRef = useRef(false);

  const copy = useMemo(
    () =>
      locale === "en"
        ? {
            title: "Voice assistant",
            button: "Talk to the assistant",
            start: "Start voice",
            stop: "Stop",
            mute: "Mute",
            unmute: "Unmute",
            close: "Close",
            idle: "Ready to start",
            requestingMic: "Requesting microphone access...",
            connecting: "Connecting...",
            connected: "Connected",
            disclosure: "Stai parlando con un assistente AI",
            activityTitle: "Live status",
            helper: "Use voice to ask about rooms, availability, and booking details.",
            errorFallback:
              "Sorry, the voice assistant is unavailable right now. Please try again in a moment.",
            toolError:
              "I can only help with rooms, availability, stay policies, and booking requests for the B&B.",
            unsupported:
              "Your browser does not support live voice connections for this assistant.",
            permissionDenied:
              "Microphone access was denied. Please enable it in your browser settings and try again.",
          }
        : {
            title: "Assistente vocale",
            button: "Parla con l'assistente",
            start: "Avvia voce",
            stop: "Ferma",
            mute: "Disattiva microfono",
            unmute: "Riattiva microfono",
            close: "Chiudi",
            idle: "Pronto per iniziare",
            requestingMic: "Richiesta accesso al microfono...",
            connecting: "Connessione in corso...",
            connected: "Connesso",
            disclosure: "Stai parlando con un assistente AI",
            activityTitle: "Stato live",
            helper: "Usa la voce per chiedere camere, disponibilita e dettagli prenotazione.",
            errorFallback:
              "Mi dispiace, l'assistente vocale non e disponibile in questo momento. Riprova tra poco.",
            toolError:
              "Posso aiutarti solo con camere, disponibilita, policy e richieste di prenotazione del B&B.",
            unsupported:
              "Il tuo browser non supporta la connessione voce in tempo reale per questo assistente.",
            permissionDenied:
              "L'accesso al microfono e stato negato. Abilitalo nelle impostazioni del browser e riprova.",
          },
    [locale],
  );

  const statusText =
    connectionState === "requesting-mic"
      ? copy.requestingMic
      : connectionState === "connecting"
        ? copy.connecting
        : connectionState === "connected"
          ? copy.connected
          : copy.idle;

  async function executeToolCall(name: string, args: unknown) {
    if (!sessionId) {
      throw new Error(copy.errorFallback);
    }

    const response = await fetch("/api/voice/tool", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        name,
        args,
      }),
    });

    const payload = (await response.json()) as VoiceToolResponse;

    if (!response.ok) {
      throw new Error(payload.error || copy.toolError);
    }

    return payload.output ?? {
      ok: false,
      error: copy.toolError,
    };
  }

  async function handleRealtimeToolCall(event: RealtimeServerEvent) {
    if (
      typeof event.call_id !== "string" ||
      typeof event.name !== "string" ||
      typeof event.arguments !== "string"
    ) {
      return;
    }

    if (handledToolCallsRef.current.has(event.call_id)) {
      return;
    }

    handledToolCallsRef.current.add(event.call_id);
    setActivity((current) => appendActivity(current, `Tool: ${event.name}`));

    let output: unknown;

    try {
      const parsedArgs = JSON.parse(event.arguments) as unknown;
      output = await executeToolCall(event.name, parsedArgs);
    } catch (toolError) {
      console.error("Voice assistant tool execution failed:", toolError);
      output = {
        ok: false,
        error: copy.toolError,
      };
    }

    const dataChannel = dataChannelRef.current;

    if (!dataChannel || dataChannel.readyState !== "open") {
      return;
    }

    dataChannel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: event.call_id,
          output: JSON.stringify(output),
        },
      }),
    );

    dataChannel.send(
      JSON.stringify({
        type: "response.create",
      }),
    );
  }

  function stopSession() {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    handledToolCallsRef.current.clear();
    greetingSentRef.current = false;
    setConnectionState("idle");
    setIsMuted(false);
  }

  function closePanel() {
    stopSession();
    setIsOpen(false);
  }

  async function startSession() {
    if (
      !sessionId ||
      connectionState === "requesting-mic" ||
      connectionState === "connecting"
    ) {
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof RTCPeerConnection === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(copy.unsupported);
      setConnectionState("error");
      return;
    }

    setError(null);
    setActivity([]);
    setConnectionState("requesting-mic");

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;

      setConnectionState("connecting");

      const sessionResponse = await fetch("/api/voice/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          language: locale,
        }),
      });

      const sessionPayload = (await sessionResponse.json()) as VoiceSessionResponse;
      const ephemeralKey = extractEphemeralKey(sessionPayload);

      if (!sessionResponse.ok || !ephemeralKey) {
        throw new Error(sessionPayload.error || copy.errorFallback);
      }

      console.debug("Voice assistant ephemeral key received:", {
        exists: ephemeralKey.length > 0,
        prefix: ephemeralKey.slice(0, 8),
      });

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      const remoteAudio = new Audio();
      remoteAudio.autoplay = true;
      remoteAudioRef.current = remoteAudio;

      peerConnection.ontrack = (event) => {
        remoteAudio.srcObject = event.streams[0] ?? null;
        void remoteAudio.play().catch(() => undefined);
      };

      peerConnection.onconnectionstatechange = () => {
        const currentState = peerConnection.connectionState;

        if (currentState === "connected") {
          setConnectionState("connected");
          return;
        }

        if (currentState === "failed" || currentState === "disconnected") {
          setError(copy.errorFallback);
          stopSession();
        }
      };

      localStream.getAudioTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      if (isMuted) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        setActivity((current) => appendActivity(current, copy.connected));

        if (greetingSentRef.current) {
          return;
        }

        greetingSentRef.current = true;
        dataChannel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions: `Greet the user in Italian by saying exactly: "${automaticGreeting}"`,
            },
          }),
        );
      };

      dataChannel.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as RealtimeServerEvent;

          if (parsed.type === "response.function_call_arguments.done") {
            void handleRealtimeToolCall(parsed);
            return;
          }

          const line = getFriendlyEventLine(parsed);

          if (line) {
            setActivity((current) => appendActivity(current, line));
          }
        } catch (messageError) {
          console.error("Voice assistant event parsing failed:", messageError);
        }
      };

      dataChannel.onerror = () => {
        setError(copy.errorFallback);
      };

      dataChannel.onclose = () => {
        setActivity((current) => appendActivity(current, copy.idle));
      };

      // WebRTC flow:
      // 1. Create a local offer from the browser peer connection.
      // 2. Send the SDP offer to OpenAI using the ephemeral client secret.
      // 3. Receive the remote SDP answer from OpenAI.
      // 4. Apply that answer so audio and tool events can flow both ways.
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.debug("Voice assistant SDP offer prepared:", {
        hasOfferSdp: typeof offer.sdp === "string" && offer.sdp.length > 0,
      });

      if (!offer.sdp) {
        throw new Error(copy.errorFallback);
      }

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );

      if (!sdpResponse.ok) {
        const responseText = await sdpResponse.text();

        console.debug("Voice assistant SDP exchange failed:", {
          status: sdpResponse.status,
          responseText,
        });

        throw new Error(copy.errorFallback);
      }

      const answerSdp = await sdpResponse.text();

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setConnectionState("connected");
    } catch (sessionError) {
      console.error("Voice assistant start failed:", sessionError);

      const isPermissionError =
        sessionError instanceof DOMException &&
        (sessionError.name === "NotAllowedError" || sessionError.name === "PermissionDeniedError");

      setError(isPermissionError ? copy.permissionDenied : copy.errorFallback);
      stopSession();
      setConnectionState("error");
    }
  }

  function toggleMute() {
    const nextMutedValue = !isMuted;
    setIsMuted(nextMutedValue);

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMutedValue;
    });
  }

  useEffect(() => {
    setSessionId(getOrCreateVoiceSessionId());
  }, []);

  useEffect(() => {
    function handleOpenVoice() {
      setIsOpen(true);
    }

    function handleCloseVoice() {
      stopSession();
      setIsOpen(false);
    }

    function handleOpenChat() {
      stopSession();
      setIsOpen(false);
    }

    window.addEventListener(OPEN_VOICE_EVENT, handleOpenVoice);
    window.addEventListener(CLOSE_VOICE_EVENT, handleCloseVoice);
    window.addEventListener(OPEN_CHAT_EVENT, handleOpenChat);

    return () => {
      window.removeEventListener(OPEN_VOICE_EVENT, handleOpenVoice);
      window.removeEventListener(CLOSE_VOICE_EVENT, handleCloseVoice);
      window.removeEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      {isOpen ? (
        <section className="w-[min(22rem,calc(100vw-2rem))] rounded-[1.8rem] border border-stone-200 bg-white p-4 shadow-[0_30px_80px_-40px_rgba(39,29,21,0.55)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base text-brand-900">{copy.title}</h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">{copy.disclosure}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {statusText}
              </span>
              <button
                type="button"
                onClick={closePanel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-sm text-stone-700 transition hover:border-brand-500 hover:text-brand-900"
                aria-label={copy.close}
              >
                x
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-stone-600">{copy.helper}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startSession}
              disabled={
                !sessionId ||
                connectionState === "requesting-mic" ||
                connectionState === "connecting"
              }
              className="inline-flex items-center justify-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.start}
            </button>

            <button
              type="button"
              onClick={stopSession}
              disabled={connectionState === "idle"}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.stop}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              disabled={connectionState === "idle"}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMuted ? copy.unmute : copy.mute}
            </button>
          </div>

          <div className="mt-4 rounded-[1.3rem] border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              {copy.activityTitle}
            </p>
            <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
              {activity.length > 0 ? (
                activity.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
              ) : (
                <p>{statusText}</p>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          onClick={() => openVoiceAssistant()}
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(39,29,21,0.8)] transition hover:bg-brand-800"
        >
          <span aria-hidden="true">☎</span>
          <span>{copy.button}</span>
        </button>
      ) : null}
    </div>
  );
}
