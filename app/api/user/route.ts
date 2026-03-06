import { NextRequest } from "next/server";
import { userController } from "./controller";

export function GET(req: NextRequest){
    return userController.getUserInfo(req);
}