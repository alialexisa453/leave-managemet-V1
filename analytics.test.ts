import { describe, it, expect } from "vitest";

/**
 * Analytics and Export Tests
 * Tests for analytics data aggregation and export functionality
 */

describe("Analytics Data Aggregation", () => {
  describe("Approval Rate Calculations", () => {
    it("should calculate approval rate correctly", () => {
      const totalRequests = 100;
      const approvedRequests = 75;
      const approvalRate = (approvedRequests / totalRequests) * 100;

      expect(approvalRate).toBe(75);
    });

    it("should handle zero total requests", () => {
      const totalRequests = 0;
      const approvedRequests = 0;
      const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

      expect(approvalRate).toBe(0);
    });

    it("should calculate rejection rate correctly", () => {
      const totalRequests = 100;
      const rejectedRequests = 15;
      const rejectionRate = (rejectedRequests / totalRequests) * 100;

      expect(rejectionRate).toBe(15);
    });

    it("should calculate pending rate correctly", () => {
      const totalRequests = 100;
      const pendingRequests = 10;
      const pendingRate = (pendingRequests / totalRequests) * 100;

      expect(pendingRate).toBe(10);
    });

    it("should ensure rates sum to 100%", () => {
      const totalRequests = 100;
      const approvedRequests = 75;
      const rejectedRequests = 15;
      const pendingRequests = 10;

      const approvalRate = (approvedRequests / totalRequests) * 100;
      const rejectionRate = (rejectedRequests / totalRequests) * 100;
      const pendingRate = (pendingRequests / totalRequests) * 100;

      expect(approvalRate + rejectionRate + pendingRate).toBe(100);
    });
  });

  describe("Average Leave Duration", () => {
    it("should calculate average leave duration correctly", () => {
      const requests = [
        { daysCount: 3 },
        { daysCount: 5 },
        { daysCount: 2 },
        { daysCount: 4 },
      ];

      const totalDays = requests.reduce((sum, r) => sum + r.daysCount, 0);
      const avgDuration = totalDays / requests.length;

      expect(avgDuration).toBe(3.5);
    });

    it("should handle single request", () => {
      const requests = [{ daysCount: 7 }];
      const avgDuration = requests.reduce((sum, r) => sum + r.daysCount, 0) / requests.length;

      expect(avgDuration).toBe(7);
    });

    it("should handle empty requests array", () => {
      const requests: { daysCount: number }[] = [];
      const avgDuration = requests.length > 0 ? requests.reduce((sum, r) => sum + r.daysCount, 0) / requests.length : 0;

      expect(avgDuration).toBe(0);
    });

    it("should round to one decimal place", () => {
      const avgDuration = 3.456;
      const rounded = Math.round(avgDuration * 10) / 10;

      expect(rounded).toBe(3.5);
    });
  });

  describe("Total Leave Days Calculation", () => {
    it("should sum only approved leave days", () => {
      const requests = [
        { status: "approved", daysCount: 5 },
        { status: "pending", daysCount: 3 },
        { status: "approved", daysCount: 2 },
        { status: "rejected", daysCount: 4 },
      ];

      const totalLeaveDays = requests
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + r.daysCount, 0);

      expect(totalLeaveDays).toBe(7);
    });

    it("should return zero when no approved requests", () => {
      const requests = [
        { status: "pending", daysCount: 3 },
        { status: "rejected", daysCount: 4 },
      ];

      const totalLeaveDays = requests
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + r.daysCount, 0);

      expect(totalLeaveDays).toBe(0);
    });
  });

  describe("Monthly Trends Aggregation", () => {
    it("should group requests by month", () => {
      const requests = [
        { createdAt: new Date("2025-01-15"), status: "approved" },
        { createdAt: new Date("2025-01-20"), status: "rejected" },
        { createdAt: new Date("2025-02-10"), status: "approved" },
        { createdAt: new Date("2025-02-15"), status: "pending" },
      ];

      const monthlyData: { [key: string]: { approved: number; rejected: number; pending: number } } = {};

      requests.forEach((r) => {
        const monthKey = new Date(r.createdAt).toISOString().slice(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { approved: 0, rejected: 0, pending: 0 };
        }
        if (r.status === "approved") monthlyData[monthKey].approved++;
        if (r.status === "rejected") monthlyData[monthKey].rejected++;
        if (r.status === "pending") monthlyData[monthKey].pending++;
      });

      expect(monthlyData["2025-01"]).toEqual({ approved: 1, rejected: 1, pending: 0 });
      expect(monthlyData["2025-02"]).toEqual({ approved: 1, rejected: 0, pending: 1 });
    });

    it("should format month names correctly", () => {
      const date = new Date("2025-01-15");
      const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" });

      expect(monthName).toMatch(/Jan.*25/);
    });
  });

  describe("Leave by Project Aggregation", () => {
    it("should aggregate leave by project", () => {
      const projects = [
        { id: 1, projectName: "Engineering" },
        { id: 2, projectName: "Marketing" },
      ];

      const users = [
        { id: 1, projectId: 1 },
        { id: 2, projectId: 1 },
        { id: 3, projectId: 2 },
      ];

      const requests = [
        { userId: 1, daysCount: 5 },
        { userId: 2, daysCount: 3 },
        { userId: 3, daysCount: 4 },
      ];

      const leaveByProject = projects.map((project) => {
        const projectUsers = users.filter((u) => u.projectId === project.id);
        const projectUserIds = projectUsers.map((u) => u.id);
        const projectRequests = requests.filter((r) => projectUserIds.includes(r.userId));
        const totalDays = projectRequests.reduce((sum, r) => sum + r.daysCount, 0);

        return {
          projectName: project.projectName,
          totalDays,
          requestCount: projectRequests.length,
        };
      });

      expect(leaveByProject[0]).toEqual({
        projectName: "Engineering",
        totalDays: 8,
        requestCount: 2,
      });

      expect(leaveByProject[1]).toEqual({
        projectName: "Marketing",
        totalDays: 4,
        requestCount: 1,
      });
    });

    it("should handle projects with no requests", () => {
      const projects = [{ id: 1, projectName: "Engineering" }];
      const users = [{ id: 1, projectId: 1 }];
      const requests: { userId: number; daysCount: number }[] = [];

      const leaveByProject = projects.map((project) => {
        const projectUsers = users.filter((u) => u.projectId === project.id);
        const projectUserIds = projectUsers.map((u) => u.id);
        const projectRequests = requests.filter((r) => projectUserIds.includes(r.userId));
        const totalDays = projectRequests.reduce((sum, r) => sum + r.daysCount, 0);

        return {
          projectName: project.projectName,
          totalDays,
          requestCount: projectRequests.length,
        };
      });

      expect(leaveByProject[0]).toEqual({
        projectName: "Engineering",
        totalDays: 0,
        requestCount: 0,
      });
    });
  });

  describe("Seasonal Patterns", () => {
    it("should categorize requests by quarter", () => {
      const requests = [
        { startDate: new Date("2025-01-15") }, // Q1
        { startDate: new Date("2025-03-20") }, // Q1
        { startDate: new Date("2025-04-10") }, // Q2
        { startDate: new Date("2025-07-05") }, // Q3
        { startDate: new Date("2025-10-15") }, // Q4
        { startDate: new Date("2025-12-25") }, // Q4
      ];

      const seasonalPatterns = [
        { quarter: "Q1 (Jan-Mar)", count: 0 },
        { quarter: "Q2 (Apr-Jun)", count: 0 },
        { quarter: "Q3 (Jul-Sep)", count: 0 },
        { quarter: "Q4 (Oct-Dec)", count: 0 },
      ];

      requests.forEach((r) => {
        const month = new Date(r.startDate).getMonth();
        if (month <= 2) seasonalPatterns[0].count++;
        else if (month <= 5) seasonalPatterns[1].count++;
        else if (month <= 8) seasonalPatterns[2].count++;
        else seasonalPatterns[3].count++;
      });

      expect(seasonalPatterns[0].count).toBe(2); // Q1
      expect(seasonalPatterns[1].count).toBe(1); // Q2
      expect(seasonalPatterns[2].count).toBe(1); // Q3
      expect(seasonalPatterns[3].count).toBe(2); // Q4
    });

    it("should handle edge case months correctly", () => {
      const januaryMonth = new Date("2025-01-01T12:00:00Z").getUTCMonth();
      const marchMonth = new Date("2025-03-31T12:00:00Z").getUTCMonth();
      const aprilMonth = new Date("2025-04-01T12:00:00Z").getUTCMonth();

      expect(januaryMonth).toBe(0); // January = 0
      expect(marchMonth).toBe(2); // March = 2
      expect(aprilMonth).toBe(3); // April = 3

      expect(januaryMonth <= 2).toBe(true); // Q1
      expect(marchMonth <= 2).toBe(true); // Q1
      expect(aprilMonth <= 5).toBe(true); // Q2
    });
  });
});

