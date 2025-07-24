import React, { useState, useContext } from 'react';

import { MonthYearSelector } from './monthYearSelector.jsx';
import { ExpenseFormContext } from '../contexts/expenseFormContext.jsx';

import '../css/calendar.css';

export const Calendar = () => {
    const { setShowExpenseForm } = useContext(ExpenseFormContext);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

    const monthName = new
        Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })
    ;

    const days = [];
    // Add empty strings for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push('');
    }
    // Add actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const handleDayClick = (e) => {
        const day = e.target.innerText;
        if (!day) return;

        setShowExpenseForm({ showing: true, day: day });
    };

    return (
        <div className="calendarWrapper">
            <MonthYearSelector
                currentYear={currentYear}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
            />
            <h2>{monthName} {selectedYear}</h2>
            <div className="calendar">
                <div className='calendarHeader'>
                   {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                      <strong key={day}>{day}</strong>
                   ))}
                </div>
                <div className='calendarGrid'>
                   {days.map((day, idx) => (
                       <div
                           className='dayBox'
                           key={idx} style={{backgroundColor: day ? '#fff' : '#f0f0f0'}}
                           onClick={handleDayClick}
                       >
                           {day}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}