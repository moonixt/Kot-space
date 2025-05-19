"use client";

/**
 * Página de Solicitação de Exclusão de Conta
 * 
 * Esta página permite que o usuário solicite a exclusão de sua conta
 * enviando um email para o suporte, com as informações necessárias já preenchidas.
 */

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { ArrowLeft, Copy, Mail } from "lucide-react";

export default function DeleteAccountPage() {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const supportEmail = "suporte@fairoute.com.br";
  const emailSubject = "Solicitação de Exclusão de Conta";
  const emailBody = `Olá, 
  
Gostaria de solicitar a exclusão da minha conta do Fair Note.

ID da conta: ${user?.id || ""}
Email: ${user?.email || ""}

Entendo que esta ação é permanente e irá excluir todos os meus dados.

Atenciosamente,
[Seu Nome]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailtoClick = () => {
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--container)] rounded-xl overflow-hidden shadow-lg">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-red-500 mb-6">
              Solicitar Exclusão de Conta
            </h1>

            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                <p className="text-amber-400 font-semibold mb-2">
                  Processo Manual de Exclusão
                </p>
                <p className="text-[var(--muted)] text-sm">
                  Para garantir a segurança dos seus dados, implementamos um processo de exclusão manual. 
                  Por favor, envie um email para nossa equipe de suporte com as informações abaixo.
                </p>
              </div>

              <div className="bg-[var(--muted-background)] rounded-lg p-4 mb-4 relative">
                <p className="text-xs text-[var(--muted)] mb-1">Mensagem Sugerida:</p>
                <pre className="text-xs whitespace-pre-wrap text-[var(--foreground)] font-mono p-2 bg-[var(--background)]/50 rounded border border-[var(--border)]">
                  {emailBody}
                </pre>
                <button 
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-[var(--muted-background)] hover:bg-[var(--muted)]/30 text-[var(--muted)]"
                  title="Copiar mensagem"
                >
                  <Copy size={16} />
                </button>
                {copied && (
                  <div className="absolute -top-2 right-12 bg-green-600 text-white text-xs py-1 px-2 rounded">
                    Copiado!
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleMailtoClick}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  Enviar Email para {supportEmail}
                </button>
                
                <Link href="/settings">
                  <button className="w-full py-3 px-4 bg-[var(--background)] hover:bg-[var(--background-highlight)] text-[var(--foreground)] rounded-lg flex items-center justify-center gap-2 border border-[var(--border)]">
                    <ArrowLeft size={16} />
                    Voltar para Configurações
                  </button>
                </Link>
              </div>

              <p className="text-xs text-[var(--muted)] text-center mt-6">
                Nossa equipe processará sua solicitação em até 48 horas úteis.
                Você receberá uma confirmação por email quando a exclusão for concluída.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
