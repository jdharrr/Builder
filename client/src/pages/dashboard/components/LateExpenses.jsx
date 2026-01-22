import React, {useState} from 'react';
import {useSuspenseQuery, useQueryClient} from "@tanstack/react-query";
import {FaExclamationCircle, FaCheckCircle, FaEye} from 'react-icons/fa';

import {fetchLateExpenses} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {LateDatesModal} from "./LateDatesModal.jsx";

import '../css/lateExpenses.css';
import '../css/animations.css';

export const LateExpenses = () => {
    const qc = useQueryClient();

    const [showLateDatesModal, setShowLateDatesModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const { data: lateExpenses = [] } = useSuspenseQuery({
        queryKey: ['lateExpenses'],
        queryFn: async () => {
            return await fetchLateExpenses() ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const handleShowClick = (expense) => {
        setSelectedExpense(expense);
        setShowLateDatesModal(true);
    };

    return (
        <>
            <div className="late-expenses-list">
                {lateExpenses.length === 0 ? (
                    <div className="no-late-expenses">
                        <FaCheckCircle className="no-late-icon" />
                        <span>No late expenses found.</span>
                    </div>
                ) : (
                    lateExpenses.map((expense, idx) => (
                        <div key={idx} className="late-expense-item">
                            <div className="late-indicator">
                                <FaExclamationCircle className="late-icon" />
                            </div>
                            <div className="late-expense-name">
                                {expense.name}
                            </div>
                            <button
                                className="show-button"
                                onClick={() => handleShowClick(expense)}
                            >
                                <FaEye className="show-icon" />
                                Show
                            </button>
                        </div>
                    ))
                )}
            </div>

            {showLateDatesModal && selectedExpense && (
                <LateDatesModal
                    expense={selectedExpense}
                    handleClose={() => {
                        setShowLateDatesModal(false);
                        setSelectedExpense(null);
                    }}
                    onPaymentSuccess={() => {
                        qc.invalidateQueries(['lateExpenses']);
                    }}
                />
            )}
        </>
    );
}
