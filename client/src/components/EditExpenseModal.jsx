import React, {useEffect, useRef, useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {Modal} from './Modal.jsx';
import {getAllExpenseCategories} from "../api.jsx";
import {getStatus, validateDueDate} from "../util.jsx";
import {ManageCategoriesModal} from "./ManageCategoriesModal.jsx";
import '../css/createExpenseForm.css';

export const EditExpenseModal = ({expense, handleSave, handleClose}) => {
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);

    const [expenseProps, setExpenseProps] = useState({
        name: expense.name || null,
        cost: expense.cost || null,
        categoryId: expense.categoryId || null,
        description: expense.description || '',
        endDate: expense.endDate || null,
    });
    const [fieldErrors, setFieldErrors] = useState({
        name: false,
        cost: false,
        endDate: false,
    });

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showManageCategoriesModal) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose, showManageCategoriesModal]);

    const { data: categories = [] } = useQuery({
        queryKey: ['expenseCategories'],
        queryFn: async () => {
            return await getAllExpenseCategories();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const handleSaveForm = () => {
        const costValue = Number(expenseProps.cost);
        const endDateValid = !expenseProps.endDate
            || (expense.startDate
                && validateDueDate(
                    expenseProps.endDate,
                    {
                        startDate: expense.startDate,
                        endDate: null,
                        recurrenceRate: expense.recurrenceRate,
                        dueEndOfMonth: expense.dueLastDayOfMonth
                    },
                    []
                ).valid);

        const nextErrors = {
            name: !expenseProps.name?.trim(),
            cost: Number.isNaN(costValue) || costValue <= 0,
            endDate: !endDateValid,
        };

        setFieldErrors(nextErrors);
        if (nextErrors.name || nextErrors.cost || nextErrors.endDate) {
            return;
        }

        handleSave(expense.id, {
            name: expenseProps.name,
            cost: expenseProps.cost,
            categoryId: expenseProps.categoryId,
            description: expenseProps.description,
            endDate: expenseProps.endDate,
        });
    };

    return (
        <>
            <Modal
                title={'Edit Expense'}
                wrapperRef={wrapperRef}
                handleSave={handleSaveForm}
                handleClose={handleClose}
                className="create-expense-modal"
            >
                <form className="create-expense-form">
                <div className='mb-3'>
                    <label className={'form-label'}>Name</label>
                    <input
                        className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`}
                        type='text'
                        value={expenseProps.name}
                        onChange={(e) => {
                            setExpenseProps((prevState) => ({
                                ...prevState,
                                name: e.target.value
                            }));
                            if (fieldErrors.name) {
                                setFieldErrors((prev) => ({...prev, name: false}));
                            }
                        }}
                    />
                </div>
                <div className='mb-3'>
                    <label className={'form-label'}>Cost</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control${fieldErrors.cost ? ' is-invalid' : ''}`}
                        value={expenseProps.cost ?? ''}
                        onChange={(e) => {
                            const { value } = e.target;
                            setExpenseProps((prev) => ({
                                ...prev,
                                cost: value === '' ? '' : Number(value).toFixed(2),
                            }));
                            if (fieldErrors.cost) {
                                setFieldErrors((prev) => ({...prev, cost: false}));
                            }
                        }}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Recurrence</label>
                    <input
                        className="form-control"
                        type="text"
                        value={expense.recurrenceRate
                            ? expense.recurrenceRate.charAt(0).toUpperCase() + expense.recurrenceRate.slice(1)
                            : 'Once'}
                        readOnly={true}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                        className="form-control"
                        type="text"
                        value={expense.startDate ? expense.startDate.substring(0, 10) : ''}
                        readOnly={true}
                    />
                </div>
                {expense.recurrenceRate !== 'once' &&
                    <div className='mb-3'>
                        <label className={'form-label'}>End Date</label>
                        <input
                            className={`form-control${fieldErrors.endDate ? ' is-invalid' : ''}`}
                            type='date'
                            value={expenseProps.endDate || ""}
                            onChange={(e) => {
                                setExpenseProps((prevState) => ({
                                    ...prevState,
                                    endDate: e.target.value
                                }));
                                if (fieldErrors.endDate) {
                                    setFieldErrors((prev) => ({...prev, endDate: false}));
                                }
                            }}
                        />
                    </div>
                }
                <div className='mb-3'>
                    <label className={'form-label'}>Category</label>
                    <div className={"row d-flex justify-content-center align-items-center me-2"}>
                        <div className={'col'}>
                            <select
                                className={'form-select'}
                                value={expenseProps.categoryId || ""}
                                onChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        categoryId: e.target.value
                                    }));
                                }}
                            >
                                <option value={""}>No Category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={'col-auto'}>
                            <button className={'manageCategoriesButton'} type='button' onClick={() => setShowManageCategoriesModal(true)}>
                                Manage
                            </button>
                        </div>
                    </div>
                </div>
                <div className='mb-3'>
                    <label className={'form-label'}>Description</label>
                    <textarea
                        className={'form-control'}
                        rows={2}
                        value={expenseProps.description}
                        onChange={(e) => {
                            setExpenseProps((prevState) => ({
                                ...prevState,
                                description: e.target.value
                            }));
                        }}
                    />
                </div>
                </form>
            </Modal>
            {showManageCategoriesModal && (
                <ManageCategoriesModal
                    handleClose={() => setShowManageCategoriesModal(false)}
                />
            )}
        </>
    );
};
