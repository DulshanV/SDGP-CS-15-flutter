const certificateGenerator = require("../utils/certificateGenerator.js");
const db = require("../db.js");

const { ensureCertificateRecord } = certificateGenerator;
const { query } = db;

async function generateCertificate(req, res, next) {
  try {
    const { courseId, userId } = req.body;
    const targetUserId = req.user.role === "admin" && userId ? userId : req.user.id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    const certificate = await ensureCertificateRecord(targetUserId, courseId);
    return res.status(201).json(certificate);
  } catch (error) {
    return next(error);
  }
}

async function getCertificates(req, res, next) {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin" && Number(userId) !== req.user.id) {
      return res.status(403).json({ message: "You cannot view another user's certificates." });
    }

    const certificates = await query(
      `SELECT
          cert.id,
          cert.user_id,
          cert.course_id,
          cert.certificate_url,
          cert.issued_at,
          c.title AS course_title
       FROM Certificates cert
       INNER JOIN Courses c ON c.id = cert.course_id
       WHERE cert.user_id = ?
       ORDER BY cert.issued_at DESC`,
      [userId]
    );

    return res.json(certificates);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  generateCertificate,
  getCertificates
};

