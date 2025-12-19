import { Strategy as SamlStrategy } from "@node-saml/passport-saml";
import { ENV } from "./env";

/**
 * SAML 2.0 Configuration for Enterprise Integration
 * 
 * This module provides SAML 2.0 authentication strategy that allows companies
 * to integrate their existing identity providers (IdP) like Okta, Azure AD, etc.
 * 
 * Staff logs in with their existing credentials, and user info is automatically
 * synced from the IdP without storing sensitive company data.
 */

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  identifierFormat: string;
  wantAssertionsSigned: boolean;
  wantAuthnResponseSigned: boolean;
}

export interface SamlUser {
  openId: string;
  email: string;
  name: string;
  department?: string;
  role?: string;
}

/**
 * Create SAML strategy for Passport.js
 */
export function createSamlStrategy(config: SamlConfig) {
  return new (SamlStrategy as any)(
    {
      entryPoint: config.entryPoint,
      issuer: config.issuer,
      cert: config.cert,
      identifierFormat: config.identifierFormat || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      wantAssertionsSigned: config.wantAssertionsSigned !== false,
      wantAuthnResponseSigned: config.wantAuthnResponseSigned !== false,
      callbackURL: `${ENV.appUrl}/api/saml/callback`,
    },
    (profile: any, done: any) => {
      try {
        const user: SamlUser = {
          openId: profile.nameID || profile.uid || profile.email,
          email: profile.email || profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "",
          name: profile.displayName || profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "",
          department: profile.department || profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department"],
          role: profile.role || profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"],
        };

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
}

/**
 * Generate SAML metadata for companies to configure their IdP
 */
export function generateSamlMetadata(config: SamlConfig): string {
  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.issuer}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>${config.identifierFormat}</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${ENV.appUrl}/api/saml/callback" index="0" isDefault="true"/>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${ENV.appUrl}/api/saml/callback" index="1"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

  return metadata;
}

/**
 * Common IdP Configuration Templates
 */
export const IdpTemplates = {
  okta: {
    name: "Okta",
    guide: "https://developer.okta.com/docs/guides/saml-application-setup/",
  },
  azureAd: {
    name: "Azure Active Directory",
    guide: "https://learn.microsoft.com/en-us/azure/active-directory/saas-apps/",
  },
  activeDirectory: {
    name: "Active Directory Federation Services (ADFS)",
    guide: "https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/operations/",
  },
  googleWorkspace: {
    name: "Google Workspace",
    guide: "https://support.google.com/a/answer/6087519",
  },
};

/**
 * Validate SAML configuration
 */
export function validateSamlConfig(config: Partial<SamlConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.entryPoint) errors.push("entryPoint (IdP Single Sign-On URL) is required");
  if (!config.issuer) errors.push("issuer (Service Provider ID) is required");
  if (!config.cert) errors.push("cert (IdP Certificate) is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}
