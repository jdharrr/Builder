import React from 'react';

import {UpcomingList} from "../components/UpcomingList.jsx";
import {LateExpenses} from "../components/LateExpenses.jsx";

export const UpcomingExpensesSection = () => {
    return (
        <>
            <div className={'border border-dark mt-3'}>
                <ul className={'nav nav-tabs border-0 nav-fill'} role={'tablist'}>
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
                        <UpcomingList />
                    </div>
                    <div className={'tab-pane fade'} role={'tabpanel'} id={'late-tab-content'}>
                        <LateExpenses />
                    </div>
                </div>
            </div>
        </>
    );
}