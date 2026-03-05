import { eventController } from "./controller";
import { NextRequest } from "next/server";
export async function GET(req: NextRequest) {
    return eventController.getEvents(req);
}
export async function POST(req: NextRequest){
    return eventController.createEvent(req);
}