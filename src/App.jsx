import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import Home from "./pages/Home";
import Directory from "./pages/Directory";
import ServiceDetail from "./pages/ServiceDetail";
import CreateListing from "./pages/CreateListing";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotUsername from "./pages/ForgotUsername";
import VerifyEmail from "./pages/VerifyEmail";
import CompleteProfile from "./pages/CompleteProfile";
import Landing from "./pages/Landing";
import Messages from "./pages/Messages";
import ChatList from "./pages/ChatList";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="forgot-username" element={<ForgotUsername />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="complete-profile" element={<CompleteProfile />} />

            {/* Protected Routes */}
            <Route
              path="dashboard"
              element={
                <AuthGuard>
                  <Home />
                </AuthGuard>
              }
            />
            <Route
              path="directory"
              element={
                <AuthGuard>
                  <Directory />
                </AuthGuard>
              }
            />
            <Route
              path="service/:id"
              element={
                <AuthGuard>
                  <ServiceDetail />
                </AuthGuard>
              }
            />
            <Route
              path="create-listing"
              element={
                <AuthGuard>
                  <CreateListing />
                </AuthGuard>
              }
            />
            <Route
              path="profile/:uid?"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="messages/:uid"
              element={
                <AuthGuard>
                  <Messages />
                </AuthGuard>
              }
            />
            <Route
              path="messages"
              element={
                <AuthGuard>
                  <ChatList />
                </AuthGuard>
              }
            />
            <Route
              path="admin"
              element={
                <AuthGuard>
                  <Admin />
                </AuthGuard>
              }
            />
          </Route>
        </Routes>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
