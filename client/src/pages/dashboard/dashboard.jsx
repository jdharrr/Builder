import React, {useEffect, useContext} from 'react';
import {useNavigate} from "react-router-dom";

import { Card } from "./components/dashboardCard.jsx";
import { Calendar } from "./components/calendar.jsx";
import {fetchExpensesForCalendar, getPaymentsForDate} from "../../api.jsx";
import {ExpenseContext} from "./providers/expenses/expenseContext.jsx";
import {RefreshExpenseContext} from "./providers/expenses/refreshExpensesContext.jsx";
import { UpcomingExpensesSection } from "./sections/upcomingExpensesSection.jsx";

import './css/dashboard.css';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { setExpenses } = useContext(ExpenseContext);
    const { refreshExpenses } = useContext(RefreshExpenseContext);

    useEffect(() => {
        async function loadExpenses(){
            try {
                const loadedExpenses = await fetchExpensesForCalendar(new Date().getMonth() + 1, new Date().getFullYear());
                await Promise.all(Object.entries(loadedExpenses).map(async ([date, exps]) => {
                    let payments = null;
                    try {
                        payments = await getPaymentsForDate(date, exps);
                    } catch (err) {
                        if (err.status === 401) {
                            navigate('/login');
                        }
                    }

                    if (payments && payments.length) {
                        const paymentMap = Object.fromEntries(
                            payments.map(p => [p.expense_id, p.due_date_paid])
                        );

                        exps.forEach(exp => {
                            if (paymentMap[exp.id] !== undefined) {
                                exp.due_date_paid = paymentMap[exp.id];
                            }
                        });
                    }
                }))

                setExpenses(loadedExpenses);
            } catch (err) {
                if (err.status === 401) {
                    navigate('/login');
                }
            }
        }

        loadExpenses();
    }, [navigate, setExpenses, refreshExpenses]);

    return (
        <div className="dashboard">
            <div className="d-flex justify-content-center align-items-center">
                    <Card title='Expense Tracker' >
                        <Calendar />
                    </Card>
                    <Card title='Upcoming Expenses' >
                        <UpcomingExpensesSection />
                    </Card>
            </div>
        </div>
    );
}