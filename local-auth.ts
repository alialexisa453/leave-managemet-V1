import bcrypt from "bcrypt";
import { getDb, upsertUser, getUserByEmail, getAllUsers } from "../db";

type User = any;

/**
 * Local Authentication Service
 * Handles email/password authentication for companies without SAML
 */

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user with email and password
 * First user automatically becomes admin
 */
export async function registerUser(email: string, password: string, name: string): Promise<User | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Check if this is the first user (should become admin)
    const allUsers = await getAllUsers();
    const isFirstUser = allUsers.length === 0;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const openId = email; // Use email as unique identifier for local auth
    const role = isFirstUser ? "admin" : "staff";

    await upsertUser({
      openId,
      companyId: "local",
      email,
      name,
      passwordHash,
      role,
      lastSignedIn: new Date(),
    });

    // Return user (without password hash)
    const user = await getUserByEmail(email);
    return user || null;
  } catch (error) {
    console.error("[LocalAuth] Registration error:", error);
    throw error;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return null;
    }

    if (!user.passwordHash) {
      // User registered via SAML, not local auth
      return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    // Update last signed in
    const db = await getDb();
    if (db) {
      await upsertUser({
        openId: user.openId,
        companyId: user.companyId,
        lastSignedIn: new Date(),
      });
    }

    return user;
  } catch (error) {
    console.error("[LocalAuth] Authentication error:", error);
    return null;
  }
}

/**
 * Check if user exists
 */
export async function userExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== undefined;
}

/**
 * Get user by email
 */
export async function getUserByEmailLocal(email: string): Promise<User | undefined> {
  return getUserByEmail(email);
}
