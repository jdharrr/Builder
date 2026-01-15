import React, {useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {OverlayTrigger, Tooltip} from "react-bootstrap";

import {getUpcomingExpenses, payDueDate} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";

import '../css/upcomingList.css';
import '../../../css/global.css';
import {ExpensePaymentInputModal} from "../../../components/ExpensePaymentInputModal.jsx";
import {showSuccess, showError} from "../../../utils/toast.js";

export const UpcomingList = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [showExpenseDatePaidModal, setShowExpenseDatePaidModal] = useState(false);
    const [checkedExpense, setCheckedExpense] = useState(null);
    const [checkedDueDate, setCheckedDueDate] = useState(null);

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
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        }
    })

    const handleDateInputSave = async (paymentDate, dueDatePaid) => {
        try {
            await payDueDate(checkedExpense.id, dueDatePaid, paymentDate);
            showSuccess('Payment saved!');
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            } else {
                showError('Failed to save payment');
            }
        }
        setShowExpenseDatePaidModal(false);
        await qc.refetchQueries({ queryKey: ['upcomingExpenses']});
    }

    return (
        <>
            <div className="upcomingList list-group list-group-flush" style={{width: '25rem'}}>
                {Object.entries(upcomingExpenses).map(([date, expensesForDate], idx) => (
                    <div className="list-group-item" key={date}>
                        <div className="fw-medium">
                            {weekDays.at((currentWeekDay + idx) % 7)} {Number(date.slice(-2))}
                        </div>
                        <div>
                        {expensesForDate.length === 0 && (
                            <div className="text-muted small">No expenses</div>
                        )}
                        {expensesForDate.map((expense) => (
                            <div
                                className="px-2 py-1"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 1fr 6rem 6rem",
                                    alignItems: "center",
                                    columnGap: "0.5rem",
                                }}
                                key={`${date}-${expense.id}`}
                            >
                                <div>•</div>
                                <OverlayTrigger
                                    placement="bottom"
                                    delay={{ show: 500, hide: 100 }}
                                    style={{
                                        backgroundColor: "#f8f9fa",
                                        color: "#212529",
                                        border: "1px solid #dee2e6",
                                        fontSize: "0.85rem",
                                    }}
                                    overlay={<Tooltip>{expense.name}</Tooltip>}
                                >
                                    <div className="flex-grow-1 text-truncate me-2" style={{minWidth: '8rem'}}>{expense.name}</div>
                                </OverlayTrigger>
                                <div>
                                    ${Number(expense.cost).toFixed(2)}
                                </div>
                                <div className="d-flex justify-content-end align-items-center">
                                    <label className="form-label me-2" htmlFor={`paid-${expense.id}-${date}`}>Paid?</label>
                                    <input
                                        className="form-check-input"
                                        type="checkbox" //TODO: uncheck on cancel payment
                                        id={`paid-${expense.id}-${date}`}
                                        onChange={() => {
                                            setCheckedExpense(expense);
                                            setCheckedDueDate(date)
                                            setShowExpenseDatePaidModal(true)
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                ))}
            </div>

            {showExpenseDatePaidModal &&
                <ExpensePaymentInputModal expense={checkedExpense} preSelectedDueDate={checkedDueDate} handleSave={handleDateInputSave} handleClose={() => {
                        setShowExpenseDatePaidModal(false)
                        setCheckedExpense(null);
                        setCheckedDueDate(null);
                    }}
                />
            }
        </>
    );
}