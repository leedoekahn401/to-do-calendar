import {Pool} from 'pg'

const globalForPool = global as unknown as {pool: Pool};

export const pool = globalForPool.pool || new Pool({
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool

export const query = (text: string, params?: any[]) => pool.query(text,params);