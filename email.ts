import sgMail from "@sendgrid/mail";
import { ENV } from "./env";

// Initialize SendGrid if API key is provided
if (ENV.sendGridApiKey) {
  sgMail.setApiKey(ENV.sendGridApiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email notification
 * Returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // If SendGrid is not configured, log and return false
  if (!ENV.sendGridApiKey) {
    console.warn(
      "[Email] SendGrid not configured. Email not sent.",
      options.subject
    );
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || ENV.emailFrom || "noreply@leavemanagementsystem.com",
      subject: options.subject,
      html: options.html,
    };

    await sgMail.send(msg);
    console.log("[Email] Sent successfully to:", options.to);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

/**
 * Email template: Leave request submitted
 */
export function getLeaveRequestSubmittedTemplate(
  staffName: string,
  supervisorName: string,
  startDate: string,
  endDate: string,
  reason: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Leave Request</h2>
      <p>Hi ${supervisorName},</p>
      <p><strong>${staffName}</strong> has submitted a new leave request:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      <p>Please review and approve or reject the request in the Leave Management System.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
}

/**
 * Email template: Leave request approved
 */
export function getLeaveRequestApprovedTemplate(
  staffName: string,
  startDate: string,
  endDate: string,
  supervisorName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Leave Request Approved</h2>
      <p>Hi ${staffName},</p>
      <p>Your leave request has been <strong style="color: #4CAF50;">approved</strong> by ${supervisorName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
      </div>
      <p>Your leave balance has been updated accordingly. You can view the details in the Leave Management System.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
}

/**
 * Email template: Leave request rejected
 */
export function getLeaveRequestRejectedTemplate(
  staffName: string,
  startDate: string,
  endDate: string,
  supervisorName: string,
  reason?: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">Leave Request Rejected</h2>
      <p>Hi ${staffName},</p>
      <p>Your leave request has been <strong style="color: #f44336;">rejected</strong> by ${supervisorName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      </div>
      <p>You can submit a new request or contact your supervisor for more information.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
}

/**
 * Email template: Leave request modified
 */
export function getLeaveRequestModifiedTemplate(
  staffName: string,
  oldStartDate: string,
  oldEndDate: string,
  newStartDate: string,
  newEndDate: string,
  supervisorName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FF9800;">Leave Request Modified</h2>
      <p>Hi ${staffName},</p>
      <p>Your leave request has been <strong>modified</strong> by ${supervisorName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Original Dates:</strong> ${oldStartDate} to ${oldEndDate}</p>
        <p><strong>New Dates:</strong> ${newStartDate} to ${newEndDate}</p>
      </div>
      <p>Please review the changes in the Leave Management System.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
}
