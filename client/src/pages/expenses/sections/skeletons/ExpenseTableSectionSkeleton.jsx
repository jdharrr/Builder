import React from 'react';

import '../../css/expensesTableSection.css';

export const ExpensesTableSectionSkeleton = () => {
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
    };

    return (
        <table className="expensesTable table table-hover table-striped table-bordered overflow-auto" style={{ cursor: "pointer" }}>
            <thead>
            <tr>
                {Object.entries(headers).map(([, label], idx) => (
                    <th key={idx} className={'text-nowrap'} scope="col">{label}</th>
                ))}

                <th key={'action'} className={'text-nowrap'} scope="col"></th>
            </tr>
            </thead>
        </table>
    );
}