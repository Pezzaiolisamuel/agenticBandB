import "server-only";

import OpenAI from "openai";

import { getOpenAIApiKey } from "@/lib/env";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });
  }

  return openaiClient;
}

export function getOpenAIResponsesApi() {
  return getOpenAIClient().responses;
}
