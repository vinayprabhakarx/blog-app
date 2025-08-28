import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT, 10)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
    // Add timeout configurations
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  const from =
    process.env.SMTP_FROM ||
    `No-Reply <no-reply@${process.env.DOMAIN || "example.com"}>`;

  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Email sending timed out. Please try again."));
    }, 10000); // 10 second timeout
  });

  // Create the email sending promise
  const emailPromise = transporter.sendMail({ from, to, subject, text, html });

  try {
    // Race between email sending and timeout
    const info = await Promise.race([emailPromise, timeoutPromise]);

    const accepted = Array.isArray(info?.accepted) ? info.accepted.length : 0;
    if (!accepted) {
      throw new Error("Email was not accepted by SMTP server");
    }
    return info;
  } catch (error) {
    // If it's a timeout error, throw it directly
    if (error.message.includes("timed out")) {
      throw error;
    }
    // For other errors, provide a more user-friendly message
    throw new Error("Failed to send email. Please try again later.");
  }
};

export default sendEmail;
