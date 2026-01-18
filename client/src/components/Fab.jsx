import React, {useContext} from 'react';
import { FaPlus } from 'react-icons/fa';

import {CreateExpenseForm} from "./CreateExpenseForm.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";

export const Fab = () => {
    const { showCreateExpenseForm, setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);

    return (
        <>
            <button
                className="fabButton"
                onClick={() => {
                    setShowCreateExpenseForm((prevState) => ({
                        ...prevState,
                        isShowing: true,
                        isFab: true,
                    }));
                }}
            >
                <FaPlus size={28} />
            </button>

            { showCreateExpenseForm.isShowing && showCreateExpenseForm.isFab && <CreateExpenseForm includeStartDateInput={true} /> }
        </>
    );
}
