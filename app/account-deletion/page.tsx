"use client";

/**
 * Página Pública de Instruções para Exclusão de Conta
 *
 * Esta página pública permite que qualquer usuário veja as instruções
 * para solicitar a exclusão de sua conta, sem necessidade de login.
 * Criada para atender aos requisitos do Google Play Store.
 */

import { useState } from "react";
import Link from "next/link";
import { Copy, Mail, Shield, Clock, Trash2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";

export default function AccountDeletionPage() {
  const [copied, setCopied] = useState(false);

  const supportEmail = "privacy@lynxky.com";
  const emailSubject = "Account Deletion Request - Lynxky";
  const emailTemplate = `Subject: Account Deletion Request - Lynxky

Dear Lynxky Support Team,

I would like to request the permanent deletion of my account and all associated data from your platform.

Account Details:
- Email: [Your registered email address]
- User ID: [If known, otherwise leave blank]
- Reason for deletion: [Optional - you can specify a reason]

I understand that:
- This action is irreversible
- All my notes, tasks, and folders will be permanently deleted
- My account cannot be recovered after deletion
- This process may take up to 30 days to complete

Please confirm the deletion of my account and all associated data.

Thank you for your assistance.

Best regards,
[Your name]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailtoClick = () => {
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailTemplate)}`;
    window.location.href = mailtoLink;
  };

  return (
    <>
      <div className="min-h-screen bg-[var(--background)] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/10 rounded-full">
                <Trash2 size={48} className="text-red-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              Account Deletion Instructions
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
              Learn how to permanently delete your Lynxky account and all
              associated data
            </p>
          </div>

          {/* Warning Section */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Shield size={24} className="text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Important Warning
                </h3>
                <p className="text-[var(--muted)] mb-4">
                  Account deletion is permanent and irreversible. Once
                  processed, you will lose:
                </p>
                <ul className="text-[var(--muted)] space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    All your notes and documents
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    All your tasks and to-do lists
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    All your folders and organization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    Your account settings and preferences
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    Any premium subscription benefits
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Process Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Manual Process */}
            <div className="bg-[var(--container)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail size={24} className="text-blue-500" />
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  How to Delete Your Account
                </h2>
              </div>
              <div className="space-y-4 text-[var(--muted)]">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <p>
                    Copy the email template below or compose your own deletion
                    request
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <p>
                    Send the email to{" "}
                    <strong className="text-blue-400">{supportEmail}</strong>
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <p>
                    Include your registered email address and any additional
                    details
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <p>Wait for confirmation from our support team</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[var(--container)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={24} className="text-green-500" />
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Processing Timeline
                </h2>
              </div>
              <div className="space-y-4 text-[var(--muted)]">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Request Received
                    </p>
                    <p className="text-sm">
                      We will acknowledge your request within 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Verification Process
                    </p>
                    <p className="text-sm">
                      We may ask for additional verification (1-3 days)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Data Deletion
                    </p>
                    <p className="text-sm">
                      Complete removal of all data (up to 30 days)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Confirmation
                    </p>
                    <p className="text-sm">
                      Final confirmation email sent to you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Template Section */}
          <div className="bg-[var(--container)] rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Email Template
              </h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] hover:bg-[var(--background)]/80 text-[var(--foreground)] rounded-lg border border-[var(--border)] transition-colors"
                title="Copy email template"
              >
                <Copy size={16} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="relative">
              <pre className="text-sm whitespace-pre-wrap text-[var(--foreground)] p-4 bg-[var(--background)]/50 rounded-lg border border-[var(--border)] overflow-x-auto">
                {emailTemplate}
              </pre>
              {copied && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs py-1 px-2 rounded">
                  Copied to clipboard!
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleMailtoClick}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-3 font-medium transition-colors"
            >
              <Mail size={20} />
              Send Deletion Request Email
            </button>

            <Link href="/">
              <button className="px-8 py-4 bg-[var(--container)] hover:bg-[var(--container)]/80 text-[var(--foreground)] rounded-lg flex items-center justify-center gap-3 font-medium border border-[var(--border)] transition-colors">
                Back to Lynxky
              </button>
            </Link>
          </div>

          {/* Additional Information */}
          <div className="bg-[var(--container)] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
              Additional Information
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <div>
                <h3 className="font-medium text-[var(--foreground)] mb-2">
                  Data Retention Policy
                </h3>
                <p>
                  We retain personal data only as long as necessary to provide
                  our services. Upon account deletion, all personal data is
                  permanently removed from our systems within 30 days.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--foreground)] mb-2">
                  Legal Compliance
                </h3>
                <p>
                  This deletion process complies with GDPR, CCPA, and other
                  privacy regulations. You have the right to request deletion of
                  your personal data at any time.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[var(--foreground)] mb-2">
                  Need Help?
                </h3>
                <p>
                  If you have questions about the deletion process or need
                  assistance, please contact our support team at{" "}
                  <strong className="text-blue-400">{supportEmail}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-[var(--border)]">
            <p className="text-[var(--muted)] text-sm">
              Last updated: {new Date().toLocaleDateString()} | Lynxky Account
              Deletion Policy
            </p>
          </div>
        </div>
      </div>
      <Analytics />
    </>
  );
}
