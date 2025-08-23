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
        <div className="modal show d-block">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className={'modal-title'}>{day} {month}, {year}</h5>
                    </div>
                    <div className="modal-body">
                        {expensesArray.length === 0 ? (
                            <p>No expenses found</p>
                            ) : (
                                expensesArray.map((expense, idx) => (
                                    <div  key={idx}>
                                        <div>{expense.name}</div>
                                    </div>
                                ))
                            )
                        }
                    </div>
                    <div className='modal-footer'>
                        <button type='button' className={'btn btn-primary'} onClick={handleClose}>Close</button>
                        <button type='button' className={'btn btn-primary'} onClick={handleAddExpense}>+</button>
                    </div>
                </div>
            </div>
        </div>
    );
}