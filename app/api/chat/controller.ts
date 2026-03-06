import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/supabase/supabase-server";
import { query } from "@/lib/db";

export const chatController = {
    async getChats(req: NextRequest) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const searchParams = req.nextUrl.searchParams;
            const limit = parseInt(searchParams.get("limit") || '10', 10);
            const skip = parseInt(searchParams.get("skip") || '0', 10);

            const sql = `
                SELECT * FROM chat
                WHERE user_id = $1
                ORDER BY last_updated DESC
                LIMIT $2
                OFFSET $3

            `;
            const values = [user.id, limit, skip];
            const res = await query(sql, values);
            return NextResponse.json({ data: res.rows }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server failed" }, { status: 500 });
        }
    },

    async createChats(req: NextRequest) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const body = await req.json();
            const { title } = body;
            if (!title) {
                return NextResponse.json({ error: 'Missing a required field "title"' }, { status: 400 });
            }


            const sql = `
                INSERT INTO chat(
                    user_id,
                    title,
                    last_updated
                )
                VALUES($1, $2, now())
                RETURNING *;
            `
            const values = [user.id, title];
            const res = await query(sql, values);
            const newChat = res.rows[0];
            return NextResponse.json({ message: "Chat created successfully", chat: newChat }, { status: 201 })


        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server failed" }, { status: 500 });
        }
    },

    async getChatById(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const { id } = await params;

            const sql = `
                SELECT * FROM chat
                WHERE uuid = $1 AND user_id = $2
            `;
            const result = await query(sql, [id, user.id]);

            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ data: result.rows[0] }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server failed" }, { status: 500 });
        }
    },

    async updateChat(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const { id } = await params;
            const body = await req.json();
            const { title } = body;

            if (!title) {
                return NextResponse.json({ error: "Missing fields to update" }, { status: 400 });
            }

            const sql = `
                UPDATE chat
                SET title = $1, last_updated = now()
                WHERE uuid = $2 AND user_id = $3
                RETURNING *;
            `;
            const result = await query(sql, [title, id, user.id]);

            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ message: "Chat updated successfully", data: result.rows[0] }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server failed" }, { status: 500 });
        }
    },

    async renameChat(req: NextRequest){
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const {chat_id, title} = await req.json();
            if(!chat_id || !title) {
                return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
            }

            const sql = `
                UPDATE chat
                SET title = $1, last_updated = now()
                WHERE uuid = $2 AND user_id = $3
                RETURNING *;
            `;
            const result = await query(sql, [title, chat_id, user.id]);

            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ message: "Chat renamed successfully", data: result.rows[0] }, { status: 200 });
        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server failed" }, { status: 500 });
        }
    },

    async deleteChat(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const { id } = await params;

            // Note: If you don't have ON DELETE CASCADE set in your database for 
            // messages and events tied to this chat, you'll need to delete them first.
            // But usually this exists. Assuming the DB handles references or they should be deleted here.

            // Delete associated messages first
            await query(`DELETE FROM message WHERE chat_id = $1`, [id]);
            // Delete associated events' source_chat_id references OR the events themselves.
            // Let's just nullify references to avoid deleting user events unintentionally.
            await query(`UPDATE event SET source_chat_id = NULL WHERE source_chat_id = $1 AND user_id = $2`, [id, user.id]);

            const sql = `
                DELETE FROM chat
                WHERE uuid = $1 AND user_id = $2
                RETURNING uuid;
            `;
            const result = await query(sql, [id, user.id]);

            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ message: "Chat deleted successfully" }, { status: 200 });

        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: "Server failed" }, { status: 500 });
        }
    }
}