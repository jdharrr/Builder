import React from 'react';
import {useNavigate} from "react-router-dom";

import {updateExpensePaidStatus} from "../../../api.jsx";

import '../css/upcomingList.css';
import '../../../css/global.css';

export const UpcomingList = ({ filteredExpenses, setFilteredExpenses }) => {
    const navigate = useNavigate();

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeekDay = new Date().getDay();

    const handlePaidStatusChange = async (e, date, expense) => {
        const dueDatePaid = e.target.checked ? date : null;
        setFilteredExpenses(prev => {
            return prev.map(([d, exps]) => [
                d,
                d === date
                    ? exps.map(x => x.id === expense.id ? { ...x, due_date_paid: dueDatePaid } : x)
                    : exps
            ]);
        });

        try {
            await updateExpensePaidStatus(expense.id, e.target.checked, date);
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            }
            setFilteredExpenses(prev => {
                return prev.map(([d, exps]) => [
                    d,
                    d === date
                        ? exps.map(x => x.id === expense.id ? { ...x, due_date_paid: dueDatePaid } : x)
                        : exps
                ]);
            });
        }
    }

    return (
        <div className="upcomingList list-group list-group-flush">
          {filteredExpenses.map(([date, expensesForDate], idx) => (
              <div className="list-group-item row" key={date}>
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