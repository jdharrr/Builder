import React, {Suspense, useContext} from 'react';

import { Card } from "./components/DashboardCard.jsx";
import { UpcomingExpensesSection } from "./sections/UpcomingExpensesSection.jsx";
import {ExpenseTrackerSection} from "./sections/ExpenseTrackerSection.jsx";
import {ExpenseTrackerSectionSkeleton} from "./components/skeletons/ExpenseTrackerSectionSkeleton.jsx";
import {UpcomingExpensesSectionSkeleton} from "./components/skeletons/UpcomingExpensesSectionSkeleton.jsx";
import {CreateExpenseForm} from "../../components/CreateExpenseForm.jsx";
import {ViewExpensesModal} from "./components/ViewExpensesModal.jsx";
import {ViewExpenseModal} from "../expenses/components/ViewExpenseModal.jsx";
import {CreateExpenseFormContext} from "../../providers/expenses/CreateExpenseFormContext.jsx";
import {ViewExpensesModalContext} from "../../providers/expenses/ViewExpensesModalContext.jsx";
import {ViewExpenseModalContext} from "../../providers/expenses/ViewExpenseModalContext.jsx";

import './css/dashboardPage.css';

export default function DashboardPage() {
    const {showCreateExpenseForm} = useContext(CreateExpenseFormContext);
    const {showViewExpensesModal} = useContext(ViewExpensesModalContext);
    const {showViewExpenseModal} = useContext(ViewExpenseModalContext);

    return (
        <>
            <div className="d-flex justify-content-center align-items-center">
                    <Card title='Expense Tracker' >
                        <Suspense fallback={<ExpenseTrackerSectionSkeleton />}>
                            <ExpenseTrackerSection />
                        </Suspense>
                    </Card>
                <Card title='Upcoming Expenses' >
                    <Suspense fallback={<UpcomingExpensesSectionSkeleton />}>
                        <UpcomingExpensesSection />
                    </Suspense>
                </Card>
            </div>
            { showCreateExpenseForm.isShowing && !showCreateExpenseForm.isFab &&
                <CreateExpenseForm
                    includeStartDateInput={false}
                />
            }
            { showViewExpensesModal.isShowing &&
                <ViewExpensesModal />
            }
            {showViewExpenseModal.isShowing &&
                <ViewExpenseModal />
            }
        </>
    );
}