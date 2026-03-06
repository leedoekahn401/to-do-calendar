import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserSession } from "@/supabase/supabase-server";
import { FunctionDeclaration, Type } from "@google/genai";
import { eventTool } from "@/lib/tool/eventTool";
import { eventFunction } from "@/lib/tool/eventFunction";
import { ai } from "@/lib/ai";
export const messageController = {
    async sendMessage(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const { id } = await params;
            const body = await req.json();
            let { chat_history, content } = body;

            if (!content) {
                return NextResponse.json({ error: 'Missing required field "content"' }, { status: 400 });
            }
            const checkSql = `
                SELECT uuid FROM chat  
                WHERE uuid = $1 
                AND user_id = $2
            `;
            const checkRes = await query(checkSql, [id, user.id]);
            if (checkRes.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found" }, { status: 404 });
            }

            if (!chat_history) {
                const getHistorySQL = `
                SELECT role, content as part FROM message
                WHERE chat_id = $1
                `
                const values = [id];
                const res = await query(getHistorySQL, values);
                chat_history = res.rows.map((row: any) => ({
                    role: row.role == "assistant" ? "model" : "user",
                    parts: [{ text: row.part }]
                }));
            }
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are a scheduling assistant. Current time in Vietnam is ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'full', timeStyle: 'long' })}`,
                    tools: [{ functionDeclarations: [eventTool.createEvent, eventTool.getEvents] }]
                },
                history: chat_history
            })

            let response = await chat.sendMessage({ message: content });

            // Handle function calls from the model
            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionResponses = [];

                for (const call of response.functionCalls) {
                    let result;
                    if (call.name === "createEvent") {
                        const args = call.args as any;
                        result = await eventFunction.createEvent(
                            user.id,
                            id,
                            args.startTime,
                            args.endTime,
                            args.title,
                            args.urgency,
                            args.status,
                            args.description
                        );
                    } else if (call.name === "getEvents") {
                        const args = call.args as any;
                        result = await eventFunction.getEvents(
                            user.id,
                            args.startTime,
                            args.endTime
                        );
                    }

                    functionResponses.push({
                        name: call.name!,
                        response: { result }
                    });
                }

                // Send function results back to the model for a final text response
                response = await chat.sendMessage({
                    message: functionResponses.map(fr => ({
                        functionResponse: {
                            name: fr.name,
                            response: fr.response
                        }
                    })) as any // Cast to any because the specific type for message when sending a functionResponse isn't clearly typed in the available scope, but the structure is correct per the Gemini API SDK
                });
            }

            const aiMessage = response.text ?? "";

            // Save user message
            const addUserMessageSQL = `
                INSERT INTO message (chat_id, role, content)
                VALUES($1, $2, $3)
            `;
            await query(addUserMessageSQL, [id, "user", content]);

            // Save AI response
            const addAiMessageSQL = `
                INSERT INTO message (chat_id, role, content)
                VALUES($1, $2, $3)
            `;
            await query(addAiMessageSQL, [id, "assistant", aiMessage]);

            // Update chat last_updated
            await query(`UPDATE chat SET last_updated = now() WHERE uuid = $1`, [id]);

            return NextResponse.json({ data: aiMessage }, { status: 200 });


        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    },
    async getMessages(req: NextRequest) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const chat_id = req.nextUrl.searchParams.get("chatId");
            if (!chat_id) {
                return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
            }

            // Verify if the user owns this chat
            const checkSql = `SELECT uuid FROM chat WHERE uuid = $1 AND user_id = $2`;
            const checkRes = await query(checkSql, [chat_id, user.id]);
            if (checkRes.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            const sql = `
                SELECT * FROM message
                WHERE chat_id = $1
                ORDER BY created_at ASC
            `;
            const values = [chat_id];
            const res = await query(sql, values);
            return NextResponse.json({ data: res.rows }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    },

    async createMessage(req: NextRequest) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const body = await req.json();
            const { chat_id, content, role } = body;

            if (!chat_id || !content) {
                return NextResponse.json({ error: 'Missing required field' }, { status: 400 });
            }

            // Verify chat ownership
            const checkSql = `SELECT uuid FROM chat WHERE uuid = $1 AND user_id = $2`;
            const checkRes = await query(checkSql, [chat_id, user.id]);
            if (checkRes.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            // Insert message
            const insertSql = `
                INSERT INTO message (chat_id, role, content)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const insertValues = [chat_id, role || 'user', content];
            const messageRes = await query(insertSql, insertValues);

            // Update chat last_updated
            const updateChatSql = `
                UPDATE chat
                SET last_updated = now()
                WHERE uuid = $1;
            `;
            await query(updateChatSql, [chat_id]);

            return NextResponse.json({ message: "Message created successfully", data: messageRes.rows[0] }, { status: 201 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    },

    async updateMessage(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const { id } = await params;
            const body = await req.json();
            const { content } = body;

            if (!content) {
                return NextResponse.json({ error: 'Missing required field "content"' }, { status: 400 });
            }

            // Verify message exists and belongs to a chat the user owns
            const verifySql = `
                SELECT m.chat_id 
                FROM message m
                JOIN chat c ON m.chat_id = c.uuid
                WHERE m.uuid = $1 AND c.user_id = $2
            `;
            const verifyRes = await query(verifySql, [id, user.id]);

            if (verifyRes.rows.length === 0) {
                return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
            }

            const chat_id = verifyRes.rows[0].chat_id;

            // Update message
            const updateSql = `
                UPDATE message
                SET content = $1
                WHERE uuid = $2
                RETURNING *;
            `;
            const messageRes = await query(updateSql, [content, id]);

            // Track chat update
            await query(`UPDATE chat SET last_updated = now() WHERE uuid = $1`, [chat_id]);

            return NextResponse.json({ message: "Message updated successfully", data: messageRes.rows[0] }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    },

    async deleteMessage(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const { id } = await params;

            // Verify message exists and belongs to a chat the user owns
            const verifySql = `
                SELECT m.chat_id 
                FROM message m
                JOIN chat c ON m.chat_id = c.uuid
                WHERE m.uuid = $1 AND c.user_id = $2
            `;
            const verifyRes = await query(verifySql, [id, user.id]);

            if (verifyRes.rows.length === 0) {
                return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
            }

            const chat_id = verifyRes.rows[0].chat_id;

            // Delete message
            const deleteSql = `
                DELETE FROM message
                WHERE uuid = $1
                RETURNING uuid;
            `;
            await query(deleteSql, [id]);

            // Track chat update
            await query(`UPDATE chat SET last_updated = now() WHERE uuid = $1`, [chat_id]);

            return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    }
}