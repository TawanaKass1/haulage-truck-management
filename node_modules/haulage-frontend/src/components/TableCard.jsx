export const TableCard = ({ title, subtitle, headers, rows, pagination, onPageChange }) => (
  <section className="card">
    <div className="card-header">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h2>{title}</h2>
      </div>
    </div>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
    <div className="pagination">
      <button
        type="button"
        className="secondary-button"
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Previous
      </button>
      <span>
        Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}
      </span>
      <button
        type="button"
        className="secondary-button"
        disabled={pagination.page >= Math.max(pagination.totalPages || 1, 1)}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </button>
    </div>
  </section>
);
