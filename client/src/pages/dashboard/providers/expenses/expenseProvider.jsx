import { useState } from "react";
import { ExpenseContext } from "./expenseContext.jsx";

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);

    return (
        <ExpenseContext.Provider value={{expenses, setExpenses}}>
            {children}
        </ExpenseContext.Provider>
    );
}