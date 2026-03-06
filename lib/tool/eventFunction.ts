import { query } from '@/lib/db'

export const eventFunction = {
    async getEvents(user_id: string, startStamp: string, endStamp?: string, limit: number = 10, skip: number = 0) {
        const sql = `
                 SELECT * FROM event
                 WHERE user_id = $1
                 AND start_timestamp >= $2
                 AND start_timestamp <= $3
                 ORDER BY start_timestamp DESC
                 LIMIT $4
                 OFFSET $5;
             `;
        const values = [
            user_id,
            startStamp,
            endStamp,
            limit,
            skip
        ]
        const response = await query(sql, values);
        return response.rows
    },
    async createEvent(
        user_id: string,
        source_chat_id: string,
        start_timestamp: string,
        end_timestamp: string,
        title: string,
        urgency?: string,
        status?: string,
        description?: string) {
        const values = [
            user_id,
            title,
            source_chat_id,
            description || null,
            urgency || 'medium',
            status || 'pending',
            start_timestamp,
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
        return result.rows[0];

    }
}

