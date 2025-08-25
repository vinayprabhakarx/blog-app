export const buildPasswordResetEmail = (name, resetLink) => {
  const safeName = name || "there";
  const subject = "Password Reset Request";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetLink}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="color: #666; font-size: 0.9em;">
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;
  
  const text = `Password Reset Request\n\n` +
    `Hi ${safeName},\n\n` +
    `We received a request to reset your password. Use the link below to set a new password.\n\n` +
    `${resetLink}\n\n` +
    `This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.`;
    
  return { subject, html, text };
};

export const buildPasswordResetSuccessEmail = (name) => {
  const safeName = name || "there";
  const subject = "Your Password Has Been Reset";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Updated Successfully</h2>
      <p>Hi ${safeName},</p>
      <p>Your password has been successfully updated. If you did not make this change, please contact us immediately.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="color: #666; font-size: 0.9em;">
        This is a security notification from ${process.env.APP_NAME || 'our service'}. If you didn't make this change, please secure your account.
      </p>
    </div>
  `;
  
  const text = `Password Updated Successfully\n\n` +
    `Hi ${safeName},\n\n` +
    `Your password has been successfully updated. If you did not make this change, please contact us immediately.\n\n` +
    `This is a security notification from ${process.env.APP_NAME || 'our service'}. If you didn't make this change, please secure your account.`;
    
  return { subject, html, text };
};
