"use client";

import { Analytics } from "@vercel/analytics/next";
import IA from "../components/ChatAssistent";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export default function ChatPage() {
  return (
    <>
      <AuthenticatedRoute>
        <div className="h-screen w-screen flex flex-col bg-[var(--background)]">
          <div className="flex-1 flex flex-col">
            <div className="w-full h-full flex flex-col bg-[var(--container)]">
              <IA />
            </div>
          </div>
        </div>
      </AuthenticatedRoute>
      <Analytics />
    </>
  );
}
