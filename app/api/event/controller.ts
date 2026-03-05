import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/supabase/supabase-server";
import { query } from "@/lib/db";

export const eventController = {
    async getEvents(req: NextRequest) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const searchParams = req.nextUrl.searchParams;

            const startStamp = searchParams.get('startstamp') || '2077-01-01 00:00:00+00';
            const endStamp = searchParams.get('endstamp') || '2000-01-01 00:00:00+00';
            const limit = parseInt(searchParams.get('limit') || '10', 10);
            const skip = parseInt(searchParams.get('skip') || '0', 10);


            const sql = `
                SELECT * FROM event
                WHERE user_id = $1
                AND start_timestamp >= $2
                AND start_timestamp <= $3
                ORDER BY start_timestamp DESC
                LIMIT $4
                OFFSET $5;
            `;
            const values = [user.id, startStamp, endStamp, limit, skip]
            const response = await query(sql, values);
            return NextResponse.json({ data: response.rows }, { status: 200 })

        } catch (error: any) {
            return NextResponse.json({ error: "Server Failed" }, { status: 500 })

        }
    },

    async createEvent(req: NextRequest) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const body = await req.json();
            const {
                title,
                source_chat_id,
                description,
                urgency,
                status,
                start_timestamp,
                end_timestamp
            } = body;

            if (!title) {
                return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
            }

            const values = [
                user.id,
                title,
                source_chat_id || null,
                description || null,
                urgency || 'medium',
                status || 'pending',
                start_timestamp || null,
                end_timestamp || (start_timestamp ? new Date(new Date(start_timestamp).getTime() + 30 * 60000).toISOString() : null)
            ]

            const sql = `
            INSERT INTO event (
                user_id, title, source_chat_id, description, urgency, status, start_timestamp, end_timestamp
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
            `
            const result = await query(sql, values);
            return NextResponse.json({ message: "Event Created" }, { status: 201 })

        } catch (error: any) {
            console.error("createEvent error:", error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 })
        }
    },

    async updateEvent(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const body = await req.json();
            const { id } = await params;

            // Build dynamically the fields to update
            const fields: string[] = [];
            const values: any[] = [];
            let argIndex = 1;

            const updatableFields = [
                'title', 'description', 'urgency', 'status',
                'start_timestamp', 'end_timestamp'
            ];

            for (const field of updatableFields) {
                if (body[field] !== undefined) {
                    fields.push(`${field} = $${argIndex}`);
                    values.push(body[field]);
                    argIndex++;
                }
            }

            if (fields.length === 0) {
                return NextResponse.json({ error: "No fields to update" }, { status: 400 });
            }

            values.push(id, user.id);
            const sql = `
                UPDATE event 
                SET ${fields.join(', ')}
                WHERE uuid = $${argIndex} AND user_id = $${argIndex + 1}
                RETURNING *;
            `;

            const result = await query(sql, values);
            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ message: "Event Updated", data: result.rows[0] }, { status: 200 });

        } catch (error: any) {
            console.error("updateEvent error:", error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    },

    async deleteEvent(req: NextRequest, { params }: any) {
        try {
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const { id } = await params;

            const sql = `
                DELETE FROM event
                WHERE uuid = $1 AND user_id = $2
                RETURNING uuid;
            `;
            const result = await query(sql, [id, user.id]);

            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
            }

            return NextResponse.json({ message: "Event Deleted" }, { status: 200 });

        } catch (error: any) {
            console.error("deleteEvent error:", error);
            return NextResponse.json({ error: "Server Failed" }, { status: 500 });
        }
    }
}