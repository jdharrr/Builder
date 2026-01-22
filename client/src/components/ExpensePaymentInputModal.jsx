import React, {useEffect, useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import {getLateDatesForExpense, getPaymentsForExpense, payAllOverdueDatesForExpense} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {showError, showSuccess} from "../utils/toast.js";
import {validateDueDate} from "../util.jsx";

export const ExpensePaymentInputModal = ({handleSave, handleClose, expense, preSelectedDueDate = null}) => {
    const navigate = useNavigate();
    const qc = useQueryClient()

    const [selectedDatePaid, setSelectedDatePaid] = useState(new Date().toISOString().substring(0,10));
    const [selectedLateDates, setSelectedLateDates] = useState([]);
    const [selectedFutureDates, setSelectedFutureDates] = useState(
        preSelectedDueDate ? [preSelectedDueDate] : []
    );
    const [futureDateInput, setFutureDateInput] = useState(preSelectedDueDate || new Date().toISOString().substring(0,10));
    const [invalidFutureDate, setInvalidFutureDate] = useState(false);
    const [paymentExists, setPaymentExists] = useState(false);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest('.Toastify')) {
                return;
            }

            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose]);

    const { data: lateDates = [] } = useQuery({
        queryKey: ['lateDates', expense.id],
        queryFn: async () => {
            return await getLateDatesForExpense(expense.id) ?? [];
        },
        staleTime: 0,
        enabled: expense.recurrenceRate !== 'once',
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
    });

    const { data: existingPayments = [] } = useQuery({
        queryKey: ['existingPayments', expense.id],
        queryFn: async () => {
            return await getPaymentsForExpense(expense.id) ?? [];
        },
        staleTime: 0,
        enabled: expense.recurrenceRate !== 'once',
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
    });

    useEffect(() => {
        if (expense.recurrenceRate === 'once' && !preSelectedDueDate) {
            setSelectedFutureDates([expense.startDate]);
        }
    }, [expense, preSelectedDueDate]);

    const handleSaveClick = () => {
        if (invalidFutureDate) {
            showError('Please enter a valid future due date');
            return;
        }

        const dueDates = [
            ...selectedLateDates,
            ...selectedFutureDates
        ];

        if (dueDates.length === 0) {
            showError('Select at least one due date.');
            return;
        }

        handleSave(selectedDatePaid, dueDates);
    }

    const handleFutureDateAdd = () => {
        if (!futureDateInput) return;

        if (lateDates.includes(futureDateInput)) {
            if (selectedLateDates.includes(futureDateInput)) {
                showError('That late date is already selected.');
                return;
            }

            setSelectedLateDates((prev) => [...prev, futureDateInput]);
            setInvalidFutureDate(false);
            setPaymentExists(false);
            return;
        }

        const validation = validateDueDate(futureDateInput, expense, existingPayments);
        setPaymentExists(validation.error === 'PAYMENT_EXISTS');
        setInvalidFutureDate(!validation.valid && validation.error !== 'PAYMENT_EXISTS');

        if (!validation.valid) {
            return;
        }

        setSelectedFutureDates((prev) => (
            prev.includes(futureDateInput) ? prev : [...prev, futureDateInput]
        ));
        setSelectedLateDates((prev) => prev.filter((date) => date !== futureDateInput));
    }

    const handleFutureDateRemove = (date) => {
        if (expense.recurrenceRate === 'once') {
            return;
        }
        setSelectedFutureDates((prev) => prev.filter((selected) => selected !== date));
        setPaymentExists(false);
        setInvalidFutureDate(false);
    }

    const handleLateDateToggle = (date, isChecked) => {
        setSelectedLateDates((prev) => {
            if (isChecked) {
                return prev.includes(date) ? prev : [...prev, date];
            }
            return prev.filter((existingDate) => existingDate !== date);
        });
        if (isChecked && selectedFutureDates.includes(date)) {
            setSelectedFutureDates((prev) => prev.filter((selected) => selected !== date));
        }
    }

    const handlePayAllOverdue = async () => {
        payAllOverdueMutation.mutate(expense.id);
    };

    const dueDatesCount = selectedLateDates.length + selectedFutureDates.length;

    const payAllOverdueMutation = useMutation({
        mutationFn: (expenseId) => payAllOverdueDatesForExpense(expenseId),
        onSuccess: (result) => {
            showSuccess(`Successfully paid ${result.count} overdue date(s)!`);
            qc.refetchQueries({ queryKey: ['upcomingExpenses']});
            // TODO: not refreshing next due date on table
            qc.refetchQueries({ queryKey: ['AllExpenses']});
            handleClose();
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to pay all overdue dates');
            }
        }
    });

    return (
        <div className="modal show d-block create-expense-modal payment-input-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <div className="payment-modal-title">
                            <span className="payment-modal-eyebrow">Record payment</span>
                            <h5 className="modal-title">
                                {expense?.name ?? 'Expense'} Payment
                            </h5>
                            <span className="payment-modal-meta">
                                Starts {expense?.startDate?.substring(0, 10)}
                            </span>
                        </div>
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
                        {expense.recurrenceRate !== 'once' && !preSelectedDueDate &&
                            <div className="payment-section">
                                <div className="payment-section-header">
                                    <span className="payment-section-title">Late Due Dates</span>
                                    <span className="payment-section-count">
                                        {lateDates.length}
                                    </span>
                                </div>
                                {lateDates.length > 0 ? (
                                    <div className="payment-dates">
                                        {lateDates.map((date, idx) => (
                                            <label key={idx} className="payment-date-pill payment-date-option">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedLateDates.includes(date)}
                                                    onChange={(e) => handleLateDateToggle(date, e.target.checked)}
                                                />
                                                <span>{date}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="modal-empty">No late expenses.</p>
                                )}
                            </div>
                        }
                        {expense.recurrenceRate !== 'once' && !preSelectedDueDate &&
                            <div className="payment-section">
                                <label className={'form-label'}>Add a future due date</label>
                                <div className="payment-future-row">
                                    <input
                                        className={'form-control'}
                                        type={'date'}
                                        value={futureDateInput}
                                        onChange={(e) => {
                                            setFutureDateInput(e.target.value);
                                            setInvalidFutureDate(false);
                                            setPaymentExists(false);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleFutureDateAdd}
                                    >
                                        Add
                                    </button>
                                </div>
                                {selectedFutureDates.length > 0 && (
                                    <div className="payment-future-list">
                                        {selectedFutureDates.map((date) => (
                                            <div className="payment-future-pill" key={date}>
                                                <span>{date}</span>
                                                <button
                                                    type="button"
                                                    className="payment-future-remove"
                                                    onClick={() => handleFutureDateRemove(date)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {invalidFutureDate &&
                                    <span className="payment-error">Invalid date.</span>
                                }
                                {paymentExists &&
                                    <span className="payment-error">Payment already exists.</span>
                                }
                            </div>
                        }
                        <div className="payment-section">
                            <label className="form-label">Paid on</label>
                            <input className={'form-control'} type={'date'} value={selectedDatePaid} onChange={(e) => setSelectedDatePaid(e.target.value)} />
                            <span className="payment-subtext">
                                {expense.dueEndOfMonth ? 'End of month schedule' : `Recurs ${expense.recurrenceRate}`}
                            </span>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
                        {expense.recurrenceRate !== 'once' && lateDates.length > 0 && !preSelectedDueDate && (
                            <button type="button" className="btn btn-warning" onClick={handlePayAllOverdue}>
                                Pay All {lateDates.length} Overdue
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-success"
                            disabled={(invalidFutureDate || paymentExists)}
                            onClick={handleSaveClick}
                        >
                            Pay Selected ({dueDatesCount})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
