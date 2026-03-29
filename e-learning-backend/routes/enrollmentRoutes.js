const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  requestEnrollment,
  getEnrollments,
  updateEnrollment,
  getMyEnrollments,
  assignEnrollment
} = require("../controllers/enrollmentController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

const adminAssignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many module assignment requests. Please try again later." }
});

router.post("/enroll", authenticate, authorize("student"), requestEnrollment);
router.get("/enrollments/me", authenticate, authorize("student"), getMyEnrollments);
router.get("/enrollments", authenticate, authorize("admin"), getEnrollments);
router.put("/enrollments/:id", authenticate, authorize("admin"), updateEnrollment);
router.post("/users/:userId/enroll", adminAssignLimiter, authenticate, authorize("admin"), assignEnrollment);

module.exports = router;
