import { eq, and, gte, lte, between, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  projects,
  leaveRequests,
  leaveSlots,
  notifications,
  InsertLeaveRequest,
  InsertLeaveSlot,
  InsertNotification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId || !user.companyId) {
    throw new Error("User openId and companyId are required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      companyId: user.companyId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

export async function getUsersByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users).where(eq(users.projectId, projectId));
}

export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  await db.update(users).set(updates).where(eq(users.id, id));
}

// Projects
export async function createProject(project: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create project: database not available");
    return undefined;
  }

  const result = await db.insert(projects).values(project);
  return result;
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get project: database not available");
    return undefined;
  }

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get projects: database not available");
    return [];
  }

  return await db.select().from(projects);
}

export async function updateProject(id: number, updates: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update project: database not available");
    return;
  }

  await db.update(projects).set(updates).where(eq(projects.id, id));
}

// Leave Requests
export async function createLeaveRequest(request: InsertLeaveRequest) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create leave request: database not available");
    return undefined;
  }

  const result = await db.insert(leaveRequests).values(request);
  return result;
}

export async function getLeaveRequestById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave request: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLeaveRequestsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave requests: database not available");
    return [];
  }

  return await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId));
}

export async function getLeaveRequestsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave requests: database not available");
    return [];
  }

  const projectUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.projectId, projectId));

  if (projectUsers.length === 0) return [];

  const userIds = projectUsers.map((u) => u.id);
  return await db
    .select()
    .from(leaveRequests)
    .where(inArray(leaveRequests.userId, userIds));
}

export async function getLeaveRequestsByStatus(status: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave requests: database not available");
    return [];
  }

  return await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.status, status as any));
}

export async function updateLeaveRequest(id: number, updates: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update leave request: database not available");
    return;
  }

  await db.update(leaveRequests).set(updates).where(eq(leaveRequests.id, id));
}

// Leave Slots
export async function getOrCreateLeaveSlot(projectId: number, date: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave slot: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(leaveSlots)
    .where(and(eq(leaveSlots.projectId, projectId), eq(leaveSlots.date, date as any)))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Create default slot with max 1 slot per day
  const newSlot = await db.insert(leaveSlots).values({
    projectId,
    date: date as any,
    maxSlots: 1,
    usedSlots: 0,
  });

  return await db
    .select()
    .from(leaveSlots)
    .where(and(eq(leaveSlots.projectId, projectId), eq(leaveSlots.date, date as any)))
    .limit(1)
    .then((r) => (r.length > 0 ? r[0] : undefined));
}

export async function getLeaveSlotsByProjectAndDateRange(
  projectId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave slots: database not available");
    return [];
  }

  return await db
    .select()
    .from(leaveSlots)
    .where(
      and(
        eq(leaveSlots.projectId, projectId),
        between(leaveSlots.date, startDate as any, endDate as any)
      )
    );
}

export async function updateLeaveSlot(id: number, updates: any) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update leave slot: database not available");
    return;
  }

  await db.update(leaveSlots).set(updates).where(eq(leaveSlots.id, id));
}

export async function setLeaveSlotMaxSlots(projectId: number, date: string, maxSlots: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update leave slot: database not available");
    return;
  }

  const slot = await getOrCreateLeaveSlot(projectId, date);
  if (slot) {
    await db
      .update(leaveSlots)
      .set({ maxSlots })
      .where(eq(leaveSlots.id, slot.id));
  }
}

// Notifications
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return undefined;
  }

  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notifications: database not available");
    return [];
  }

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update notification: database not available");
    return;
  }

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}


