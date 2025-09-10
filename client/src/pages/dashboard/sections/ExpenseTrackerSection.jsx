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
                <h2 className={'titleText'}>{monthName} {selectedYear}</h2>
                <MonthYearSelector
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    setSelectedYear={setSelectedYear}
                    setSelectedMonth={setSelectedMonth}
                />
                <Calendar
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                />
            </div>
        </>
    );
}