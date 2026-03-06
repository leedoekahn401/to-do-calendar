import React from "react";
import SidebarAssistant from "@/components/SidebarAssistant";
import CalendarDashboard from "@/components/CalendarDashboard";
import { User, Settings } from "lucide-react";
import HeaderActions from "@/components/HeaderActions";

export default function HomePage() {
    return (
        <main className="bg-background-light font-display text-black h-screen overflow-hidden p-6 flex flex-col justify-center items-center relative">

            <HeaderActions />

            {/* Main Content Layout */}
            <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6 justify-center items-center h-full max-h-[850px]">
                <SidebarAssistant />
                <CalendarDashboard />
            </div>

        </main>
    );
}
