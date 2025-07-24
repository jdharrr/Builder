import React from 'react';

export const MonthYearSelector = ({ currentYear, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const surroundingYears = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

    const handleYearChange = (e) => setSelectedYear(Number(e.target.value));
    const handleMonthChange = (e) =>
    {
        const index = months.indexOf(e.target.value);
        setSelectedMonth(index);
    }

    return (
        <div>
            <div className="monthSelector">
                <select value={selectedMonth} onChange={handleMonthChange}>
                    {months.map((month, i) => (
                        <option key={i} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>
            <div className="yearSelector">
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