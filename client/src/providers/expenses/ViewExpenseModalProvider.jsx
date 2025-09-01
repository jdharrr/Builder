import { useState } from "react";

import { ViewExpenseModalContext } from "./ViewExpenseModalContext.jsx";

export const ViewExpenseModalProvider = ({ children }) => {
    const [showViewExpenseModal, setShowViewExpenseModal] = useState({isShowing: false, expense: {}});

    return (
        <ViewExpenseModalContext.Provider value={{showViewExpenseModal, setShowViewExpenseModal}}>
            {children}
        </ViewExpenseModalContext.Provider>
    );
}