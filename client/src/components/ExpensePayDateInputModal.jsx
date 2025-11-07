import React, {useEffect, useRef, useState} from 'react';
import {useQuery} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

import {getLateDatesForExpense, getPaymentsForExpense} from "../api.jsx";
import {getStatus} from "../util.jsx";

export const ExpensePayDateInputModal = ({handleSave, handleClose, expense, preSelectedDueDate}) => {
    const navigate = useNavigate();

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
            alert('Please enter a valid due date');
            return;
        }

        if (preSelectedDueDate) {
            handleSave(selectedDatePaid, preSelectedDueDate);
        } else if (expense.recurrenceRate !== 'once') {
            handleSave(selectedDatePaid, expense.startDate);
        } else {
            handleSave(selectedDatePaid, selectedDueDatePaid);
        }
    }

    const handleSelectedDueDatePaidChange = (selectedDate) => {
        setPaymentExists(false);
        setInvalidDueDate(false);

        if (existingPayments && existingPayments.some(p => p.dueDatePaid === selectedDate.substring(0,10))) {
            setPaymentExists(true);
            setSelectedDueDatePaid(selectedDate);
            return;
        }

        const selectedYear = Number(selectedDate.substring(0,4));
        const selectedMonth = Number(selectedDate.substring(5,7));
        const selectedDay = Number(selectedDate.substring(8,10));
        const startDateMonth = Number(expense.startDate.substring(5,7));
        const startDateDay = Number(expense.startDate.substring(8,10));
        const oneDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.round((new Date(selectedDate) - new Date(expense.startDate)) / oneDay);
        const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 2, 0).getDate();

        // Verify the due date the user is paying is valid
        if (new Date(selectedDate) < new Date(expense.startDate)
            && (expense.endDate === null || new Date(selectedDate) >= new Date(expense.endDate))) {
            setInvalidDueDate(true);
            setSelectedDueDatePaid(selectedDate);
            return;
        }

        // TODO: fix this digusting code
        if (expense.recurrenceRate === 'daily') {
                setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrenceRate === 'weekly' && diffDays % 7 === 0) {
            setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrenceRate === 'monthly' && expense.dueEndOfMonth && selectedDay === daysInSelectedMonth) {
            setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrenceRate === 'monthly' && selectedDay === startDateDay) {
            setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrenceRate === 'yearly'
                   && selectedMonth === startDateMonth
                   && selectedDay === startDateDay) {
            setSelectedDueDatePaid(selectedDate);
        } else {
            setInvalidDueDate(true);
            setSelectedDueDatePaid(selectedDate);
        }
    }

    return (
        <div className="modal show d-block">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <h5 className="modal-title">Payments started on {expense?.startDate?.substring(0,10)}, recurs {expense.dueEndOfMonth ? 'at the end of every month' : expense.recurrenceRate}</h5>
                    </div>
                    <div className="modal-body">
                        {(expense.recurrenceRate !== 'once' && !preSelectedDueDate) &&
                            <div className={"mb-2"}>
                                <div>
                                    Late Due Dates: {lateDates.length <= 0 ? 'No late expenses!' : ''}
                                </div>
                                {lateDates.length > 0 &&
                                    <div className="list-group list-group-flush">
                                        {lateDates.map((date, idx) => (
                                            <div key={idx} className="list-group-item">
                                                {date}
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>
                        }
                        {(expense.recurrenceRate !== 'once' && !preSelectedDueDate) &&
                            <div>
                                <label className={'form-label mt-1'}>Select a due date to mark as paid:</label>
                                <input className={'form-control'} type={'date'} value={selectedDueDatePaid} onChange={(e) => handleSelectedDueDatePaidChange(e.target.value)} />
                                {invalidDueDate &&
                                    <label className={"form-text text-danger"}>Invalid Date</label>
                                }
                                {paymentExists &&
                                    <label className={'form-text text-danger'}>Payment already exists!</label>
                                }
                            </div>
                        }
                        <form>
                            <label className="form-label">Paid on:</label>
                            <input className={'form-control'} type={'date'} value={selectedDatePaid} onChange={(e) => setSelectedDatePaid(e.target.value)} />
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" disabled={(invalidDueDate || paymentExists)} onClick={handleSaveClick}>Save</button>
                        <button type="button" className="btn btn-primary" onClick={handleClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}