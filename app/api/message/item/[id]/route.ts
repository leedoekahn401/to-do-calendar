import { NextRequest } from "next/server";
import { messageController } from "../../controller";

export async function PUT(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return messageController.updateMessage(req, { params: awaitedParams });
}

export async function DELETE(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return messageController.deleteMessage(req, { params: awaitedParams });
}

export async function POST(req: NextRequest, {params}: any){
    const awaitedParams = await params;
    return messageController.sendMessage(req, {params: awaitedParams});
}