import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Download, FileText, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const COLORS = {
  approved: "#10b981",
  rejected: "#ef4444",
  pending: "#f59e0b",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
};

export default function HRReports() {
  const { data: analyticsData } = trpc.analytics.getData.useQuery();
  const { data: detailedRequests = [] } = trpc.analytics.getLeaveRequestsWithDetails.useQuery();

  const handleExportCSV = () => {
    const headers = [
      "Employee Name",
      "Email",
      "Project",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
      "Supervisor",
      "Submitted Date",
    ];
    const rows = detailedRequests.map((req) => [
      req.userName,
      req.userEmail,
      req.projectName,
      new Date(req.startDate).toLocaleDateString(),
      new Date(req.endDate).toLocaleDateString(),
      req.daysCount,
      req.status,
      req.reason || "-",
      req.supervisorName || "-",
      new Date(req.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success("CSV report exported successfully");
  };

  const handleExportPDF = () => {
    // Create a simple PDF-like HTML report
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Leave Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
          .summary-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
          .summary-card h3 { color: #6b7280; font-size: 14px; margin: 0 0 10px 0; }
          .summary-card .value { font-size: 32px; font-weight: bold; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: 600; }
          .status-approved { color: #10b981; font-weight: 600; }
          .status-rejected { color: #ef4444; font-weight: 600; }
          .status-pending { color: #f59e0b; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Leave Management Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total Requests</h3>
            <div class="value">${analyticsData?.summary.totalRequests || 0}</div>
          </div>
          <div class="summary-card">
            <h3>Approved Requests</h3>
            <div class="value" style="color: #10b981;">${analyticsData?.summary.approvedRequests || 0}</div>
          </div>
          <div class="summary-card">
            <h3>Total Leave Days</h3>
            <div class="value">${analyticsData?.summary.totalLeaveDays || 0}</div>
          </div>
        </div>

        <h2>Leave Requests Details</h2>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Project</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
              <th>Supervisor</th>
            </tr>
          </thead>
          <tbody>
            ${detailedRequests
              .map(
                (req) => `
              <tr>
                <td>${req.userName}</td>
                <td>${req.projectName}</td>
                <td>${new Date(req.startDate).toLocaleDateString()}</td>
                <td>${new Date(req.endDate).toLocaleDateString()}</td>
                <td>${req.daysCount}</td>
                <td class="status-${req.status}">${req.status.toUpperCase()}</td>
                <td>${req.supervisorName || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Leave Management System - Confidential Report</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-report-${new Date().toISOString().split("T")[0]}.html`;
    a.click();

    toast.success("PDF report exported successfully (HTML format)");
  };

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare pie chart data
  const pieChartData = [
    { name: "Approved", value: analyticsData.summary.approvedRequests, color: COLORS.approved },
    { name: "Rejected", value: analyticsData.summary.rejectedRequests, color: COLORS.rejected },
    { name: "Pending", value: analyticsData.summary.pendingRequests, color: COLORS.pending },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>
            <p className="text-gray-600 mt-2">Comprehensive leave analytics and export options</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData.summary.totalRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analyticsData.summary.approvalRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Days Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData.summary.totalLeaveDays}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Leave Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData.summary.avgLeaveDuration} days</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Approval Rate Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Approval Rate Breakdown
              </CardTitle>
              <CardDescription>Distribution of leave request statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Seasonal Patterns
              </CardTitle>
              <CardDescription>Leave requests by quarter</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.seasonalPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Leave Trends
            </CardTitle>
            <CardDescription>Leave requests over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="approved" stroke={COLORS.approved} strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="rejected" stroke={COLORS.rejected} strokeWidth={2} name="Rejected" />
                <Line type="monotone" dataKey="pending" stroke={COLORS.pending} strokeWidth={2} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row 3: Leave by Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Leave Days by Project
            </CardTitle>
            <CardDescription>Total leave days taken per project</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.leaveByProject}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="projectName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalDays" fill={COLORS.secondary} name="Total Days" />
                <Bar dataKey="requestCount" fill={COLORS.primary} name="Request Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
            <CardDescription>Detailed breakdown of leave metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Total Requests</span>
                  <span className="text-lg font-bold">{analyticsData.summary.totalRequests}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Approved Requests</span>
                  <span className="text-lg font-bold text-green-600">{analyticsData.summary.approvedRequests}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Rejected Requests</span>
                  <span className="text-lg font-bold text-red-600">{analyticsData.summary.rejectedRequests}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Pending Requests</span>
                  <span className="text-lg font-bold text-yellow-600">{analyticsData.summary.pendingRequests}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Approval Rate</span>
                  <span className="text-lg font-bold text-green-600">{analyticsData.summary.approvalRate}%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Rejection Rate</span>
                  <span className="text-lg font-bold text-red-600">{analyticsData.summary.rejectionRate}%</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium">Average Leave Duration</span>
                  <span className="text-lg font-bold">{analyticsData.summary.avgLeaveDuration} days</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium">Total Leave Days Used</span>
                  <span className="text-lg font-bold">{analyticsData.summary.totalLeaveDays} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
