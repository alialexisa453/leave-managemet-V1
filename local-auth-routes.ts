import express, { Router, Request, Response } from "express";
import { registerUser, authenticateUser } from "./local-auth";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { SignJWT } from "jose";
import { ENV } from "./env";

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post("/register", express.json(), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "email, password, and name are required",
      });
    }

    const user = await registerUser(email, password, name);

    if (!user) {
      return res.status(400).json({
        error: "Registration failed",
        message: "Could not create user",
      });
    }

    // Create session JWT
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const token = await new SignJWT({
      sub: user.id.toString(),
      openId: user.openId,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LocalAuth] Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post("/login", express.json(), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "email and password are required",
      });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Create session JWT
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const token = await new SignJWT({
      sub: user.id.toString(),
      openId: user.openId,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LocalAuth] Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
