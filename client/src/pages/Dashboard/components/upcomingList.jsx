import React from 'react';

import '../css/upcomingList.css';

export const UpcomingList = ({ upcomingDays }) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = new Date().getMonth();

    const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = new Date().getDay();

    const handleChange = () => {

    }

    return (
      <div className='upcomingListWrapper'>
          <h1>{months.at(currentMonth)}</h1>
          <div className='upcomingList'>
              {upcomingDays.map((day, idx) => (
                  <div className='upcomingDay' key={day}>
                      <span>{weekDays.at((currentDay + idx) % 7)} {day}</span>
                      <input className='upcomingCheckbox' type='checkbox' onChange={handleChange} />
                  </div>
              ))}
          </div>
      </div>
    );
}