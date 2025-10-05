import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useSuspenseQuery} from "@tanstack/react-query";

import {ExpensesTableSection} from "./sections/ExpensesTableSection.jsx";
import {ViewExpenseModal} from "../../components/ViewExpenseModal.jsx";
import {ViewExpenseModalContext} from "../../providers/expenses/ViewExpenseModalContext.jsx";
import {getAllExpenses, getExpenseSortOptions} from "../../api.jsx";
import {getStatus} from "../../util.jsx";

import './css/expensesPage.css';

export default function ExpensesPage() {
    const navigate = useNavigate();

    const {showViewExpenseModal} = useContext(ViewExpenseModalContext);

    const [sortOptions, setSortOptions] = useState([]);
    const [selectedSort, setSelectedSort] = useState('CreatedDate');
    const [sortDirection, setSortDirection] = useState('asc');
    const [enableSearch, setEnableSearch] = useState(false);
    const [searchFilter, setSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const [showInactiveExpenses, setShowInactiveExpenses] = useState(false);

    const { data: expenses = [] } = useSuspenseQuery({
        queryKey: ['allExpenses', selectedSort, sortDirection, searchFilter, showInactiveExpenses],
        queryFn: async () => {
            return (enableSearch ? await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses, searchFilter)
                                 : await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses))
                                 ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                queueMicrotask(() => navigate('/login', { replace: true }));
            }
        },
    });

    useEffect(() => {
        async function loadSortOptions() {
            try {
                const options = await getExpenseSortOptions();
                setSortOptions(options);
            } catch(e) {
                if (e.response.status === 401) {
                    navigate('/login');
                }
            }
        }

        loadSortOptions();
    }, [navigate])

    const handleSortChange = (e) => {
        e.preventDefault();
        setSelectedSort(e.currentTarget.dataset.value);
    }

    const handleEnableSearchChange = (e) => {
        setEnableSearch(e.target.checked);
        if (!e.target.checked) {
            setSearchFilter({
                searchColumn: '',
                searchValue: '',
            });
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center">
            <div className="expensesCard card text-center m-5" >
                <div className="card-body d-flex flex-column">
                    <div className={"d-flex align-items-center mb-2"}>
                        <div className="dropdown text-center me-2">
                            <button className="btn dropdown-toggle border-dark-subtle" type="button"
                                    data-bs-toggle="dropdown"
                            >
                                Sort
                            </button>
                            <ul className="dropdown-menu" >
                                {Object.entries(sortOptions).map(([name, label], idx) => (
                                    (name !== 'Active' || showInactiveExpenses) && (
                                        <li key={idx}>
                                            <a className={"dropdown-item"} href={"#"} data-value={name}
                                               onClick={(e) => handleSortChange(e)}>
                                                {label}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                        <div className="form-check form-switch d-flex align-items-center ms-auto">
                            <label className="form-check-label me-5">
                                Show Inactive
                            </label>
                            <input className="form-check-input" type="checkbox" onChange={() => setShowInactiveExpenses((prev) => !prev)} />
                        </div>
                        <div className="form-check form-switch d-flex align-items-center">
                            <label className="form-check-label me-5">
                                Search
                            </label>
                            <input className="form-check-input" type="checkbox" onChange={(e) => handleEnableSearchChange(e)} />
                        </div>
                    </div>
                    <ExpensesTableSection
                        expenses={expenses}
                        setSortDirection={setSortDirection}
                        setSelectedSort={setSelectedSort}
                        setSearchFilter={setSearchFilter}
                        enableSearch={enableSearch}
                        showInactiveExpenses={showInactiveExpenses}
                    />
                </div>
            </div>

            {showViewExpenseModal.isShowing && <ViewExpenseModal/>}
        </div>
    );
}