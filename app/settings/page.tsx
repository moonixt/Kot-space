"use client";

import { AuthenticatedRoute } from "../components/AuthenticatedRoute";
import Profile from "../profile/page";
import Link from "next/link";
import { checkSubscriptionStatus } from "../../lib/checkSubscriptionStatus";
import { Button } from "../../components/ui/button";
import {
  User, 
  Shield, 
  FileText, 
  CreditCard, 
  Trash2,
  ChevronRight,
  BellRing,
  HelpCircle,
  Settings as SettingsIcon,
  ArrowLeft,
  Languages,
  MessageSquareText,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

export default function Settings() {  
  const [activeCategory, setActiveCategory] = useState("account");
  const [isMobile, setIsMobile] = useState(false);
  const [, setShowSidebar] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  
  // Função para verificar o status da assinatura
  useEffect(() => {
    const checkUserSubscription = async () => {
      if (user) {
        try {
          const { isSubscriptionActive, subscriptionStatus, subscriptionEndDate } = 
            await checkSubscriptionStatus(user.id);
          
          setIsSubscriptionActive(isSubscriptionActive);
          setSubscriptionStatus(subscriptionStatus);
          setSubscriptionEndDate(subscriptionEndDate);
          
          console.log("Status da assinatura carregado:", {
            isActive: isSubscriptionActive,
            status: subscriptionStatus,
            endDate: subscriptionEndDate
          });
        } catch (error) {
          console.error("Erro ao verificar assinatura:", error);
        }
      }
    };
    
    checkUserSubscription();
  }, [user]);
  
  // Função para redirecionar para o portal do cliente Stripe
  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsLoadingPortal(true);
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const { url, error } = await response.json();
      
      if (error) {
        console.error('Erro ao acessar o portal:', error);
        alert('Não foi possível acessar o portal de assinatura. Por favor, tente novamente mais tarde.');
        return;
      }
      
      // Redirecionar para o portal do Stripe
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao processar requisição:', error);
      alert('Ocorreu um erro ao tentar acessar o portal de assinatura.');
    } finally {
      setIsLoadingPortal(false);
    }
  };
  
  // Detect screen size on mount and when resized
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      // Don't show sidebar by default on mobile to make UI cleaner
      setShowSidebar(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const categories = [
    { id: "account", name: "Account", icon: <User className="mr-2 h-4 w-4" />, description: "Manage your personal account details" },
    { id: "subscription", name: "Subscription", icon: <CreditCard className="mr-2 h-4 w-4" />, description: "Manage your subscription plan" },
    { id: "privacy", name: "Privacy & Security", icon: <Shield className="mr-2 h-4 w-4" />, description: "Control your data and security settings" },
    // { id: "appearance", name: "Appearance", icon: <Moon className="mr-2 h-4 w-4" />, description: "Customize your visual experience" },
    // { id: "notifications", name: "Notifications", icon: <BellRing className="mr-2 h-4 w-4" />, description: "Manage your notification preferences" },
    { id: "legal", name: "Legal", icon: <FileText className="mr-2 h-4 w-4" />, description: "View legal documents and policies" },
    // { id: "help", name: "Help & Support", icon: <HelpCircle className="mr-2 h-4 w-4" />, description: "Get help with Kot-space" }
  ];  return (
    <AuthenticatedRoute>
      <Profile/>
      <div className="flex flex-col md:flex-row justify-center min-h-screen p-4 gap-6">        {/* Mobile navigation header */}
        {isMobile && (
          <div className="w-full bg-[var(--container)] rounded-lg p-4 shadow-sm mb-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2 text-[var(--foreground)]" />
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {categories.find(cat => cat.id === activeCategory)?.name || "Settings"}
              </h2>
              <span className="ml-2 text-sm text-[var(--foreground)]/60 hidden sm:inline">
                {categories.find(cat => cat.id === activeCategory)?.description}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="md:hidden"
                >
                  <span className="sr-only">Settings</span>
                  <span className="flex items-center">
                    Categories 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    className={`${activeCategory === category.id ? "bg-[var(--theme)]/20 text-[var(--theme)]" : ""}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <div className="flex items-center">
                      {category.icon}
                      {category.name}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}          {/* Sidebar - only shown on desktop */}
        {!isMobile && (
          <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-4 bg-[var(--container)] rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Settings
                </h2>
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowSidebar(false)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              <div className="border-b border-slate-700 mb-4 pb-2">
                <p className="text-sm text-[var(--foreground)]/70 mb-2">Settings & Preferences</p>
              </div>
              
              <nav className="flex flex-col gap-1.5">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "secondary" : "ghost"}
                    className={`justify-start text-left h-11`}
                    onClick={() => {
                      setActiveCategory(category.id);
                      if (isMobile) setShowSidebar(false);
                    }}
                  >
                    {category.icon}
                    {category.name}
                  </Button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 max-w-3xl">
          {activeCategory === "account" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Account Settings</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Manage your personal account settings and preferences
              </p>

              <div className="space-y-4">
                {/* <div className="flex items-center justify-between p-4 hover:bg-[var(--theme)]/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-[var(--foreground)] opacity-70" />
                    <div>
                      <h3 className="font-medium">Profile Information</h3>
                      <p className="text-sm opacity-70">Update your profile details and picture</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--foreground)] opacity-70" />
                </div> */}

                {/* <div className="flex items-center justify-between p-4 hover:bg-[var(--theme)]/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <PenTool className="h-5 w-5 mr-3 text-[var(--foreground)] opacity-70" />
                    <div>
                      <h3 className="font-medium">Preferences</h3>
                      <p className="text-sm opacity-70">Customize your note-taking experience</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--foreground)] opacity-70" />
                </div> */}

                {/* <div className="flex items-center justify-between p-4 hover:bg-[var(--theme)]/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <BellRing className="h-5 w-5 mr-3 text-[var(--foreground)] opacity-70" />
                    <div>
                      <h3 className="font-medium">Notifications</h3>
                      <p className="text-sm opacity-70">Control how we contact you</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--foreground)] opacity-70" />
                </div> */}
                
                {/* <div className="flex items-center justify-between p-4 hover:bg-[var(--theme)]/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Moon className="h-5 w-5 mr-3 text-[var(--foreground)] opacity-70" />
                    <div>
                      <h3 className="font-medium">Appearance</h3>
                      <p className="text-sm opacity-70">Adjust themes and visual preferences</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--foreground)] opacity-70" />
                </div> */}

                <Link href="/delete-account">
                  <div className="mt-8 p-4  rounded-lg hover:bg-red-500/10 transition-colors flex items-center">
                    <Trash2 className="h-5 w-5 mr-3 text-red-400" />
                    <div>
                      <h3 className="font-medium text-red-400">Delete Account</h3>
                      <p className="text-sm text-red-400/70">Permanently delete your account and data</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {activeCategory === "subscription" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Subscription</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Manage your subscription plan and billing information
              </p>              <div className={`mb-8 p-6 bg-gradient-to-br rounded-lg border transition-all duration-200 ease-in-out
                ${isSubscriptionActive && subscriptionStatus !== 'canceled' 
                  ? 'from-green-800 to-emerald-800/30 border-green-700/30' 
                  : subscriptionStatus === 'canceled' 
                  ? 'from-amber-800 to-amber-800/30 border-amber-700/30' 
                  : 'from-red-800 to-red-800/30 border-red-700/30'}`}
              >
                <div className="flex justify-between items-start">
                  <div>                    <p className={`text-xs uppercase font-medium 
                      ${isSubscriptionActive && subscriptionStatus !== 'canceled' 
                        ? 'text-green-400/80' 
                        : subscriptionStatus === 'canceled' 
                        ? 'text-amber-400/80' 
                        : 'text-red-400/80'}`}
                    >
                      Current Plan
                    </p>                    <h3 className={`text-2xl font-bold mt-1
                      ${isSubscriptionActive && subscriptionStatus !== 'canceled' 
                        ? 'text-green-400' 
                        : subscriptionStatus === 'canceled' 
                        ? 'text-amber-400' 
                        : 'text-red-400'}`}
                    >
                      Unlimited Access
                    </h3>
                    
                    {subscriptionStatus === "canceled" && !subscriptionEndDate ? (
                      <p className="text-sm text-amber-400 mt-2">
                        Subscription canceled
                      </p>
                    ) : subscriptionStatus === "canceled" ? (
                      <p className="text-sm text-amber-400 mt-2">
                        Subscription canceled. Access until {new Date(subscriptionEndDate || "").toLocaleDateString()}
                      </p>
                    ) : isSubscriptionActive && subscriptionEndDate ? (
                      <p className="text-sm text-green-300 mt-2">
                        Active subscription until {new Date(subscriptionEndDate).toLocaleDateString()}
                      </p>
                    ) : isSubscriptionActive ? (
                      <p className="text-sm text-green-300 mt-2">
                        Active subscription
                      </p>
                    ) : (
                      <p className="text-sm text-red-400 mt-2">
                        Subscription expired
                      </p>
                    )}
                  </div>                  <div className={`shrink-0 p-3 rounded-full 
                    ${isSubscriptionActive && subscriptionStatus !== 'canceled' 
                      ? 'bg-green-500/20' 
                      : subscriptionStatus === 'canceled' 
                      ? 'bg-amber-500/20' 
                      : 'bg-red-500/20'}`}
                  >
                    <CreditCard className={`h-6 w-6 
                      ${isSubscriptionActive && subscriptionStatus !== 'canceled' 
                        ? 'text-green-400' 
                        : subscriptionStatus === 'canceled' 
                        ? 'text-amber-400' 
                        : 'text-red-400'}`} 
                    />
                  </div>
                </div>

                {subscriptionStatus === "canceled" && new Date(subscriptionEndDate || "") > new Date() ? (
                  <div className="mt-4 flex flex-col space-y-2">
                    <Button 
                      onClick={handleManageSubscription} 
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={isLoadingPortal}
                    >
                      {isLoadingPortal ? "Loading..." : "Reactivate Subscription"}
                    </Button>
                    <Button 
                      onClick={handleManageSubscription} 
                      variant="outline"
                      className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
                      disabled={isLoadingPortal}
                    >
                      {isLoadingPortal ? "Loading..." : "Manage Subscription"}
                    </Button>
                  </div>
                ) : !isSubscriptionActive ? (
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/pricing')} 
                      className="bg-green-700 hover:bg-green-800 text-white"
                    >
                      Get Subscription
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleManageSubscription} 
                    className="mt-4 bg-green-700 hover:bg-green-800 text-white"
                    disabled={isLoadingPortal}
                  >
                    {isLoadingPortal ? "Loading..." : "Manage Subscription"}
                  </Button>
                )}
              </div>
              
              {/* Subscription Details Section */}
              {(isSubscriptionActive || subscriptionStatus === "canceled") && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium text-[var(--foreground)]">Subscription Details</h3>
                  
                  <div className="space-y-2 border-b border-[var(--foreground)]/10 pb-4">
                    <div className="flex justify-between">
                      <span className="text-[var(--foreground)]/70">Status:</span>
                      <span className={`font-medium ${
                        isSubscriptionActive && subscriptionStatus !== 'canceled' 
                          ? 'text-green-400' 
                          : subscriptionStatus === 'canceled' 
                            ? 'text-amber-400' 
                            : 'text-red-400'
                      }`}>
                        {subscriptionStatus === 'canceled' 
                          ? 'Canceled' 
                          : isSubscriptionActive 
                            ? 'Active' 
                            : 'Expired'}
                      </span>
                    </div>
                    
                    {subscriptionEndDate && (
                      <div className="flex justify-between">
                        <span className="text-[var(--foreground)]/70">
                          {subscriptionStatus === 'canceled' ? 'Access Until:' : 'Renewal Date:'}
                        </span>
                        <span className="font-medium">
                          {new Date(subscriptionEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-[var(--foreground)]/70 mb-3">
                      {subscriptionStatus === 'canceled'
                        ? 'Your subscription has been canceled but you still have access until the end of your billing period.'
                        : isSubscriptionActive
                          ? 'Your subscription is active and will automatically renew on the date shown above.'
                          : 'Your subscription has expired. Renew now to continue using premium features.'}
                    </p>
                    
                    {subscriptionStatus === 'canceled' && new Date(subscriptionEndDate || "") > new Date() && (
                      <p className="text-sm text-amber-400/80 mb-3">
                        To continue using premium features beyond that date, you will need to reactivate your subscription.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeCategory === "privacy" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Privacy & Security</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Manage your privacy settings and security preferences
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-3">Password & Authentication</h3>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-3">Data & Privacy</h3>
                  <Link href="/privacy">
                    <Button variant="outline" className="w-full justify-start mb-3">
                      <FileText className="mr-2 h-4 w-4" />
                      Privacy Policy
                    </Button>
                  </Link>
                  {/* <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Request Data Download
                  </Button> */}
                </div>
              </div>
            </div>
          )}          {activeCategory === "legal" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Legal</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Important legal documents and information
              </p>
              
              <Link href="/terms">
                <Button variant="outline" className="w-full justify-start mb-3">
                  <FileText className="mr-2 h-4 w-4" />
                  Terms of Service
                </Button>
              </Link>
              
              <Link href="/privacy">
                <Button variant="outline" className="w-full justify-start mb-3">
                  <FileText className="mr-2 h-4 w-4" />
                  Privacy Policy
                </Button>
              </Link>
              
             
            </div>
          )}
          
          {activeCategory === "appearance" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Appearance</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Customize how Kot-space looks for you
              </p>
              
              <div className="space-y-6">
                <div className="border-b border-slate-700 pb-6">
                  <h3 className="font-medium text-lg mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border-2 border-[var(--theme)] rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-[var(--theme)]/10">
                      <div className="w-full h-20 mb-2 rounded bg-white"></div>
                      <p className="text-sm">Light</p>
                    </div>
                    <div className="border-2 border-transparent rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-[var(--theme)]/10">
                      <div className="w-full h-20 mb-2 rounded bg-gray-900"></div>
                      <p className="text-sm">Dark</p>
                    </div>
                    <div className="border-2 border-transparent rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-[var(--theme)]/10">
                      <div className="w-full h-20 mb-2 rounded bg-gradient-to-b from-white to-gray-900"></div>
                      <p className="text-sm">System</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-slate-700 pb-6">
                  <h3 className="font-medium text-lg mb-4">Accent Color</h3>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="aspect-square rounded-full bg-blue-500 cursor-pointer border-2 border-white/20"></div>
                    <div className="aspect-square rounded-full bg-purple-500 cursor-pointer"></div>
                    <div className="aspect-square rounded-full bg-pink-500 cursor-pointer"></div>
                    <div className="aspect-square rounded-full bg-orange-500 cursor-pointer"></div>
                    <div className="aspect-square rounded-full bg-green-500 cursor-pointer"></div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-4">Language</h3>
                  <div className="w-full p-3 bg-[var(--theme)]/10 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[var(--theme)]/20">
                    <div className="flex items-center">
                      <Languages className="h-5 w-5 mr-3" />
                      <span>English (US)</span>
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-70" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeCategory === "notifications" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Notifications</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Control when and how you receive notifications
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--theme)]/10 rounded-lg">
                  <div className="flex items-center">
                    <BellRing className="h-5 w-5 mr-3" />
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm opacity-70">Receive notifications even when you are offline</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-[var(--theme)] rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[var(--theme)]/10 rounded-lg">
                  <div className="flex items-center">
                    <MessageSquareText className="h-5 w-5 mr-3" />
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm opacity-70">Receive updates via email</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-gray-600 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                  </div>
                </div>
                
                <div className="border-t border-slate-700 pt-6">
                  <h3 className="font-medium text-lg mb-4">Notification Categories</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p>Reminders</p>
                      <div className="w-12 h-6 bg-[var(--theme)] rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p>Updates & News</p>
                      <div className="w-12 h-6 bg-[var(--theme)] rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p>Tips & Tutorials</p>
                      <div className="w-12 h-6 bg-gray-600 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeCategory === "help" && (
            <div className="bg-[var(--container)] rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Help & Support</h2>
              <p className="text-[var(--foreground)] opacity-80 mb-6">
                Get help with your account and app features
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--theme)]/10 rounded-lg">
                  <HelpCircle className="h-6 w-6 mb-2 text-[var(--foreground)] opacity-70" />
                  <h3 className="font-medium mb-1">FAQs</h3>
                  <p className="text-sm opacity-70 mb-3">Find answers to common questions</p>
                  <Button variant="secondary" size="sm">View FAQs</Button>
                </div>
                
                <div className="p-4 bg-[var(--theme)]/10 rounded-lg">
                  <svg className="h-6 w-6 mb-2 text-[var(--foreground)] opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="font-medium mb-1">Contact Support</h3>
                  <p className="text-sm opacity-70 mb-3">Get help from our support team</p>
                  <Button variant="secondary" size="sm">Contact Us</Button>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="font-medium text-blue-400 mb-2">Kot-space Documentation</h3>
                <p className="text-sm text-blue-400/80 mb-3">
                  Explore our comprehensive documentation to get the most out of Kot-space
                </p>
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
                  View Documentation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>    </AuthenticatedRoute>
  );
}