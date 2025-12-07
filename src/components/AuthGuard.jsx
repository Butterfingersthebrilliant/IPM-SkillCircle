import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children }) {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        // Since we handle login via modal/popup on any page, we might just redirect to home or show alert.
        // For now, redirect to home.
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (currentUser.is_blacklisted) {
        return <Navigate to="/blacklisted" replace />;
    }

    return children;
}
