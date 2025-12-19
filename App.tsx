import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Auth pages
import Login from "./pages/Login";
import RoleSelection from "./pages/RoleSelection";
import Auth from "./pages/Auth";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageSlots from "./pages/admin/ManageSlots";
import ManageProjects from "./pages/admin/ManageProjects";
import ManageLeaveTypes from "./pages/admin/ManageLeaveTypes";
import BulkImport from "./pages/admin/BulkImport";
import AdminReports from "./pages/admin/Reports";

// Supervisor pages
import SupervisorDashboard from "./pages/supervisor/Dashboard";
import TeamRequests from "./pages/supervisor/TeamRequests";
import Approvals from "./pages/supervisor/Approvals";

// Staff pages
import StaffDashboard from "./pages/staff/Dashboard";
import ApplyLeave from "./pages/staff/ApplyLeave";
import MyRequests from "./pages/staff/MyRequests";

// HR pages
import HRDashboard from "./pages/hr/Dashboard";
import GlobalRequests from "./pages/hr/GlobalRequests";
import HRReports from "./pages/hr/Reports";

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType<any>;
  allowedRoles: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Auth} />
        <Route path="/auth" component={Auth} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Show role selection if user doesn't have a role assigned
  if (!user.role) {
    return (
      <Switch>
        <Route path="/" component={RoleSelection} />
        <Route path="/role-selection" component={RoleSelection} />
        <Route component={RoleSelection} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Role Selection Route */}
      <Route path="/role-selection" component={RoleSelection} />

      {/* Admin Routes */}
      {user.role === "admin" && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/manage-users" component={ManageUsers} />
          <Route path="/admin/manage-projects" component={ManageProjects} />
          <Route path="/admin/manage-slots" component={ManageSlots} />
          <Route path="/admin/manage-leave-types" component={ManageLeaveTypes} />
          <Route path="/admin/bulk-import" component={BulkImport} />
          <Route path="/admin/reports" component={AdminReports} />
          <Route path="/hr/reports" component={HRReports} />
        </>
      )}

      {/* Supervisor Routes */}
      {user.role === "supervisor" && (
        <>
          <Route path="/" component={SupervisorDashboard} />
          <Route path="/supervisor/dashboard" component={SupervisorDashboard} />
          <Route path="/supervisor/team-requests" component={TeamRequests} />
          <Route path="/supervisor/approvals" component={Approvals} />
        </>
      )}

      {/* Staff Routes */}
      {user.role === "staff" && (
        <>
          <Route path="/" component={StaffDashboard} />
          <Route path="/staff/dashboard" component={StaffDashboard} />
          <Route path="/staff/apply-leave" component={ApplyLeave} />
          <Route path="/staff/my-requests" component={MyRequests} />
        </>
      )}

      {/* HR Routes */}
      {user.role === "hr" && (
        <>
          <Route path="/" component={HRDashboard} />
          <Route path="/hr/dashboard" component={HRDashboard} />
          <Route path="/hr/global-requests" component={GlobalRequests} />
          <Route path="/hr/reports" component={HRReports} />
        </>
      )}

      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
