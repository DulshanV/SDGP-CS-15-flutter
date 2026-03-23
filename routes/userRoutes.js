const express = require("express");
const { getUsers } = require("../controllers/userController.js");
const { authenticate, authorize } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getUsers);

module.exports = router;
