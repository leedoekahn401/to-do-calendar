import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserSession } from "@/supabase/supabase-server";

export const messageController = {
    async sendMessage(req: NextRequest, {params}: any){
        try{
            const {user,authError} = await getUserSession();
            if(authError||!user||!user.id){
                return NextResponse.json({error: "Unauthenticated"}, {status: 401});
            }
            const { id } = await params;
            const body = await req.json();
            const { content } = body;

            if (!content) {
                return NextResponse.json({ error: 'Missing required field "content"' }, { status: 400 });
            }
            const checkSql = `SELECT uuid FROM chat WHERE uuid = $1 AND user_id = $2`;
            const checkRes = await query(checkSql, [chat_id, user.id]);
            if (checkRes.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            const sql = `
                INSERT INTO message (chat_id, role, content)
                
            `


        }catch(error: any){
            console.error(error);
            return NextResponse.json({error: "Server Failed"},{status: 500});
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