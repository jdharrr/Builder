import React, {useEffect, useRef, useState} from 'react';

import '../../../css/createExpenseForm.css';

export const SelectFromListModal = ({list, handleSave, handleClose, title}) => {
    const [selectedIds, setSelectedIds] = useState([]);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSaveClick = () => {
        handleSave(selectedIds);
    }

    const handleCheckboxClick = (checked, id) => {
        if (checked) {
            setSelectedIds((prevState) => [...prevState, id])
        } else {
            setSelectedIds((prev) => prev.filter((existingId) => existingId !== id));
        }
    }

    return (
        <div className="modal show d-block create-expense-modal select-payments-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                    </div>
                    <div className="modal-body">
                        <div className="payment-list">
                            {list && list.length > 0 ? (
                                list.map((item, idx) => (
                                    <label key={idx} className="payment-row">
                                        <div className="payment-row-details">
                                            <span className="payment-row-label">Due date</span>
                                            <span className="payment-row-value">{item.dueDatePaid}</span>
                                            <span className="payment-row-label">Paid on</span>
                                            <span className="payment-row-value">{item.paymentDate}</span>
                                        </div>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={(e) => handleCheckboxClick(e.target.checked, item.id)}
                                        />
                                    </label>
                                ))
                            ) : (
                                <p className="modal-empty">This expense has no payments.</p>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
                        <button
                            type="button"
                            className="btn btn-warning"
                            disabled={selectedIds.length <= 0}
                            onClick={handleSaveClick}
                        >
                            Unpay Selected ({selectedIds.length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