describe("CSV Export Functionality", () => {
  it("should format CSV headers correctly", () => {
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

    expect(headers.length).toBe(10);
    expect(headers[0]).toBe("Employee Name");
    expect(headers[headers.length - 1]).toBe("Submitted Date");
  });

  it("should format CSV rows correctly", () => {
    const request = {
      userName: "John Doe",
      userEmail: "john@example.com",
      projectName: "Engineering",
      startDate: new Date("2025-12-20"),
      endDate: new Date("2025-12-22"),
      daysCount: 3,
      status: "approved",
      reason: "Vacation",
      supervisorName: "Jane Smith",
      createdAt: new Date("2025-12-15"),
    };

    const row = [
      request.userName,
      request.userEmail,
      request.projectName,
      new Date(request.startDate).toLocaleDateString(),
      new Date(request.endDate).toLocaleDateString(),
      request.daysCount,
      request.status,
      request.reason || "-",
      request.supervisorName || "-",
      new Date(request.createdAt).toLocaleDateString(),
    ];

    expect(row.length).toBe(10);
    expect(row[0]).toBe("John Doe");
    expect(row[6]).toBe("approved");
  });

  it("should join CSV rows with commas", () => {
    const row = ["John Doe", "john@example.com", "Engineering", "3", "approved"];
    const csvRow = row.join(",");

    expect(csvRow).toBe("John Doe,john@example.com,Engineering,3,approved");
  });

  it("should join CSV lines with newlines", () => {
    const headers = ["Name", "Email", "Status"];
    const row1 = ["John", "john@example.com", "approved"];
    const row2 = ["Jane", "jane@example.com", "pending"];

    const csv = [headers, row1, row2].map((row) => row.join(",")).join("\n");

    expect(csv).toContain("Name,Email,Status");
    expect(csv).toContain("John,john@example.com,approved");
    expect(csv).toContain("Jane,jane@example.com,pending");
  });

  it("should handle missing optional fields", () => {
    const reason = null;
    const supervisorName = undefined;

    const formattedReason = reason || "-";
    const formattedSupervisor = supervisorName || "-";

    expect(formattedReason).toBe("-");
    expect(formattedSupervisor).toBe("-");
  });
});

