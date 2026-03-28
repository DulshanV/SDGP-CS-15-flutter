import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { formatError } from "../services/api";

function CourseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        setFormData({
          title: response.data.title,
          description: response.data.description
        });
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, isEditMode]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (isEditMode) {
        await api.put(`/courses/${id}`, formData);
      } else {
        await api.post("/courses", formData);
      }

      navigate("/admin/courses");
    } catch (requestError) {
      setError(formatError(requestError));
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="center-panel">Loading course form...</div>;
  }

  return (
    <div className="form-wrapper dashboard-form">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Course Setup</p>
          <h2>{isEditMode ? "Edit Course" : "Add New Course"}</h2>
          <p>Define the course title and description before adding lessons and quizzes.</p>
        </div>

        <label>
          Course Title
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Import Procedures"
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the customs training course"
            rows="6"
            required
          />
        </label>

        {error ? <div className="alert error">{error}</div> : null}

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? "Saving..." : isEditMode ? "Update Course" : "Create Course"}
        </button>
      </form>
    </div>
  );
}

export default CourseFormPage;
