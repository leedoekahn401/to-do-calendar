import React from "react";
import SidebarAssistant from "@/components/SidebarAssistant";
import CalendarDashboard from "@/components/CalendarDashboard";
import { User, Settings } from "lucide-react";

export default function HomePage() {
    return (
        <main className="bg-background-light font-display text-black h-screen overflow-hidden p-6 flex flex-col justify-center items-center relative">

            {/* Floating Action Buttons */}
            <div className="absolute top-8 right-8 flex gap-4 z-9">
                <button className="w-12 h-12 rounded-full thick-border bg-accent-peach  flex items-center justify-center hover:scale-105 transition-transform text-black ">
                    <User size={28} />
                </button>
                <button className="w-12 h-12 rounded-2xl thick-border bg-panel-light  flex items-center justify-center hover:scale-105 transition-transform text-black ">
                    <Settings size={28} />
                </button>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6 justify-center items-center h-full max-h-[850px]">
                <SidebarAssistant />
                <CalendarDashboard />
            </div>

        </main>
    );
}
