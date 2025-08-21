import { useState } from "react";
import { RefreshExpenseContext } from "./refreshExpensesContext.jsx";

export const RefreshExpensesProvider = ({ children }) => {
    const [refreshExpenses, setRefreshExpenses] = useState(false);

    return (
        <RefreshExpenseContext.Provider value={{refreshExpenses, setRefreshExpenses}}>
            {children}
        </RefreshExpenseContext.Provider>
    );
}