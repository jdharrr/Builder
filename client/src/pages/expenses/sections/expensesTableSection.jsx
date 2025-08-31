import React from 'react';

import '../css/expensesTableSection.css';

export const ExpensesTableSection = ({setShowViewExpenseModal}) => {
    const handleRowClick = (e) => {
        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            isShowing: true,
            expense: {}
        }));
    }

    return (
        <table className="expensesTable table table-hover table-striped table-bordered">
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
            <tr onClick={(e) => handleRowClick(e)} >
                <th scope="row">1</th>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
            </tr>
            </tbody>
        </table>
    );
}