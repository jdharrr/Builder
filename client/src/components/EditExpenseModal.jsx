import React, {useEffect, useRef, useState} from 'react';
import {FaLock} from "react-icons/fa";

import {Modal} from './Modal.jsx';
import {validateDueDate} from "../util.jsx";
import {CreditCardSelect} from "./CreditCardSelect.jsx";
import {CategorySelect} from "./CategorySelect.jsx";
import '../css/createExpenseForm.css';

export const EditExpenseModal = ({expense, handleSave, handleClose}) => {
    const [expenseProps, setExpenseProps] = useState({
        name: expense.name || null,
        cost: expense.cost || null,
        categoryId: expense.categoryId || null,
        description: expense.description || '',
        endDate: expense.endDate || null,
        automaticPayments: expense.automaticPayments || false,
        automaticPaymentsUseCredit: Boolean(expense.automaticPaymentCreditCardId),
        automaticPaymentsCreditCardId: expense.automaticPaymentCreditCardId || null,
    });
    const [fieldErrors, setFieldErrors] = useState({
        name: false,
        cost: false,
        endDate: false,
    });
    const isPaidOneTimeExpense = expense.recurrenceRate === 'once' && expense.oneTimeExpenseIsPaid;

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (document.querySelector('.manage-categories-modal') || document.querySelector('.manage-credit-cards-modal')) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose]);

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
            creditCardId: expenseProps.automaticPaymentsUseCredit && expenseProps.automaticPaymentsCreditCardId === null,
        };

        setFieldErrors(nextErrors);
        if (nextErrors.name || nextErrors.cost || nextErrors.endDate || nextErrors.creditCardId) {
            return;
        }

        handleSave(expense.id, {
            name: expenseProps.name,
            cost: expenseProps.cost,
            categoryId: expenseProps.categoryId,
            description: expenseProps.description,
            endDate: expenseProps.endDate,
            automaticPayments: expenseProps.automaticPayments,
            automaticPaymentsCreditCardId: expenseProps.automaticPaymentsUseCredit
                ? expenseProps.automaticPaymentsCreditCardId
                : null,
        });
    };

    return (
        <>
            <Modal
                title={'Edit Expense'}
                wrapperRef={wrapperRef}
                handleSave={handleSaveForm}
                handleClose={handleClose}
                className="app-modal"
            >
                <form className="create-expense-form">
                    <div className="expense-form-grid">
                        <div className="expense-form-column">
                            <section className="expense-form-card">
                                <header className="expense-card-header">
                                    <h6 className="expense-card-title">Essentials</h6>
                                </header>
                                <div className="expense-card-body">
                                    <div className="expense-input-grid">
                                        <div className="expense-input">
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
                                        <div className="expense-input">
                                            <label className={`form-label${isPaidOneTimeExpense ? ' expense-label-row' : ''}`}>
                                                Cost
                                                {isPaidOneTimeExpense && (
                                                    <>
                                                        <span className="read-only-hint" title="Paid expenses can't be edited." aria-label="Paid expenses can't be edited.">
                                                            <FaLock size={10} />
                                                        </span>
                                                        <span className="paid-pill">Paid</span>
                                                    </>
                                                )}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className={`form-control${isPaidOneTimeExpense ? ' read-only-field' : ''}${fieldErrors.cost ? ' is-invalid' : ''}`}
                                                value={expenseProps.cost ?? ''}
                                                disabled={isPaidOneTimeExpense}
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
                                        <div className="expense-input expense-input-span">
                                            <CategorySelect
                                                label="Category"
                                                includeNoneOption={true}
                                                initialValue={expenseProps.categoryId || ''}
                                                onChange={(e) => {
                                                    setExpenseProps((prevState) => ({
                                                        ...prevState,
                                                        categoryId: e.target.value || null
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <div className="expense-input expense-input-span">
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
                                    </div>
                                </div>
                            </section>

                            <section className="expense-form-card">
                                <header className="expense-card-header">
                                    <h6 className="expense-card-title">Timeline</h6>
                                </header>
                                <div className="expense-card-body">
                                    <div className="expense-input-grid">
                                        <div className="expense-input">
                                            <label className="form-label expense-label-row">
                                                Recurrence
                                                <span className="read-only-hint" title="Set on creation." aria-label="Set on creation.">
                                                    <FaLock size={10} />
                                                </span>
                                            </label>
                                            <input
                                                className="form-control read-only-field"
                                                type="text"
                                                value={expense.recurrenceRate
                                                    ? expense.recurrenceRate.charAt(0).toUpperCase() + expense.recurrenceRate.slice(1)
                                                    : 'Once'}
                                                readOnly={true}
                                            />
                                        </div>
                                        <div className="expense-input">
                                            <label className="form-label expense-label-row">
                                                Start Date
                                                <span className="read-only-hint" title="Set on creation." aria-label="Set on creation.">
                                                    <FaLock size={10} />
                                                </span>
                                            </label>
                                            <input
                                                className="form-control read-only-field"
                                                type="text"
                                                value={expense.startDate ? expense.startDate.substring(0, 10) : ''}
                                                readOnly={true}
                                            />
                                        </div>
                                        {expense.recurrenceRate !== 'once' && (
                                            <div className="expense-input">
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
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="expense-form-column">
                            <section className="expense-form-card">
                                <header className="expense-card-header">
                                    <h6 className="expense-card-title">Payments</h6>
                                </header>
                                <div className="expense-card-body">
                                    {expense.recurrenceRate !== 'once' && (
                                        <>
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor="automaticPayments">
                                                    Automatic Payments?
                                                </label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id="automaticPayments"
                                                    checked={expenseProps.automaticPayments}
                                                    onChange={() => {
                                                        setExpenseProps((prevState) => ({
                                                            ...prevState,
                                                            automaticPayments: !prevState.automaticPayments,
                                                            automaticPaymentsUseCredit: false,
                                                            automaticPaymentsCreditCardId: null,
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            {expenseProps.automaticPayments && (
                                                <>
                                                    <div className="expense-toggle-row">
                                                        <label className={'form-label'} htmlFor="automaticPaymentsCredit">
                                                            Put automatic payments on credit?
                                                        </label>
                                                        <input
                                                            className={'form-check-input'}
                                                            type={'checkbox'}
                                                            id="automaticPaymentsCredit"
                                                            checked={expenseProps.automaticPaymentsUseCredit}
                                                            onChange={() => {
                                                                setExpenseProps((prevState) => ({
                                                                    ...prevState,
                                                                    automaticPaymentsUseCredit: !prevState.automaticPaymentsUseCredit,
                                                                    automaticPaymentsCreditCardId: prevState.automaticPaymentsUseCredit
                                                                        ? null
                                                                        : prevState.automaticPaymentsCreditCardId,
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                    {expenseProps.automaticPaymentsUseCredit && (
                                                        <div className="expense-input">
                                                            <CreditCardSelect
                                                                required={true}
                                                                isInvalid={fieldErrors.creditCardId}
                                                                initialValue={expenseProps.automaticPaymentsCreditCardId || ''}
                                                                onChange={(e) => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        automaticPaymentsCreditCardId: e.target.value || null
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};
