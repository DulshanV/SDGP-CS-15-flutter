const express = require("express");
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require("../controllers/courseController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post("/", authenticate, authorize("admin"), createCourse);
router.put("/:id", authenticate, authorize("admin"), updateCourse);
router.delete("/:id", authenticate, authorize("admin"), deleteCourse);

module.exports = router;
