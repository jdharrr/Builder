import React, {useState} from 'react';

import {ExpensesTableSection} from "./sections/expensesTableSection.jsx";
import {ViewExpenseModal} from "./components/viewExpenseModal.jsx";

import './css/expensesPage.css';

export default function ExpensesPage() {
    const [showViewExpenseModal, setShowViewExpenseModal] = useState({isShowing: false, expense: null});

    return (
        <div className="d-flex justify-content-center align-items-center">
            <div className="expensesCard card text-center m-5">
                <div className="expensesCardHeader card-header">
                    Expenses
                </div>
                <div className="card-body">
                    <ExpensesTableSection setShowViewExpenseModal={setShowViewExpenseModal} />
                </div>
                <div className="expensesCardFooter card-footer text-body-secondary">

                </div>
            </div>

            {showViewExpenseModal.isShowing && <ViewExpenseModal setShowViewExpenseModal={setShowViewExpenseModal} />}
        </div>
    );
}