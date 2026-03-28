const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const quizRoutes = require("./routes/quizRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const progressRoutes = require("./routes/progressRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();
const port = Number(process.env.PORT || 5000);
const configuredClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Add it to backend/.env before starting the server.");
}

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        origin === configuredClientUrl ||
        localhostOriginPattern.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));

app.get("/api/health", (req, res) => {
  res.json({ message: "Sri Lankan Customs e-learning API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/progress", progressRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
