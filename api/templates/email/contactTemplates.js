// Template for email sent to site owner
export const buildContactSubmissionEmail = ({
  userName,
  email,
  subject,
  message,
}) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="background-color: #f8f9fa; padding: 30px; border-bottom: 1px solid #dee2e6;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #212529;">New Contact Form Submission</h1>
        <p style="margin: 8px 0 0 0; color: #6c757d; font-size: 14px;">Received from vinayprabhakar.dev</p>
      </div>

      <!-- Content -->
      <div style="padding: 30px;">
        
        <!-- Contact Information -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #495057;">Contact Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #495057; width: 80px;">Name:</td>
              <td style="padding: 8px 0; color: #212529;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #495057;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #495057;">Subject:</td>
              <td style="padding: 8px 0; color: #212529;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #495057;">Date:</td>
              <td style="padding: 8px 0; color: #6c757d;">${new Date().toLocaleString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                }
              )}</td>
            </tr>
          </table>
        </div>

        <!-- Message Content -->
        <div>
          <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #495057;">Message</h2>
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-left: 4px solid #0066cc; border-radius: 6px;">
            <p style="margin: 0; line-height: 1.6; color: #212529; white-space: pre-wrap;">${message}</p>
          </div>
        </div>

        <!-- Action Button -->
        <div style="margin-top: 30px; text-align: center;">
          <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Reply to ${userName}
          </a>
        </div>

      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #dee2e6; text-align: center;">
        <p style="margin: 0; color: #6c757d; font-size: 14px;">
          This message was submitted through the contact form on 
          <a href="https://vinayprabhakar.dev" style="color: #0066cc; text-decoration: none;">vinayprabhakar.dev</a>
        </p>
      </div>

    </div>
  `;

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
This message was submitted via the contact form on vinayprabhakar.dev
  `;

  return {
    subject: `New Contact Message: ${subject}`,
    html,
    text,
  };
};

// Template for confirmation email sent to user
export const buildContactConfirmationEmail = (userName) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="background-color: #f8f9fa; padding: 30px; border-bottom: 1px solid #dee2e6;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #212529;">Thank you for your message</h1>
        <p style="margin: 8px 0 0 0; color: #6c757d; font-size: 14px;">Message received successfully</p>
      </div>

      <!-- Content -->
      <div style="padding: 30px;">
        
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #212529;">Dear ${userName},</p>
        
        <p style="margin: 0 0 20px 0; line-height: 1.6; color: #495057;">
          Thank you for reaching out through my portfolio website. I have received your message and will review it carefully.
        </p>

        <!-- Information Box -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; border-left: 4px solid #1976d2; margin: 30px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #1565c0;">What happens next?</h2>
          <ul style="margin: 0; padding-left: 20px; color: #1565c0; line-height: 1.6;">
            <li style="margin-bottom: 8px;">I typically respond to messages within 2-3 business days</li>
            <li style="margin-bottom: 8px;">You will receive a personal response directly to your email address</li>
            <li>No further action is required from your side</li>
          </ul>
        </div>

        <p style="margin: 0 0 30px 0; line-height: 1.6; color: #495057;">
          If your message is urgent or you need to provide additional information, feel free to reach out directly at 
          <a href="mailto:work.vinayprabhakar@gmail.com" style="color: #0066cc; text-decoration: none;">work.vinayprabhakar@gmail.com</a>.
        </p>

        <p style="margin: 0; color: #212529;">
          Best regards,<br>
          <strong style="font-weight: 600;">Vinay Prabhakar</strong>
        </p>

      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #dee2e6; text-align: center;">
        <p style="margin: 0; color: #6c757d; font-size: 14px;">
          This is an automated confirmation from 
          <a href="https://vinayprabhakar.dev" style="color: #0066cc; text-decoration: none;">vinayprabhakar.dev</a>
        </p>
        <p style="margin: 8px 0 0 0; color: #6c757d; font-size: 12px;">
          Please do not reply to this email
        </p>
      </div>

    </div>
  `;

  const text = `
Thank you for your message

Dear ${userName},

Thank you for reaching out through my portfolio website. I have received your message and will review it carefully.

What happens next?
- I typically respond to messages within 2-3 business days
- You will receive a personal response directly to your email address  
- No further action is required from your side

If your message is urgent or you need to provide additional information, feel free to reach out directly at work.vinayprabhakar@gmail.com.

Best regards,
Vinay Prabhakar

---
This is an automated confirmation from vinayprabhakar.dev
Please do not reply to this email
  `;

  return {
    subject: "Thank you for your message - Vinay Prabhakar",
    html,
    text,
  };
};
