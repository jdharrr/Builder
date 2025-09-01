import React, {useContext, useState} from 'react';
import {useNavigate} from "react-router-dom";

import {MonthYearSelector} from "../components/MonthYearSelector.jsx";
import {Calendar} from "../components/Calendar.jsx";
import {useQuery} from "@tanstack/react-query";
import {fetchExpensesForCalendar} from "../../../api.jsx";

import '../css/expenseTrackerSection.css';
import '../../../css/global.css';

export const ExpenseTrackerSection = () => {
    const navigate = useNavigate();

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });

    const { data: expenses = [] } = useQuery({
        queryKey: ['expenseTrackerExpenses', selectedMonth, selectedYear],
        queryFn: async () => {
            return await fetchExpensesForCalendar(selectedMonth + 1, selectedYear);
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

    return (
        <>
            <div className="expenseTrackerWrapper">
                <h2 className={'titleText'}>{monthName} {selectedYear}</h2>
                <MonthYearSelector
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    setSelectedYear={setSelectedYear}
                    setSelectedMonth={setSelectedMonth}
                />
                <Calendar
                    expenses={expenses}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                />
            </div>
        </>
    );
}