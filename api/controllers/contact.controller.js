import { validationResult } from "express-validator";
import sendEmail from "../utils/sendEmail.js";
import {
  buildContactSubmissionEmail,
  buildContactConfirmationEmail,
} from "../templates/email/contactTemplates.js";
import { validationError, serverError } from "../utils/handleError.js";

// @route   POST /api/contact
// @desc    Handle contact form submission from portfolio
// @access  Public
export const sendContactMessage = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        validationError(
          "form",
          errors
            .array()
            .map((err) => `${err.path}: ${err.msg}`)
            .join(", ")
        )
      );
    }

    const startTime = Date.now();
    const { userName, email, subject, message } = req.body;


    // Build email content using templates
    const submissionEmail = buildContactSubmissionEmail({
      userName,
      email,
      subject,
      message,
    });
    const confirmationEmail = buildContactConfirmationEmail(userName, message);

    const recipientEmail =
      process.env.RECIPIENT_EMAIL || "info@vinayprabhakar.dev";

    // Send both emails
    const emailPromises = [
      // Email to site owner
      sendEmail({
        to: recipientEmail,
        subject: submissionEmail.subject,
        html: submissionEmail.html,
        text: submissionEmail.text,
      }),
      // Confirmation email to user
      sendEmail({
        to: email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
        text: confirmationEmail.text,
      }),
    ];

    await Promise.all(emailPromises);

    const duration = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message:
        "Message sent successfully! You'll receive a confirmation email shortly.",
      data: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(serverError("Failed to send contact message", error));
  }
};
