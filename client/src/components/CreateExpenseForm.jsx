import React, {useContext, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";

import {postExpense} from "../api.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";

import '../css/createExpenseForm.css';

export const CreateExpenseForm = ({includeStartDateInput}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const {showCreateExpenseForm, setShowCreateExpenseForm} = useContext(CreateExpenseFormContext);
    const { date } = showCreateExpenseForm;

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
                setShowCreateExpenseForm((prevState) => ({
                    ...prevState,
                    isShowing: false,
                    date: null,
                    isFab: false,
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowCreateExpenseForm]);

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
        if (isCreated) {
            // An expense has been added, refresh any stale lists
            handleExpenseRefresh();
            setShowCreateExpenseForm((prevState) => ({
                ...prevState,
                isShowing: false,
                date: null,
                isFab: false
            }));
        }
    }

    const handleCloseForm = () => {
        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: false,
            date: null,
            isFab: false
        }));
    }

    const handleExpenseRefresh = () => {
        qc.invalidateQueries({ queryKey: ['expenseTrackerExpenses'], type: 'all' });
        qc.invalidateQueries({ queryKey: ['upcomingExpenses'], type: 'all' });
        qc.invalidateQueries({ queryKey: ['lateExpenses'], type: 'all' });
        qc.invalidateQueries({ queryKey: ['allExpenses'], type: 'all' });
    }

    return (
        <div className='modal show d-block'>
            <div className='modal-dialog'>
                <div className='modal-content' ref={wrapperRef}>
                    <div className='modal-header'>
                        <h5 className="modal-title">{date === null ? 'Create Expense' : 'Create Expense For ' + date.substring(0,10)}</h5>
                    </div>
                    <div className='modal-body'>
                        <form>
                            <div className='mb-3'>
                                <label className={'form-label'}>Name</label>
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
                            <div className='mb-3'>
                                <label className={'form-label'}>Cost</label>
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
                            <div className='mb-3'>
                            <label className={'form-label'}>Recurrence Rate</label>
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
                                <div className={'mb-3'}>
                                    <label className={'form-label'}>Start Date</label>
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
                            <div className='mb-3'>
                                <label className={'form-label'}>End Date</label>
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
                            {date === null && <div className='mb-3'>
                                <label className={'form-label'}>Next Due Date</label>
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
                            <div className='mb-3'>
                                <label className={'form-label'}>Category</label>
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
                            <div className='mb-3'>
                            <label className={'form-label'}>Description</label>
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
                        <button type="button" className="btn btn-primary" onClick={handleCloseForm}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveForm}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}