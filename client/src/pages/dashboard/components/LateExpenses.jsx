import React from 'react';

import {useSuspenseQuery} from "@tanstack/react-query";
import {fetchLateExpenses} from "../../../api.jsx";
import {useNavigate} from "react-router-dom";
import {getStatus} from "../../../util.jsx";

import '../css/lateExpenses.css';

export const LateExpenses = () => {
    const navigate = useNavigate();

    const { data: lateExpenses = [] } = useSuspenseQuery({
        queryKey: ['lateExpenses'],
        queryFn: async () => {
            return await fetchLateExpenses() ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        }
    })

    return (
        <div className={'lateExpensesList list-group list-group-flush'} style={{width: '25rem'}}>
            {lateExpenses.map((expense, idx) => (
                <div className="list-group-item" key={idx}>
                    <div>
                        {expense.name}
                    </div>
                </div>
            ))}
        </div>
    );
}