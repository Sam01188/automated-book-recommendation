export function AppModal({
  title,
  message,
  confirmText = "OK",
  cancelText,
  onConfirm,
  onCancel,
  variant = "default"
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
      <div className={`app-modal app-modal-${variant}`}>
        <h3 id="app-modal-title">{title}</h3>
        {message && <p>{message}</p>}

        <div className="modal-actions">
          {cancelText && (
            <button className="secondary-button" type="button" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className="primary-button" type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
