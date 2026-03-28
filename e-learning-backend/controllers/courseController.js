const db = require("../db.js");

const { query } = db;

async function createCourse(req, res, next) {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const result = await query(
      "INSERT INTO Courses (title, description, created_by) VALUES (?, ?, ?)",
      [title, description, req.user.id]
    );

    const [course] = await query("SELECT * FROM Courses WHERE id = ?", [result.insertId]);
    return res.status(201).json(course);
  } catch (error) {
    return next(error);
  }
}

async function getCourses(req, res, next) {
  try {
    const courses = await query(
      `SELECT
          c.id,
          c.title,
          c.description,
          c.created_at,
          u.name AS creator_name,
          COUNT(DISTINCT l.id) AS lessons_count,
          COUNT(DISTINCT q.id) AS quizzes_count,
          COUNT(DISTINCT CASE WHEN e.status IN ('approved', 'completed') THEN e.id END) AS enrolled_students
       FROM Courses c
       INNER JOIN Users u ON u.id = c.created_by
       LEFT JOIN Lessons l ON l.course_id = c.id
       LEFT JOIN Quizzes q ON q.course_id = c.id
       LEFT JOIN Enrollments e ON e.course_id = c.id
       GROUP BY c.id, c.title, c.description, c.created_at, u.name
       ORDER BY c.created_at DESC`
    );

    return res.json(courses);
  } catch (error) {
    return next(error);
  }
}

async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;

    const courses = await query(
      `SELECT
          c.id,
          c.title,
          c.description,
          c.created_by,
          c.created_at,
          u.name AS creator_name,
          COUNT(DISTINCT l.id) AS lessons_count,
          COUNT(DISTINCT q.id) AS quizzes_count
       FROM Courses c
       INNER JOIN Users u ON u.id = c.created_by
       LEFT JOIN Lessons l ON l.course_id = c.id
       LEFT JOIN Quizzes q ON q.course_id = c.id
       WHERE c.id = ?
       GROUP BY c.id, c.title, c.description, c.created_by, c.created_at, u.name`,
      [id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.json(courses[0]);
  } catch (error) {
    return next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const existing = await query("SELECT id FROM Courses WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    await query("UPDATE Courses SET title = ?, description = ? WHERE id = ?", [
      title,
      description,
      id
    ]);

    const [updatedCourse] = await query("SELECT * FROM Courses WHERE id = ?", [id]);
    return res.json(updatedCourse);
  } catch (error) {
    return next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await query("SELECT id FROM Courses WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Course not found." });
    }

    await query("DELETE FROM Courses WHERE id = ?", [id]);
    return res.json({ message: "Course deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};

