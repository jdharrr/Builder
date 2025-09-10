import React, {useContext} from 'react';

import {ExpensesTableSection} from "./sections/ExpensesTableSection.jsx";
import {ViewExpenseModal} from "../../components/ViewExpenseModal.jsx";
import {ViewExpenseModalContext} from "../../providers/expenses/ViewExpenseModalContext.jsx";

import './css/expensesPage.css';

export default function ExpensesPage() {
    const {showViewExpenseModal} = useContext(ViewExpenseModalContext);

    return (
        <div className="d-flex justify-content-center align-items-center">
            <div className="expensesCard card text-center m-5">
                <div className="card-body">
                    <ExpensesTableSection />
                </div>
            </div>

            {showViewExpenseModal.isShowing && <ViewExpenseModal />}
        </div>
    );
}