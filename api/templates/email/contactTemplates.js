// Sanitization utility
const sanitizeForEmail = (text) =>
  text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

// Convert message text to HTML paragraphs
const createHtmlMessage = (message) =>
  message
    .split("\n")
    .map(
      (line) =>
        `<p style="margin: 0 0 10px 0; line-height: 1.6;">${sanitizeForEmail(
          line.trim()
        )}</p>`
    )
    .join("");

// Template for email sent to site owner
export const buildContactSubmissionEmail = ({
  userName,
  email,
  subject,
  message,
}) => {
  const htmlMessage = createHtmlMessage(message);
  const websiteUrl = process.env.SENDER_WEBSITE || "https://vinayprabhakar.dev";
  const displayUrl = websiteUrl.replace(/^https?:\/\//, "");

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e0e0e0;">
  <!-- Header -->
  <div style="background-color: #000000; padding: 16px 32px;">
    <h2 style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 400; letter-spacing: 1px;">NEW CONTACT SUBMISSION</h2>
  </div>
  
  <!-- Body -->
  <div style="padding: 40px 32px;">
    <div style="margin-bottom: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 100px;">Name</td>
          <td style="padding: 8px 0; font-size: 14px; color: #000000; font-weight: 500;">${sanitizeForEmail(
            userName
          )}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666; border-top: 1px solid #f0f0f0;">Email</td>
          <td style="padding: 8px 0; font-size: 14px; border-top: 1px solid #f0f0f0;"><a href="mailto:${email}" style="color: #000000; text-decoration: underline;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666; border-top: 1px solid #f0f0f0;">Subject</td>
          <td style="padding: 8px 0; font-size: 14px; color: #000000; font-weight: 500; border-top: 1px solid #f0f0f0;">${sanitizeForEmail(
            subject
          )}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #666666; border-top: 1px solid #f0f0f0;">Date</td>
          <td style="padding: 8px 0; font-size: 14px; color: #000000; border-top: 1px solid #f0f0f0;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <div style="border-top: 1px solid #e0e0e0; padding-top: 24px;">
      <h3 style="color: #000000; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
      <div style="background: #f5f5f5; padding: 20px; border-left: 2px solid #000000;">
        ${htmlMessage}
      </div>
    </div>
    
    <p style="font-size: 13px; color: #999999; margin: 32px 0 0 0; line-height: 1.6;">
      Reply directly to this email to respond to ${sanitizeForEmail(userName)}.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background: #f9f9f9; padding: 20px 32px; border-top: 1px solid #e0e0e0;">
    <p style="font-size: 11px; color: #999999; margin: 0; line-height: 1.5;">
      Contact form submission from ${displayUrl}<br>
      ${new Date().toLocaleDateString()}
    </p>
  </div>
</div>`;

  const text = `
NEW CONTACT FORM SUBMISSION

Contact Information:
Name: ${userName}
Email: ${email}
Subject: ${subject}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
Reply to this person: ${email}
This message was submitted via the contact form on ${displayUrl}
  `;

  // Extract and capitalize first name for subject
  const firstName = userName.trim().split(" ")[0];
  const capitalizedFirstName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  return {
    subject: `New Contact Submission from ${capitalizedFirstName}: ${subject}`,
    html,
    text,
  };
};

// Template for confirmation email sent to user
export const buildContactConfirmationEmail = (
  userName,
  originalMessage = ""
) => {
  const recipientEmail =
    process.env.RECIPIENT_EMAIL || "work.vinayprabhakar@gmail.com";
  const websiteUrl = process.env.SENDER_WEBSITE || "https://vinayprabhakar.dev";
  const displayUrl = websiteUrl.replace(/^https?:\/\//, "");

  // Extract first name and capitalize
  const firstName = userName.trim().split(" ")[0];
  const capitalizedFirstName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  // Only include message if provided
  const messageSection = originalMessage
    ? `
    <div style="border-top: 1px solid #e0e0e0; padding-top: 24px; margin-bottom: 24px;">
      <h3 style="color: #000000; margin: 0 0 16px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Message</h3>
      <div style="background: #f5f5f5; padding: 20px; border-left: 2px solid #000000;">
        ${createHtmlMessage(originalMessage)}
      </div>
    </div>`
    : "";

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e0e0e0;">
  <!-- Header -->
  <div style="background-color: #000000; padding: 16px 32px;">
    <h2 style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 400; letter-spacing: 1px;">MESSAGE CONFIRMATION</h2>
  </div>
  
  <!-- Body -->
  <div style="padding: 40px 32px;">
    <p style="font-size: 16px; color: #000000; margin: 0 0 24px 0;">Hi ${capitalizedFirstName},</p>
    
    <p style="font-size: 15px; color: #333333; line-height: 1.6; margin: 0 0 32px 0;">
      Thank you for reaching out. I have received your message and will respond within 2–3 business days.
    </p>
    ${messageSection}
    <p style="font-size: 14px; color: #666666; margin: 32px 0 0 0; line-height: 1.6;">
      For direct inquiries, contact me at <a href="mailto:${recipientEmail}" style="color: #000000; text-decoration: underline;">${recipientEmail}</a>
    </p>
    
    <p style="margin-top: 32px; color: #000000;">Best regards,<br><strong>Vinay Prabhakar</strong></p>
  </div>
  
  <!-- Footer -->
  <div style="background: #f9f9f9; padding: 20px 32px; border-top: 1px solid #e0e0e0;">
    <p style="font-size: 11px; color: #999999; margin: 0; line-height: 1.5;">
      This is an automated message. Please do not reply directly to this email.<br>
      ${displayUrl} • ${new Date().toLocaleDateString()}
    </p>
  </div>
</div>`;

  const text = `
Thank you for your message

Hi ${capitalizedFirstName},

Thank you for reaching out. I have received your message and will respond within 2–3 business days.
${originalMessage ? `\nYour Message:\n${originalMessage}\n` : ""}
For direct inquiries, contact me at ${recipientEmail}.

Best regards,
Vinay Prabhakar

---
This is an automated message. Please do not reply directly to this email.
${displayUrl}
  `;

  return {
    subject: "Thanks for reaching out!",
    html,
    text,
  };
};
