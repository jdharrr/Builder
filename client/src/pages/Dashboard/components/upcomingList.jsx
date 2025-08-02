import React, { useContext } from 'react';

import { hasExpense } from "../../../utils.jsx";
import {ExpenseContext} from "../contexts/expenseContext.jsx";

import '../css/upcomingList.css';

export const UpcomingList = ({ numDays }) => {
    const { expenses } = useContext(ExpenseContext);

    const currentYear = new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeekDay = new Date().getDay();
    const currentDay = new Date().getDate();

    const days = [];
    for (let i = currentDay; i <= currentDay + numDays - 1; i++) {
        days.push(i <= daysInMonth ? i : i - daysInMonth);
    }

    const handleChange = (e) => {
        if (e.target.checked) {
            //
        } else {
            //
        }
    }

    return (
      <div className='upcomingListWrapper'>
          <h1>{months.at(currentMonth)}</h1>
          <div className='upcomingList'>
              {days.map((day, idx) => (
                  <div className='upcomingDay' key={day}>
                      <div>
                          {weekDays.at((currentWeekDay + idx) % 7)} {day} {hasExpense(day, expenses, currentMonth, currentYear) ? 'Expense' : ''}
                      </div>
                      <input className='upcomingCheckbox' type='checkbox' onChange={handleChange} />
                  </div>
              ))}
          </div>
      </div>
    );
}