// Analytics Functions
export async function getAnalyticsData() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get analytics: database not available");
    return null;
  }

  // Get all leave requests
  const allRequests = await db.select().from(leaveRequests);

  // Get all projects
  const allProjects = await db.select().from(projects);

  // Get all users
  const allUsers = await db.select().from(users);

  // Calculate approval rates
  const totalRequests = allRequests.length;
  const approvedRequests = allRequests.filter((r) => r.status === "approved").length;
  const rejectedRequests = allRequests.filter((r) => r.status === "rejected").length;
  const pendingRequests = allRequests.filter((r) => r.status === "pending").length;

  const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
  const rejectionRate = totalRequests > 0 ? (rejectedRequests / totalRequests) * 100 : 0;
  const pendingRate = totalRequests > 0 ? (pendingRequests / totalRequests) * 100 : 0;

  // Calculate monthly trends (last 12 months)
  const monthlyTrends: { month: string; approved: number; rejected: number; pending: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM format
    const monthName = monthDate.toLocaleString("default", { month: "short", year: "2-digit" });

    const monthRequests = allRequests.filter((r) => {
      const reqDate = new Date(r.createdAt);
      return reqDate.toISOString().slice(0, 7) === monthStr;
    });

    monthlyTrends.push({
      month: monthName,
      approved: monthRequests.filter((r) => r.status === "approved").length,
      rejected: monthRequests.filter((r) => r.status === "rejected").length,
      pending: monthRequests.filter((r) => r.status === "pending").length,
    });
  }

  // Calculate leave by project
  const leaveByProject: { projectName: string; totalDays: number; requestCount: number }[] = [];
  for (const project of allProjects) {
    const projectUsers = allUsers.filter((u) => u.projectId === project.id);
    const projectUserIds = projectUsers.map((u) => u.id);
    const projectRequests = allRequests.filter((r) => projectUserIds.includes(r.userId));
    const totalDays = projectRequests.reduce((sum, r) => sum + r.daysCount, 0);

    leaveByProject.push({
      projectName: project.projectName,
      totalDays,
      requestCount: projectRequests.length,
    });
  }

  // Calculate seasonal patterns (by quarter)
  const seasonalPatterns: { quarter: string; count: number }[] = [
    { quarter: "Q1 (Jan-Mar)", count: 0 },
    { quarter: "Q2 (Apr-Jun)", count: 0 },
    { quarter: "Q3 (Jul-Sep)", count: 0 },
    { quarter: "Q4 (Oct-Dec)", count: 0 },
  ];

  allRequests.forEach((r) => {
    const month = new Date(r.startDate).getMonth();
    if (month <= 2) seasonalPatterns[0].count++;
    else if (month <= 5) seasonalPatterns[1].count++;
    else if (month <= 8) seasonalPatterns[2].count++;
    else seasonalPatterns[3].count++;
  });

  // Calculate average leave duration
  const avgLeaveDuration =
    totalRequests > 0 ? allRequests.reduce((sum, r) => sum + r.daysCount, 0) / totalRequests : 0;

  // Calculate total leave days taken
  const totalLeaveDays = allRequests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.daysCount, 0);

  return {
    summary: {
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      approvalRate: Math.round(approvalRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      pendingRate: Math.round(pendingRate * 10) / 10,
      avgLeaveDuration: Math.round(avgLeaveDuration * 10) / 10,
      totalLeaveDays,
    },
    monthlyTrends,
    leaveByProject,
    seasonalPatterns,
  };
}

export async function getAllLeaveRequestsWithDetails() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get leave requests: database not available");
    return [];
  }

  const allRequests = await db.select().from(leaveRequests);
  const allUsers = await db.select().from(users);
  const allProjects = await db.select().from(projects);

  return allRequests.map((r) => {
    const user = allUsers.find((u) => u.id === r.userId);
    const project = allProjects.find((p) => p.id === user?.projectId);
    const supervisor = allUsers.find((u) => u.id === r.supervisorId);

    return {
      id: r.id,
      userName: user?.name || "Unknown",
      userEmail: user?.email || "",
      projectName: project?.projectName || "Unassigned",
      startDate: r.startDate,
      endDate: r.endDate,
      daysCount: r.daysCount,
      reason: r.reason,
      status: r.status,
      supervisorName: supervisor?.name || "",
      createdAt: r.createdAt,
    };
  });
}
