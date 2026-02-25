import React, {Suspense, useContext} from 'react';
import {ErrorBoundary} from "react-error-boundary";

import { Card } from "../../components/Card.jsx";
import { UpcomingExpensesSection } from "./sections/UpcomingExpensesSection.jsx";
import {ExpenseTrackerSection} from "./sections/ExpenseTrackerSection.jsx";
import {ExpenseTrackerSectionSkeleton} from "./sections/skeletons/ExpenseTrackerSectionSkeleton.jsx";
import {UpcomingExpensesSectionSkeleton} from "./sections/skeletons/UpcomingExpensesSectionSkeleton.jsx";
import {CreateExpenseModal} from "../../components/expense/createExpense/CreateExpenseModal.jsx";
import {CreateExpenseFormContext} from "../../providers/expenses/CreateExpenseFormContext.jsx";

import './css/dashboardPage.css';

export default function DashboardPage() {
    const {showCreateExpenseForm} = useContext(CreateExpenseFormContext);

    return (
        <>
            <div className="dashboard-page">
                <div className="dashboard-hero">
                    <div className="dashboard-hero-title">
                        <span className="dashboard-eyebrow">Dashboard</span>
                        <h1 className="dashboard-title">Overview</h1>
                        <p className="dashboard-subtitle">Keep an eye on what is due next and what needs attention.</p>
                    </div>
                </div>
                <div className="dashboard-cards">
                    <Card
                        title='Expense Tracker'
                        className="dashboard-card expense-tracker-card"
                        style={{width: 'min(40rem, 100%)'}}
                        noMargin={true}
                    >
                        <Suspense fallback={<ExpenseTrackerSectionSkeleton />}>
                            <ErrorBoundary FallbackComponent={ExpenseTrackerSectionSkeleton} >
                                <ExpenseTrackerSection />
                            </ErrorBoundary>
                        </Suspense>
                    </Card>
                <Card
                    title='Upcoming Expenses'
                    className="dashboard-card upcoming-expenses-card"
                    style={{width: 'min(40rem, 100%)'}}
                    noMargin={true}
                >
                    <Suspense fallback={<UpcomingExpensesSectionSkeleton />}>
                        <ErrorBoundary FallbackComponent={UpcomingExpensesSectionSkeleton} >
                            <UpcomingExpensesSection />
                        </ErrorBoundary>
                    </Suspense>
                </Card>
                </div>
            </div>
            { showCreateExpenseForm.isShowing && !showCreateExpenseForm.isFab &&
                <CreateExpenseModal
                    includeStartDateInput={false}
                />
            }
        </>
    );
}
