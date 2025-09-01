import { useState } from "react";
import {CreateExpenseFormContext} from "./CreateExpenseFormContext.jsx";

export const CreateExpenseFormProvider = ({ children }) => {
    const [showCreateExpenseForm, setShowCreateExpenseForm] = useState({isShowing: false, date: null, isFab: false});

    return (
        <CreateExpenseFormContext.Provider value={{showCreateExpenseForm, setShowCreateExpenseForm}}>
            {children}
        </CreateExpenseFormContext.Provider>
    );
}