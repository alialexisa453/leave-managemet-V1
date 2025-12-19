  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow and role-based access control.
 * Roles: staff, supervisor, admin, hr
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  companyId: varchar("companyId", { length: 64 }).notNull().unique(),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["staff", "supervisor", "admin", "hr"]).default("staff").notNull(),
  projectId: int("projectId"),
  leaveBalance: int("leaveBalance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table to organize staff by location/project.
 * Each project has an admin responsible for it.
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  adminId: int("adminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Leave slots table to track daily leave capacity per project.
 * Tracks max slots and used slots for each day.
 */
export const leaveSlots = mysqlTable("leaveSlots", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  date: date("date").notNull(),
  maxSlots: int("maxSlots").default(1).notNull(),
  usedSlots: int("usedSlots").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveSlot = typeof leaveSlots.$inferSelect;
export type InsertLeaveSlot = typeof leaveSlots.$inferInsert;

/**
 * Leave requests table to track all leave applications.
 * Status: pending, approved, rejected, hr_pending
 */
export const leaveRequests = mysqlTable("leaveRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  supervisorId: int("supervisorId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "hr_pending"])
    .default("pending")
    .notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  daysCount: int("daysCount").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

/**
 * Notifications table to track in-app notifications for users.
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: mysqlEnum("type", ["submitted", "approved", "rejected", "modified"]).notNull(),
  relatedRequestId: int("relatedRequestId"),
  isRead: boolean("isRead").default(false).notNull(),