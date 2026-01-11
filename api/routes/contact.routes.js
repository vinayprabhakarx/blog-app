import express from "express";
import { body } from "express-validator";
import { sendContactMessage } from "../controllers/contact.controller.js";

const router = express.Router();

// Contact form validation
const contactValidation = [
  body("userName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s\-'.]+$/)
    .withMessage("Name contains invalid characters")
    .escape(),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 150 })
    .withMessage("Email address is too long")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("subject")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be between 3 and 200 characters")
    .escape(),

  body("message")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters")
    .escape(),
];

// @route   POST /api/send-email
// @desc    Send contact form message from portfolio
// @access  Public
router.post("/", contactValidation, sendContactMessage);

export default router;
