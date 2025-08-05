import { useState } from 'react';
import { CalendarDateContext } from "./calendarDateContext.jsx";

export const CalendarDateProvider = ({ children }) => {
    const [selectedCalendarMonthYear, setCalendarSelectedMonthYear] = useState({year: new Date().getFullYear(), month: new Date().getMonth()});

    return (
        <CalendarDateContext.Provider value={{ selectedCalendarMonthYear, setCalendarSelectedMonthYear }}>
            {children}
        </CalendarDateContext.Provider>
    );
}