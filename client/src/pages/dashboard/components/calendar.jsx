import React, {useState, useContext } from 'react';

import { MonthYearSelector } from './monthYearSelector.jsx';
import {ExpenseContext} from "../providers/expenses/expenseContext.jsx";
import { CalendarDateContext } from "../providers/calendarDate/calendarDateContext.jsx";
import { hasExpense } from "../../../utils.jsx";
import {CreateExpenseForm} from "./createExpenseForm.jsx";
import { Selector } from "./selector.jsx"
import { ViewExpensesModal } from './viewExpensesModal.jsx';

import '../css/calendar.css';

export const Calendar = () => {
    const { expenses } = useContext(ExpenseContext);
    const { selectedCalendarMonthYear, setCalendarSelectedMonthYear } = useContext(CalendarDateContext);

    const [showViewExpensesModal, setShowViewExpensesModal] = useState({isShowing: false, expenses: null});
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const actionOptions = ['View Expenses', 'Create Expense'];
    const [showActionSelector, setShowActionSelector] = useState(false);

    const currentYear = new Date().getFullYear();
    const monthName = new Date(selectedCalendarMonthYear.year, selectedCalendarMonthYear.month).toLocaleString('default', { month: 'long' });

    const dates = buildDatesArray(selectedCalendarMonthYear.year, selectedCalendarMonthYear.month);

    const handleDayClick = (e) => {
        const date = e.currentTarget.dataset.fulldate;
        if (!date) return;

        setSelectedDate(date);
        setShowActionSelector(true);
    }

    const handleActionChange = (e) => {
        const option = e.target.value;
        if (option === 'View Expenses') {
            const expensesForDay = getExpensesForDay(selectedDate, expenses);
            setShowViewExpensesModal((prevState) => ({
                ...prevState,
                isShowing: true,
                expenses: expensesForDay
            }));
        } else if (option === 'Create Expense') {
            setShowExpenseForm(true);
        }

        setShowActionSelector(false);
    }

    const handleActionSelectorClose = () => {
        setShowActionSelector(false);
    }

    const handleViewExpensesModalClose = () => {
        setShowViewExpensesModal({isShowing: false, expenses: null});
    }

    const handleViewExpensesModalAddExpense = () => {
        setShowViewExpensesModal({isShowing: false, expenses: null});
        setShowExpenseForm(true);
    }

    return (
        <>
            <div className="calendarWrapper">
                <MonthYearSelector
                    currentYear={currentYear}
                    selectedYear={selectedCalendarMonthYear.year}
                    selectedMonth={selectedCalendarMonthYear.month}
                    setSelectedMonthYear={setCalendarSelectedMonthYear}
                />
                <h2>{monthName} {selectedCalendarMonthYear.year}</h2>
                <div className="calendar">
                    <div className='calendarHeader'>
                       {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                          <strong key={day}>{day}</strong>
                       ))}
                    </div>
                    <div className='calendarGrid'>
                       {dates.map((date, idx) => (
                           <div
                               className='dayBox'
                               key={idx}
                               data-fulldate={date}
                               style={{backgroundColor: date ? '#fff' : '#f0f0f0'}}
                               onClick={handleDayClick}
                           >
                               <div>
                                    {date && Number(date.substring(8, 10))}{hasExpense(date, expenses) && '...'}
                               </div>
                               {showActionSelector && selectedDate === date &&
                                   <div className='selectorWrapper'>
                                       <Selector options={actionOptions} handleSelect={handleActionChange} handleClose={handleActionSelectorClose} />
                                   </div>
                               }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            { showExpenseForm && <CreateExpenseForm date={selectedDate} setShowExpenseForm={setShowExpenseForm} /> }
            { showViewExpensesModal.isShowing && <ViewExpensesModal expenses={showViewExpensesModal.expenses} handleClose={handleViewExpensesModalClose} handleAddExpense={handleViewExpensesModalAddExpense} date={selectedDate} />}
        </>
    );
}

const buildDatesArray = (year, month) => {
    const date = new Date(year, month, 1);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const dates = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        dates.push('');
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const nextDate = new Date(date.getFullYear(), date.getMonth(), i);
        dates.push(nextDate.toISOString().substring(0, 10));
    }

    return dates;
}

const getExpensesForDay = (selectedDate, expenses) => {
    let expensesArray = [];
    if (Array.isArray(expenses)) {
        expensesArray = expenses;
    } else if (expenses) {
        expensesArray = [expenses];
    }

    const expensesForDay = [];
    expensesArray.forEach(expense => {
        const formattedDueDate = expense.next_due_date.substring(0, 10);
        if (formattedDueDate === selectedDate) {
            expensesForDay.push(expense);
        }
    })

    return expensesForDay;
}