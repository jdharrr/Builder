import React, {useContext, useState} from 'react';

import {ViewExpenseModalContext} from "../../../providers/expenses/ViewExpenseModalContext.jsx";

import '../css/expensesTableSection.css';

//TODO: Fix exception handling on 401 after token expires
// Currently it causes the components to error out
export const ExpensesTableSection = ({expenses, setSortDirection, setSelectedSort, setSearchFilter, enableSearch}) => {
    const { setShowViewExpenseModal } = useContext(ViewExpenseModalContext);

    const headers = {
        CreatedDate: 'Created Date',
        UpdatedDate: 'Updated Date',
        Category: 'Category',
        Name: 'Name',
        Cost: 'Cost',
        RecurrenceRate: 'Recurrence Rate',
        StartDate: 'Start Date',
        EndDate: 'End Date',
        NextDueDate: 'Next Due Date',
        Active: 'Active',
    };

    const [activeSearchFilter, setActiveSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });

    const handleRowClick = (expense) => {
        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            isShowing: true,
            expense: expense
        }));
    }

    const handleHeaderClick = (e) => {
        setSelectedSort(e.currentTarget.dataset.value);

        setSortDirection((prevState) => {
            return prevState === 'asc' ? 'desc' : 'asc';
        });
    }

    const handleSearchInput = (e) => {
        e.preventDefault();
        setActiveSearchFilter({
            searchValue: e.target.value,
            searchColumn: e.currentTarget.dataset.value,
        });
    }

    const handleSearchSubmit = (e) => {
        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();
        setSearchFilter({
            searchColumn: activeSearchFilter.searchColumn,
            searchValue: activeSearchFilter.searchValue,
        });
    }

    const handleSearchFocus = (e) => {
        const col = e.currentTarget.dataset.value;
        if (col !== activeSearchFilter.searchColumn) {
            setActiveSearchFilter({ searchColumn: col, searchValue: '' });
        }
    };

    return (
        <table className="expensesTable table table-hover table-striped table-bordered overflow-auto" style={{ cursor: "pointer" }}>
            <thead>
            <tr>
                {Object.entries(headers).map(([column, label], idx) => (
                    <th key={idx} className={'text-nowrap'} scope="col" data-value={column} onClick={(e) => handleHeaderClick(e)}>{label}</th>
                ))}
            </tr>
            {enableSearch &&
                <tr>
                    {Object.entries(headers).map(([column], idx) => (
                        <th key={idx}><input
                            type="text"
                            className="form-control form-control-sm"
                            data-value={column}
                            value={activeSearchFilter.searchColumn === column ? activeSearchFilter.searchValue : ''}
                            placeholder="Search..."
                            onChange={(e) => handleSearchInput(e)}
                            onKeyDown={(e) => handleSearchSubmit(e)}
                            onFocus={(e) => handleSearchFocus(e)}
                        /></th>
                    ))}
                </tr>
            }
            </thead>
            <tbody className="table-group-divider" >
            {expenses.map((exp, idx) => (
                <tr key={idx} onClick={() => handleRowClick(exp)}>
                    <td className={"text-nowrap"} >{exp.created_at.substring(0, 10)}</td>
                    <td className={"text-nowrap"}>{exp.updated_at.substring(0, 10)}</td>
                    <td className={"text-nowrap"}>{exp.category_name}</td>
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