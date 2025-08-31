import React, {useEffect, useRef} from 'react';

import '../css/viewExpensesModal.css'

export const ViewExpensesModal = ({ expenses, handleAddExpense, date, isLoading, setShowViewExpensesModal }) => {
    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowViewExpensesModal((prevState) => ({
                    ...prevState,
                    isShowing: false,
                    expenses: []
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowViewExpensesModal]);

    const handleClose = () => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: []
        }));
    }

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
            <div className="modal-dialog" ref={wrapperRef}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className={'modal-title'}>{day} {month}, {year}</h5>
                    </div>
                    <div className="modal-body">
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : (
                            expensesArray.length === 0 ? (
                                <p>No expenses found</p>
                                ) : (
                                    expensesArray.map((expense, idx) => (
                                        <div  key={idx}>
                                            <div>{expense.name}</div>
                                        </div>
                                    ))
                                )
                            )}
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