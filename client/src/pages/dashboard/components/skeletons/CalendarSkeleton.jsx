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
                    <div
                        key={idx}
                        className="dayBox placeholder-glow"
                        aria-hidden="true"
                        style={{
                            height: '3rem',
                            width: '3rem'
                        }}
                    >
                        <span
                            className="placeholder"
                            style={{
                                width: '1.5rem',
                                height: '1.2rem',
                                alignSelf: 'flex-start'
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};