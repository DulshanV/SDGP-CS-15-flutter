const express = require("express");
const {
  requestEnrollment,
  getEnrollments,
  updateEnrollment,
  getMyEnrollments
} = require("../controllers/enrollmentController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/enroll", authenticate, authorize("student"), requestEnrollment);
router.get("/enrollments/me", authenticate, authorize("student"), getMyEnrollments);
router.get("/enrollments", authenticate, authorize("admin"), getEnrollments);
router.put("/enrollments/:id", authenticate, authorize("admin"), updateEnrollment);

module.exports = router;
