const express = require("express");
const {
  createQuiz,
  getQuizzes,
  updateQuiz,
  deleteQuiz,
  submitQuiz
} = require("../controllers/quizController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createQuiz);
router.post("/submit", authenticate, authorize("student"), submitQuiz);
router.get("/:courseId", authenticate, getQuizzes);
router.put("/manage/:id", authenticate, authorize("admin"), updateQuiz);
router.delete("/manage/:id", authenticate, authorize("admin"), deleteQuiz);

module.exports = router;
