import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Contribute from "./pages/Contribute";
import Clubs from "./pages/Clubs";
import Leaderboard from "./pages/Leaderboard";
import SignIn from "./pages/SignIn";
import GetStarted from "./pages/GetStarted";
import AnswerQuestion from "./pages/AnswerQuestion";
import QuestionsPage from "./pages/QuestionsPage";
import QuestionDetailPage from "./pages/QuestionDetailPage";
import AskQuestionPage from "./pages/AskQuestionPage";
import Guidelines from "./pages/Guidelines";
import ReportIssue from "./pages/ReportIssue";
import AdminDashboard from "./pages/AdminDashboard";
import Goodies from "./pages/Goodies";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/answer" element={<AnswerQuestion />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/questions/new" element={<AskQuestionPage />} />
            <Route path="/questions/:id" element={<QuestionDetailPage />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/report-issue" element={<ReportIssue />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/goodies" element={<Goodies />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider >
  </QueryClientProvider >
);

export default App;
