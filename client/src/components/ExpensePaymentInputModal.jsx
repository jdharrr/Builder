import React, {useEffect, useRef, useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {getLateDatesForExpense, getPaymentsForExpense} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {showError} from "../utils/toast.js";
import {validateDueDate} from "../util.jsx";
import {CreditCardSelect} from "./CreditCardSelect.jsx";

export const ExpensePaymentInputModal = ({handleSave, handleClose, expense, preSelectedDueDate = null}) => {
    const [selectedDatePaid, setSelectedDatePaid] = useState(new Date().toISOString().substring(0,10));
    const [selectedLateDates, setSelectedLateDates] = useState([]);
    const [selectedFutureDates, setSelectedFutureDates] = useState(
        preSelectedDueDate ? [preSelectedDueDate] : []
    );
    const [futureDateInput, setFutureDateInput] = useState(preSelectedDueDate || new Date().toISOString().substring(0,10));
    const [invalidFutureDate, setInvalidFutureDate] = useState(false);
    const [paymentExists, setPaymentExists] = useState(false);
    const todayDateString = new Date().toISOString().substring(0, 10);
    const hasStarted = expense?.startDate && expense.startDate.substring(0, 10) <= todayDateString;
    const [selectedCreditCardId, setSelectedCreditCardId] = useState('');
    const [ignoreCashBack, setIgnoreCashBack] = useState(false);
    const [cashBackOverwriteEnabled, setCashBackOverwriteEnabled] = useState(false);
    const [cashBackOverwrite, setCashBackOverwrite] = useState('');

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest('.Toastify')) {
                return;
            }

            if (document.querySelector('.manage-credit-cards-modal')) {
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

        handleSave(
            selectedDatePaid,
            dueDates,
            selectedCreditCardId || null,
            ignoreCashBack,
            cashBackOverwriteEnabled ? cashBackOverwrite : ''
        );
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

    const dueDatesCount = selectedLateDates.length + selectedFutureDates.length;
    const selectedDueDates = Array.from(new Set([...selectedLateDates, ...selectedFutureDates]));
    const allowDueDateSelection = expense.recurrenceRate !== 'once' && !preSelectedDueDate;

    return (
        <div className="modal show d-block app-modal payment-input-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <div className="payment-modal-title">
                            <span className="payment-modal-eyebrow">Record payment</span>
                            <h5 className="modal-title">
                                {expense?.name ?? 'Expense'} Payment
                            </h5>
                            <span className="payment-modal-meta">
                                {hasStarted ? 'Started' : 'Starts'} {expense?.startDate?.substring(0, 10)}
                            </span>
                            {expense?.automaticPayments ? (
                                <span className="payment-modal-meta">
                                    Automatic payment scheduled for {expense?.nextDueDate?.substring(0, 10) || 'the next due date'}.
                                </span>
                            ) : (
                                <span className="payment-modal-meta">
                                    Next due date on {expense?.nextDueDate?.substring(0, 10) || 'TBD'}.
                                </span>
                            )}
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
                        <div className="expense-input-grid">
                            {!allowDueDateSelection && (
                                <div className="payment-section expense-input-span">
                                    <div className="payment-section-header">
                                        <span className="payment-section-title">Selected due date</span>
                                    </div>
                                    <div className="payment-dates">
                                        {selectedDueDates.map((date) => (
                                            <span className="payment-date-pill" key={date}>{date}</span>
                                        ))}
                                    </div>
                                    <span className="payment-section-description">
                                        This expense is a one-time payment.
                                    </span>
                                </div>
                            )}
                            {allowDueDateSelection &&
                                <div className="payment-section">
                                    <div className="payment-section-header">
                                        <span className="payment-section-title">Late Due Dates</span>
                                        <span className="payment-section-count">
                                            {selectedLateDates.length}/{lateDates.length}
                                        </span>
                                    </div>
                                    <span className="payment-section-description">
                                        Select any past due dates you want to mark as paid.
                                    </span>
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
                            {allowDueDateSelection &&
                                <div className="payment-section">
                                    <div className="payment-section-header">
                                        <span className="payment-section-title">Add a future due date</span>
                                        <span className="payment-section-count">
                                            {selectedFutureDates.length}
                                        </span>
                                    </div>
                                    <span className="payment-section-description">
                                        Add an upcoming due date if you are paying ahead.
                                    </span>
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
                            <div className="payment-section expense-input-span">
                                <div className="payment-section-header">
                                    <span className="payment-section-title">Payment details</span>
                                </div>
                                <span className="payment-section-description">
                                    Set the payment date and optional credit card details.
                                </span>
                                <div className="expense-input">
                                    <label className="form-label">Paid on</label>
                                    <input
                                        className={'form-control'}
                                        type={'date'}
                                        value={selectedDatePaid}
                                        onChange={(e) => setSelectedDatePaid(e.target.value)}
                                    />
                                    <span className="payment-subtext">
                                        {expense.dueEndOfMonth ? 'End of month schedule' : `Recurs ${expense.recurrenceRate}`}
                                    </span>
                                </div>
                                <CreditCardSelect
                                    label="Credit card (optional)"
                                    includeNoneOption={true}
                                    initialValue={selectedCreditCardId || ''}
                                    onChange={(e) => setSelectedCreditCardId(e.target.value)}
                                >
                                    {selectedCreditCardId && (
                                        <>
                                            <div className="credit-card-options-label">Cash back options</div>
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor="ignoreCashBackOnRecord">
                                                    Ignore Cash Back?
                                                </label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id="ignoreCashBackOnRecord"
                                                    checked={ignoreCashBack}
                                                    onChange={() => {
                                                        setIgnoreCashBack((prev) => !prev);
                                                        setCashBackOverwriteEnabled(false);
                                                        setCashBackOverwrite('');
                                                    }}
                                                />
                                            </div>
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor="cashBackOverwriteToggleRecord">
                                                    Cash Back Overwrite?
                                                </label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id="cashBackOverwriteToggleRecord"
                                                    checked={cashBackOverwriteEnabled}
                                                    onChange={() => {
                                                        setCashBackOverwriteEnabled((prev) => !prev);
                                                        setIgnoreCashBack(false);
                                                        if (cashBackOverwriteEnabled) {
                                                            setCashBackOverwrite('');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {cashBackOverwriteEnabled && (
                                                <div className="expense-input">
                                                    <label className={'form-label'}>Cash Back Overwrite percentage</label>
                                                    <input
                                                        className={'form-control'}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={cashBackOverwrite}
                                                        onChange={(e) => setCashBackOverwrite(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CreditCardSelect>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
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
