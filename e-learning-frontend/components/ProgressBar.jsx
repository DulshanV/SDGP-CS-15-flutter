function ProgressBar({ value = 0, label }) {
  return (
    <div className="progress-wrapper">
      <div className="progress-label-row">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
