export const FormCard = ({ title, onSubmit, children, submitLabel, editMode = false }) => (
  <section className="card">
    <div className="card-header">
      <div>
        <p className="eyebrow">{editMode ? "Edit record" : "Create record"}</p>
        <h2>{title}</h2>
      </div>
    </div>
    <form className="form-grid" onSubmit={onSubmit}>
      {children}
      <button type="submit" className="primary-button">
        {submitLabel}
      </button>
    </form>
  </section>
);
