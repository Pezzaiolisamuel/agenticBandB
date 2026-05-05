export const OPEN_CHAT_EVENT = "club66:open-chat";
export const CLOSE_CHAT_EVENT = "club66:close-chat";
export const OPEN_VOICE_EVENT = "club66:open-voice";
export const CLOSE_VOICE_EVENT = "club66:close-voice";

function dispatchAssistantEvent(eventName: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName));
}

export function openChatAssistant() {
  dispatchAssistantEvent(OPEN_CHAT_EVENT);
}

export function closeChatAssistant() {
  dispatchAssistantEvent(CLOSE_CHAT_EVENT);
}

export function openVoiceAssistant() {
  dispatchAssistantEvent(OPEN_VOICE_EVENT);
}

export function closeVoiceAssistant() {
  dispatchAssistantEvent(CLOSE_VOICE_EVENT);
}
