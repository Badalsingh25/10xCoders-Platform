import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Bmi from "./components/Courses"; // Renaming might be good later, keeping as is
import Dietplans from "./components/PerRoadmaps";
import Injury from "./components/ResumeEnhancer";
import Exercise from "./components/CareerAgent";
import Nutrition from "./components/ResumeMaker";
import ResumePreview from "./components/ResumePreview";
import AuthPage from "./components/Login";
import InterviewPrep from "./components/Interview";
import TypingTest from "./components/Typing";
import MachineCode from "./components/CodingPractice";
import KanbanBoard from "./components/KanBan";
import PdfTools from "./components/PdfTools";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import AITutor from "./components/AITutor";
import Quiz from "./components/Quiz";
import Community from "./components/Community";
import PostDetails from "./components/PostDetails";
import CodeTranslator from "./components/CodeTranslator";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Layout component to selectively show Navbar
const Layout = ({ children }) => {
  const location = useLocation();
  // Don't show navbar on login page
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <Navbar />}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          {/* Keep /home as alias or explicit home if needed, or redirect /home to / ? User likes /home */}
          <Route path="/home" element={<Home />} />
          <Route path="/courses" element={<Bmi />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/roadmaps" element={<ProtectedRoute><Dietplans /></ProtectedRoute>} />
          <Route path="/enhance" element={<ProtectedRoute><Injury /></ProtectedRoute>} />
          <Route path="/career" element={<ProtectedRoute><Exercise /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
          <Route path="/resume-preview" element={<ProtectedRoute><ResumePreview /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
          <Route path="/type" element={<ProtectedRoute><TypingTest /></ProtectedRoute>} />
          <Route path="/code" element={<ProtectedRoute><MachineCode /></ProtectedRoute>} />
          <Route path="/todo" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/pdf-tools" element={<ProtectedRoute><PdfTools /></ProtectedRoute>} />
          <Route path="/pdf-tools" element={<ProtectedRoute><PdfTools /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/ai-tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/community/post/:id" element={<ProtectedRoute><PostDetails /></ProtectedRoute>} />
          <Route path="/translate" element={<ProtectedRoute><CodeTranslator /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
