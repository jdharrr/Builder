import React, {useContext, useEffect, useRef} from 'react';
import { FaPen } from 'react-icons/fa';

import {ViewExpensesModalContext} from "../../../providers/expenses/ViewExpensesModalContext.jsx";
import {ViewExpenseModalContext} from "../../../providers/expenses/ViewExpenseModalContext.jsx";
import {CreateExpenseFormContext} from "../../../providers/expenses/CreateExpenseFormContext.jsx";
import {MONTHS} from "../../../constants/dateConstants.js";

import '../css/viewExpensesModal.css'

export const ViewExpensesModal = () => {
    const { showViewExpensesModal, setShowViewExpensesModal } = useContext(ViewExpensesModalContext);
    const { expenses, date } = showViewExpensesModal;
    const { setShowViewExpenseModal } = useContext(ViewExpenseModalContext);
    const { setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowViewExpensesModal((prevState) => ({
                    ...prevState,
                    isShowing: false,
                    expenses: [],
                    date: null
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
            expenses: [],
            date: null
        }));
    }

    const handleExpenseEditClick = (expense) => {
        console.log('Edit clicked', expense);
    }

    const handleExpenseRowClick = (expense) => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: [],
            date: null
        }))

        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            expense: expense,
            isShowing: true
        }))
    }

    const handleAddExpense = () => {
        setShowViewExpensesModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expenses: [],
            date: null,
        }));

        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: true,
            date: date,
        }));
    }

    const month = MONTHS[Number(date.substring(5, 7)) - 1];
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
                        {expenses.length === 0 ? (
                            <p>No expenses found</p>
                        ) : (
                            <div className={"list-group list-group-flush"} >
                                <div className="list-group-item">
                                    <div className={"row"}>
                                        <div className={"col-3"}>Name</div>
                                        <div className={"col-3"}>Cost</div>
                                        <div className={"col-4"}>Category</div>
                                        <div className={"col-2"}>Edit</div>
                                    </div>
                                </div>
                                {expenses.map((expense, idx) => (
                                    <div key={idx} className={"viewExpenseItem list-group-item"} onClick={() => handleExpenseRowClick(expense)}>
                                        <div className={"row"}>
                                            <div className={"col-3"}>{expense.name}</div>
                                            <div className={"col-3"}>{expense.cost}</div>
                                            <div className={"col-4"}>{expense.category}</div>
                                            <div className="col-1 text-end">
                                                <button
                                                    type={"button"}
                                                    className="viewExpenseEditBtn border-0 bg-transparent"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExpenseEditClick(expense);
                                                    }}
                                                >
                                                    <FaPen size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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