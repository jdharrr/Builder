import React, {useState, useContext, useEffect} from 'react';
import {useNavigate} from "react-router-dom";

import { MonthYearSelector } from './monthYearSelector.jsx';
import {ExpenseContext} from "../../../providers/expenses/expenseContext.jsx";
import {CreateExpenseForm} from "../../../components/createExpenseForm.jsx";
import { Selector } from "./selector.jsx"
import { ViewExpensesModal } from './viewExpensesModal.jsx';
import {fetchExpensesForCalendar, getExpensesForDate} from "../../../api.jsx";
import {RefreshExpenseContext} from "../../../providers/expenses/refreshExpensesContext.jsx";

import '../css/calendar.css';
import '../../../css/global.css';

export const Calendar = () => {
    const { expenses } = useContext(ExpenseContext);
    const { refreshExpenses } = useContext(RefreshExpenseContext);
    const navigate = useNavigate();

    const [showViewExpensesModal, setShowViewExpensesModal] = useState({isShowing: false, expenses: [], isLoading: false});
    const [showCreateExpenseForm, setShowCreateExpenseForm] = useState(false);
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
    }, [selectedYear, selectedMonth, navigate, refreshExpenses]);

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
                isShowing: true,
                isLoading: true,
            }));

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
                expenses: expensesForDate,
                isLoading: false
            }));
        } else if (option === 'Create Expense') {
            setShowCreateExpenseForm(true);
        }
    }

    const handleActionSelectorClose = () => {
        setShowActionSelector(false);
    }

    const handleViewExpensesModalAddExpense = () => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: [],
            isLoading: false
        }));
        setShowCreateExpenseForm(true);
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
            { showCreateExpenseForm &&
                <CreateExpenseForm
                    date={selectedDate}
                    setShowCreateExpenseForm={setShowCreateExpenseForm}
                    includeStartDateInput={false}
                />
            }
            { showViewExpensesModal.isShowing &&
                <ViewExpensesModal
                    expenses={showViewExpensesModal.expenses}
                    handleAddExpense={handleViewExpensesModalAddExpense}
                    date={selectedDate}
                    setShowViewExpensesModal={setShowViewExpensesModal}
                    isLoading={showViewExpensesModal.isLoading}
                />
            }
        </>
    );
}