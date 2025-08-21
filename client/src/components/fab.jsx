import React, {useState} from 'react';
import { FaPlus } from 'react-icons/fa';
import {CreateExpenseForm} from "../pages/dashboard/components/createExpenseForm.jsx";

export const Fab = () => {
    const [showExpenseForm, setShowExpenseForm] = useState(false);

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
                onClick={() => setShowExpenseForm(true)}
            >
                <FaPlus size={28} />
            </button>

            { showExpenseForm && <CreateExpenseForm setShowExpenseForm={setShowExpenseForm} includeStartDateInput={true} /> }
        </>
    );
}