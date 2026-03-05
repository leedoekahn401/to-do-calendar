import { NextRequest } from "next/server";
import { eventController } from "../controller";

export async function PUT(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return eventController.updateEvent(req, { params: awaitedParams });
}

export async function DELETE(req: NextRequest, { params }: any) {
    const awaitedParams = await params;
    return eventController.deleteEvent(req, { params: awaitedParams });
}
