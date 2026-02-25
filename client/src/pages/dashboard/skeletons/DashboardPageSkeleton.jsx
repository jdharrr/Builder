import React from 'react';

import {Card} from "../../../components/Card.jsx";
import {ExpenseTrackerSectionSkeleton} from "../sections/skeletons/ExpenseTrackerSectionSkeleton.jsx";
import {UpcomingExpensesSectionSkeleton} from "../sections/skeletons/UpcomingExpensesSectionSkeleton.jsx";

import '../css/dashboardPage.css';

export default function DashboardPageSkeleton() {
    return (
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
                    <ExpenseTrackerSectionSkeleton />
                </Card>
                <Card
                    title='Upcoming Expenses'
                    className="dashboard-card upcoming-expenses-card"
                    style={{width: 'min(40rem, 100%)'}}
                    noMargin={true}
                >
                    <UpcomingExpensesSectionSkeleton />
                </Card>
            </div>
        </div>
    );
}
