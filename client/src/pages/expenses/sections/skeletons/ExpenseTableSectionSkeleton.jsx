import React from 'react';

import '../../css/expensesTableSection.css';

export const ExpensesTableSectionSkeleton = ({
    rowCount = 10,
    selectActive = false,
    showInactiveExpenses = false,
    enableSearch = false
}) => {
    const headers = {
        CreatedDate: 'Created Date',
        UpdatedDate: 'Updated Date',
        Category: 'Category',
        Name: 'Name',
        Cost: 'Cost',
        NextDueDate: 'Next Due Date',
        RecurrenceRate: 'Recurrence Rate',
        StartDate: 'Start Date',
        EndDate: 'End Date',
    };

    const columnCount = Object.keys(headers).length;

    return (
        <div className="expenses-table-scroll">
            <table className="table expenses-table" style={{ cursor: "default", tableLayout: "fixed", width: "100%" }}>
                <thead className="expenses-table-head">
                    <tr>
                        {selectActive && <th key={"select"} scope={'col'}></th>}
                        {showInactiveExpenses && <th key={'active'} scope={'col'} className="expenses-sortable">Active</th>}
                        {Object.entries(headers).map(([, label], idx) => (
                            <th className={"text-center expenses-sortable"} key={idx} scope="col">{label}</th>
                        ))}
                        <th key='actions' scope="col"></th>
                    </tr>
                    {enableSearch && (
                        <tr>
                            {selectActive && <th></th>}
                            {showInactiveExpenses && <th></th>}
                            {Object.keys(headers).map((_, idx) => (
                                <th key={idx}>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Search..."
                                        disabled
                                    />
                                </th>
                            ))}
                            <th></th>
                        </tr>
                    )}
                </thead>
                <tbody className="expenses-table-body">
                    {Array.from({ length: rowCount }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="placeholder-glow expenses-table-row">
                            {selectActive && (
                                <td className="cell cell-select text-center">
                                    <span className="placeholder" style={{width: '1rem', height: '1rem', display: 'inline-block'}} />
                                </td>
                            )}
                            {showInactiveExpenses && (
                                <td className={'text-center cell cell-status'}>
                                    <span className="placeholder col-4" />
                                </td>
                            )}
                            {Array.from({ length: columnCount }).map((_, cellIdx) => (
                                <td key={cellIdx} className="text-center">
                                    <span className="placeholder col-8" />
                                </td>
                            ))}
                            <td className="text-center">
                                <span className="placeholder col-6" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
