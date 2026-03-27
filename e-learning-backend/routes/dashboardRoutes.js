const express = require("express");
const {
  getAdminDashboard,
  getStudentDashboard
} = require("../controllers/dashboardController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/admin", authenticate, authorize("admin"), getAdminDashboard);
router.get("/student", authenticate, authorize("student"), getStudentDashboard);

module.exports = router;
