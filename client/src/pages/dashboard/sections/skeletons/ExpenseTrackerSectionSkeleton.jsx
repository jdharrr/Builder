import React from "react";

import {CalendarSkeleton} from "../../components/skeletons/CalendarSkeleton.jsx";
import {MonthYearSelectorSkeleton} from "../../components/skeletons/MonthYearSelectorSkeleton.jsx";

export const ExpenseTrackerSectionSkeleton = () => {
    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });
    const yearLabel  = now.getFullYear();

    return (
        <>
            <div className="expenseTrackerWrapper">
                <div className="expenseTrackerHeader">
                    <div className="expenseTrackerTitleBlock">
                        <span className="expenseTrackerEyebrow">Calendar Overview</span>
                        <h2 className="expenseTrackerTitle">{monthLabel} {yearLabel}</h2>
                    </div>
                    <div className="expenseTrackerControls">
                        <MonthYearSelectorSkeleton />
                    </div>
                </div>
                <p className="expenseTrackerHint">Select a day to view or create expenses.</p>
                <CalendarSkeleton />
            </div>
        </>
    );
}
