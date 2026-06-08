import express from "express";
import { getSitemap } from "../controllers/sitemap.controller.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(getSitemap));

export default router;
