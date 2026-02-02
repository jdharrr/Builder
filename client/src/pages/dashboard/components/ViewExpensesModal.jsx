import React, {useContext, useEffect, useRef, useState} from 'react';
import { FaPen } from 'react-icons/fa';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import {MONTHS} from "../../../constants/dateConstants.js";
import {updateExpense} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {showError, showSuccess} from "../../../utils/toast.js";
import {EditExpenseModal} from "../../../components/EditExpenseModal.jsx";
import {CreateExpenseFormContext} from "../../../providers/expenses/CreateExpenseFormContext.jsx";
import {formatCost, formatDate, formatRecurrence} from "../utils/expenseFormatters.js";

import '../css/viewExpensesModal.css'

export const ViewExpensesModal = ({expenses, date, handleClose}) => {
    const [viewEditExpenseModal, setViewEditExpenseModal] = useState({isShowing: false, expense: null});
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (viewEditExpenseModal.isShowing) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose, viewEditExpenseModal.isShowing]);

    const handleExpenseEditClick = (expense) => {
        setViewEditExpenseModal({isShowing: true, expense});
    }


    const handleAddExpense = () => {
        handleClose();

        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: true,
            isFab: false,
            date: date,
        }));
    }

    const handleEditExpenseSave = async (expenseId, expenseData) => {
        updateExpenseMutation.mutate({ expenseId, expenseData });
    };

    const updateExpenseMutation = useMutation({
        mutationFn: ({ expenseId, expenseData }) => updateExpense(expenseId, expenseData),
        onSuccess: () => {
            showSuccess('Expense updated successfully!');
            setViewEditExpenseModal({ isShowing: false, expense: null });
            qc.refetchQueries({ queryKey: ['expenseTrackerExpenses'] });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to update expense');
            }
        }
    });

    const month = MONTHS[Number(date.substring(5, 7)) - 1];
    const year = Number(date.substring(0, 4));
    const day = Number(date.substring(8, 10));

    return (
        <>
            <div className="modal show d-block view-expenses-modal app-modal">
                <div className="modal-dialog" ref={wrapperRef}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-title-block">
                                <span className="modal-eyebrow">Expenses for</span>
                                <h5 className="modal-title">{day} {month}, {year}</h5>
                            </div>
                            <span className="modal-count">{expenses.length} item{expenses.length === 1 ? '' : 's'}</span>
                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                x
                            </button>
                        </div>
                        <div className="modal-body">
                            {expenses.length === 0 ? (
                                <div className="modal-empty">No expenses found for this day.</div>
                            ) : (
                                <div className="expense-list">
                                    {expenses.map((expense, idx) => (
                                        <div
                                            key={idx}
                                            className="expense-row"
                                        >
                                            <div className="expense-row-main">
                                                <span className="expense-row-name">{expense.name}</span>
                                                <span className="expense-row-category">{expense.categoryName ?? expense.category}</span>
                                                <div className="expense-row-details">
                                                    <span className="expense-row-detail">
                                                        Next due: {formatDate(expense.nextDueDate)}
                                                    </span>
                                                    <span className="expense-row-detail">
                                                        Recurrence: {formatRecurrence(expense.recurrenceRate)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="expense-row-meta">
                                                <span className="expense-row-amount">{formatCost(expense.cost)}</span>
                                                <button
                                                    type={"button"}
                                                    className="expense-row-edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExpenseEditClick(expense);
                                                    }}
                                                >
                                                    <FaPen size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className='modal-footer'>
                            <button type='button' className={'btn btn-secondary'} onClick={handleClose}>Close</button>
                            <button type='button' className={'btn btn-primary'} onClick={handleAddExpense}>Add Expense</button>
                        </div>
                    </div>
                </div>
            </div>
            {viewEditExpenseModal.isShowing && viewEditExpenseModal.expense &&
                <EditExpenseModal
                    expense={viewEditExpenseModal.expense}
                    handleSave={handleEditExpenseSave}
                    handleClose={() => setViewEditExpenseModal({ isShowing: false, expense: null })}
                />
            }
        </>
    );
}
