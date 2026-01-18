import React, {useContext, useEffect, useRef} from 'react';

import {ViewExpenseModalContext} from "../providers/expenses/ViewExpenseModalContext.jsx";
import '../css/viewExpenseModal.css';

export const ViewExpenseModal = () => {
    const {showViewExpenseModal, setShowViewExpenseModal} = useContext(ViewExpenseModalContext);
    const {expense} = showViewExpenseModal;

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowViewExpenseModal((prevState) => ({
                   ...prevState,
                   isShowing: false,
                   expense: {}
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowViewExpenseModal]);

    const handleClose= () => {
        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expense: {}
        }));
    }

    const recurrenceLabel = expense.recurrenceRate
        ? expense.recurrenceRate.charAt(0).toUpperCase() + expense.recurrenceRate.slice(1).toLowerCase()
        : 'One-time';

    return (
        <div className="modal show d-block view-expense-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title expense-modal-title">Expense Details</h5>
                    </div>
                    <div className="modal-body">
                        <div className="expense-modal-summary">
                            <span className="expense-modal-name">{expense.name}</span>
                            <span className="expense-modal-amount">{expense.cost}</span>
                        </div>
                        <div className="expense-modal-meta">
                            <span className="expense-modal-label">Recurrence</span>
                            <span className="expense-modal-chip">{recurrenceLabel}</span>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={handleClose}>Close</button>
                        <button className="btn btn-primary">Edit</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
