import React from 'react';

import {CreateExpenseFormProvider} from "./expenses/CreateExpenseFormProvider.jsx";

export const BuilderContextProvider = ({ children }) => {
    return (
        <CreateExpenseFormProvider>
            {children}
        </CreateExpenseFormProvider>
    );
}
