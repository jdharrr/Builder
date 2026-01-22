import React, {Suspense, useContext} from 'react';
import {ErrorBoundary} from "react-error-boundary";

import { Card } from "../../components/Card.jsx";
import { UpcomingExpensesSection } from "./sections/UpcomingExpensesSection.jsx";
import {ExpenseTrackerSection} from "./sections/ExpenseTrackerSection.jsx";
import {ExpenseTrackerSectionSkeleton} from "./sections/skeletons/ExpenseTrackerSectionSkeleton.jsx";
import {UpcomingExpensesSectionSkeleton} from "./sections/skeletons/UpcomingExpensesSectionSkeleton.jsx";
import {CreateExpenseModal} from "../../components/CreateExpenseModal.jsx";
import {CreateExpenseFormContext} from "../../providers/expenses/CreateExpenseFormContext.jsx";

import './css/dashboardPage.css';

export default function DashboardPage() {
    const {showCreateExpenseForm} = useContext(CreateExpenseFormContext);

    return (
        <>
            <div className="d-flex justify-content-center align-items-stretch dashboard-cards">
                    <Card
                        title='Expense Tracker'
                        className="dashboard-card expense-tracker-card"
                        style={{width: 'min(38rem, 100%)'}}
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
                    style={{width: 'min(38rem, 100%)'}}
                >
                    <Suspense fallback={<UpcomingExpensesSectionSkeleton />}>
                        <ErrorBoundary FallbackComponent={UpcomingExpensesSectionSkeleton} >
                            <UpcomingExpensesSection />
                        </ErrorBoundary>
                    </Suspense>
                </Card>
            </div>
            { showCreateExpenseForm.isShowing && !showCreateExpenseForm.isFab &&
                <CreateExpenseModal
                    includeStartDateInput={false}
                />
            }
        </>
    );
}
