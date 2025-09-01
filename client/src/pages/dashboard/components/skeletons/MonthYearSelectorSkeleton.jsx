import React from 'react';

import '../../css/monthYearSelector.css';

export const MonthYearSelectorSkeleton = () => {
    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });
    const yearLabel  = now.getFullYear();

    return (
        <div className="monthYearSelector d-flex gap-2">
            <div className="dateSelector">
                <select disabled className="form-select">
                    <option>{monthLabel}</option>
                </select>
            </div>
            <div className="dateSelector">
                <select disabled className="form-select">
                    <option>{yearLabel}</option>
                </select>
            </div>
        </div>
    );
}