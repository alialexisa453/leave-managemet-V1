import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper to check if user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Helper to check if user is supervisor or admin
const supervisorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "supervisor" && ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Supervisor access required" });
  }
  return next({ ctx });
});

// Helper to check if user is HR or admin
const hrProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "hr" && ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "HR access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Users Router
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),

    getByProject: supervisorProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getUsersByProjectId(input.projectId);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          companyId: z.string(),
          email: z.string().email().optional(),
          role: z.enum(["staff", "supervisor", "admin", "hr"]),
          projectId: z.number().optional(),
          leaveBalance: z.number().default(20),
        })
      )
      .mutation(async ({ input }) => {
        // Create user with temporary password
        return await db.upsertUser({
          openId: input.companyId,
          companyId: input.companyId,
          name: input.name,