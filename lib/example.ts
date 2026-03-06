import { GoogleGenAI, Type } from "@google/genai";
import { Pool } from "pg";
import { NextResponse } from "next/server";

// 1. Initialize Database Pool
// Reused across serverless function calls to keep DB connections efficient
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Initialize the NEW Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Define the Tools using the new 'parametersJsonSchema' syntax
const createEventTool = {
  name: "create_event",
  description: "Create a new event in the user's schedule database.",
  parametersJsonSchema: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The title of the event" },
      startTime: { type: Type.STRING, description: "ISO 8601 start time (e.g., 2026-03-06T14:00:00Z)" },
      endTime: { type: Type.STRING, description: "ISO 8601 end time" },
    },
    required: ["title", "startTime", "endTime"],
  },
};

const deleteEventTool = {
  name: "delete_event",
  description: "Delete an event from the schedule using its ID.",
  parametersJsonSchema: {
    type: Type.OBJECT,
    properties: {
      eventId: { type: Type.NUMBER, description: "The ID of the event to delete" },
    },
    required: ["eventId"],
  },
};

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 4. Create the chat session with the tools attached
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        // Crucial: Give the AI the current time so it understands "tomorrow"
        systemInstruction: `You are a helpful scheduling assistant. Today is ${new Date().toISOString()}.`,
        tools: [{ functionDeclarations: [createEventTool, deleteEventTool] }],
      }
    });

    // 5. Send the user's message to Gemini
    let response = await chat.sendMessage({ message });

    // 6. Check if Gemini decided to call a function
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      let apiResponse;

      // Execute the requested tool securely on the server
      try {
        if (call.name === "create_event") {
          const { title, startTime, endTime } = call.args as any;
          
          // Parameterized SQL query prevents SQL injection
          const dbResult = await pool.query(
            `INSERT INTO schedule_events (title, start_time, end_time) VALUES ($1, $2, $3) RETURNING id`,
            [title, startTime, endTime]
          );
          
          apiResponse = { status: "success", id: dbResult.rows[0].id };
          
        } else if (call.name === "delete_event") {
          const { eventId } = call.args as any;
          
          await pool.query(
            `DELETE FROM schedule_events WHERE id = $1`, 
            [eventId]
          );
          
          apiResponse = { status: "success", message: `Deleted event ${eventId}` };
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        apiResponse = { status: "error", message: "Failed to modify database." };
      }

      // 7. Send the database result BACK to Gemini
      response = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: apiResponse
        }
      }]);
    }

    // 8. Return the final natural language text to your frontend
    return NextResponse.json({ text: response.text });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}