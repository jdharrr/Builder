import React, { useState } from 'react';

import { Card } from "./components/dashboardCard.jsx";
import { Calendar } from "./components/calendar.jsx";
import { CreateExpenseForm } from "./components/createExpenseForm.jsx";
import { ExpenseFormContext } from "./contexts/ExpenseFormContext.jsx";
import { UpcomingList } from "./components/upcomingList.jsx";

import './css/dashboard.css';

export const Dashboard = () => {
    const [showExpenseForm, setShowExpenseForm] = useState({ showing: false, day: null });

    return (
        <ExpenseFormContext.Provider value={{ showExpenseForm, setShowExpenseForm }}>
            <div className="dashboard">
                <div className="dashboardCards">
                        <Card
                            title='Expense Tracker'
                            customComponent={Calendar}
                        />
                        <Card
                            title='Upcoming Expenses'
                            customComponent={UpcomingList}
                            customProps={{upcomingDays: [21,22,23,24,25,26,27,28,29,30]}}
                        />
                        <Card title='Expense Totals' />
                </div>
                {showExpenseForm.showing && <CreateExpenseForm day={showExpenseForm.day} />}
            </div>
        </ExpenseFormContext.Provider>
    );
}