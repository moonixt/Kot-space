"use client";
import Editor from "../components/editor";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "next-i18next";

export default function EditorPage() {
  const { t } = useTranslation();
  return (
    <ProtectedRoute>
      <div className="h-screen bg-[var(--background)] overflow-y-auto scrollbar flex flex-col">
        <div className="sticky top-0 bg-[var(--background)] bg-opacity-90 backdrop-blur-sm z-10 py-3 px-4   flex items-center">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-[var(--container)] transition-colors mr-2"
            title={t("editor.backToDashboard")}
          >
            <ArrowLeft size={20} className="text-[var(--foreground)]" />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("editor.newNote")}
          </h1>
        </div>

        <div className="flex-grow">
          <Editor />
        </div>
      </div>
    </ProtectedRoute>
  );
}
