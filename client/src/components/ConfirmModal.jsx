import React from 'react';
import '../css/confirmModal.css';

export const ConfirmModal = ({
    title = 'Confirm',
    message,
    confirmLabel = 'Yes',
    cancelLabel = 'No',
    onConfirm,
    onCancel,
    onClose,
    className = ''
}) => {
    const modalClassName = `modal show d-block confirm-modal ${className}`.trim();

    return (
        <div className={modalClassName}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            x
                        </button>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            {cancelLabel}
                        </button>
                        <button type="button" className="btn btn-primary" onClick={onConfirm}>
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
