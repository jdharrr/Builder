import React from 'react';

import {ExpensesTableSectionSkeleton} from "../sections/skeletons/ExpenseTableSectionSkeleton.jsx";

import '../css/expensesPage.css';

export default function ExpensesPageSkeleton() {
    return (
        <div className="expenses-page">
            <div className="expenses-hero">
                <div className="expenses-hero-title">
                    <span className="expenses-eyebrow">Expenses</span>
                    <h1 className="expenses-title">Expense Table</h1>
                    <p className="expenses-subtitle">Track, sort, and batch-edit your expenses without losing context.</p>
                </div>
            </div>

            <div className="card expenses-page-card" style={{width: 'min(90rem, 100%)'}}>
                <div className="card-body expenses-page-body">
                    <div className="expenses-toolbar">
                        <div className="expenses-toolbar-group">
                            <div className="expenses-control placeholder-glow">
                                <span className="placeholder col-6" />
                            </div>
                            <div className="expenses-control placeholder-glow">
                                <span className="placeholder col-5" />
                            </div>
                            <div className="expenses-control placeholder-glow">
                                <span className="placeholder col-5" />
                            </div>
                        </div>
                        <div className="expenses-toolbar-toggles">
                            {['Select', 'Show Inactive', 'Search'].map((label) => (
                                <div className="expenses-toggle placeholder-glow" key={label}>
                                    <span className="placeholder col-6" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <ExpensesTableSectionSkeleton
                        selectActive={false}
                        showInactiveExpenses={false}
                        enableSearch={false}
                        rowCount={10}
                    />
                </div>
            </div>
        </div>
    );
}
