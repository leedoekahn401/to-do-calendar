import { NextRequest } from "next/server";
import { messageController } from "./controller";

export async function GET(req: NextRequest) {
    return messageController.getMessages(req);
}

export async function POST(req: NextRequest) {
    return messageController.createMessage(req);
}
