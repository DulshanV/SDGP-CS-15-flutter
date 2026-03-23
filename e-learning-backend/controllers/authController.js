const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db.js");

const { query } = db;

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, role = "student", adminSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be either student or admin." });
    }

    if (role === "admin" && !process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(500).json({
        message: "Admin registration is not configured. Add ADMIN_REGISTRATION_KEY to backend/.env."
      });
    }

    if (role === "admin" && adminSecret !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({ message: "Invalid admin registration key." });
    }

    const existingUser = await query("SELECT id FROM Users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    const [user] = await query(
      "SELECT id, name, email, role FROM Users WHERE id = ?",
      [result.insertId]
    );

    const token = signToken(user);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const users = await query("SELECT * FROM Users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login
};
