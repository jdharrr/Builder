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
        <div className={"table-responsive"} style={{ maxWidth: '100%' }}>
            <table className="table table-striped table-bordered" style={{ cursor: "default", tableLayout: "fixed", width: "100%" }}>
                <thead style={{cursor: 'pointer'}}>
                    <tr>
                        {selectActive && <th key={"select"} scope={'col'}></th>}
                        {showInactiveExpenses && <th key={'active'} scope={'col'}>Active</th>}
                        {Object.entries(headers).map(([column, label], idx) => (
                            <th className={"text-center"} key={idx} scope="col">{label}</th>
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
                <tbody className="table-group-divider">
                    {Array.from({ length: rowCount }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="placeholder-glow">
                            {selectActive && (
                                <td>
                                    <span className="placeholder" style={{width: '1rem', height: '1rem', display: 'inline-block'}} />
                                </td>
                            )}
                            {showInactiveExpenses && (
                                <td className={'text-center'}>
                                    <span className="placeholder col-4" />
                                </td>
                            )}
                            {Array.from({ length: columnCount }).map((_, cellIdx) => (
                                <td key={cellIdx}>
                                    <span className="placeholder col-8" />
                                </td>
                            ))}
                            <td>
                                <span className="placeholder col-6" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
