import React, {useState, useContext, useEffect} from 'react';
import {useNavigate} from "react-router-dom";

import { MonthYearSelector } from './monthYearSelector.jsx';
import {ExpenseContext} from "../providers/expenses/expenseContext.jsx";
import {CreateExpenseForm} from "./createExpenseForm.jsx";
import { Selector } from "./selector.jsx"
import { ViewExpensesModal } from './viewExpensesModal.jsx';
import {fetchExpensesForCalendar, getExpensesForDate} from "../../../api.jsx";

import '../css/calendar.css';
import '../../../css/global.css';

export const Calendar = () => {
    const { expenses } = useContext(ExpenseContext);
    const navigate = useNavigate();

    const [showViewExpensesModal, setShowViewExpensesModal] = useState({isShowing: false, expenses: null});
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const actionOptions = ['View Expenses', 'Create Expense'];
    const [showActionSelector, setShowActionSelector] = useState(false);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });
    const [emptyDaysInMonth, setEmptyDaysInMonth] = useState([]);
    const [currentExpenses, setCurrentExpenses] = useState({});

    useEffect(() => {
        setCurrentExpenses(JSON.parse(JSON.stringify(expenses)));
    }, [expenses]);

    useEffect(() => {
        async function loadExpenses() {
            try {
                const loadedExpenses = await fetchExpensesForCalendar(selectedMonth + 1, selectedYear);
                setCurrentExpenses(loadedExpenses);
            } catch (err) {
                if (err.status === 401) {
                    navigate('/login');
                }
            }
        }

        loadExpenses();
    }, [selectedYear, selectedMonth, navigate])

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
        const option = e.target.value;
        if (option === 'View Expenses') {
            let expensesForDate = [];
            try {
                expensesForDate = await getExpensesForDate(selectedDate, expenses);
            } catch (err) {
                if (err.status === 401) {
                    navigate('/login')
                }
            }
            setShowViewExpensesModal((prevState) => ({
                ...prevState,
                isShowing: true,
                expenses: expensesForDate
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
                <h2 className={'titleText'}>{monthName} {selectedYear}</h2>
                <MonthYearSelector
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    setSelectedYear={setSelectedYear}
                    setSelectedMonth={setSelectedMonth}
                />
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
                       {Object.entries(currentExpenses).map(([date, expensesForDate], idx) => (
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
            </div>
            { showExpenseForm && <CreateExpenseForm date={selectedDate} setShowExpenseForm={setShowExpenseForm} includeStartDateInput={false} /> }
            { showViewExpensesModal.isShowing && <ViewExpensesModal expenses={showViewExpensesModal.expenses} handleClose={handleViewExpensesModalClose} handleAddExpense={handleViewExpensesModalAddExpense} date={selectedDate} />}
        </>
    );
}