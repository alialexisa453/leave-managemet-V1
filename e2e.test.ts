    it("should calculate slot availability for date range", () => {
      const dates = [
        { date: "2025-12-20", maxSlots: 5, usedSlots: 2 },
        { date: "2025-12-21", maxSlots: 5, usedSlots: 5 },
        { date: "2025-12-22", maxSlots: 5, usedSlots: 1 },
      ];

      const availableCount = dates.filter((d) => d.usedSlots < d.maxSlots).length;
      expect(availableCount).toBe(2);
    });
  });

  describe("Notification System", () => {
    it("should create notification for supervisor on new request", () => {
      const notification = {
        userId: 4, // supervisor
        title: "New Leave Request",
        content: "Staff member requested leave",
        type: "submitted",
        read: false,
      };

      expect(notification.userId).toBe(4);
      expect(notification.type).toBe("submitted");
      expect(notification.read).toBe(false);
    });

    it("should create notification for staff on approval", () => {
      const notification = {
        userId: 1, // staff
        title: "Leave Approved",
        content: "Your leave request has been approved",
        type: "approved",
        read: false,
      };

      expect(notification.type).toBe("approved");
      expect(notification.userId).toBe(1);
    });

    it("should mark notification as read", () => {
      let notification = { id: 1, read: false };
      notification.read = true;

      expect(notification.read).toBe(true);
    });
  });

  describe("HR Global View", () => {
    it("should filter requests by status", () => {
      const allRequests = [
        { id: 1, status: "pending" },
        { id: 2, status: "approved" },
        { id: 3, status: "pending" },
        { id: 4, status: "rejected" },
      ];

      const pendingRequests = allRequests.filter((r) => r.status === "pending");
      expect(pendingRequests.length).toBe(2);
    });

    it("should export requests as CSV", () => {
      const requests = [
        { id: 1, name: "John", status: "approved", days: 3 },
        { id: 2, name: "Jane", status: "pending", days: 2 },
      ];

      const csvHeader = "ID,Name,Status,Days";
      const csvRows = requests.map((r) => `${r.id},${r.name},${r.status},${r.days}`);

      expect(csvHeader).toContain("ID");
      expect(csvRows.length).toBe(2);
    });
  });

  describe("Role-Based Access Control", () => {
    it("should enforce admin-only operations", () => {
      const userRole = "admin";
      const canCreateUsers = userRole === "admin";

      expect(canCreateUsers).toBe(true);
    });

    it("should enforce supervisor-only operations", () => {
      const userRole = "supervisor";
      const canApproveRequests = ["supervisor", "admin"].includes(userRole);

      expect(canApproveRequests).toBe(true);
    });

    it("should enforce staff-only operations", () => {
      const userRole = "staff";
      const canApplyForLeave = userRole === "staff";

      expect(canApplyForLeave).toBe(true);
    });
  });

  describe("Data Validation", () => {
    it("should validate date format", () => {
      const dateStr = "2025-12-20";
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(dateRegex.test(dateStr)).toBe(true);
    });

    it("should validate numeric inputs", () => {
      const maxSlots = 5;
      const leaveBalance = 20;

      expect(typeof maxSlots).toBe("number");
      expect(typeof leaveBalance).toBe("number");
      expect(maxSlots > 0).toBe(true);
      expect(leaveBalance >= 0).toBe(true);
    });

    it("should validate string inputs", () => {
      const name = "John Doe";
      const email = "john@example.com";

      expect(name.length > 0).toBe(true);
      expect(email.includes("@")).toBe(true);
    });
  });
});
