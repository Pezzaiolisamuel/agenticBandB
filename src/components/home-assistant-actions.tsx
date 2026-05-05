"use client";

import { openChatAssistant, openVoiceAssistant } from "@/lib/assistant-ui";

type HomeAssistantActionsProps = {
  label: string;
  mode: "chat" | "voice";
  className?: string;
};

export function HomeAssistantActions({
  label,
  mode,
  className,
}: HomeAssistantActionsProps) {
  return (
    <button
      type="button"
      onClick={() => (mode === "voice" ? openVoiceAssistant() : openChatAssistant())}
      className={className}
    >
      {label}
    </button>
  );
}
