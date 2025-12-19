# SAML 2.0 Enterprise Integration Guide

This guide explains how to integrate the Leave Management System with your company's existing identity provider using SAML 2.0. This allows your staff to log in using their existing credentials without any data migration.

## Overview

**Benefits of SAML 2.0 Integration:**
- Staff logs in with their existing company credentials (no new passwords)
- User information automatically synced from your identity provider
- No sensitive company data stored in our system
- Easy to disconnect or switch providers
- Complies with enterprise security standards
- Automatic user provisioning and deprovisioning

## Supported Identity Providers

- **Okta** - Most popular enterprise IdP
- **Azure Active Directory (Azure AD)** - Microsoft enterprise solution
- **Active Directory Federation Services (ADFS)** - On-premises AD integration
- **Google Workspace** - For Google-based organizations
- **Any SAML 2.0 compliant IdP**

## Step 1: Get SAML Metadata

First, retrieve the SAML metadata that your identity provider needs to configure the service provider.

**Access the metadata endpoint:**
```
GET https://your-lms-domain.com/api/saml/metadata
```

This returns an XML file containing:
- Service Provider Entity ID
- Assertion Consumer Service (ACS) URL
- NameID Format

Save this metadata - you'll need it to configure your IdP.

## Step 2: Configure Your Identity Provider

### For Okta

1. Log in to your Okta admin console
2. Go to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select **SAML 2.0**
5. Fill in the form:
   - **App name:** Leave Management System
   - **App logo:** (optional)
6. In **SAML Settings**:
   - **Single Sign-On URL:** `https://your-lms-domain.com/api/saml/callback`
   - **Audience URI:** Use the Entity ID from the metadata
   - **Name ID format:** Email
   - **Application username:** Okta username
7. In **Attribute Statements**, map these attributes:
   - `email` → `user.email`
   - `name` → `user.firstName + " " + user.lastName`
   - `department` → `user.department` (if available)
8. Click **Finish**
9. Copy the **Identity Provider metadata URL** or download the metadata XML

### For Azure AD

1. Log in to Azure Portal
2. Go to **Azure Active Directory** → **Enterprise applications**
3. Click **New application** → **Create your own application**
4. Select **Integrate any other application you don't find in the gallery**
5. Go to **Single sign-on** → **SAML**
6. In **Basic SAML Configuration**:
   - **Identifier (Entity ID):** Use the Entity ID from the metadata
   - **Reply URL (Assertion Consumer Service URL):** `https://your-lms-domain.com/api/saml/callback`
   - **Sign on URL:** `https://your-lms-domain.com/login`
7. In **User Attributes & Claims**, ensure these are mapped:
   - `email` → `user.mail`
   - `name` → `user.displayname`
   - `department` → `user.department`
8. Download the **Federation Metadata XML**

### For Active Directory Federation Services (ADFS)

1. Open ADFS Management Console
2. Right-click **Relying Party Trusts** → **Add Relying Party Trust**
3. Select **Import data about the relying party from a file**
4. Upload the SAML metadata XML from Step 1
5. Configure the **Claim Rules**:
   - Add rule: **Send LDAP Attributes as Claims**
   - Map LDAP Attributes:
     - `E-Mail-Addresses` → `email`
     - `Display-Name` → `name`
     - `Department` → `department`
6. Complete the wizard

## Step 3: Configure the Leave Management System

Once your IdP is configured, you need to provide the SAML configuration to the Leave Management System.

**Admin Configuration Endpoint:**
```
POST /api/saml/configure
Content-Type: application/json

{
  "entryPoint": "https://your-idp.com/app/123456/sso/saml",
  "issuer": "https://your-lms-domain.com",
  "cert": "-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"
}
```

**Where to get these values:**

- **entryPoint:** IdP Single Sign-On URL (from your IdP metadata)
- **issuer:** Your LMS domain (e.g., `https://lms.yourcompany.com`)
- **cert:** IdP certificate (from your IdP metadata, in the `<ds:X509Certificate>` tag)

**Via Environment Variables (Recommended for Production):**

Set these environment variables on your server:
```bash
SAML_ENABLED=true
SAML_ENTRY_POINT=https://your-idp.com/app/123456/sso/saml
SAML_ISSUER=https://your-lms-domain.com
SAML_CERT="-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"
APP_URL=https://your-lms-domain.com
```

## Step 4: Test the Integration

1. Navigate to your LMS login page
2. Click **"Sign in with SAML"** or **"Sign in with Company Credentials"**
3. You should be redirected to your IdP login page
4. Log in with your company credentials
5. You should be redirected back to the LMS dashboard
6. Your user profile should be automatically created with your name, email, and department

## Step 5: Manage User Roles

After SAML integration, users are automatically created with the **"staff"** role. To assign different roles (supervisor, admin, HR):

1. Go to **Admin Dashboard** → **Manage Users**
2. Find the user
3. Click **Edit**
4. Change the **Role** dropdown
5. Save

You can also bulk assign roles by uploading a CSV file with the **Bulk Import** feature.

## Attribute Mapping

The system automatically maps these SAML attributes:

| SAML Attribute | LMS Field | Required | Notes |
|---|---|---|---|
| `nameID` | Staff ID / OpenID | Yes | Unique identifier from IdP |
| `email` | Email | Yes | Used for notifications |
| `name` | Full Name | Yes | Display name in the system |
| `department` | Department | No | For organizational context |
| `role` | User Role | No | Can be `staff`, `supervisor`, `admin`, `hr` |

## Security Considerations

1. **Certificate Validation:** Always use HTTPS for all SAML endpoints
2. **Signed Assertions:** Ensure your IdP signs SAML assertions
3. **Encrypted Assertions:** For sensitive data, enable assertion encryption
4. **Session Timeout:** Configure appropriate session timeouts in your IdP
5. **Audit Logging:** Monitor SAML authentication attempts in your IdP logs

## Troubleshooting

### "SAML assertion validation failed"
- Verify the certificate in the SAML configuration matches your IdP certificate
- Check that the clock on your server is synchronized with your IdP
- Ensure the IdP is signing assertions

### "User not found after login"
- Check that the `nameID` attribute is being sent by your IdP
- Verify email and name attributes are mapped correctly
- Check server logs for detailed error messages

### "Redirect loop between IdP and LMS"
- Verify the Assertion Consumer Service (ACS) URL matches exactly
- Check that the Entity ID matches your LMS domain
- Clear browser cookies and try again

### "Certificate not found"
- Ensure the certificate is properly formatted with `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
- Remove any extra whitespace or line breaks
- Use the X.509 certificate from your IdP metadata

## Support

For issues or questions about SAML integration:
1. Check the server logs: `docker logs lms-server`
2. Enable debug logging in your IdP
3. Contact your IdP support team
4. Reach out to the LMS support team

## Additional Resources

- [SAML 2.0 Specification](https://en.wikipedia.org/wiki/SAML_2.0)
- [Okta SAML Setup](https://developer.okta.com/docs/guides/saml-application-setup/)
- [Azure AD SAML Configuration](https://learn.microsoft.com/en-us/azure/active-directory/saas-apps/)
- [ADFS Documentation](https://learn.microsoft.com/en-us/windows-server/identity/ad-fs/)
