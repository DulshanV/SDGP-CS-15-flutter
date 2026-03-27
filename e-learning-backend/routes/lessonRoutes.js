const express = require("express");
const {
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson,
  updateLessonProgress
} = require("../controllers/lessonController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createLesson);
router.put("/:lessonId/progress", authenticate, authorize("student"), updateLessonProgress);
router.get("/:courseId", authenticate, getLessons);
router.put("/manage/:id", authenticate, authorize("admin"), updateLesson);
router.delete("/manage/:id", authenticate, authorize("admin"), deleteLesson);

module.exports = router;
