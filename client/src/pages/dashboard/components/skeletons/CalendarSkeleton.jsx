import React from 'react';

import '../../css/calendar.css';

export const CalendarSkeleton = () => {
    const cells = Array.from({ length: 42 });

    return (
        <div className="calendar">
            <div className="calendarHeader col-md d-flex justify-content-between">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                    <strong key={day} className="text-nowrap">{day}</strong>
                ))}
            </div>

            <div className="calendarGrid">
                {cells.map((_, idx) => (
                    <div key={idx} className="dayBox placeholder-glow" aria-hidden="true">
                        <span className="placeholder col-6" />
                    </div>
                ))}
                <span className="visually-hidden">Loading calendar…</span>
            </div>
        </div>
    );
};