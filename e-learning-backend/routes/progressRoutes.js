const express = require("express");
const { getCourseProgressDetails } = require("../controllers/progressController.js");
const { authenticate } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/:courseId", authenticate, getCourseProgressDetails);

module.exports = router;
