import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/supabase/supabase-server";
import { query } from "@/lib/db";


export const userController = {
    async getUserInfo(req: NextRequest){
        try{
            const { user, authError } = await getUserSession();
            if (authError || !user || !user.id) {
                
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }
            const sql = `
            SELECT * FROM profiles
            WHERE id = $1
            `;
            const values = [user.id];
            const res = await query(sql, values);
            return NextResponse.json({data: res.rows}, {status: 200});
        }catch(error){
            console.error(error);
            return NextResponse.json({error: "Server Failed"},{status: 500})
        }
    }
}