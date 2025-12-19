import express, { Router, Request, Response } from "express";
import passport from "passport";
import { createSamlStrategy, generateSamlMetadata, validateSamlConfig, type SamlConfig } from "./saml";
import { getDb, upsertUser } from "../db";
import { ENV } from "./env";

const router = Router();

/**
 * SAML Configuration Storage (in production, store in database)
 * For now, we use environment variables or a simple in-memory store
 */
let samlConfig: SamlConfig | null = null;

/**
 * Initialize SAML if configuration is provided
 */
export async function initializeSaml() {
  if (ENV.samlEnabled && ENV.samlEntryPoint && ENV.samlIssuer && ENV.samlCert) {
    samlConfig = {
      entryPoint: ENV.samlEntryPoint,
      issuer: ENV.samlIssuer,
      cert: ENV.samlCert,
      identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: false,
    };

    const strategy = createSamlStrategy(samlConfig);
    passport.use("saml", strategy);

    console.log("[SAML] Initialized with IdP:", ENV.samlEntryPoint);
  }
}

/**
 * GET /api/saml/metadata
 * Returns SAML metadata for IdP configuration
 */
router.get("/metadata", (req: Request, res: Response) => {
  if (!samlConfig) {
    return res.status(400).json({
      error: "SAML not configured",
      message: "Please configure SAML settings first",
    });
  }

  const metadata = generateSamlMetadata(samlConfig);
  res.type("application/xml").send(metadata);
});

/**
 * POST /api/saml/configure
 * Admin endpoint to configure SAML settings
 * In production, this should be protected and stored in database
 */
router.post("/configure", express.json(), async (req: Request, res: Response) => {
  try {
    const { entryPoint, issuer, cert } = req.body;

    const config: Partial<SamlConfig> = {
      entryPoint,
      issuer,
      cert,
      identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: false,
    };

    const validation = validateSamlConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid SAML configuration",
        errors: validation.errors,
      });
    }

    samlConfig = config as SamlConfig;
    const strategy = createSamlStrategy(samlConfig);
    passport.use("saml", strategy);

    res.json({
      success: true,
      message: "SAML configured successfully",
      metadata: generateSamlMetadata(samlConfig),
    });
  } catch (error) {
    console.error("[SAML] Configuration error:", error);
    res.status(500).json({
      error: "Failed to configure SAML",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/saml/login
 * Initiates SAML authentication flow
 */
router.get("/login", passport.authenticate("saml", { failureRedirect: "/login" }), (req: Request, res: Response) => {
  res.redirect("/");
});

/**
 * POST /api/saml/callback
 * SAML assertion consumer service endpoint
 * IdP posts the SAML response here
 */
router.post(
  "/callback",
  passport.authenticate("saml", { failureRedirect: "/login" }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.redirect("/login");
      }

      // Upsert user in database with SAML attributes
      await upsertUser({
        openId: user.openId,
        companyId: user.openId.split("@")[0] || "default",
        email: user.email,
        name: user.name,
        role: user.role || "staff",
        lastSignedIn: new Date(),
      });

      // In production, create a session and redirect to dashboard
      res.redirect("/");
    } catch (error) {
      console.error("[SAML] Callback error:", error);
      res.redirect("/login?error=saml_error");
    }
  }
);

/**
 * GET /api/saml/logout
 * SAML logout endpoint
 */
router.get("/logout", (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.redirect("/");
  });
});

/**
 * GET /api/saml/config
 * Get current SAML configuration (for admin panel)
 */
router.get("/config", (req: Request, res: Response) => {
  if (!samlConfig) {
    return res.json({
      configured: false,
      message: "SAML not configured yet",
    });
  }

  res.json({
    configured: true,
    entryPoint: samlConfig.entryPoint,
    issuer: samlConfig.issuer,
    // Don't expose certificate
  });
});

export default router;
