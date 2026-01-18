import React, {useEffect, useRef, useState} from 'react';
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import {getLateDatesForExpense, getPaymentsForExpense, payAllOverdueDatesForExpense} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {showError, showSuccess} from "../utils/toast.js";
import {validateDueDate} from "../util.jsx";

export const ExpensePaymentInputModal = ({handleSave, handleClose, expense, preSelectedDueDate = null}) => {
    const navigate = useNavigate();
    const qc = useQueryClient()

    const [selectedDatePaid, setSelectedDatePaid] = useState(new Date().toISOString().substring(0,10));
    const [selectedDueDatePaid, setSelectedDueDatePaid] = useState(new Date().toISOString().substring(0,10));
    const [invalidDueDate, setInvalidDueDate] = useState(false);
    const [paymentExists, setPaymentExists] = useState(false);

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

    useEffect(() => {
        if (expense.recurrenceRate !== 'once' && !preSelectedDueDate) {
            handleSelectedDueDatePaidChange(selectedDueDatePaid);
        }
    }, [])

    const { data: lateDates = [] } = useQuery({
        queryKey: ['lateDates', expense.id],
        queryFn: async () => {
            return await getLateDatesForExpense(expense.id) ?? [];
        },
        staleTime: 0,
        enabled: expense.recurrenceRate !== 'once' && !preSelectedDueDate,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        },
    });

    const { data: existingPayments = [] } = useQuery({
        queryKey: ['existingPayments', expense.id],
        queryFn: async () => {
            return await getPaymentsForExpense(expense.id) ?? [];
        },
        staleTime: 0,
        enabled: expense.recurrenceRate !== 'once' && !preSelectedDueDate,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        },
    });

    const handleSaveClick = () => {
        if (invalidDueDate) {
            showError('Please enter a valid due date');
            return;
        }

        if (preSelectedDueDate) {
            handleSave(selectedDatePaid, preSelectedDueDate);
        } else if (expense.recurrenceRate === 'once') {
            handleSave(selectedDatePaid, expense.startDate);
        } else {
            handleSave(selectedDatePaid, selectedDueDatePaid);
        }
    }

    const handleSelectedDueDatePaidChange = (selectedDate) => {
        const validation = validateDueDate(selectedDate, expense, existingPayments);

        setSelectedDueDatePaid(selectedDate);
        setPaymentExists(validation.error === 'PAYMENT_EXISTS');
        setInvalidDueDate(!validation.valid && validation.error !== 'PAYMENT_EXISTS');
    }

    const handlePayAllOverdue = async () => {
        try {
            const result = await payAllOverdueDatesForExpense(expense.id);
            showSuccess(`Successfully paid ${result.count} overdue date(s)!`);
            await qc.refetchQueries({ queryKey: ['upcomingExpenses']});
            // TODO: not refreshing next due date on table
            await qc.refetchQueries({ queryKey: ['AllExpenses']});
            handleClose();
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            } else {
                showError('Failed to pay all overdue dates');
            }
        }
    };

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
                    </div>
                    <div className="modal-body">
                        {(expense.recurrenceRate !== 'once' && !preSelectedDueDate) &&
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
                                            <div key={idx} className="payment-date-pill">
                                                {date}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="modal-empty">No late expenses.</p>
                                )}
                            </div>
                        }
                        {(expense.recurrenceRate !== 'once' && !preSelectedDueDate) &&
                            <div className="payment-section">
                                <label className={'form-label'}>Select a due date to mark as paid</label>
                                <input className={'form-control'} type={'date'} value={selectedDueDatePaid} onChange={(e) => handleSelectedDueDatePaidChange(e.target.value)} />
                                {invalidDueDate &&
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
                        {expense.recurrenceRate !== 'once' && lateDates.length > 0 && (
                            <button type="button" className="btn btn-warning" onClick={handlePayAllOverdue}>
                                Pay All {lateDates.length} Overdue
                            </button>
                        )}
                        <button type="button" className="btn btn-primary" disabled={(invalidDueDate || paymentExists)} onClick={handleSaveClick}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
