import React, {useContext, useEffect, useRef} from 'react';
import { FaPen } from 'react-icons/fa';

import {ViewExpensesModalContext} from "../../../providers/expenses/ViewExpensesModalContext.jsx";
import {ViewExpenseModalContext} from "../../../providers/expenses/ViewExpenseModalContext.jsx";
import {CreateExpenseFormContext} from "../../../providers/expenses/CreateExpenseFormContext.jsx";
import {MONTHS} from "../../../constants/dateConstants.js";

import '../css/viewExpensesModal.css'

export const ViewExpensesModal = () => {
    const { showViewExpensesModal, setShowViewExpensesModal } = useContext(ViewExpensesModalContext);
    const { expenses, date } = showViewExpensesModal;
    const { setShowViewExpenseModal } = useContext(ViewExpenseModalContext);
    const { setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowViewExpensesModal((prevState) => ({
                    ...prevState,
                    isShowing: false,
                    expenses: [],
                    date: null
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowViewExpensesModal]);
    
    const handleClose = () => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: [],
            date: null
        }));
    }

    const handleExpenseEditClick = (expense) => {
        console.log('Edit clicked', expense);
    }

    const handleExpenseRowClick = (expense) => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: [],
            date: null
        }))

        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            expense: expense,
            isShowing: true
        }))
    }

    const handleAddExpense = () => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: [],
            date: null,
        }));

        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: true,
            date: date,
        }));
    }

    const month = MONTHS[Number(date.substring(5, 7)) - 1];
    const year = Number(date.substring(0, 4));
    const day = Number(date.substring(8, 10));
    const formatCost = (value) => {
        if (value === null || value === undefined || value === '') return '$0.00';
        if (typeof value === 'number') return `$${value.toFixed(2)}`;
        const trimmed = value.toString().trim();
        return trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
    };
    const formatDate = (value) => {
        if (!value) return 'No due date';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const formatRecurrence = (value) => {
        if (!value) return 'One-time';
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    return (
        <div className="modal show d-block view-expenses-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="modal-title-block">
                            <span className="modal-eyebrow">Expenses for</span>
                            <h5 className="modal-title">{day} {month}, {year}</h5>
                        </div>
                        <span className="modal-count">{expenses.length} item{expenses.length === 1 ? '' : 's'}</span>
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
                                        onClick={() => handleExpenseRowClick(expense)}
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
                        <button type='button' className={'btn btn-primary'} onClick={handleClose}>Close</button>
                        <button type='button' className={'btn btn-primary'} onClick={handleAddExpense}>Add Expense</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
