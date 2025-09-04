import React from 'react';

import {CreateExpenseFormProvider} from "./expenses/CreateExpenseFormProvider.jsx";
import {ViewExpensesModalProvider} from "./expenses/ViewExpensesModalProvider.jsx";
import {ViewExpenseModalProvider} from "./expenses/ViewExpenseModalProvider.jsx";

export const BuilderContextProvider = ({ children }) => {
    return (
        <CreateExpenseFormProvider>
            <ViewExpensesModalProvider>
                <ViewExpenseModalProvider>
                    {children}
                </ViewExpenseModalProvider>
            </ViewExpensesModalProvider>
        </CreateExpenseFormProvider>
    );
}