const db = require("../db.js");

const { query } = db;

async function getUsers(req, res, next) {
  try {
    const users = await query(
      `SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.created_at,
          COUNT(DISTINCT e.id) AS enrollments
       FROM Users u
       LEFT JOIN Enrollments e ON e.user_id = u.id
       GROUP BY u.id, u.name, u.email, u.role, u.created_at
       ORDER BY u.created_at DESC`
    );

    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers
};

