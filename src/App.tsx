import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import GradingDemo from "./pages/GradingDemo";
import ArchitecturePage from "./pages/ArchitecturePage";
import MetricsPage from "./pages/MetricsPage";
import UsersPage from "./pages/UsersPage";
import ExamsPage from "./pages/ExamsPage";
import QuestionBankPage from "./pages/QuestionBankPage";
import FraudDetectionPage from "./pages/FraudDetectionPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/grading-demo" element={<GradingDemo />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/fraud-detection" element={<FraudDetectionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
