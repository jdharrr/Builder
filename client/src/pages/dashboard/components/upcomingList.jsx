import React, { useContext } from 'react';

import { hasExpense } from "../../../utils.jsx";
import {ExpenseContext} from "../providers/expenses/expenseContext.jsx";

import '../css/upcomingList.css';
import {updateExpensePaidStatus} from "../../../api.jsx";

export const UpcomingList = ({ numDays }) => {
    // TODO: Tie expense id to days
    const { expenses, setExpenses } = useContext(ExpenseContext);

    const currentYear = new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeekDay = new Date().getDay();
    const currentDate = new Date();

    const dates = [];
    for (let i = currentDate.getDate(); i <= currentDate.getDate() + numDays - 1; i++) {
        const date = i <= daysInMonth ?
                                   new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toISOString() :
                                   new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i - daysInMonth).toISOString();
        dates.push(date.substring(0, 10));
    }

    const handlePaidStatusChange = async (e) => {
        const expenseId = e.target.value;
        await updateExpensePaidStatus(expenseId, e.target.checked)
            .then(result => {
                const expenseIdx = expenses.findIndex((expense) => expense.id === expenseId);
                const updatedExpenses = Array.from(expenses);
                if (expenseIdx >= 0) {
                    updatedExpenses[expenseIdx] = result.data
                }
                setExpenses(updatedExpenses);
            })
    }

    return (
      <div className='upcomingListWrapper'>
          <h1>{months.at(currentMonth)}</h1>
          <div className='upcomingList'>
              {dates.map((date, idx) => (
                  <div className='upcomingDay' key={idx}>
                      <div>
                          {weekDays.at((currentWeekDay + idx) % 7)} {Number(date.substring(8, 10))} {hasExpense(date, expenses) ? 'Expense' : ''}
                      </div>
                      <input className='upcomingCheckbox' type='checkbox' onChange={handlePaidStatusChange} checked={checkPaidStatus(date, expenses)} />
                  </div>
              ))}
          </div>
      </div>
    );
}

const checkPaidStatus = (date, expenses) => {

}