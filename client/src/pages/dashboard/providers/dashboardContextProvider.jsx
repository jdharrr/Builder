import React from 'react';

import {ExpenseProvider} from "./expenses/expenseProvider.jsx";
import {RefreshExpensesProvider} from "./expenses/RefreshExpenseProvider.jsx";

export const DashboardContextProvider = ({ children }) => {
    return (
        <ExpenseProvider>
                {children}
        </ExpenseProvider>
    );
}