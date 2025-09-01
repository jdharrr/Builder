import React from 'react';
import {useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";

import {UpcomingList} from "../components/UpcomingList.jsx";
import {LateExpenses} from "../components/LateExpenses.jsx";
import {fetchLateExpenses, getUpcomingExpenses} from "../../../api.jsx";

export const UpcomingExpensesSection = () => {
    const navigate = useNavigate();

    const { data: upcomingExpenses = [] } = useQuery({
        queryKey: ['upcomingExpenses'],
        queryFn: async () => {
            return await getUpcomingExpenses();
        },
        suspense: true,
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (error?.status === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => {
            if (error.status === 401) {
                navigate('/login');
            }

            return false;
        }
    })

    const { data: lateExpenses = [] } = useQuery({
        queryKey: ['lateExpenses'],
        queryFn: async () => {
            return await fetchLateExpenses();
        },
        suspense: true,
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (error?.status === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => {
            if (error.status === 401) {
                navigate('/login');
            }

            return false;
        }
    })

    return (
        <>
            <div className={'border border-dark mt-3'}>
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
                        <UpcomingList upcomingExpenses={upcomingExpenses} />
                    </div>
                    <div className={'tab-pane fade'} role={'tabpanel'} id={'late-tab-content'}>
                        <LateExpenses lateExpenses={lateExpenses} />
                    </div>
                </div>
            </div>
        </>
    );
}