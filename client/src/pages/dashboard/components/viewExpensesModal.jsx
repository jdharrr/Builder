import React from 'react';

import '../css/viewExpensesModal.css'

export const ViewExpensesModal = ({ expenses, handleClose, handleAddExpense, date }) => {

    let expensesArray = [];
    if (Array.isArray(expenses)) {
        expensesArray = expenses;
    } else if (expenses) {
        expensesArray = [expenses];
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[Number(date.substring(5, 7)) - 1];
    const year = Number(date.substring(0, 4));
    const day = Number(date.substring(8, 10));

    return (
      <div className="viewExpensesOverlay">
        <div className="viewExpensesModal">
            <h1>{day} {month}, {year}</h1>
            <div className='viewExpensesModalBody'>
                {expensesArray.length === 0 ? (
                    <p>No expenses found</p>
                    ) : (
                        expensesArray.map((expense, idx) => (
                            <div className='expenseRow' key={idx}>
                                <div className='expenseRowItem'>{expense.name}</div>
                            </div>
                        ))
                    )
                }
            </div>
            <div className='viewExpensesModalFooter'>
                <button type='button' onClick={handleClose}>Close</button>
                <button type='button' onClick={handleAddExpense}>+</button>
            </div>
        </div>
      </div>
    );
}