import React from 'react';

import {MONTHS, getYearRange} from "../../../constants/dateConstants.js";
import '../css/monthYearSelector.css';

export const MonthYearSelector = ({ selectedYear, selectedMonth, setSelectedMonth, setSelectedYear }) => {
    const surroundingYears = getYearRange(50, 25);

    const handleYearChange = (e) => setSelectedYear(Number(e.target.value));
    const handleMonthChange = (e) => setSelectedMonth(Number(e.target.value));

    return (
        <div className="monthYearSelector">
            <div className="dateSelector">
                <select className={'form-select'} value={selectedMonth} onChange={handleMonthChange}>
                    {MONTHS.map((month, i) => (
                        <option key={i} value={i}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>
            <div className="dateSelector">
                <select className={"form-select"} value={selectedYear} onChange={handleYearChange}>
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