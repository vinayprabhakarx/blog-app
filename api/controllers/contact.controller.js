import { validationResult } from "express-validator";
import sendEmail from "../utils/sendEmail.js";
import {
  buildContactSubmissionEmail,
  buildContactConfirmationEmail,
} from "../templates/email/contactTemplates.js";
import { validationError, serverError, notFoundError } from "../utils/handleError.js";
import Contact from "../models/contact.model.js";

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


    // Save to database
    const newContact = new Contact({
      userName,
      email,
      subject,
      message,
    });
    await newContact.save();

    const confirmationEmail = buildContactConfirmationEmail(userName, message);

    // Send only confirmation email to user
    await sendEmail({
      to: email,
      subject: confirmationEmail.subject,
      html: confirmationEmail.html,
      text: confirmationEmail.text,
    });

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

// @route   GET /api/contact
// @desc    Get all contact messages (Admin)
// @access  Private/Admin
export const getContacts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const startIndex = (page - 1) * limit;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Contact.countDocuments(query);
    const unreadCount = await Contact.countDocuments({ status: "unread" });

    return res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    return next(serverError("Failed to fetch contact messages", error));
  }
};

// @route   PUT /api/contact/:id
// @desc    Update contact message status (Admin)
// @access  Private/Admin
export const updateContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["unread", "read"].includes(status)) {
      return next(validationError("status", "Invalid status value"));
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return next(notFoundError("Contact message"));
    }

    contact.status = status;
    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Contact status updated successfully",
      data: contact,
    });
  } catch (error) {
    return next(serverError("Failed to update contact status", error));
  }
};

// @route   DELETE /api/contact/:id
// @desc    Delete a contact message (Admin)
// @access  Private/Admin
export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return next(notFoundError("Contact message"));
    }

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    return next(serverError("Failed to delete contact message", error));
  }
};
