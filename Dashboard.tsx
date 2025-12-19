import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Calendar, FileText, Bell, Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import LeaveCalendar from "@/components/LeaveCalendar";
import { useMemo } from "react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: requests = [] } = trpc.leaveRequests.list.useQuery();
  const { data: notifications = [] } = trpc.notifications.list.useQuery();

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Build calendar data from leave requests
  const calendarData = useMemo(() => {
    const data: Record<string, any> = {};

    requests.forEach((req) => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const isPast = d < new Date();

        if (isPast) {
          data[dateStr] = { status: "past" };
        } else if (req.status === "approved") {
          data[dateStr] = { status: "approved" };
        } else if (req.status === "pending") {
          data[dateStr] = { status: "pending" };
        }
      }
    });

    return data;
  }, [requests]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-gray-600 mt-2">Manage your leave requests and view your balance</p>
          </div>
          <Button onClick={() => setLocation("/staff/apply-leave")} className="gap-2">
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{user?.leaveBalance || 0}</div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{pendingCount}</div>
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{approvedCount}</div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">confirmed</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {unreadNotifications.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Recent Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unreadNotifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="text-sm">
                    <p className="font-medium text-gray-900">{notif.title}</p>
                    <p className="text-gray-600">{notif.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <LeaveCalendar calendarData={calendarData} mode="view" />

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your last 5 leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No leave requests yet</p>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">
                        {new Date(req.startDate).toLocaleDateString()} -{" "}
                        {new Date(req.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{req.daysCount} days</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : req.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => setLocation("/staff/apply-leave")}
              variant="outline"
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Leave Request
            </Button>
            <Button
              onClick={() => setLocation("/staff/my-requests")}
              variant="outline"
              className="justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              View All Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
