import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { formatError } from "../services/api";

const initialForm = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A"
};

function ManageQuizzesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [courseResponse, quizzesResponse] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/quizzes/${courseId}`)
      ]);
      setCourse(courseResponse.data);
      setQuizzes(quizzesResponse.data);
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/quizzes/manage/${editingId}`, formData);
      } else {
        await api.post("/quizzes", {
          courseId: Number(courseId),
          ...formData
        });
      }

      setFormData(initialForm);
      setEditingId(null);
      await loadData();
    } catch (requestError) {
      setError(formatError(requestError));
    }
  };

  const startEdit = (quiz) => {
    setEditingId(quiz.id);
    setFormData({
      question: quiz.question,
      optionA: quiz.option_a,
      optionB: quiz.option_b,
      optionC: quiz.option_c,
      optionD: quiz.option_d,
      correctAnswer: quiz.correct_answer
    });
  };

  const removeQuiz = async (quizId) => {
    const confirmed = window.confirm("Delete this quiz question?");
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/quizzes/manage/${quizId}`);
      await loadData();
    } catch (requestError) {
      setError(formatError(requestError));
    }
  };

  if (loading) {
    return <div className="center-panel">Loading quizzes...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Quiz Management</p>
            <h2>{course?.title}</h2>
            <p>Create multiple-choice questions for this course.</p>
          </div>
        </div>

        <form className="quiz-form" onSubmit={handleSubmit}>
          <textarea
            name="question"
            value={formData.question}
            onChange={handleChange}
            placeholder="Question"
            rows="3"
            required
          />
          <div className="option-grid two-up">
            <input
              type="text"
              name="optionA"
              value={formData.optionA}
              onChange={handleChange}
              placeholder="Option A"
              required
            />
            <input
              type="text"
              name="optionB"
              value={formData.optionB}
              onChange={handleChange}
              placeholder="Option B"
              required
            />
            <input
              type="text"
              name="optionC"
              value={formData.optionC}
              onChange={handleChange}
              placeholder="Option C"
              required
            />
            <input
              type="text"
              name="optionD"
              value={formData.optionD}
              onChange={handleChange}
              placeholder="Option D"
              required
            />
          </div>
          <select name="correctAnswer" value={formData.correctAnswer} onChange={handleChange}>
            <option value="A">Correct Answer: A</option>
            <option value="B">Correct Answer: B</option>
            <option value="C">Correct Answer: C</option>
            <option value="D">Correct Answer: D</option>
          </select>
          <button type="submit" className="primary-button">
            {editingId ? "Update Question" : "Add Question"}
          </button>
        </form>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="stack-list">
          {quizzes.length ? (
            quizzes.map((quiz) => (
              <article key={quiz.id} className="list-card">
                <div>
                  <h3>{quiz.question}</h3>
                  <p>
                    A. {quiz.option_a} | B. {quiz.option_b} | C. {quiz.option_c} | D. {quiz.option_d}
                  </p>
                  <span className="badge">Correct: {quiz.correct_answer}</span>
                </div>
                <div className="table-actions">
                  <button type="button" className="text-button" onClick={() => startEdit(quiz)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => removeQuiz(quiz.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-panel">No quiz questions yet for this course.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManageQuizzesPage;
