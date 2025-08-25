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
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  const from =
    process.env.SMTP_FROM ||
    `No-Reply <no-reply@${process.env.DOMAIN || "example.com"}>`;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  const accepted = Array.isArray(info?.accepted) ? info.accepted.length : 0;
  if (!accepted) {
    throw new Error("Email was not accepted by SMTP server");
  }
  return info;
};

export default sendEmail;
