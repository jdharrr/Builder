import React, {useState} from 'react';

import {MonthYearSelector} from "../components/MonthYearSelector.jsx";
import {Calendar} from "../components/Calendar.jsx";

import '../css/expenseTrackerSection.css';
import '../../../css/global.css';

export const ExpenseTrackerSection = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });

    return (
        <>
            <div className="expenseTrackerWrapper">
                <div className="expenseTrackerHeader">
                    <div className="expenseTrackerTitleBlock">
                        <span className="expenseTrackerEyebrow">Calendar Overview</span>
                        <h2 className="expenseTrackerTitle">{monthName} {selectedYear}</h2>
                    </div>
                    <div className="expenseTrackerControls">
                        <MonthYearSelector
                            selectedYear={selectedYear}
                            selectedMonth={selectedMonth}
                            setSelectedYear={setSelectedYear}
                            setSelectedMonth={setSelectedMonth}
                        />
                    </div>
                </div>
                <p className="expenseTrackerHint">Select a day to view or create expenses.</p>
                <Calendar
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                />
            </div>
        </>
    );
}
