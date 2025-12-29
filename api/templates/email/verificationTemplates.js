// Helper to get capitalized first name from full name
const getCapitalizedFirstName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return "there";
  const firstName = fullName.trim().split(" ")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const buildVerifyRegistrationEmail = (name, linkForEmail) => {
  const firstName = getCapitalizedFirstName(name);
  const subject = "Verify your email";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hi ${firstName},</p>
      <p>Thanks for signing up! Please verify your email by clicking the button below:</p>
      <p>
        <a href="${linkForEmail}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${linkForEmail}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="color: #666; font-size: 0.9em;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;
  const text = `Email Verification\n\n` +
    `Hi ${firstName},\n\n` +
    `Thanks for signing up! Please verify your email using the link below:\n\n` +
    `${linkForEmail}\n\n` +
    `This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.`;
  return { subject, html, text };
};

export const buildVerifyNewEmail = (name, linkForEmail) => {
  const firstName = getCapitalizedFirstName(name);
  const subject = "Verify your new email";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Change Verification</h2>
      <p>Hi ${firstName},</p>
      <p>You recently changed the email on your account. Please verify this new email by clicking the button below:</p>
      <p>
        <a href="${linkForEmail}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${linkForEmail}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="color: #666; font-size: 0.9em;">
        This link will expire in 24 hours. If you didn't request this change, please contact support immediately.
      </p>
    </div>
  `;
  const text = `Email Change Verification\n\n` +
    `Hi ${firstName},\n\n` +
    `You recently changed the email on your account. Please verify this new email using the link below:\n\n` +
    `${linkForEmail}\n\n` +
    `This link will expire in 24 hours. If you didn't request this change, please contact support immediately.`;
  return { subject, html, text };
};

