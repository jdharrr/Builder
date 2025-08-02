import React, {useState, useContext, useEffect, useRef} from 'react';

import { MonthYearSelector } from './monthYearSelector.jsx';
import {ExpenseContext} from "../contexts/expenseContext.jsx";
import {RefreshExpensesContext} from "../contexts/refreshExpensesContext.jsx";
import { hasExpense } from "../../../utils.jsx";
import {CreateExpenseForm} from "./createExpenseForm.jsx";
import { Selector } from "./selector.jsx"

import '../css/calendar.css';

export const Calendar = () => {
    const { expenses } = useContext(ExpenseContext);
    const { setRefreshExpenses } = useContext(RefreshExpensesContext);

    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const actionOptions = ['View Expenses', 'Create Expense'];
    const [showActionSelector, setShowActionSelector] = useState({isShowing: false, day: null});

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });

    const days = buildDaysArray(firstDayOfWeek, daysInMonth);

    const didMount = useRef(false);
    useEffect(() => {
        if (didMount.current) {
            setRefreshExpenses((prevState) => !prevState);
        } else {
            didMount.current = true;
        }
    }, [selectedYear, selectedMonth]);

    const handleDayClick = (e) => {
        let day = e.target.innerText;
        if (!day) return;

        if (day.length > 2) {
            day = day.substring(0, day.indexOf('.'));
        }

        setSelectedDate(day);
        setShowActionSelector((prevState) => ({
            ...prevState,
            isShowing: true,
            day: day,
        }));
    }

    const handleOptionChange = (e) => {
        const option = e.target.value;
        if (option === 'View Expenses') {
            getExpensesForDay(selectedDate);
        } else if (option === 'Create Expense') {
            setShowExpenseForm(true);
        }

        setShowActionSelector({isShowing: false, day: null});
    }

    const handleClose = () => {
        setShowActionSelector({isShowing: false, day: null});
    }

    return (
        <>
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
                               key={idx}
                               style={{backgroundColor: day ? '#fff' : '#f0f0f0'}}
                               onClick={handleDayClick}
                           >
                               <div>
                                    {hasExpense(day, expenses, selectedMonth, selectedYear) ? day + '...' : day}
                               </div>
                               {showActionSelector.isShowing && showActionSelector.day == day &&
                                   <div className='selectorWrapper'>
                                       <Selector options={actionOptions} handleSelect={handleOptionChange} handleClose={handleClose} />
                                   </div>
                               }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            { showExpenseForm && <CreateExpenseForm day={selectedDate} month={selectedMonth} year={selectedYear} setShowExpenseForm={setShowExpenseForm} /> }
        </>
    );
}

const buildDaysArray = (firstDayOfWeek, daysInMonth) => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push('');
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return days;
}

const getExpensesForDay = (selectedDate) => {

}