import React from 'react';

import {UserProvider} from "./user/userProvider.jsx";
import {RefreshExpensesProvider} from "./expenses/RefreshExpenseProvider.jsx";
import {ExpenseProvider} from "./expenses/expenseProvider.jsx";

export const BuilderContextProvider = ({ children }) => {
    return (
        <UserProvider>
            <RefreshExpensesProvider>
                <ExpenseProvider>
                    {children}
                </ExpenseProvider>
            </RefreshExpensesProvider>
        </UserProvider>
    );
}