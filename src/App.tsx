import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Navbar from "./components/Navbar";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import Index from "./pages/Index";
import Clinics from "./pages/Clinics";
import Medication from "./pages/Medication";
import Volunteers from "./pages/Volunteers";
import SOS from "./pages/SOS";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import NgoSecure from "./pages/NgoSecure";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { loading, isOnboarded } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

    return (
      <Routes>
        <Route path="/ngo-secure" element={<NgoSecure />} />
        <Route path="*" element={
          <>
            <AnnouncementBanner />
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/clinics" element={<Clinics />} />
              <Route path="/medication" element={<Medication />} />
              <Route path="/volunteers" element={<Volunteers />} />
              <Route path="/sos" element={<SOS />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </>
        } />
      </Routes>
    );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
