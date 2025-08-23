import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";

import {UpcomingList} from "../components/upcomingList.jsx";
import {LateExpenses} from "../components/lateExpenses.jsx";
import {ExpenseContext} from "../providers/expenses/expenseContext.jsx";
import {fetchLateExpenses} from "../../../api.jsx";

export const UpcomingExpensesSection = () => {
    const navigate = useNavigate();
    const { expenses } = useContext(ExpenseContext);

    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [lateExpenses, setLateExpenses] = useState([]);

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentDate = new Date().getDate();

    useEffect(() => {
        async function loadExpenses() {
            try {
                const lateExpenses = await fetchLateExpenses();
                setLateExpenses(lateExpenses);
            } catch (err) {
                if (err.status === 401) {
                    navigate('/login');
                }
            }
        }

        loadExpenses();
    }, [navigate]);

    useEffect(() => {
        const filtered = Object.entries(JSON.parse(JSON.stringify(expenses))).slice(currentDate - 1, currentDate + 7 - 1);
        setFilteredExpenses(filtered);
    }, [currentDate, expenses])

    return (
        <>
            <h1 className={'titleText'}>{currentMonth}</h1>
            <div className={'border border-dark'}>
                <ul className={'nav nav-tabs border-0'} role={'tablist'}>
                    <li className={'nav-item'} role={'presentation'}>
                        <button className={'nav-link active border-0'} data-bs-toggle={'tab'} id={'upcoming-tab'}
                                data-bs-target={'#upcoming-tab-content'} type={'button'} role={'tab'}>
                            Upcoming Expenses
                        </button>
                    </li>
                    <li className={'nav-item'} role={'presentation'}>
                        <button className={'nav-link border-0'} data-bs-toggle={'tab'} id={'late-tab'}
                                data-bs-target={'#late-tab-content'} type={'button'} role={'tab'}>
                            Late Expenses
                        </button>
                    </li>
                </ul>

                <div className={'tab-content'}>
                    <div className={'tab-pane fade show active'} role={'tabpanel'} id={'upcoming-tab-content'}>
                        <UpcomingList filteredExpenses={filteredExpenses} setFilteredExpenses={setFilteredExpenses} />
                    </div>
                    <div className={'tab-pane fade'} role={'tabpanel'} id={'late-tab-content'}>
                        <LateExpenses lateExpenses={lateExpenses} />
                    </div>
                </div>
            </div>
        </>
    );
}