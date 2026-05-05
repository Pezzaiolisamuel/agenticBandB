type JsonSchema =
  | {
      type: "object";
      properties: Record<string, JsonSchema>;
      required?: string[];
      additionalProperties?: boolean;
      description?: string;
    }
  | {
      type: "string" | ["string", "null"];
      description?: string;
      enum?: string[];
      format?: "email";
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    }
  | {
      type: "integer" | ["integer", "null"];
      description?: string;
      minimum?: number;
      maximum?: number;
    }
  | {
      type: "boolean";
      description?: string;
    };

type ResponsesFunctionTool = {
  type: "function";
  name: string;
  description: string;
  parameters: JsonSchema;
  strict: true;
};

const isoDateSchema: JsonSchema = {
  type: "string",
  description: "Date in YYYY-MM-DD format.",
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
};

const nullableIsoDateSchema: JsonSchema = {
  type: ["string", "null"],
  description: "Date in YYYY-MM-DD format, or null when not yet known.",
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
};

const languageSchema: JsonSchema = {
  type: "string",
  description: "Preferred language for content and guest-facing responses.",
  enum: ["it", "en"],
};

const roomIdSchema: JsonSchema = {
  type: "string",
  description: "Supabase room UUID.",
  pattern:
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
};

const nullableRoomIdSchema: JsonSchema = {
  type: ["string", "null"],
  description: "Supabase room UUID, or null when the room is not chosen yet.",
  pattern:
    "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
};

const guestCountSchema: JsonSchema = {
  type: "integer",
  description: "Number of guests staying in the room.",
  minimum: 1,
};

const nullableGuestCountSchema: JsonSchema = {
  type: ["integer", "null"],
  description: "Number of guests staying in the room, or null when not yet known.",
  minimum: 1,
};

const roomsCountSchema: JsonSchema = {
  type: ["integer", "null"],
  description: "Number of rooms requested, or null when not yet known.",
  minimum: 1,
};

const nullableShortTextSchema = (description: string, maxLength: number): JsonSchema => ({
  type: ["string", "null"],
  description,
  maxLength,
});

export const bookingAgentTools: ResponsesFunctionTool[] = [
  {
    type: "function",
    name: "list_rooms",
    description:
      "List active rooms and their base booking facts. Never use this tool to infer live availability or a final price; those must always come from server-side checks.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        language: languageSchema,
      },
      required: ["language"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_policies",
    description:
      "Retrieve guest-facing booking and stay policies. Policy text must come from the server-side policies table, not from cached client content.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        language: languageSchema,
      },
      required: ["language"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "update_booking_state",
    description:
      "Store or update the current booking draft for this chat session. Only pass values the user explicitly provided, and use null for fields that are still unknown.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        checkIn: nullableIsoDateSchema,
        checkOut: nullableIsoDateSchema,
        guestsCount: nullableGuestCountSchema,
        roomsCount: roomsCountSchema,
        roomId: nullableRoomIdSchema,
        guestFullName: nullableShortTextSchema("Guest full name, or null when unknown.", 200),
        guestEmail: {
          type: ["string", "null"],
          description: "Guest email address, or null when unknown.",
          format: "email",
          maxLength: 320,
        },
        guestPhone: nullableShortTextSchema("Guest phone number, or null when unknown.", 50),
        notes: nullableShortTextSchema("Booking notes, or null when unknown.", 5000),
      },
      required: [
        "checkIn",
        "checkOut",
        "guestsCount",
        "roomsCount",
        "roomId",
        "guestFullName",
        "guestEmail",
        "guestPhone",
        "notes",
      ],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "check_availability",
    description:
      "Check live room availability and server-calculated pricing for the requested stay. Use null for values that should be read from the current booking draft.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        checkIn: nullableIsoDateSchema,
        checkOut: nullableIsoDateSchema,
        guestsCount: nullableGuestCountSchema,
      },
      required: ["checkIn", "checkOut", "guestsCount"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "create_booking_request",
    description:
      "Create a booking request using validated guest details. The server must re-check availability, re-calculate nights and total price, and ignore any client-calculated values. Use null for draft-backed fields that should be read from the current session state.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        roomId: nullableRoomIdSchema,
        guestFullName: nullableShortTextSchema("Guest full name, or null when not yet known.", 200),
        guestEmail: {
          type: ["string", "null"],
          description: "Guest email address, or null when not yet known.",
          format: "email",
          maxLength: 320,
        },
        guestPhone: nullableShortTextSchema("Guest phone number, or null when not yet known.", 50),
        language: languageSchema,
        guestsCount: nullableGuestCountSchema,
        checkIn: nullableIsoDateSchema,
        checkOut: nullableIsoDateSchema,
        notes: nullableShortTextSchema("Optional booking notes, or null when not yet known.", 5000),
        consentPrivacy: {
          type: "boolean",
          description: "Whether the guest accepted the privacy policy.",
        },
        consentCookies: {
          type: "boolean",
          description: "Whether the guest accepted cookie-consent recording.",
        },
        source: {
          type: ["string", "null"],
          description: "Booking source, or null to use the default website source.",
          enum: ["website", "phone", "admin"],
        },
      },
      required: [
        "roomId",
        "guestFullName",
        "guestEmail",
        "guestPhone",
        "language",
        "guestsCount",
        "checkIn",
        "checkOut",
        "notes",
        "consentPrivacy",
        "consentCookies",
        "source",
      ],
      additionalProperties: false,
    },
  },
];

export const bookingAgentToolsByName = Object.fromEntries(
  bookingAgentTools.map((tool) => [tool.name, tool]),
) as Record<string, ResponsesFunctionTool>;

export const realtimeBookingAgentTools = bookingAgentTools;
