import React from 'react';

import '../css/monthYearSelector.css';

export const MonthYearSelector = ({ selectedYear, selectedMonth, setSelectedMonth, setSelectedYear }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const surroundingYears = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

    const handleYearChange = (e) => setSelectedYear(Number(e.target.value));
    const handleMonthChange = (e) => setSelectedMonth(Number(e.target.value));

    return (
        <div className="monthYearSelector">
            <div className="dateSelector">
                <select value={selectedMonth} onChange={handleMonthChange}>
                    {months.map((month, i) => (
                        <option key={i} value={i}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>
            <div className="dateSelector">
                <select value={selectedYear} onChange={handleYearChange}>
                    {surroundingYears.map((year, i) => (
                        <option key={i} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}