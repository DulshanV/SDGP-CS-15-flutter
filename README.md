# Sri Lankan Customs E-Learning Platform

Full-stack web application for Sri Lankan Customs training with:

- JWT-based authentication for students and admins
- Course creation and management
- Enrollment request approval flow
- Lesson videos and MCQ quizzes
- Progress tracking
- PDF certificate generation
- Student and admin dashboards

## Project Structure

```text
/e-learning-backend   Express API + MySQL schema + certificate generation
/e-learning-frontend  React + React Router + Axios client
```

## Backend Setup

1. Copy [e-learning-backend/.env.example](e-learning-backend/.env.example) to `e-learning-backend/.env`.
2. Update MySQL credentials and `JWT_SECRET`.
3. Run the schema in [e-learning-backend/schema.sql](e-learning-backend/schema.sql).
4. Install dependencies and start the API:

```bash
cd e-learning-backend
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

## Frontend Setup

1. Copy [e-learning-frontend/.env.example](e-learning-frontend/.env.example) to `e-learning-frontend/.env` if you want to override the API URL.
2. Install dependencies and start the React app:

```bash
cd e-learning-frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Notes

- Admin registration requires the `ADMIN_REGISTRATION_KEY` value from the backend environment file.
- Certificates are stored under `e-learning-backend/certificates/`.
- An extra `LessonProgress` table is included so video completion and course progress work cleanly.
