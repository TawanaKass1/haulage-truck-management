import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Layout } from "./components/Layout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { WelcomePage } from "./components/Auth/WelcomePage.jsx";
import { RoleSelect } from "./components/Auth/RoleSelect.jsx";
import { AdminLogin } from "./components/Auth/AdminLogin.jsx";
import { DriverLogin } from "./components/Auth/DriverLogin.jsx";
import { DriverRegister } from "./components/Auth/DriverRegister.jsx";
import { OTPVerification } from "./components/Auth/OTPVerification.jsx";
import { TruckManagement } from "./pages/TruckManagement.jsx";
import { DriverManagement } from "./pages/DriverManagement.jsx";
import { JobManagement } from "./pages/JobManagement.jsx";
import { AssignmentPage } from "./pages/AssignmentPage.jsx";

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/role-select" element={<RoleSelect />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/driver-login" element={<DriverLogin />} />
            <Route path="/driver-register" element={<DriverRegister />} />
            <Route path="/verify-otp" element={<OTPVerification />} />

            {/* Protected Admin Routes - Using Layout as wrapper */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
                <Route path="trucks" element={<TruckManagement />} />
                <Route path="drivers" element={<DriverManagement />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="assignments" element={<AssignmentPage />} />
            </Route>

            {/* Protected Driver Routes */}
            <Route
                path="/driver"
                element={
                    <ProtectedRoute requiredRole="driver">
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;