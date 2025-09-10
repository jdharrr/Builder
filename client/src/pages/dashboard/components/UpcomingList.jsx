import React from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {getUpcomingExpenses, updateExpensePaidStatus} from "../../../api.jsx";

import '../css/upcomingList.css';
import '../../../css/global.css';
import {getStatus} from "../../../util.jsx";

export const UpcomingList = () => {
    const navigate = useNavigate();

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeekDay = new Date().getDay();

    const { data: upcomingExpenses = [] } = useSuspenseQuery({
        queryKey: ['upcomingExpenses', ],
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
         togglePaid.mutate({
             expenseId: expense.id,
             date: date,
             checked: e.target.checked,
         });
    }

    return (
        <div className="upcomingList list-group list-group-flush">
          {Object.entries(upcomingExpenses).map(([date, expensesForDate], idx) => (
              <div className="list-group-item" key={date}>
                  <div className="col-auto fw-medium">
                      {weekDays.at((currentWeekDay + idx) % 7)} {Number(date.slice(-2))}
                  </div>
                  <div className="col-auto">
                      {expensesForDate.length === 0 && (
                          <div className="text-muted small">No expenses</div>
                      )}
                      {expensesForDate.map((expense) => (
                          <div className="row px-2 g-3" key={`${date}-${expense.id}`}>
                              <div className={'col-1'}>•</div>
                              <div className="col-6 text-truncate">
                                  {expense.name}
                              </div>
                              <div className="col-4">
                                  ${Number(expense.cost).toFixed(2)}
                              </div>
                              <div className="col-1">
                                  <input
                                      className="form-check-input"
                                      type="checkbox"
                                      disabled={togglePaid.isPending}
                                      checked={!!expense.due_date_paid}
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
        mutationFn: ({ expenseId, checked, date }) =>
            updateExpensePaidStatus(expenseId, checked, date),

        // optimistic update
        onMutate: async ({ expenseId, checked, date }) => {
            await qc.cancelQueries({ queryKey: queryKey });

            const previous = qc.getQueryData(queryKey);

            qc.setQueryData(queryKey, (old) => {
                if (!old) return old;
                const dueDatePaid = checked ? date : null;

                const updatedExpenses = Object.entries(old).map(([d, exps]) => [
                    d,
                    d === date
                        ? exps.map((x) =>
                            x.id === expenseId ? { ...x, due_date_paid: dueDatePaid } : x
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