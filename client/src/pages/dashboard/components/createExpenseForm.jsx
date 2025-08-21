import React, {useContext, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";

import {postExpense} from "../../../api.jsx";
import {RefreshExpenseContext} from "../providers/expenses/refreshExpensesContext.jsx";

import '../css/createExpenseForm.css';

export const CreateExpenseForm = ({ setShowExpenseForm, date = null, includeStartDateInput}) => {
    const { setRefreshExpenses } = useContext(RefreshExpenseContext);
    const navigate = useNavigate();

    const [expenseProps, setExpenseProps] = useState({
        name: '',
        cost: 0.0,
        recurrence_rate: '',
        next_due_date: date !== null ? date : null,
        category: '',
        description: '',
        start_date: includeStartDateInput ? '': date,
        end_date: null,
    });

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowExpenseForm(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowExpenseForm]);

    const handleSaveForm = async () => {
        let isCreated = false;
        try {
            isCreated = await postExpense(expenseProps);
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
                return;
            }

            alert('Error creating expense.');
            return;
        }

        isCreated ? alert('Expense successfully created.'): alert('Failed to create Expense.');
        setRefreshExpenses((prevState) => !prevState);
        setShowExpenseForm(!isCreated);
    }

    const handleCloseForm = () => {
        setShowExpenseForm(false);
    }

    return (
        <div className='modal show d-block'>
            <div className='modal-dialog'>
                <div className='modal-content' ref={wrapperRef}>
                    <div className='modal-header'>
                        <h5 className="modal-title">Create Expense</h5>
                    </div>
                    <div className='modal-body'>
                        <form>
                            <div className='form-group'>
                                <label>Name</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   name: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>
                            <div className='form-group'>
                                <label>Cost</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   cost: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>
                            <div className='form-group'>
                            <label>Recurrence Rate</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   recurrence_rate: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>
                            {includeStartDateInput && (
                                <div className={'form-group'}>
                                    <label>Start Date</label>
                                    <input className={'form-control'} type='text'
                                           onChange={
                                               (e) => {
                                                   setExpenseProps((prevState) => ({
                                                       ...prevState,
                                                       start_date: e.target.value
                                                   }));
                                               }
                                           }
                                    />
                                </div>
                            )}
                            <div className='form-group'>
                                <label>End Date</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   end_date: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>
                            {date === null && <div className='form-group'>
                                <label>Next Due Date</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   next_due_date: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>}
                            <div className='form-group'>
                                <label>Category</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   category: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>
                            <div className='form-group'>
                            <label>Description</label>
                                <input className={'form-control'} type='text'
                                       onChange={
                                           (e) => {
                                               setExpenseProps((prevState) => ({
                                                   ...prevState,
                                                   description: e.target.value
                                               }));
                                           }
                                       }
                                />
                            </div>
                        </form>
                    </div>
                    <div className={'modal-footer'}>
                        <button type="button" className="btn btn-primary" onClick={handleSaveForm}>Save</button>
                        <button type="button" className="btn btn-primary" onClick={handleCloseForm}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}