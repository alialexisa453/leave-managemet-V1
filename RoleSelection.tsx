import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, Briefcase, BarChart3, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const roles = [
  {
    id: "staff",
    name: "Staff Member",
    description: "Apply for leave and view your requests",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "supervisor",
    name: "Supervisor",
    description: "Manage your team's leave requests",
    icon: Briefcase,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "admin",
    name: "Administrator",
    description: "Manage users, projects, and system settings",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "hr",
    name: "HR Manager",
    description: "View global reports and analytics",
    icon: CheckCircle,
    color: "bg-orange-100 text-orange-600",
  },
];

export default function RoleSelection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const updateUserMutation = trpc.users.update.useMutation();

  const handleRoleSelect = async (roleId: string) => {
    if (!user) return;

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        role: roleId as any,
      });

      toast.success("Role selected successfully!");

      // Redirect to appropriate dashboard
      setTimeout(() => {
        if (roleId === "staff") {
          setLocation("/staff/dashboard");
        } else if (roleId === "supervisor") {
          setLocation("/supervisor/dashboard");
        } else if (roleId === "admin") {
          setLocation("/admin/dashboard");
        } else if (roleId === "hr") {
          setLocation("/hr/dashboard");
        }
      }, 500);
    } catch (error) {
      toast.error("Failed to select role");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome to Leave Management System</h1>
          <p className="text-gray-600 text-lg">
            Please select your role to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="hover:shadow-lg transition-all cursor-pointer hover:border-primary"
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${role.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{role.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleRoleSelect(role.id)}
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Selecting..." : "Select Role"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg border">
          <h3 className="font-semibold mb-3">What's the difference?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>Staff Member:</strong> Apply for leave, view your balance and request history
            </li>
            <li>
              <strong>Supervisor:</strong> Approve/reject team leave requests and manage availability
            </li>
            <li>
              <strong>Administrator:</strong> Manage users, projects, and system-wide settings
            </li>
            <li>
              <strong>HR Manager:</strong> View global reports, analytics, and export data
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
