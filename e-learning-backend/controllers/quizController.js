const db = require("../db.js");
const courseProgress = require("../utils/courseProgress.js");

const { query } = db;
const { getCourseAccess, syncCourseCompletion } = courseProgress;

async function createQuiz(req, res, next) {
  try {
    const {
      courseId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer
    } = req.body;

    if (!courseId || !question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({ message: "All quiz fields are required." });
    }

    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      return res.status(400).json({ message: "Correct answer must be A, B, C, or D." });
    }

    const course = await query("SELECT id FROM Courses WHERE id = ?", [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    const result = await query(
      `INSERT INTO Quizzes (
          course_id,
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [courseId, question, optionA, optionB, optionC, optionD, correctAnswer]
    );

    const [quiz] = await query("SELECT * FROM Quizzes WHERE id = ?", [result.insertId]);
    return res.status(201).json(quiz);
  } catch (error) {
    return next(error);
  }
}

async function getQuizzes(req, res, next) {
  try {
    const { courseId } = req.params;
    const access = await getCourseAccess(req.user, courseId);

    if (!access.allowed) {
      return res.status(403).json({ message: "You do not have access to this course content yet." });
    }

    const includeAnswer = req.user.role === "admin";
    const quizzes = await query(
      `SELECT
          q.id,
          q.course_id,
          q.question,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          ${includeAnswer ? "q.correct_answer," : ""}
          qa.selected_answer,
          qa.is_correct
       FROM Quizzes q
       LEFT JOIN QuizAttempts qa
         ON qa.quiz_id = q.id
        AND qa.user_id = ?
       WHERE q.course_id = ?
       ORDER BY q.created_at ASC`,
      [req.user.id, courseId]
    );

    return res.json(quizzes);
  } catch (error) {
    return next(error);
  }
}

async function updateQuiz(req, res, next) {
  try {
    const { id } = req.params;
    const {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer
    } = req.body;

    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({ message: "All quiz fields are required." });
    }

    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      return res.status(400).json({ message: "Correct answer must be A, B, C, or D." });
    }

    const existing = await query("SELECT id FROM Quizzes WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    await query(
      `UPDATE Quizzes
       SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?
       WHERE id = ?`,
      [question, optionA, optionB, optionC, optionD, correctAnswer, id]
    );

    const [updated] = await query("SELECT * FROM Quizzes WHERE id = ?", [id]);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function deleteQuiz(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query("SELECT id FROM Quizzes WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    await query("DELETE FROM Quizzes WHERE id = ?", [id]);
    return res.json({ message: "Quiz deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

async function submitQuiz(req, res, next) {
  try {
    const { quizId, selectedAnswer } = req.body;

    if (!quizId || !selectedAnswer) {
      return res.status(400).json({ message: "Quiz ID and selected answer are required." });
    }

    if (!["A", "B", "C", "D"].includes(selectedAnswer)) {
      return res.status(400).json({ message: "Selected answer must be A, B, C, or D." });
    }

    const quizzes = await query("SELECT id, course_id, correct_answer FROM Quizzes WHERE id = ?", [quizId]);
    if (quizzes.length === 0) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const quiz = quizzes[0];
    const access = await getCourseAccess(req.user, quiz.course_id);
    if (!access.allowed) {
      return res.status(403).json({ message: "You do not have access to submit this quiz." });
    }

    const isCorrect = quiz.correct_answer === selectedAnswer ? 1 : 0;

    await query(
      `INSERT INTO QuizAttempts (user_id, quiz_id, selected_answer, is_correct)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         selected_answer = VALUES(selected_answer),
         is_correct = VALUES(is_correct),
         attempted_at = NOW()`,
      [req.user.id, quizId, selectedAnswer, isCorrect]
    );

    const progress = await syncCourseCompletion(req.user.id, quiz.course_id);

    return res.json({
      message: isCorrect ? "Correct answer submitted." : "Answer submitted.",
      isCorrect: Boolean(isCorrect),
      progress
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createQuiz,
  getQuizzes,
  updateQuiz,
  deleteQuiz,
  submitQuiz
};

