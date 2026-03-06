import { NextRequest } from "next/server"
import { chatController } from "./controller"

export async function GET(req: NextRequest) {
    return chatController.getChats(req);
}

export async function POST(req: NextRequest){
    return chatController.createChats(req);
}

export async function PUT(req: NextRequest){
    return chatController.renameChat(req);
}