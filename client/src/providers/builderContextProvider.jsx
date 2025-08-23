import React from 'react';

import {UserProvider} from "./user/userProvider.jsx";
import {RefreshExpensesProvider} from "../pages/dashboard/providers/expenses/RefreshExpenseProvider.jsx";

export const BuilderContextProvider = ({ children }) => {
    return (
        <UserProvider>
            <RefreshExpensesProvider>
                {children}
            </RefreshExpensesProvider>
        </UserProvider>
    );
}