import React, {useContext} from 'react';
import { FaPlus } from 'react-icons/fa';

import {CreateExpenseForm} from "./CreateExpenseForm.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";

export const Fab = () => {
    const { showCreateExpenseForm, setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);

    return (
        <>
            <button
                className="btn btn-primary rounded-circle shadow d-flex align-items-center justify-content-center"
                style={{
                    position: "fixed",
                    bottom: "1rem",
                    right: "1rem",
                    width: "4rem",
                    height: "4rem",
                }}
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