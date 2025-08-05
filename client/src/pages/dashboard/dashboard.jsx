import React, {useEffect, useContext} from 'react';
import {useNavigate} from "react-router-dom";

import { Card } from "./components/dashboardCard.jsx";
import { Calendar } from "./components/calendar.jsx";
import { UpcomingList } from "./components/upcomingList.jsx";
import {fetchExpenses} from "../../api.jsx";
import { CalendarDateContext } from "./providers/calendarDate/calendarDateContext.jsx";
import {ExpenseContext} from "./providers/expenses/expenseContext.jsx";

import './css/dashboard.css';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { selectedCalendarMonthYear } = useContext(CalendarDateContext);
    const { setExpenses } = useContext(ExpenseContext);

    useEffect(() => {
        const daysInMonth = new Date(selectedCalendarMonthYear.year, selectedCalendarMonthYear.month + 1, 0).getDate();
        // getMonth returns index 0-11, add 1 for actual date
        const dateFrom = `${selectedCalendarMonthYear.year}-${String(selectedCalendarMonthYear.month + 1).padStart(2, '0')}-01`;
        const dateTo = `${selectedCalendarMonthYear.year}-${String(selectedCalendarMonthYear.month + 1).padStart(2, '0')}-${daysInMonth}`;
        fetchExpenses(dateFrom, dateTo)
            .then((loadedExpenses) => {setExpenses(loadedExpenses)})
            .catch((err) => {
                if (err.status === 401) {
                    navigate('/login');
                }
            })
    }, [navigate, selectedCalendarMonthYear]);

    return (
        <div className="dashboard">
            <div className="dashboardCards">
                    <Card
                        title='Expense Tracker'
                        customComponent={Calendar}
                    />
                    <Card
                        title='Upcoming Expenses'
                        customComponent={UpcomingList}
                        customProps={{numDays: 7}}
                    />
                    <Card title='Expense Totals' />
            </div>
        </div>
    );
}