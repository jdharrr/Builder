import React from 'react';

export const MonthYearSelector = ({ currentYear, selectedYear, selectedMonth, setSelectedMonthYear }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const surroundingYears = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

    const handleYearChange = (e) => setSelectedMonthYear((prevState) => ({
        ...prevState,
        year: Number(e.target.value),
    }));
    const handleMonthChange = (e) => setSelectedMonthYear((prevState) => ({
        ...prevState,
        month: Number(e.target.value)
    }));

    return (
        <div>
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