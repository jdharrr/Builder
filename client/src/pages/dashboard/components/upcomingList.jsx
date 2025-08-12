import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";

import { ExpenseContext } from "../providers/expenses/expenseContext.jsx";
import {getPaymentsForDate, updateExpensePaidStatus} from "../../../api.jsx";
import {deepCopyArray} from "../../../utils.jsx";

import '../css/upcomingList.css';

export const UpcomingList = ({ numDays }) => {
    const navigate = useNavigate();
    const { expenses } = useContext(ExpenseContext);

    const [expensesForDates, setExpensesForDates] = useState({});
    const [refreshExpenseList, setRefreshExpenseList] = useState(false);

    const currentYear = new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeekDay = new Date().getDay();

    useEffect(() => {
        async function loadExpenses() {
            const currentDate = new Date();
            const expForDates = {};
            for (let i = currentDate.getDate(); i <= currentDate.getDate() + numDays - 1; i++) {
                const date = i <= daysInMonth ?
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toISOString() :
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i - daysInMonth).toISOString();

                const formattedDate = date.substring(0, 10);
                expForDates[formattedDate] = await getExpensesForListDate(formattedDate, expenses);
            }

            setExpensesForDates(expForDates);
        }

        loadExpenses();
    }, [daysInMonth, expenses, numDays, refreshExpenseList]);

    const getExpensesForListDate = async (date, expenses) => {
        if (!date) return [];

        const expensesArray = deepCopyArray(expenses);
        const expensesForDate = [];
        expensesArray.forEach(exp => {
            const expDate = new Date(exp.next_due_date.substring(0, 10));
            const targetDate = new Date(date);
            const diffDays = Math.floor((targetDate - expDate) / (1000 * 60 * 60 * 24));
            if (expDate.getFullYear() === targetDate.getFullYear() && expDate.getMonth() === targetDate.getMonth() && expDate.getDate() === targetDate.getDate()) {
                expensesForDate.push(exp);
            } else if (exp.recurrence_rate === 'daily') {
                expensesForDate.push(exp);
            } else if (exp.recurrence_rate === 'weekly' && diffDays % 7 === 0) {
                expensesForDate.push(exp);
            } else if (exp.recurrence_rate === 'monthly' && expDate.getDate() === targetDate.getDate()) {
                expensesForDate.push(exp);
            } else if (exp.recurrence_rate === 'yearly' && expDate.getMonth() === targetDate.getMonth() && expDate.getDate() === targetDate.getDate() ) {
                expensesForDate.push(exp);
            }
        });

        let result = null;
        try {
            result = await getPaymentsForDate(date, expensesForDate);
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            }
        }

        const payments = result?.data;
        if (payments && payments.length) {
            const paymentMap = Object.fromEntries(
                payments.map(p => [p.expense_id, p.due_date_paid])
            );

            expensesForDate.forEach(exp => {
                if (paymentMap[exp.id] !== undefined) {
                    exp.due_date_paid = paymentMap[exp.id];
                }
            });
        }

        return expensesForDate;
    }

    const handlePaidStatusChange = async (e, expense) => {
        try {
            await updateExpensePaidStatus(expense.id, e.target.checked, e.target.closest('.upcomingDay').dataset.fulldate);
            setRefreshExpenseList((prevState) => !prevState);
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            }
        }
    }

    return (
      <div className='upcomingListWrapper'>
          <h1>{months.at(currentMonth)}</h1>
          <div className='upcomingList'>
              {Object.entries(expensesForDates).map(([date, expensesForDate], idx) => (
                  <div className='upcomingDay' key={idx} data-fulldate={date}>
                      <div>
                          {weekDays.at((currentWeekDay + idx) % 7)} {Number(date.substring(8, 10))}
                      </div>
                      {expensesForDate.map((expense) => (
                          <div key={`${date}-${expense.id}`}>
                              <div>
                                  {expense.name}
                              </div>
                              <input className='upcomingCheckbox' type='checkbox' onChange={(e) => handlePaidStatusChange(e, expense)} checked={!!expense.due_date_paid} />
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      </div>
    );
}