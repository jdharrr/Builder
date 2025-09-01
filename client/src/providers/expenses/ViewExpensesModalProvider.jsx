import { useState } from "react";

import {ViewExpensesModalContext} from "./ViewExpensesModalContext.jsx";

export const ViewExpensesModalProvider = ({ children }) => {
    const [showViewExpensesModal, setShowViewExpensesModal] = useState({isShowing: false, expenses: []});

    return (
        <ViewExpensesModalContext.Provider value={{showViewExpensesModal, setShowViewExpensesModal}}>
            {children}
        </ViewExpensesModalContext.Provider>
    );
}