import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";

import { Card } from "./components/dashboardCard.jsx";
import { Calendar } from "./components/calendar.jsx";
import { ExpenseContext} from "./contexts/expenseContext.jsx";
import {RefreshExpensesContext} from "./contexts/refreshExpensesContext.jsx";
import { UpcomingList } from "./components/upcomingList.jsx";
import {fetchExpenses} from "../../api.jsx";

import './css/dashboard.css';

export const Dashboard = () => {
    const navigate = useNavigate();

    const [expenses, setExpenses] = useState([]);
    const [refreshExpenses, setRefreshExpenses] = useState(false);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        // getMonth return index 0-11, add 1 for actual date
        const dateFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const dateTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${daysInMonth}`;
        fetchExpenses(dateFrom, dateTo)
            .then((loadedExpenses) => {setExpenses(loadedExpenses)})
            .catch((err) => {
                if (err.status === 401) {
                    navigate('/login');
                }
            })
    }, [navigate, refreshExpenses]);

    return (
        <RefreshExpensesContext value={{ refreshExpenses, setRefreshExpenses }}>
            <ExpenseContext.Provider value={{ expenses, setExpenses }}>
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
            </ExpenseContext.Provider>
        </RefreshExpensesContext>
    );
}