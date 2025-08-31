import React, {useState} from 'react';
import { FaPlus } from 'react-icons/fa';
import {CreateExpenseForm} from "./createExpenseForm.jsx";

export const Fab = () => {
    const [showCreateExpenseForm, setShowCreateExpenseForm] = useState(false);

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
                onClick={() => setShowCreateExpenseForm(true)}
            >
                <FaPlus size={28} />
            </button>

            { showCreateExpenseForm && <CreateExpenseForm setShowCreateExpenseForm={setShowCreateExpenseForm} includeStartDateInput={true} /> }
        </>
    );
}