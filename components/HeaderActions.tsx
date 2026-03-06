"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from '@/supabase/supabase-browser';

export default function HeaderActions() {
    const [openDropdown, setOpenDropdown] = useState<'user' | 'settings' | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchUserInfo = async () => {
        setIsLoadingUser(true);
        try {
            const res = await fetch('/api/user');
            if (res.ok) {
                const json = await res.json();
                if (json.data && json.data.length > 0) {
                    setUserInfo(json.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch user info", error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const handleUserClick = () => {
        if (openDropdown === 'user') {
            setOpenDropdown(null);
        } else {
            setOpenDropdown('user');
            if (!userInfo) fetchUserInfo();
        }
    };

    const handleSettingsClick = () => {
        if (openDropdown === 'settings') {
            setOpenDropdown(null);
        } else {
            setOpenDropdown('settings');
        }
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <div ref={wrapperRef} className="absolute top-8 right-8 flex gap-4 z-50">
            {/* User Profile */}
            <div className="relative">
                <button 
                    onClick={handleUserClick}
                    className="w-12 h-12 rounded-full thick-border bg-accent-peach flex items-center justify-center hover:scale-105 transition-transform text-black"
                >
                    <User size={28} />
                </button>
                
                {openDropdown === 'user' && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl thick-border shadow-lg p-4 z-50 overflow-hidden transform origin-top-right transition-all">
                        <h3 className="font-bold border-b-2 border-black pb-2 mb-3">User Profile</h3>
                        {isLoadingUser ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin text-accent-orange" size={24} />
                            </div>
                        ) : userInfo ? (
                            <div className="flex flex-col gap-2 font-semibold text-sm">
                                <p><span className="text-gray-500">Name:</span> {userInfo.display_name || "Unknown User"}</p>
                                <p><span className="text-gray-500">Email:</span> {userInfo.email || "No email"}</p>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-gray-500">Failed to load user info.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="relative">
                <button 
                    onClick={handleSettingsClick}
                    className="w-12 h-12 rounded-2xl thick-border bg-panel-light flex items-center justify-center hover:scale-105 transition-transform text-black"
                >
                    <Settings size={28} />
                </button>

                {openDropdown === 'settings' && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl thick-border shadow-lg p-2 z-50 overflow-hidden transform origin-top-right transition-all">
                        <button 
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="w-full flex items-center gap-3 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 text-left"
                        >
                            {isSigningOut ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
