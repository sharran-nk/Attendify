import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { MotionConfig } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import AttendanceCalendar from "./pages/AttendanceCalendar";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider";
import { useAttendanceReminder } from "@/hooks/useAttendanceReminder";

import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const AppContent = () => {
  useAttendanceReminder();
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceCalendar /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
      <InstallPrompt />
    </BrowserRouter>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <MotionConfig reducedMotion="user">
              <AppContent />
            </MotionConfig>
          </TooltipProvider>
    </AppProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
