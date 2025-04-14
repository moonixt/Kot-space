"use client";

import React, { useState } from "react";
import { CreditCard, Check, Shield, HardDrive, Smartphone, FileEdit, LayoutDashboard, CheckSquare, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function PricingPage() {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  const planDetails = {
    name: "Pro",
    price: "19.99",
    period: "mês",
    features: [
      "Armazenamento ilimitado de notas",
      "Sincronização em todos dispositivos",
      "Suporte a formatação Markdown",
      "Visualização em dashboard avançado",
      "Gerenciamento de tarefas avançado",
      "Calendário integrado com notificações",
    ],
  };

  // Função para redirecionar para o checkout do Stripe com o ID do usuário
  const handleCheckout = () => {
    if (!user) {
      alert("Você precisa estar logado para fazer uma assinatura.");
      return;
    }

    // Criar URL com parâmetros de query
    const checkoutUrl = new URL(
      "https://buy.stripe.com/test_eVaaFG14ugrtbSMaEE",
    );
    checkoutUrl.searchParams.append("client_reference_id", user.id);

    // Abrir em nova aba
    window.open(checkoutUrl.toString(), "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] to-[var(--background-secondary)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block py-1 px-3 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse mb-4">
            OFERTA POR TEMPO LIMITADO
          </div>
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--accent)] mb-6">
            Plano PRO
          </h1>
          <p className="text-xl text-[var(--foreground)] max-w-2xl mx-auto leading-relaxed">
            Desbloqueie todo o potencial do Fair-note com nosso plano premium e 
            <span className="font-bold"> potencialize sua produtividade</span>
          </p>
          
          <div className="flex items-center justify-center mt-8 space-x-4">
            <div className="flex items-center text-green-500">
              <Check className="mr-1 h-5 w-5" />
                <span className="text-sm">Acesso contínuo em qualquer dispositivo</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--muted)]"></div>
            <div className="flex items-center text-green-500">
              <Shield className="mr-1 h-5 w-5" />
              <span className="text-sm">Garantia de 30 dias</span>
            </div>
          </div>
        </div>

        <div className="relative bg-[var(--container)] rounded-3xl shadow-2xl overflow-hidden mb-12 border border-[var(--accent)]">
          <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-lg font-semibold">
            OFERTA POR TEMPO LIMITADO
          </div>
          <div className="bg-[var(--foreground)] px-6 py-5">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[var(--background)]">
                Plano PRO
              </h2>
              <div className="bg-[var(--accent)] text-white px-3 py-5 text-sm font-medium rounded-full">
                Mais Popular
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 flex items-baseline">
              <span className="text-5xl font-extrabold text-[var(--foreground)]">
                R$ {planDetails.price}
              </span>
              <span className="ml-2 text-xl font-medium text-[var(--foreground)]">
                /{planDetails.period}
              </span>
              <span className="ml-4 line-through text-[var(--muted)] text-lg">
                R$ 29.99
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-6">
                O que está incluído:
              </h3>
              <ul className="space-y-4 ">
                {planDetails.features.map((feature, index) => {
                  // Select the right icon based on the feature
                  let FeatureIcon = Check;
                  
                  if (feature.includes("Armazenamento")) {
                    FeatureIcon = HardDrive;
                  } else if (feature.includes("Sincronização")) {
                    FeatureIcon = Smartphone;
                  } else if (feature.includes("Markdown")) {
                    FeatureIcon = FileEdit;
                  } else if (feature.includes("dashboard")) {
                    FeatureIcon = LayoutDashboard;
                  } else if (feature.includes("tarefas")) {
                    FeatureIcon = CheckSquare;
                  } else if (feature.includes("Calendário")) {
                    FeatureIcon = Calendar;
                  }
                  
                  return (
                    <li key={index} className="flex items-start bg-[var(--highlight)] p-3 rounded-lg transition-all duration-200 hover:shadow-md">
                      <div className="flex-shrink-0 h-6 w-6 bg-[var(--accent)] rounded-full flex items-center justify-center text-white">
                        <FeatureIcon className="h-4 w-4 text-[var(--foreground)]" />
                      </div>
                      <span className="ml-3 text-[var(--foreground)] font-medium">
                        {feature}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[var(--container)] rounded-3xl shadow-xl overflow-hidden border border-[var(--border-color)]">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[var(--foreground)]">
                Resumo do pedido
              </h3>
              <div className="flex items-center text-green-600">
                <Shield className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Pagamento seguro</span>
              </div>
            </div>

            <div className="flex justify-between py-4 border-t border-[var(--border-color)]">
              <span className="text-[var(--foreground)]">
                Plano {planDetails.name}
              </span>
              <span className="font-medium text-[var(--foreground)]">
                R$ {planDetails.price}
              </span>
            </div>

            <div className="flex justify-between py-4 border-t border-b border-[var(--border-color)]">
              <span className="text-[var(--foreground)]">Impostos</span>
              <span className="font-medium text-[var(--foreground)]">
                Inclusos
              </span>
            </div>

            <div className="flex justify-between py-4 mt-2">
              <span className="text-xl font-bold text-[var(--foreground)]">
                Total
              </span>
              <div>
                <span className="text-xl font-bold text-[var(--accent)]">
                  R$ {planDetails.price}
                </span>
                <span className="text-[var(--foreground)]">/{planDetails.period}</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleCheckout}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full bg-[var(--foreground)] hover:from-[var(--accent)] hover:to-[var(--foreground)] text-[var(--background)] py-5 px-6 rounded-xl font-bold flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <CreditCard className={`mr-2 h-5 w-5 ${isHovered ? 'animate-pulse' : ''}`} />
                <span className="text-lg">Assinar Agora</span>
              </button>
              <p className="text-center text-[var(--muted)] mt-4 text-sm">
                Cancele a qualquer momento. Sem compromisso.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-[var(--highlight)] p-6 rounded-2xl border-l-4 border-red-500">
          <h4 className="font-bold text-[var(--foreground)] text-center">
            Oferta especial por tempo limitado! Economize 33%
          </h4>
          <p className="text-[var(--muted)] text-center mt-2">
            Organize, planeje e realize mais com recursos avançados de calendário e gerenciamento de tarefas
          </p>
        </div>
      </div>
    </div>
  );
}
