import React, {useState, useEffect, useContext, useMemo} from 'react';

import { Selector } from "./Selector.jsx"
import {CreateExpenseFormContext} from "../../../providers/expenses/CreateExpenseFormContext.jsx";
import {ViewExpensesModal} from "./ViewExpensesModal.jsx";
import {useSuspenseQuery} from "@tanstack/react-query";
import {fetchExpensesForCalendar} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";

import '../css/calendar.css';

export const Calendar = ({selectedYear, selectedMonth}) => {
    const { setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);
    const [showViewExpensesModal, setShowViewExpensesModal] = useState(false);

    const actionOptions = ['View Expenses', 'Create Expense'];
    const [showActionSelector, setShowActionSelector] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const { data: expenses = [] } = useSuspenseQuery({
        queryKey: ['expenseTrackerExpenses', selectedMonth, selectedYear],
        queryFn: async () => {
            return await fetchExpensesForCalendar(selectedMonth + 1, selectedYear) ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const emptyDaysInMonth = useMemo(() => {
        const emptyDays = [];
        const firstDayOfFirstWeek = new Date(selectedYear, selectedMonth, 1).getDay();
        for (let i = 0; i < firstDayOfFirstWeek; i++) {
            emptyDays.push('');
        }

        return emptyDays;
    }, [selectedMonth, selectedYear]);

    const handleDayClick = (e) => {
        const date = e.currentTarget.dataset.fulldate;
        if (!date) return;

        setSelectedDate(date);
        setShowActionSelector(true);
    }

    const handleActionChange = (e) => {
        setShowActionSelector(false);

        const option = e.target.value;
        if (option === 'View Expenses') {
            setShowViewExpensesModal(true);
        } else if (option === 'Create Expense') {
            setShowCreateExpenseForm((prevState) => ({
                ...prevState,
                isShowing: true,
                isFab: false,
                date: selectedDate
            }));
        }
    }

    useEffect(() => {
        setShowActionSelector(false);
        setSelectedDate(null);
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (!showActionSelector) return;

        const handleClickOutside = (event) => {
            if (event.target.closest('.selectorWrapper')) {
                return;
            }
            setShowActionSelector(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showActionSelector]);

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return (
        <>
            <div className="calendar">
                <div className='calendarHeader col-md'>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                        <div className="calendarDayLabel" key={day}>
                            {day}
                        </div>
                    ))}
                </div>
                <div className='calendarGrid'>
                    {emptyDaysInMonth.map((_, idx) => (
                        <div
                            className='dayBox dayBox--empty'
                            key={`empty-${idx}`}
                        ></div>
                    ))}
                    {Object.entries(expenses).map(([date, expensesForDate]) => {
                        const dayNumber = Number(date.substring(8, 10));
                        const hasExpenses = expensesForDate.length > 0;
                        const isToday = selectedYear === todayYear
                            && selectedMonth === todayMonth
                            && dayNumber === todayDate;
                        const dayBoxClassName = [
                            'dayBox',
                            hasExpenses ? 'dayBox--active' : 'dayBox--open',
                            isToday ? 'dayBox--today' : '',
                            showActionSelector && selectedDate === date ? 'dayBox--menu-open' : '',
                        ].join(' ').trim();

                        return (
                            <div
                                className={dayBoxClassName}
                                key={date}
                                data-fulldate={date}
                                onClick={handleDayClick}
                            >
                                <div className="dayBoxTop">
                                    <span className="dayNumber">{dayNumber}</span>
                                    {hasExpenses && (
                                        <span className="dayPill">{expensesForDate.length}</span>
                                    )}
                                </div>
                                <div className="dayMeta">
                                    <span className={`dayStatus ${hasExpenses ? '' : 'dayStatus--muted'}`}>
                                        {hasExpenses ? 'Expenses' : 'Open'}
                                    </span>
                                </div>
                                {showActionSelector && selectedDate === date &&
                                    <Selector options={actionOptions} handleSelect={handleActionChange} handleClose={() => setShowActionSelector(false)} />
                                }
                            </div>
                        );
                    })}
                </div>
            </div>
            {showViewExpensesModal &&
                <ViewExpensesModal
                    date={selectedDate}
                    expenses={selectedDate ? (expenses[selectedDate] ?? []) : []}
                    handleClose={() => setShowViewExpensesModal(false)}
                />
            }
        </>
    );
}
