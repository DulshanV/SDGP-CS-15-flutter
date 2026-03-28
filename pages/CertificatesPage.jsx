import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { formatError, resolveFileUrl } from "../services/api";

function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const response = await api.get(`/certificates/${user.id}`);
        setCertificates(response.data);
      } catch (requestError) {
        setError(formatError(requestError));
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadCertificates();
    }
  }, [user?.id]);

  if (loading) {
    return <div className="center-panel">Loading certificates...</div>;
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <p className="eyebrow">Certificates</p>
        <h2>Your issued completion certificates</h2>
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="stack-list">
        {certificates.length ? (
          certificates.map((certificate) => (
            <article key={certificate.id} className="list-card">
              <div>
                <h3>{certificate.course_title}</h3>
                <p>Issued on {new Date(certificate.issued_at).toLocaleDateString()}</p>
              </div>
              <a
                className="primary-button inline-action"
                href={resolveFileUrl(certificate.certificate_url)}
                target="_blank"
                rel="noreferrer"
              >
                Download PDF
              </a>
            </article>
          ))
        ) : (
          <div className="empty-panel">No certificates yet. Complete a course to unlock one.</div>
        )}
      </div>
    </div>
  );
}

export default CertificatesPage;