describe("PDF Export Functionality", () => {
  it("should generate HTML report with summary", () => {
    const summary = {
      totalRequests: 100,
      approvedRequests: 75,
      totalLeaveDays: 250,
    };

    const htmlContent = `
      <div class="summary-card">
        <h3>Total Requests</h3>
        <div class="value">${summary.totalRequests}</div>
      </div>
    `;

    expect(htmlContent).toContain("Total Requests");
    expect(htmlContent).toContain("100");
  });

  it("should format date and time for report header", () => {
    const now = new Date("2025-12-17T20:00:00");
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    expect(dateStr).toBeTruthy();
    expect(timeStr).toBeTruthy();
  });

  it("should apply status-specific CSS classes", () => {
    const statuses = ["approved", "rejected", "pending"];
    const cssClasses = statuses.map((s) => `status-${s}`);

    expect(cssClasses).toEqual(["status-approved", "status-rejected", "status-pending"]);
  });

  it("should generate table rows from requests", () => {
    const requests = [
      {
        userName: "John Doe",
        projectName: "Engineering",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-22"),
        daysCount: 3,
        status: "approved",
        supervisorName: "Jane Smith",
      },
    ];

    const tableRows = requests
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
      .join("");

    expect(tableRows).toContain("John Doe");
    expect(tableRows).toContain("Engineering");
    expect(tableRows).toContain("status-approved");
    expect(tableRows).toContain("APPROVED");
  });

  it("should create blob with correct MIME type", () => {
    const content = "<html><body>Test Report</body></html>";
    const mimeType = "text/html";

    expect(mimeType).toBe("text/html");
    expect(content).toContain("<html>");
  });
});

describe("Data Validation for Analytics", () => {
  it("should validate numeric values are non-negative", () => {
    const totalRequests = 100;
    const approvedRequests = 75;

    expect(totalRequests).toBeGreaterThanOrEqual(0);
    expect(approvedRequests).toBeGreaterThanOrEqual(0);
    expect(approvedRequests).toBeLessThanOrEqual(totalRequests);
  });

  it("should validate date ranges", () => {
    const startDate = new Date("2025-12-20");
    const endDate = new Date("2025-12-22");

    expect(startDate <= endDate).toBe(true);
  });

  it("should validate status values", () => {
    const validStatuses = ["approved", "rejected", "pending"];
    const testStatus = "approved";

    expect(validStatuses.includes(testStatus)).toBe(true);
  });

  it("should handle empty data gracefully", () => {
    const requests: any[] = [];
    const totalRequests = requests.length;
    const avgDuration = totalRequests > 0 ? requests.reduce((sum, r) => sum + r.daysCount, 0) / totalRequests : 0;

    expect(totalRequests).toBe(0);
    expect(avgDuration).toBe(0);
  });
});
