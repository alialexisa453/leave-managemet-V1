import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getAllUsers: vi.fn(),
  getUserById: vi.fn(),
  getUsersByProjectId: vi.fn(),
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
  createProject: vi.fn(),
  getProjectById: vi.fn(),
  getAllProjects: vi.fn(),
  updateProject: vi.fn(),
  createLeaveRequest: vi.fn(),
  getLeaveRequestById: vi.fn(),
  getLeaveRequestsByUserId: vi.fn(),
  getLeaveRequestsByProjectId: vi.fn(),
  getLeaveRequestsByStatus: vi.fn(),
  updateLeaveRequest: vi.fn(),
  getOrCreateLeaveSlot: vi.fn(),
  getLeaveSlotsByProjectAndDateRange: vi.fn(),
  updateLeaveSlot: vi.fn(),
  setLeaveSlotMaxSlots: vi.fn(),
  createNotification: vi.fn(),
  getNotificationsByUserId: vi.fn(),
  markNotificationAsRead: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createStaffContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "staff-user",
      companyId: "EMP001",
      email: "staff@example.com",
      name: "Staff User",
      loginMethod: "manus",
      role: "staff",
      projectId: 1,
      leaveBalance: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: null,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createSupervisorContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 2,
      openId: "supervisor-user",
      companyId: "SUP001",
      email: "supervisor@example.com",
      name: "Supervisor User",
      loginMethod: "manus",
      role: "supervisor",
      projectId: 1,
      leaveBalance: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: null,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createAdminContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: 3,
      openId: "admin-user",
      companyId: "ADM001",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      projectId: 1,
      leaveBalance: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: null,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Leave Management System - Routers", () => {
  describe("Users Router", () => {
    it("should list all users as admin", async () => {
      const { ctx } = createAdminContext();
      const mockUsers = [
        {
          id: 1,
          openId: "user1",
          companyId: "EMP001",
          name: "User 1",
          email: "user1@example.com",
          role: "staff" as const,
          projectId: 1,
          leaveBalance: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
          loginMethod: "manus",
          passwordHash: null,
        },
      ];

      vi.mocked(db.getAllUsers).mockResolvedValue(mockUsers);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.users.list();

      expect(result).toEqual(mockUsers);
      expect(db.getAllUsers).toHaveBeenCalled();
    });

    it("should not allow staff to list users", async () => {
      const { ctx } = createStaffContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.users.list();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should create a new user as admin", async () => {
      const { ctx } = createAdminContext();
      vi.mocked(db.upsertUser).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(ctx);
      await caller.users.create({
        name: "New User",
        companyId: "EMP002",
        email: "newuser@example.com",
        role: "staff",
        projectId: 1,
        leaveBalance: 20,
      });

      expect(db.upsertUser).toHaveBeenCalled();
    });
  });

  describe("Leave Requests Router", () => {
    it("should create a leave request for staff", async () => {
      const { ctx } = createStaffContext();
      const mockRequest = {
        id: 1,
        userId: 1,
        supervisorId: null,
        status: "pending" as const,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-01-17"),
        daysCount: 3,
        reason: "Vacation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createLeaveRequest).mockResolvedValue({ insertId: 1 } as any);
      vi.mocked(db.getUsersByProjectId).mockResolvedValue([]);
      vi.mocked(db.createNotification).mockResolvedValue({ insertId: 1 } as any);

      const caller = appRouter.createCaller(ctx);
      await caller.leaveRequests.create({
        startDate: "2025-01-15",
        endDate: "2025-01-17",
        reason: "Vacation",
      });

      expect(db.createLeaveRequest).toHaveBeenCalled();
    });

    it("should reject leave request if insufficient balance", async () => {
      const { ctx } = createStaffContext();
      ctx.user!.leaveBalance = 2; // Only 2 days left

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.leaveRequests.create({
          startDate: "2025-01-15",
          endDate: "2025-01-17", // 3 days
          reason: "Vacation",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("Insufficient leave balance");
      }
    });

    it("should approve leave request as supervisor", async () => {
      const { ctx } = createSupervisorContext();
      const mockRequest = {
        id: 1,
        userId: 1,
        supervisorId: null,
        status: "pending" as const,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-01-17"),
        daysCount: 3,
        reason: "Vacation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser = {
        id: 1,
        openId: "staff-user",
        companyId: "EMP001",
        name: "Staff User",
        email: "staff@example.com",
        role: "staff" as const,
        projectId: 1,
        leaveBalance: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "manus",
        passwordHash: null,
      };

      vi.mocked(db.getLeaveRequestById).mockResolvedValue(mockRequest as any);
      vi.mocked(db.getUserById).mockResolvedValue(mockUser);
      vi.mocked(db.updateLeaveRequest).mockResolvedValue(undefined);
      vi.mocked(db.getOrCreateLeaveSlot).mockResolvedValue({
        id: 1,
        projectId: 1,
        date: new Date("2025-01-15"),
        maxSlots: 1,
        usedSlots: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.updateLeaveSlot).mockResolvedValue(undefined);
      vi.mocked(db.updateUser).mockResolvedValue(undefined);
      vi.mocked(db.createNotification).mockResolvedValue({ insertId: 1 } as any);

      const caller = appRouter.createCaller(ctx);
      await caller.leaveRequests.approve({
        id: 1,
      });

      expect(db.updateLeaveRequest).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: "approved",
          supervisorId: ctx.user!.id,
        })
      );
    });

    it("should reject leave request as supervisor", async () => {
      const { ctx } = createSupervisorContext();
      const mockRequest = {
        id: 1,
        userId: 1,
        supervisorId: null,
        status: "pending" as const,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-01-17"),
        daysCount: 3,
        reason: "Vacation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getLeaveRequestById).mockResolvedValue(mockRequest as any);
      vi.mocked(db.updateLeaveRequest).mockResolvedValue(undefined);
      vi.mocked(db.createNotification).mockResolvedValue({ insertId: 1 } as any);

      const caller = appRouter.createCaller(ctx);
      await caller.leaveRequests.reject({
        id: 1,
      });

      expect(db.updateLeaveRequest).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: "rejected",
          supervisorId: ctx.user!.id,
        })
      );
    });
  });

  describe("Notifications Router", () => {
    it("should list notifications for user", async () => {
      const { ctx } = createStaffContext();
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          title: "Leave Approved",
          content: "Your leave has been approved",
          type: "approved" as const,
          relatedRequestId: 1,
          isRead: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getNotificationsByUserId).mockResolvedValue(mockNotifications as any);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.list();

      expect(result).toEqual(mockNotifications);
      expect(db.getNotificationsByUserId).toHaveBeenCalledWith(ctx.user!.id);
    });

    it("should mark notification as read", async () => {
      const { ctx } = createStaffContext();
      vi.mocked(db.markNotificationAsRead).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.markAsRead({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.markNotificationAsRead).toHaveBeenCalledWith(1);
    });
  });

  describe("Leave Slots Router", () => {
    it("should set max slots as admin", async () => {
      const { ctx } = createAdminContext();
      vi.mocked(db.setLeaveSlotMaxSlots).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.leaveSlots.setMaxSlots({
        projectId: 1,
        date: "2025-01-15",
        maxSlots: 2,
      });

      expect(result).toEqual({ success: true });
      expect(db.setLeaveSlotMaxSlots).toHaveBeenCalledWith(1, "2025-01-15", 2);
    });

    it("should not allow staff to set max slots", async () => {
      const { ctx } = createStaffContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.leaveSlots.setMaxSlots({
          projectId: 1,
          date: "2025-01-15",
          maxSlots: 2,
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});
