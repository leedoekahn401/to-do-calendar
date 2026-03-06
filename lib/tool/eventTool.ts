import { Type } from "@google/genai"

export const eventTool = {
    createEvent: {
        name: "createEvent",
        description: "Create a new event in the user calendar",
        parametersJsonSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING, description: "The detail of the event" },
                startTime: { type: Type.STRING, description: "The start time in 'YYYY-MM-DD HH:mm:ss+07' format (Vietnam timezone). Example: '2026-03-04 18:00:00+07'." },
                endTime: { type: Type.STRING, description: "The end time in 'YYYY-MM-DD HH:mm:ss+07' format (Vietnam timezone). Example: '2026-03-04 19:00:00+07'." },
                urgency: { type: Type.STRING, enum: ["low", "medium", "high"], description: "How important is the event" },
                status: { type: Type.STRING, enum: ["pending", "done", "cancelled"], description: "The state of the event" }
            },
            required: ["title", "startTime"]
        }
    },
    getEvents: {
        name: "getEvents",
        description: "Get users list of events",
        parametersJsonSchema: {
            type: Type.OBJECT,
            properties: {
                startTime: { type: Type.STRING, description: "The start time in 'YYYY-MM-DD HH:mm:ss+07' format (Vietnam timezone). Example: '2026-03-04 00:00:00+07'" },
                endTime: { type: Type.STRING, description: "The end time in 'YYYY-MM-DD HH:mm:ss+07' format (Vietnam timezone). Example: '2026-03-04 23:59:59+07'." }
            },
            required: ["startTime", "endTime"]
        }
    }
}