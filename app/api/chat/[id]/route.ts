import { NextRequest } from "next/server";
import { chatController } from "../controller";

export async function GET(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return chatController.getChatById(req, { params: awaitedParams });
}

export async function PUT(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return chatController.updateChat(req, { params: awaitedParams });
}

export async function DELETE(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return chatController.deleteChat(req, { params: awaitedParams });
}
