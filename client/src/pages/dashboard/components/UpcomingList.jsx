import React from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {OverlayTrigger, Tooltip} from "react-bootstrap";

import {getUpcomingExpenses, updateExpensePaidStatus} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";

import '../css/upcomingList.css';
import '../../../css/global.css';

export const UpcomingList = () => {
    const navigate = useNavigate();

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

    const togglePaid = useTogglePaid(navigate);
    const handlePaidStatusChange = async (e, date, expense) => {
        console.log(date)
         togglePaid.mutate({
             expenseId: expense.id,
             date: date,
             checked: e.target.checked,
         });
    }

    return (
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
                                <span className="form-text me-2">Paid today?</span>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    disabled={togglePaid.isPending}
                                    checked={!!expense.dueDatePaid}
                                    onChange={(e) => handlePaidStatusChange(e, date, expense)}
                                />
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

const useTogglePaid = (navigate) => {
    const qc = useQueryClient();
    const queryKey = ['upcomingExpenses'];

    return useMutation({
        mutationFn: ({expenseId, checked, date}) =>
            updateExpensePaidStatus(expenseId, checked, date),

        // optimistic update
        onMutate: async ({expenseId, checked, date}) => {
            await qc.cancelQueries({queryKey: queryKey});

            const previous = qc.getQueryData(queryKey);

            qc.setQueryData(queryKey, (old) => {
                if (!old) return old;
                const dueDatePaid = checked ? date : null;

                const updatedExpenses = Object.entries(old).map(([d, exps]) => [
                    d,
                    d === date
                        ? exps.map((x) =>
                            x.id === expenseId ? { ...x, dueDatePaid: dueDatePaid } : x
                        )
                        : exps,
                ]);

                return Object.fromEntries(updatedExpenses);
            });

            // pass previous data to onError for rollback
            return { previous };
        },

        onError: (err, _vars, ctx) => {
            if (getStatus(err) === 401) navigate('/login');
            if (ctx?.previous) {
                qc.setQueryData(queryKey, ctx.previous);
            }
        },

        onSettled: () => {
            qc.refetchQueries({ queryKey: queryKey });
        },
    });
}