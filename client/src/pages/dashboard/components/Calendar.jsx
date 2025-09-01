import React, {useState, useEffect, useContext} from 'react';

import { Selector } from "./Selector.jsx"
import {CreateExpenseFormContext} from "../../../providers/expenses/CreateExpenseFormContext.jsx";
import {ViewExpensesModalContext} from "../../../providers/expenses/ViewExpensesModalContext.jsx";

import '../css/calendar.css';

export const Calendar = ({expenses, selectedYear, selectedMonth}) => {
    const { setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);
    const { setShowViewExpensesModal } = useContext(ViewExpensesModalContext);

    const actionOptions = ['View Expenses', 'Create Expense'];
    const [showActionSelector, setShowActionSelector] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const [emptyDaysInMonth, setEmptyDaysInMonth] = useState([]);

    useEffect(() => {
        const emptyDays = [];
        const firstDayOfFirstWeek = new Date(selectedYear, selectedMonth, 1).getDay();
        for (let i = 0; i < firstDayOfFirstWeek; i++) {
            emptyDays.push('');
        }

        setEmptyDaysInMonth(emptyDays);
    }, [selectedMonth, selectedYear]);

    const handleDayClick = (e) => {
        const date = e.currentTarget.dataset.fulldate;
        if (!date) return;

        setSelectedDate(date);
        setShowActionSelector(true);
    }

    const handleActionChange = async (e) => {
        setShowActionSelector(false);

        const option = e.target.value;
        if (option === 'View Expenses') {
            setShowViewExpensesModal((prevState) => ({
                ...prevState,
                expenses: expenses[selectedDate],
                isShowing: true,
                date: selectedDate
            }));
        } else if (option === 'Create Expense') {
            setShowCreateExpenseForm((prevState) => ({
                ...prevState,
                isShowing: true,
                date: selectedDate
            }));
        }
    }

    const handleActionSelectorClose = () => {
        setShowActionSelector(false);
    }

    return (
        <div className="calendar">
            <div className='calendarHeader col-md'>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                    <strong key={day}>{day}</strong>
                ))}
            </div>
            <div className='calendarGrid'>
                {emptyDaysInMonth.map((_, idx) => (
                    <div
                        className='dayBox'
                        key={idx}
                        style={{backgroundColor:'#f0f0f0'}}
                    ></div>
                ))}
                {Object.entries(expenses).map(([date, expensesForDate], idx) => (
                    <div
                        className='dayBox'
                        key={idx + emptyDaysInMonth.length - 1}
                        data-fulldate={date}
                        style={{backgroundColor: expensesForDate.length > 0 ? 'pink' : '#fff'}}
                        onClick={handleDayClick}
                    >
                        <div>
                            { Number(date.substring(8, 10)) }
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
    );
}