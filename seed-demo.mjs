import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedDatabase() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🌱 Starting database seed...");

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await connection.execute("DELETE FROM leave_requests");
    // await connection.execute("DELETE FROM leave_slots");
    // await connection.execute("DELETE FROM users");
    // await connection.execute("DELETE FROM projects");

    // Create demo project
    console.log("📁 Creating demo project...");
    const [projectResult] = await connection.execute(
      "INSERT INTO projects (name, description, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())",
      ["Demo Project", "Demo project for testing all features"]
    );
    const projectId = projectResult.insertId;
    console.log(`✅ Project created with ID: ${projectId}`);

    // Create demo users
    console.log("👥 Creating demo users...");
    const users = [
      {
        email: "admin@demo.com",
        name: "Admin User",
        role: "admin",
        password: "admin123",
      },
      {
        email: "supervisor@demo.com",
        name: "Supervisor User",
        role: "supervisor",
        password: "supervisor123",
      },
      {
        email: "staff1@demo.com",
        name: "Staff Member 1",
        role: "staff",
        password: "staff123",
      },
      {
        email: "staff2@demo.com",
        name: "Staff Member 2",
        role: "staff",
        password: "staff123",
      },
      {
        email: "staff3@demo.com",
        name: "Staff Member 3",
        role: "staff",
        password: "staff123",
      },
    ];

    const userIds = {};

    for (const user of users) {
      const passwordHash = await hashPassword(user.password);
      const [result] = await connection.execute(
        `INSERT INTO users (openId, companyId, email, name, passwordHash, role, projectId, leaveBalance, loginMethod, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          user.email,
          "demo",
          user.email,
          user.name,
          passwordHash,
          user.role,
          projectId,
          20, // Default 20 days leave balance
          "local",
        ]
      );
      userIds[user.email] = result.insertId;
      console.log(`✅ User created: ${user.email} (${user.role})`);
    }

    // Create leave slots for demo project
    console.log("📅 Creating leave slots...");
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      await connection.execute(
        `INSERT INTO leave_slots (projectId, date, maxSlots, usedSlots, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE updatedAt = NOW()`,
        [projectId, dateStr, 5, 0] // Max 5 people can take leave per day
      );
    }
    console.log("✅ Leave slots created for next 30 days");

    // Create sample leave requests
    console.log("📝 Creating sample leave requests...");
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    const requests = [
      {
        userId: userIds["staff1@demo.com"],
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        reason: "Personal leave",
        status: "approved",
      },
      {
        userId: userIds["staff2@demo.com"],
        startDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        reason: "Vacation",
        status: "pending",
      },
      {
        userId: userIds["staff3@demo.com"],
        startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        reason: "Sick leave",
        status: "rejected",
      },
    ];

    for (const req of requests) {
      await connection.execute(
        `INSERT INTO leave_requests (userId, startDate, endDate, reason, status, supervisorId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          req.userId,
          req.startDate,
          req.endDate,
          req.reason,
          req.status,
          userIds["supervisor@demo.com"],
        ]
      );
    }
    console.log("✅ Sample leave requests created");

    console.log("\n🎉 Database seed completed successfully!");
    console.log("\n📋 Demo Credentials:");
    console.log("   Admin: admin@demo.com / admin123");
    console.log("   Supervisor: supervisor@demo.com / supervisor123");
    console.log("   Staff: staff1@demo.com / staff123");
    console.log("   Staff: staff2@demo.com / staff123");
    console.log("   Staff: staff3@demo.com / staff123");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
