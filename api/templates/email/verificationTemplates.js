export const buildVerifyRegistrationEmail = (name, linkForEmail) => {
  const safeName = name || "there";
  const subject = "Verify your email";
  const html = `
    <p>Hi ${safeName},</p>
    <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
    <p><a href="${linkForEmail}" target="_blank" rel="noreferrer">Verify Email</a></p>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p>${linkForEmail}</p>
    <hr/>
    <p>This link will expire in 24 hours.</p>
  `;
  const text = `Verify your email: ${linkForEmail}\nThis link expires in 24 hours.`;
  return { subject, html, text };
};

export const buildVerifyNewEmail = (name, linkForEmail) => {
  const safeName = name || "there";
  const subject = "Verify your new email";
  const html = `
    <p>Hi ${safeName},</p>
    <p>You changed the email on your account. Please verify this email by clicking the link below:</p>
    <p><a href="${linkForEmail}" target="_blank" rel="noreferrer">Verify Email</a></p>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p>${linkForEmail}</p>
    <hr/>
    <p>This link will expire in 24 hours.</p>
  `;
  const text = `Verify your email: ${linkForEmail}\nThis link expires in 24 hours.`;
  return { subject, html, text };
};
