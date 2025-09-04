import React, {useContext} from 'react';
import {useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";

import {getAllExpenses} from '../../../api.jsx';
import {ViewExpenseModalContext} from "../../../providers/expenses/ViewExpenseModalContext.jsx";

import '../css/expensesTableSection.css';

export const ExpensesTableSection = () => {
    const navigate = useNavigate();
    const { setShowViewExpenseModal } = useContext(ViewExpenseModalContext);

    const { data: expenses = [] } = useQuery({
        queryKey: ['allExpenses'],
        queryFn: async () => {
            return await getAllExpenses() ?? [];
        },
        suspense: true,
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (error?.status === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => {
            if (error?.status === 401) {
                navigate('/login');
            }
            return false;
        },
    });
    
    const handleRowClick = (expense) => {
        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            isShowing: true,
            expense: expense
        }));
    }

    return (
        <table className="expensesTable table table-hover table-striped table-bordered overflow-auto">
            <thead>
            <tr>
                <th className={'text-nowrap'} scope="col">Created</th>
                <th className={'text-nowrap'} scope="col">Updated</th>
                <th className={'text-nowrap'} scope="col">Category</th>
                <th className={'text-nowrap'} scope="col">Name</th>
                <th className={'text-nowrap'} scope="col">Cost</th>
                <th className={'text-nowrap'} scope="col">Recurrence Rate</th>
                <th className={'text-nowrap'} scope="col">Start Date</th>
                <th className={'text-nowrap'} scope="col">End Date</th>
                <th className={'text-nowrap'} scope="col">Next Due Date</th>
                <th className={'text-nowrap'} scope="col">Active</th>
            </tr>
            </thead>
            <tbody className="table-group-divider">
            {expenses.map((exp, idx) => (
                <tr key={idx} onClick={() => handleRowClick(exp)}>
                    <td className={"text-nowrap"} >{exp.created_at.substring(0, 10)}</td>
                    <td className={"text-nowrap"}>{exp.updated_at.substring(0, 10)}</td>
                    <td className={"text-nowrap"}>{exp.category}</td>
                    <td className={"text-nowrap"}>{exp.name}</td>
                    <td className={"text-nowrap"}>{exp.cost}</td>
                    <td className={"text-nowrap"}>{exp.recurrence_rate.charAt(0).toUpperCase() + exp.recurrence_rate.slice(1).toLowerCase()}</td>
                    <td className={"text-nowrap"}>{exp.start_date.substring(0, 10)}</td>
                    <td className={"text-nowrap"}>{exp.end_date ? exp.end_date.substring(0, 10) : ''}</td>
                    <td className={"text-nowrap"}>{exp.next_due_date.substring(0, 10)}</td>
                    <td className={"text-nowrap"}>{exp.active ? "True" : "False"}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}