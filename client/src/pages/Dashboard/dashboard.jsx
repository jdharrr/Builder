import React, { useState } from 'react';

import { Card } from "./components/dashboardCard.jsx";
import { Calendar } from "./components/calendar.jsx";
import { CreateExpenseForm } from "./components/createExpenseForm.jsx";
import { ExpenseFormContext } from "./contexts/ExpenseFormContext.jsx";

export const Dashboard = () => {
    const [showExpenseForm, setShowExpenseForm] = useState({ showing: false, day: null });

    return (
        <ExpenseFormContext.Provider value={{ showExpenseForm, setShowExpenseForm }}>
            <div className="dashboard">
                <div className="dashboardCards">
                        <Card
                            className='expenseTrackingCard'
                            title='Expense Tracker'
                            customComponent={Calendar}
                        />
                    {/*<Card title='Expenses' description='Expenses Card' />*/}
                    {/*<Card title='Totals' description='Totals Card' />*/}
                </div>
                {showExpenseForm.showing && <CreateExpenseForm day={showExpenseForm.day} />}
            </div>
        </ExpenseFormContext.Provider>
    );
}