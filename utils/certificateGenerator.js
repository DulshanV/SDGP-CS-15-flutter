const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { query } = require("../db");

function sanitizeFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function createCertificatePdf({ userName, courseTitle, outputPath, issuedAt }) {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);

    doc.rect(25, 25, 545, 792).lineWidth(3).stroke("#1d4d4f");
    doc.fontSize(28).fillColor("#0f172a").text("Certificate of Completion", {
      align: "center"
    });
    doc.moveDown(1.5);
    doc.fontSize(16).fillColor("#475569").text("This certifies that", { align: "center" });
    doc.moveDown(0.6);
    doc.fontSize(26).fillColor("#1d4d4f").text(userName, { align: "center" });
    doc.moveDown(0.8);
    doc.fontSize(16).fillColor("#475569").text("has successfully completed the course", {
      align: "center"
    });
    doc.moveDown(0.6);
    doc.fontSize(22).fillColor("#0f172a").text(courseTitle, { align: "center" });
    doc.moveDown(1.6);
    doc.fontSize(14).fillColor("#334155").text(
      `Issued on ${new Date(issuedAt).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}`,
      { align: "center" }
    );
    doc.moveDown(5);
    doc.fontSize(12).fillColor("#64748b").text("Sri Lankan Customs Training Platform", {
      align: "center"
    });

    doc.end();
  });
}

async function ensureCertificateRecord(userId, courseId) {
  const existing = await query(
    "SELECT id, user_id, course_id, certificate_url, issued_at FROM Certificates WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );

  if (existing.length > 0) {
    return existing[0];
  }

  const enrollments = await query(
    `SELECT e.status, u.name AS user_name, c.title AS course_title
     FROM Enrollments e
     INNER JOIN Users u ON u.id = e.user_id
     INNER JOIN Courses c ON c.id = e.course_id
     WHERE e.user_id = ? AND e.course_id = ?`,
    [userId, courseId]
  );

  if (enrollments.length === 0 || enrollments[0].status !== "completed") {
    const error = new Error("Certificate can only be generated for completed courses.");
    error.statusCode = 400;
    throw error;
  }

  const issuedAt = new Date();
  const fileName = `${sanitizeFileName(enrollments[0].user_name)}-${courseId}-${userId}.pdf`;
  const outputPath = path.join(__dirname, "..", "certificates", fileName);
  const certificateUrl = `/certificates/${fileName}`;

  await createCertificatePdf({
    userName: enrollments[0].user_name,
    courseTitle: enrollments[0].course_title,
    outputPath,
    issuedAt
  });

  const result = await query(
    "INSERT INTO Certificates (user_id, course_id, certificate_url, issued_at) VALUES (?, ?, ?, ?)",
    [userId, courseId, certificateUrl, issuedAt]
  );

  const created = await query(
    "SELECT id, user_id, course_id, certificate_url, issued_at FROM Certificates WHERE id = ?",
    [result.insertId]
  );

  return created[0];
}

module.exports = {
  ensureCertificateRecord
};
