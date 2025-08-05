import React from 'react';

import {ExpenseProvider} from "./expenses/expenseProvider.jsx";
import {CalendarDateProvider} from "./calendarDate/calendarDateProvider.jsx";

export const ContextProvider = ({ children }) => {
    return (
        <ExpenseProvider>
            <CalendarDateProvider>
                {children}
            </CalendarDateProvider>
        </ExpenseProvider>
    );
}