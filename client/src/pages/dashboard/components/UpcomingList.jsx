import React, {useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {FaCalendarAlt, FaDollarSign} from 'react-icons/fa';

import {getUpcomingExpenses, payDueDates} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";

import '../css/upcomingList.css';
import '../css/animations.css';
import '../../../css/global.css';
import {ExpensePaymentInputModal} from "../../../components/ExpensePaymentInputModal.jsx";
import {showSuccess, showError} from "../../../utils/toast.js";

export const UpcomingList = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [showExpenseDatePaidModal, setShowExpenseDatePaidModal] = useState(false);
    const [checkedExpense, setCheckedExpense] = useState(null);
    const [checkedDueDate, setCheckedDueDate] = useState(null);
    const [skippingDate, setSkippingDate] = useState(null);

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeekDay = new Date().getDay();

    const { data: upcomingExpenses = [] } = useSuspenseQuery({
        queryKey: ['upcomingExpenses'],
        queryFn: async () => {
            return await getUpcomingExpenses() ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    })

    const handleDateInputSave = async (paymentDate, dueDates, creditCardId) => {
        payDueDateMutation.mutate({ expenseId: checkedExpense.id, dueDates, paymentDate, creditCardId });
    }

    const payDueDateMutation = useMutation({
        mutationFn: ({ expenseId, dueDates, paymentDate, creditCardId }) => payDueDates(expenseId, dueDates, paymentDate, false, creditCardId),
        onSuccess: () => {
            showSuccess('Payment saved!');
            setShowExpenseDatePaidModal(false);
            qc.refetchQueries({ queryKey: ['upcomingExpenses']});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to save payment');
            }
        }
    });

    const skipDueDateMutation = useMutation({
        mutationFn: ({ expenseId, dueDate }) => payDueDates(expenseId, [dueDate], undefined, true),
        onMutate: ({ dueDate }) => {
            setSkippingDate(dueDate);
        },
        onSuccess: () => {
            showSuccess('Payment skipped.');
            qc.refetchQueries({ queryKey: ['upcomingExpenses']});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to skip payment');
            }
        },
        onSettled: () => {
            setSkippingDate(null);
        }
    });

    return (
        <>
            <div className="upcoming-list">
                {Object.entries(upcomingExpenses).map(([date, expensesForDate], idx) => (
                    <div className="date-group" key={date}>
                        <div className="date-header">
                            <FaCalendarAlt className="date-icon" />
                            <span className="date-text">
                                {weekDays.at((currentWeekDay + idx) % 7)} {Number(date.slice(-2))}
                            </span>
                            {expensesForDate.length > 0 && (
                                <span className="expense-count">{expensesForDate.length}</span>
                            )}
                        </div>

                        <div className="expense-items">
                            {expensesForDate.length === 0 ? (
                                <div className="no-expenses">No expenses</div>
                            ) : (
                                expensesForDate.map((expense) => {
                                    const isChecked = showExpenseDatePaidModal
                                        && checkedExpense?.id === expense.id
                                        && checkedDueDate === date;

                                    return (
                                        <div className="expense-item" key={`${date}-${expense.id}`}>
                                            <OverlayTrigger
                                                placement="bottom"
                                                delay={{ show: 500, hide: 100 }}
                                                overlay={<Tooltip>{expense.name}</Tooltip>}
                                            >
                                            <div className="expense-name">
                                                <span className="expense-name-text" title={expense.name}>
                                                    {expense.name}
                                                </span>
                                                {expense.automaticPayments && (
                                                    <span className="expense-scheduled-pill">Scheduled</span>
                                                )}
                                            </div>
                                            </OverlayTrigger>
                                            <div className="expense-amount">
                                                <FaDollarSign className="amount-icon" />
                                                <span>{Number(expense.cost).toFixed(2)}</span>
                                            </div>
                                            <div className="expense-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="custom-checkbox"
                                                    id={`paid-${expense.id}-${date}`}
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        if (isChecked) {
                                                            return;
                                                        }

                                                        setCheckedExpense(expense);
                                                        setCheckedDueDate(date);
                                                        setShowExpenseDatePaidModal(true);
                                                    }}
                                                />
                                                <label className="checkbox-label" htmlFor={`paid-${expense.id}-${date}`}>
                                                    Paid?
                                                </label>
                                                <button
                                                    type="button"
                                                    className="expense-skip-button"
                                                    disabled={skippingDate === date}
                                                    onClick={() => {
                                                        const confirmed = window.confirm('Skip this payment?');
                                                        if (!confirmed) return;
                                                        skipDueDateMutation.mutate({ expenseId: expense.id, dueDate: date });
                                                    }}
                                                >
                                                    {skippingDate === date ? 'Skipping...' : 'Skip'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showExpenseDatePaidModal &&
                <ExpensePaymentInputModal
                    expense={checkedExpense}
                    preSelectedDueDate={checkedDueDate}
                    handleSave={handleDateInputSave}
                    handleClose={() => {
                        setShowExpenseDatePaidModal(false);
                        setCheckedExpense(null);
                        setCheckedDueDate(null);
                    }}
                />
            }
        </>
    );
}
