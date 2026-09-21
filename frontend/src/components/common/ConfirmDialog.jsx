import React from 'react';

function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', confirmDanger = false, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <h2 id="confirm-title" className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={confirmDanger ? 'btn-danger' : 'btn-primary'}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
