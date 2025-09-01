import React from "react";

import {CalendarSkeleton} from "./CalendarSkeleton.jsx";
import {MonthYearSelectorSkeleton} from "./MonthYearSelectorSkeleton.jsx";

export const ExpenseTrackerSectionSkeleton = () => {
    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });
    const yearLabel  = now.getFullYear();

    return (
        <>
            <div className="expenseTrackerWrapper">
                <h2 className={'titleText'}>{monthLabel} {yearLabel}</h2>
                <MonthYearSelectorSkeleton />
                <CalendarSkeleton />
            </div>
        </>
    );
}