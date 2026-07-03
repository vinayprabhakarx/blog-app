import https from "https";
import querystring from "querystring";

// Mailgun HTTP API email sender
export const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error("Mailgun configuration missing. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.");
  }

  const from = process.env.MAILGUN_FROM || `No-Reply <no-reply@${domain}>`;

  const postData = querystring.stringify({
    from,
    to,
    subject,
    text: text || "Please enable HTML to view this email.",
    html: html || text,
  });

  const options = {
    hostname: "api.mailgun.net",
    port: 443,
    path: `/v3/${domain}/messages`,
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
    timeout: 10000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
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

    req.on("error", (error) => {
      reject(new Error(`Mailgun request failed: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Mailgun request timed out"));
    });

    req.write(postData);
    req.end();
  });
};

export default sendEmail;
