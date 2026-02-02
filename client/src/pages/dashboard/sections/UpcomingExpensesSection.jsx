import React, {useState} from 'react';
import {FaClock, FaExclamationTriangle} from 'react-icons/fa';

import {UpcomingList} from "../components/UpcomingList.jsx";
import {LateExpenses} from "../components/LateExpenses.jsx";

import '../css/upcomingExpensesSection.css';

export const UpcomingExpensesSection = () => {
    const [activeTab, setActiveTab] = useState('upcoming');

    return (
        <div className="card upcoming-expenses-panel">
            <div className="tab-pills-container">
                <div className="tab-pills">
                    <button
                        className={`tab-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        <FaClock className="tab-icon" />
                        Upcoming Expenses
                    </button>
                    <button
                        className={`tab-pill ${activeTab === 'late' ? 'active' : ''}`}
                        onClick={() => setActiveTab('late')}
                    >
                        <FaExclamationTriangle className="tab-icon" />
                        Late Expenses
                    </button>
                </div>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'upcoming' ? <UpcomingList /> : <LateExpenses />}
            </div>
        </div>
    );
}
