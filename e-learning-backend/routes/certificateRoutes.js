const express = require("express");
const {
  generateCertificate,
  getCertificates
} = require("../controllers/certificateController.js");
const { authenticate } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/", authenticate, generateCertificate);
router.get("/:userId", authenticate, getCertificates);

module.exports = router;
