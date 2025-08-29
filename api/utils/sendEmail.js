import nodemailer from "nodemailer";
import https from "https";
import querystring from "querystring";

// Mailgun HTTP API email sender
const sendEmailWithMailgun = async ({ to, subject, html, text }) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error("Mailgun configuration missing");
  }

  const from = process.env.MAILGUN_FROM || 
    process.env.SMTP_FROM ||
    `No-Reply <no-reply@${process.env.DOMAIN || domain}>`;

  const postData = querystring.stringify({
    from,
    to,
    subject,
    text: text || 'Please enable HTML to view this email.',
    html: html || text
  });

  const options = {
    hostname: 'api.mailgun.net',
    port: 443,
    path: `/v3/${domain}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (parseError) {
            resolve({ message: data, success: true });
          }
        } else {
          reject(new Error(`Mailgun API error ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Mailgun request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Mailgun request timed out'));
    });
    
    req.write(postData);
    req.end();
  });
};

// SMTP email sender (fallback)
const sendEmailWithSMTP = async ({ to, subject, html, text }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration incomplete");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  const from = process.env.SMTP_FROM || `No-Reply <no-reply@${process.env.DOMAIN || "example.com"}>`;

  return transporter.sendMail({ from, to, subject, text, html });
};

// Main email function with fallback logic
export const sendEmail = async ({ to, subject, html, text }) => {
  // Try Mailgun first (HTTP API - more reliable when SMTP ports are blocked)
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    try {
      const result = await sendEmailWithMailgun({ to, subject, html, text });
      return result;
    } catch (mailgunError) {
      // If Mailgun fails, try SMTP as fallback
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          const result = await sendEmailWithSMTP({ to, subject, html, text });
          return result;
        } catch (smtpError) {
          throw new Error(`Email delivery failed: ${smtpError.message}`);
        }
      } else {
        throw new Error(`Email delivery failed: ${mailgunError.message}`);
      }
    }
  }
  
  // If no Mailgun config, try SMTP only
  else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const result = await sendEmailWithSMTP({ to, subject, html, text });
      return result;
    } catch (smtpError) {
      throw new Error(`Email delivery failed: ${smtpError.message}`);
    }
  }
  
  // No email service configured
  else {
    throw new Error('Email service not configured. Please configure either Mailgun or SMTP settings.');
  }
};

export default sendEmail;
