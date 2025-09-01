import React from 'react';

import {UserProvider} from "./user/UserProvider.jsx";
import {CreateExpenseFormProvider} from "./expenses/CreateExpenseFormProvider.jsx";
import {ViewExpensesModalProvider} from "./expenses/ViewExpensesModalProvider.jsx";
import {ViewExpenseModalProvider} from "./expenses/ViewExpenseModalProvider.jsx";

export const BuilderContextProvider = ({ children }) => {
    return (
        <UserProvider>
            <CreateExpenseFormProvider>
                <ViewExpensesModalProvider>
                    <ViewExpenseModalProvider>
                        {children}
                    </ViewExpenseModalProvider>
                </ViewExpensesModalProvider>
            </CreateExpenseFormProvider>
        </UserProvider>
    );
}