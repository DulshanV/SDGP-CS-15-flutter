import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { formatError } from "../services/api";

const initialForm = {
  title: "",
  videoUrl: "",
  position: 1
};

function ManageLessonsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [courseResponse, lessonsResponse] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/lessons/${courseId}`)
      ]);
      setCourse(courseResponse.data);
      setLessons(lessonsResponse.data);
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
        await api.put(`/lessons/manage/${editingId}`, {
          ...formData,
          position: Number(formData.position)
        });
      } else {
        await api.post("/lessons", {
          courseId: Number(courseId),
          ...formData,
          position: Number(formData.position)
        });
      }

      setFormData(initialForm);
      setEditingId(null);
      await loadData();
    } catch (requestError) {
      setError(formatError(requestError));
    }
  };

  const startEdit = (lesson) => {
    setEditingId(lesson.id);
    setFormData({
      title: lesson.title,
      videoUrl: lesson.video_url,
      position: lesson.position
    });
  };

  const removeLesson = async (lessonId) => {
    const confirmed = window.confirm("Delete this lesson?");
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/lessons/manage/${lessonId}`);
      await loadData();
    } catch (requestError) {
      setError(formatError(requestError));
    }
  };

  if (loading) {
    return <div className="center-panel">Loading lessons...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Lesson Management</p>
            <h2>{course?.title}</h2>
            <p>Add lesson titles and video URLs in the order students should follow.</p>
          </div>
        </div>

        <form className="inline-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Lesson title"
            required
          />
          <input
            type="url"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="Video URL"
            required
          />
          <input
            type="number"
            min="1"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="Order"
            required
          />
          <button type="submit" className="primary-button">
            {editingId ? "Update Lesson" : "Add Lesson"}
          </button>
        </form>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="stack-list">
          {lessons.length ? (
            lessons.map((lesson) => (
              <article key={lesson.id} className="list-card compact">
                <div>
                  <h3>{lesson.position}. {lesson.title}</h3>
                  <p>{lesson.video_url}</p>
                </div>
                <div className="table-actions">
                  <button type="button" className="text-button" onClick={() => startEdit(lesson)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => removeLesson(lesson.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-panel">No lessons yet for this course.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManageLessonsPage;
