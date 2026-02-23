import React, {useContext, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {getExpenseRecurrenceRates, postExpense} from "../api.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";
import {MONTHS, getYearRange} from "../constants/dateConstants.js";

import '../css/createExpenseForm.css';
import {getStatus, validateDueDate} from "../util.jsx";
import {Dropdown} from "./Dropdown.jsx";
import {Modal} from "./Modal.jsx";
import {showSuccess, showError} from "../utils/toast.js";
import {CreditCardSelect} from "./CreditCardSelect.jsx";
import {CategorySelect} from "./CategorySelect.jsx";

export const CreateExpenseModal = ({includeStartDateInput}) => {
    const years = getYearRange();

    const navigate = useNavigate();
    const qc = useQueryClient();

    const {showCreateExpenseForm, setShowCreateExpenseForm} = useContext(CreateExpenseFormContext);
    const { date } = showCreateExpenseForm;


    const [endOfMonthStartDate, setEndOfMonthStartDate] = useState({year: (new Date()).getFullYear(), month: MONTHS.at((new Date()).getMonth())});

    const [expenseProps, setExpenseProps] = useState({
        name: '',
        cost: 0.0,
        recurrenceRate: 'Once',
        categoryId: null,
        description: '',
        startDate: includeStartDateInput ? null : date,
        endDate: null,
        dueLastDayOfMonth: false,
        oneTimePayment: {
            isPaid: false,
            isCredit: false,
            paymentDate: null,
            creditCardId: null,
        },
        automaticPayment: {
            enabled: false,
            isCredit: false,
            creditCardId: null,
            ignoreCashBack: false,
            cashBackOverwriteEnabled: false,
            cashBackOverwrite: '',
        },
        payToNowPayment: {
            enabled: false,
            isCredit: false,
            creditCardId: null,
        },
        ignoreCashBackForPaymentsOnCreation: false,
        cashBackOverwriteEnabled: false,
        cashBackOverwrite: '',
    });
    const [fieldErrors, setFieldErrors] = useState({
        name: false,
        cost: false,
        startDate: false,
        endDate: false,
        oneTimeExpenseCreditCardId: false,
        oneTimeExpensePaymentDate: false,
        payToNowCreditCardId: false,
        automaticPaymentCreditCardId: false,
        automaticPaymentCashBackOverwrite: false,
    });
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const recurrenceRate = expenseProps.recurrenceRate?.toLowerCase();
    const isOnce = recurrenceRate === 'once';
    const isMonthly = recurrenceRate === 'monthly';
    const { data: recurrenceRates = [] } = useQuery({
        queryKey: ['expenseRecurrenceRates'],
        queryFn: async () => {
            return await getExpenseRecurrenceRates();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    useEffect(() => {
        if (!recurrenceRates.length) return;
        if (recurrenceRates.includes(expenseProps.recurrenceRate)) return;
        setExpenseProps((prevState) => ({
            ...prevState,
            recurrenceRate: recurrenceRates[0],
        }));
    }, [recurrenceRates, expenseProps.recurrenceRate]);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (document.querySelector('.manage-credit-cards-modal') || document.querySelector('.manage-categories-modal')) {
                return;
            }
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
        const monthIndex = MONTHS.indexOf(endOfMonthStartDate.month);
        const resolvedStartDate = expenseProps.dueLastDayOfMonth
            ? new Date(endOfMonthStartDate.year, monthIndex + 1, 0).toISOString().substring(0, 10)
            : expenseProps.startDate;
        const costValue = Number(expenseProps.cost);
        const startDateValid = Boolean(resolvedStartDate);
        const endDateValid = !expenseProps.endDate
            || (resolvedStartDate
                && validateDueDate(
                    expenseProps.endDate,
                    {
                        startDate: resolvedStartDate,
                        endDate: null,
                        recurrenceRate: expenseProps.recurrenceRate,
                        dueEndOfMonth: expenseProps.dueLastDayOfMonth
                    },
                    []
                ).valid);

        const automaticPaymentOverwriteValue = Number(expenseProps.automaticPayment.cashBackOverwrite);
        const automaticPaymentOverwriteInvalid = expenseProps.automaticPayment.isCredit
            && expenseProps.automaticPayment.cashBackOverwriteEnabled
            && (Number.isNaN(automaticPaymentOverwriteValue) || automaticPaymentOverwriteValue <= 0);

        const nextErrors = {
            name: !expenseProps.name?.trim(),
            cost: Number.isNaN(costValue) || costValue <= 0,
            startDate: !startDateValid,
            endDate: !endDateValid,
            oneTimeExpenseCreditCardId: expenseProps.oneTimePayment.isCredit && !expenseProps.oneTimePayment.creditCardId,
            oneTimeExpensePaymentDate: (expenseProps.oneTimePayment.isCredit || expenseProps.oneTimePayment.isPaid)
                && !expenseProps.oneTimePayment.paymentDate,
            payToNowCreditCardId: expenseProps.payToNowPayment.isCredit && !expenseProps.payToNowPayment.creditCardId,
            automaticPaymentCreditCardId: expenseProps.automaticPayment.isCredit && !expenseProps.automaticPayment.creditCardId,
            automaticPaymentCashBackOverwrite: automaticPaymentOverwriteInvalid,
        };

        setFieldErrors(nextErrors);
        if (nextErrors.name || nextErrors.cost || nextErrors.startDate || nextErrors.endDate
            || nextErrors.oneTimeExpenseCreditCardId || nextErrors.oneTimeExpensePaymentDate
            || nextErrors.payToNowCreditCardId || nextErrors.automaticPaymentCreditCardId
            || nextErrors.automaticPaymentCashBackOverwrite) {
            return;
        }

        const payload = {
            ...expenseProps,
            cost: costValue,
        };
        payload.cashBackOverwrite = expenseProps.cashBackOverwriteEnabled && expenseProps.cashBackOverwrite
            ? Number(expenseProps.cashBackOverwrite)
            : null;

        if (expenseProps.dueLastDayOfMonth) {
            payload.startDate = resolvedStartDate;
        }

        createExpenseMutation.mutate(payload);
    }

    const handleCloseForm = () => {
        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: false,
            date: null,
            isFab: false
        }));
    }

    const createExpenseMutation = useMutation({
        mutationFn: (payload) => postExpense(payload),
        onSuccess: (response) => {
            if (response?.isCreated ?? response?.IsCreated) {
                showSuccess('Expense successfully created.');
                qc.invalidateQueries({ queryKey: ['tableExpenses'] });
                qc.invalidateQueries({ queryKey: ['upcomingExpenses'] });
                qc.invalidateQueries({ queryKey: ['expenseTrackerExpenses'] });
                qc.invalidateQueries({ queryKey: ['lateExpenses'] });
                setShowCreateExpenseForm((prevState) => ({
                    ...prevState,
                    isShowing: false,
                    date: null,
                    isFab: false
                }));
            } else {
                showError('Failed to create Expense.');
            }
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
                return;
            }
            showError('Error creating expense.');
        }
    });

    const handleCategoryChange = (categoryId) => {
        setExpenseProps((prevState) => ({
            ...prevState,
            categoryId: categoryId,
        }));
    }

    const handleRecurrenceRateChange = (rate) => {
        const normalizedRate = rate?.toLowerCase();
        setExpenseProps((prevState) => ({
            ...prevState,
            recurrenceRate: rate,
            endDate: normalizedRate === 'once' ? null : prevState.endDate,
            dueLastDayOfMonth: false,
        }));
        setFieldErrors((prev) => ({...prev, startDate: false, endDate: false}));
    }

    const handleMonthChange = (e, month) => {
        setEndOfMonthStartDate((prevState) => ({
            ...prevState,
            month: month,
        }));
    }

    const handleYearChange = (e, year) => {
        setEndOfMonthStartDate((prevState) => ({
            ...prevState,
            year: year,
        }));
    }

    const isStartDateBeforeToday = () => {
        if (!expenseProps.startDate) return false;
        const startDate = new Date(expenseProps.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        return startDate < today;
    };

    return (
        <>
            <Modal
                title={date === null ? 'Create Expense' : 'Create Expense For ' + date.substring(0,10)}
                wrapperRef={wrapperRef}
                handleSave={handleSaveForm}
                handleClose={handleCloseForm}
                className={`app-modal${isManageModalOpen ? ' create-expense-modal--suppressed' : ''}`}
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
                                            <label className={'form-label'}>Cost</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className={`form-control${fieldErrors.cost ? ' is-invalid' : ''}`}
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
                                                onChange={(e) => handleCategoryChange(e.target.value)}
                                                onManageOpen={() => setIsManageModalOpen(true)}
                                                onManageClose={() => setIsManageModalOpen(false)}
                                            />
                                        </div>
                                        <div className="expense-input expense-input-span">
                                            <label className={'form-label'}>Description</label>
                                            <textarea
                                                className={'form-control'}
                                                rows={2}
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
                                            <label className={'form-label'}>Recurrence Rate</label>
                                            <select
                                                className={'form-select'}
                                                value={expenseProps.recurrenceRate}
                                                onChange={(e) => handleRecurrenceRateChange(e.target.value)}
                                            >
                                                {recurrenceRates.map((rate) => (
                                                    <option value={rate} key={rate}>{rate}</option>
                                                ))}
                                            </select>

                                            {!includeStartDateInput
                                            && isMonthly
                                            && expenseProps.startDate.substring(8,10)
                                                == new Date(
                                                    new Date(expenseProps.startDate).getFullYear(),
                                                    new Date(expenseProps.startDate).getMonth() + 1,
                                                    0
                                                ).getDate()
                                            && (
                                                <div className="expense-toggle-row">
                                                    <label className={'form-label'} htmlFor="dueEndOfMonth1">
                                                        Due on the last day of the month?
                                                    </label>
                                                    <input
                                                        className={'form-check-input'}
                                                        type={'checkbox'}
                                                        id="dueEndOfMonth1"
                                                        onChange={() => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                dueLastDayOfMonth: !prevState.dueLastDayOfMonth
                                                            }));
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {includeStartDateInput && (
                                            <div className="expense-input">
                                                {expenseProps.dueLastDayOfMonth ? (
                                                    <>
                                                        <label className={'form-label'}>
                                                            {isOnce ? 'Due Date' : 'Start Date'}
                                                        </label>
                                                        <div className="expense-dropdown-row">
                                                            <Dropdown
                                                                title={endOfMonthStartDate.month}
                                                                options={MONTHS}
                                                                handleOptionChange={handleMonthChange}
                                                                maxHeight={'20rem'}
                                                                includeScrollbarY={true}
                                                            />
                                                            <Dropdown
                                                                title={endOfMonthStartDate.year}
                                                                options={years}
                                                                handleYearChange={handleYearChange}
                                                                maxHeight={'20rem'}
                                                                includeScrollbarY={true}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <label className={'form-label'}>
                                                            {isOnce ? 'Due Date' : 'Start Date'}
                                                        </label>
                                                        <input
                                                            className={`form-control${fieldErrors.startDate ? ' is-invalid' : ''}`}
                                                            type='date'
                                                            disabled={expenseProps.dueLastDayOfMonth}
                                                            value={expenseProps.startDate || ""}
                                                            onChange={(e) => {
                                                                setExpenseProps((prevState) => ({
                                                                    ...prevState,
                                                                    startDate: e.target.value
                                                                }));
                                                                if (fieldErrors.startDate) {
                                                                    setFieldErrors((prev) => ({...prev, startDate: false}));
                                                                }
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {!isOnce && (
                                            <div className="expense-input">
                                                <label className={'form-label'}>End Date</label>
                                                <input
                                                    className={`form-control${fieldErrors.endDate ? ' is-invalid' : ''}`}
                                                    type='date'
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

                                    {includeStartDateInput && isMonthly && (
                                        <div className="expense-toggle-row">
                                            <label className={'form-label'} htmlFor="dueEndOfMonth2">
                                                Due on the last day of the month?
                                            </label>
                                            <input
                                                className={'form-check-input'}
                                                type={'checkbox'}
                                                id="dueEndOfMonth2"
                                                onChange={() => {
                                                    setExpenseProps((prevState) => ({
                                                        ...prevState,
                                                        startDate: null,
                                                        dueLastDayOfMonth: !prevState.dueLastDayOfMonth
                                                    }));
                                                    if (fieldErrors.startDate) {
                                                        setFieldErrors((prev) => ({...prev, startDate: false}));
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="expense-form-column">
                            <section className="expense-form-card">
                                <header className="expense-card-header">
                                    <h6 className="expense-card-title">Payments</h6>
                                </header>
                                <div className="expense-card-body">
                                    {isOnce ? (
                                        <>
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor="paidCheckbox">Paid?</label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id="paidCheckbox"
                                                    checked={expenseProps.oneTimePayment.isPaid}
                                                    onChange={() => {
                                                        setExpenseProps((prevState) => {
                                                            const isPaid = !prevState.oneTimePayment.isPaid;
                                                            if (fieldErrors.oneTimeExpensePaymentDate && !isPaid) {
                                                                setFieldErrors((prev) => ({...prev, oneTimeExpensePaymentDate: false}));
                                                            }
                                                            return {
                                                                ...prevState,
                                                                oneTimePayment: {
                                                                    ...prevState.oneTimePayment,
                                                                    isPaid,
                                                                    isCredit: false,
                                                                    creditCardId: null,
                                                                },
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    enabled: false,
                                                                    isCredit: false,
                                                                    creditCardId: null,
                                                                    ignoreCashBack: false,
                                                                    cashBackOverwriteEnabled: false,
                                                                    cashBackOverwrite: '',
                                                                },
                                                            };
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor="creditCheckbox">Paid with credit?</label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id="creditCheckbox"
                                                    checked={expenseProps.oneTimePayment.isCredit}
                                                    onChange={() => {
                                                        setExpenseProps((prevState) => {
                                                            const nextCredit = !prevState.oneTimePayment.isCredit;
                                                            if (fieldErrors.oneTimeExpenseCreditCardId || fieldErrors.oneTimeExpensePaymentDate) {
                                                                setFieldErrors((prev) => ({
                                                                    ...prev,
                                                                    oneTimeExpenseCreditCardId: false,
                                                                    oneTimeExpensePaymentDate: false
                                                                }));
                                                            }
                                                            return {
                                                                ...prevState,
                                                                oneTimePayment: {
                                                                    ...prevState.oneTimePayment,
                                                                    isCredit: nextCredit,
                                                                    isPaid: false,
                                                                    creditCardId: null,
                                                                },
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    enabled: false,
                                                                    isCredit: false,
                                                                    creditCardId: null,
                                                                    ignoreCashBack: false,
                                                                    cashBackOverwriteEnabled: false,
                                                                    cashBackOverwrite: '',
                                                                },
                                                            };
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor="scheduledCheckbox">Scheduled?</label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id="scheduledCheckbox"
                                                    checked={expenseProps.automaticPayment.enabled}
                                                    onChange={() => {
                                                        setExpenseProps((prevState) => {
                                                            const nextScheduled = !prevState.automaticPayment.enabled;
                                                            return {
                                                                ...prevState,
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    enabled: nextScheduled,
                                                                    isCredit: false,
                                                                    creditCardId: null,
                                                                    ignoreCashBack: false,
                                                                    cashBackOverwriteEnabled: false,
                                                                    cashBackOverwrite: '',
                                                                },
                                                                oneTimePayment: {
                                                                    ...prevState.oneTimePayment,
                                                                    isPaid: nextScheduled ? false : prevState.oneTimePayment.isPaid,
                                                                    isCredit: nextScheduled ? false : prevState.oneTimePayment.isCredit,
                                                                    creditCardId: nextScheduled ? null : prevState.oneTimePayment.creditCardId,
                                                                    paymentDate: nextScheduled ? null : prevState.oneTimePayment.paymentDate,
                                                                },
                                                            };
                                                        });
                                                        if (fieldErrors.automaticPaymentCreditCardId) {
                                                            setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                        }
                                                        if (fieldErrors.oneTimeExpenseCreditCardId || fieldErrors.oneTimeExpensePaymentDate) {
                                                            setFieldErrors((prev) => ({
                                                                ...prev,
                                                                oneTimeExpenseCreditCardId: false,
                                                                oneTimeExpensePaymentDate: false,
                                                            }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {expenseProps.automaticPayment.enabled && (
                                                <div className="expense-toggle-row">
                                                    <label className={'form-label'} htmlFor="scheduledCreditCheckbox">
                                                        Schedule with credit?
                                                    </label>
                                                    <input
                                                        className={'form-check-input'}
                                                        type={'checkbox'}
                                                        id="scheduledCreditCheckbox"
                                                        checked={expenseProps.automaticPayment.isCredit}
                                                        onChange={() => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    isCredit: !prevState.automaticPayment.isCredit,
                                                                    creditCardId: null,
                                                                    ignoreCashBack: !prevState.automaticPayment.isCredit
                                                                        ? prevState.automaticPayment.ignoreCashBack
                                                                        : false,
                                                                    cashBackOverwriteEnabled: !prevState.automaticPayment.isCredit
                                                                        ? prevState.automaticPayment.cashBackOverwriteEnabled
                                                                        : false,
                                                                    cashBackOverwrite: !prevState.automaticPayment.isCredit
                                                                        ? prevState.automaticPayment.cashBackOverwrite
                                                                        : '',
                                                                },
                                                            }));
                                                            if (fieldErrors.automaticPaymentCreditCardId) {
                                                                setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {(expenseProps.oneTimePayment.isCredit
                                                || expenseProps.oneTimePayment.isPaid
                                                || expenseProps.automaticPayment.isCredit) && (
                                                <div className="expense-divider" />
                                            )}
                                            {expenseProps.automaticPayment.isCredit && (
                                                <div className="expense-input">
                                                    <CreditCardSelect
                                                        key={`once-schedule-${expenseProps.automaticPayment.isCredit}-${expenseProps.automaticPayment.creditCardId ?? 'none'}`}
                                                        required={true}
                                                        isInvalid={fieldErrors.automaticPaymentCreditCardId}
                                                        initialValue={expenseProps.automaticPayment.creditCardId || ''}
                                                        onChange={(e) => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    creditCardId: e.target.value
                                                                },
                                                            }));
                                                            if (fieldErrors.automaticPaymentCreditCardId) {
                                                                setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                            }
                                                        }}
                                                    >
                                                        <div className="credit-card-options-label">Cash back options</div>
                                                        <div className="expense-toggle-row">
                                                            <label className={'form-label'} htmlFor="ignoreCashBackOnScheduledOnce">
                                                                Ignore Cash Back?
                                                            </label>
                                                            <input
                                                                className={'form-check-input'}
                                                                type={'checkbox'}
                                                                id="ignoreCashBackOnScheduledOnce"
                                                                checked={expenseProps.automaticPayment.ignoreCashBack}
                                                                onChange={() => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        automaticPayment: {
                                                                            ...prevState.automaticPayment,
                                                                            ignoreCashBack: !prevState.automaticPayment.ignoreCashBack,
                                                                            cashBackOverwriteEnabled: false,
                                                                            cashBackOverwrite: ''
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="expense-toggle-row">
                                                            <label className={'form-label'} htmlFor="cashBackOverwriteToggleScheduledOnce">
                                                                Cash Back Overwrite?
                                                            </label>
                                                            <input
                                                                className={'form-check-input'}
                                                                type={'checkbox'}
                                                                id="cashBackOverwriteToggleScheduledOnce"
                                                                checked={expenseProps.automaticPayment.cashBackOverwriteEnabled}
                                                                onChange={() => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        automaticPayment: {
                                                                            ...prevState.automaticPayment,
                                                                            ignoreCashBack: false,
                                                                            cashBackOverwriteEnabled: !prevState.automaticPayment.cashBackOverwriteEnabled,
                                                                            cashBackOverwrite: !prevState.automaticPayment.cashBackOverwriteEnabled
                                                                                ? prevState.automaticPayment.cashBackOverwrite
                                                                                : ''
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                        {expenseProps.automaticPayment.cashBackOverwriteEnabled && (
                                                            <div className="expense-input">
                                                                <label className={'form-label'}>Cash Back Overwrite percentage</label>
                                                                <input
                                                                    className={`form-control${fieldErrors.automaticPaymentCashBackOverwrite ? ' is-invalid' : ''}`}
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={expenseProps.automaticPayment.cashBackOverwrite}
                                                                    onChange={(e) => {
                                                                        setExpenseProps((prevState) => ({
                                                                            ...prevState,
                                                                            automaticPayment: {
                                                                                ...prevState.automaticPayment,
                                                                                cashBackOverwrite: e.target.value
                                                                            }
                                                                        }));
                                                                        if (fieldErrors.automaticPaymentCashBackOverwrite) {
                                                                            setFieldErrors((prev) => ({...prev, automaticPaymentCashBackOverwrite: false}));
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </CreditCardSelect>
                                                </div>
                                            )}
                                            {expenseProps.oneTimePayment.isCredit && (
                                                <div className="expense-input">
                                                    <CreditCardSelect
                                                        key={`one-time-${expenseProps.oneTimePayment.isCredit}-${expenseProps.oneTimePayment.creditCardId ?? 'none'}`}
                                                        label="Credit Card"
                                                        required={true}
                                                        isInvalid={fieldErrors.oneTimeExpenseCreditCardId}
                                                        initialValue={expenseProps.oneTimePayment.creditCardId || ''}
                                                        onManageOpen={() => setIsManageModalOpen(true)}
                                                        onManageClose={() => setIsManageModalOpen(false)}
                                                        onChange={(e) => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                oneTimePayment: {
                                                                    ...prevState.oneTimePayment,
                                                                    creditCardId: e.target.value
                                                                },
                                                            }));
                                                            if (fieldErrors.oneTimeExpenseCreditCardId) {
                                                                setFieldErrors((prev) => ({...prev, oneTimeExpenseCreditCardId: false}));
                                                            }
                                                        }}
                                                    >
                                                        <div className="credit-card-options-label">Cash back options</div>
                                                        <div className="expense-toggle-row">
                                                            <label className={'form-label'} htmlFor="ignoreCashBackOnCreate">
                                                                Ignore Cash Back?
                                                            </label>
                                                            <input
                                                                className={'form-check-input'}
                                                                type={'checkbox'}
                                                                id="ignoreCashBackOnCreate"
                                                                checked={expenseProps.ignoreCashBackForPaymentsOnCreation}
                                                                onChange={() => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        ignoreCashBackForPaymentsOnCreation: !prevState.ignoreCashBackForPaymentsOnCreation,
                                                                        cashBackOverwriteEnabled: !prevState.ignoreCashBackForPaymentsOnCreation
                                                                            ? false
                                                                            : prevState.cashBackOverwriteEnabled,
                                                                        cashBackOverwrite: !prevState.ignoreCashBackForPaymentsOnCreation
                                                                            ? ''
                                                                            : prevState.cashBackOverwrite
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="expense-toggle-row">
                                                            <label className={'form-label'} htmlFor="cashBackOverwriteToggle">
                                                                Cash Back Overwrite?
                                                            </label>
                                                            <input
                                                                className={'form-check-input'}
                                                                type={'checkbox'}
                                                                id="cashBackOverwriteToggle"
                                                                checked={expenseProps.cashBackOverwriteEnabled}
                                                                onChange={() => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        ignoreCashBackForPaymentsOnCreation: false,
                                                                        cashBackOverwriteEnabled: !prevState.cashBackOverwriteEnabled,
                                                                        cashBackOverwrite: !prevState.cashBackOverwriteEnabled
                                                                            ? prevState.cashBackOverwrite
                                                                            : ''
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                        {expenseProps.cashBackOverwriteEnabled && (
                                                            <div className="expense-input">
                                                                <label className={'form-label'}>Cash Back Overwrite percentage</label>
                                                                <input
                                                                    className={'form-control'}
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={expenseProps.cashBackOverwrite}
                                                                    onChange={(e) => {
                                                                        setExpenseProps((prevState) => ({
                                                                            ...prevState,
                                                                            cashBackOverwrite: e.target.value
                                                                        }));
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </CreditCardSelect>
                                                </div>
                                            )}
                                            {(expenseProps.oneTimePayment.isPaid || expenseProps.oneTimePayment.isCredit) && (
                                                <div className="expense-input">
                                                    <label className={'form-label'}>Paid on:</label>
                                                    <input
                                                        className={`form-control${fieldErrors.oneTimeExpensePaymentDate ? ' is-invalid' : ''}`}
                                                        type='date'
                                                        value={expenseProps.oneTimePayment.paymentDate || ''}
                                                        onChange={(e) => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                oneTimePayment: {
                                                                    ...prevState.oneTimePayment,
                                                                    paymentDate: e.target.value
                                                                },
                                                            }));
                                                            if (fieldErrors.oneTimeExpensePaymentDate) {
                                                                setFieldErrors((prev) => ({...prev, oneTimeExpensePaymentDate: false}));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {isStartDateBeforeToday() && (
                                                <div className="expense-toggle-row">
                                                    <label className={'form-label'} htmlFor='payToNow'>
                                                        Pay all due dates from start to today?
                                                    </label>
                                                    <input
                                                        className={'form-check-input'}
                                                        type={'checkbox'}
                                                        id='payToNow'
                                                        checked={expenseProps.payToNowPayment.enabled}
                                                        onChange={() => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                payToNowPayment: {
                                                                    ...prevState.payToNowPayment,
                                                                    enabled: !prevState.payToNowPayment.enabled,
                                                                    isCredit: false,
                                                                    creditCardId: null,
                                                                },
                                                            }));
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {expenseProps.payToNowPayment.enabled && (
                                                <>
                                                    <div className="expense-toggle-row">
                                                        <label className={'form-label'} htmlFor='payToNowCredit'>
                                                            Put past payments on credit?
                                                        </label>
                                                        <input
                                                            className={'form-check-input'}
                                                            type={'checkbox'}
                                                            id='payToNowCredit'
                                                            checked={expenseProps.payToNowPayment.isCredit}
                                                            onChange={() => {
                                                                setExpenseProps((prevState) => ({
                                                                    ...prevState,
                                                                    payToNowPayment: {
                                                                        ...prevState.payToNowPayment,
                                                                        isCredit: !prevState.payToNowPayment.isCredit,
                                                                        creditCardId: null,
                                                                    },
                                                                }));
                                                                if (fieldErrors.payToNowCreditCardId) {
                                                                    setFieldErrors((prev) => ({...prev, payToNowCreditCardId: false}));
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    {!expenseProps.payToNowPayment.isCredit && (
                                                        <div className="expense-divider" />
                                                    )}
                                                    {expenseProps.payToNowPayment.isCredit && (
                                                        <div className="expense-input">
                                                            <CreditCardSelect
                                                                key={`pay-to-now-${expenseProps.payToNowPayment.isCredit}-${expenseProps.payToNowPayment.creditCardId ?? 'none'}`}
                                                                required={true}
                                                                isInvalid={fieldErrors.payToNowCreditCardId}
                                                                initialValue={expenseProps.payToNowPayment.creditCardId || ''}
                                                                onManageOpen={() => setIsManageModalOpen(true)}
                                                                onManageClose={() => setIsManageModalOpen(false)}
                                                                onChange={(e) => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        payToNowPayment: {
                                                                            ...prevState.payToNowPayment,
                                                                            creditCardId: e.target.value
                                                                        },
                                                                    }));
                                                                    if (fieldErrors.payToNowCreditCardId) {
                                                                        setFieldErrors((prev) => ({...prev, payToNowCreditCardId: false}));
                                                                    }
                                                                }}
                                                            >
                                                                <div className="credit-card-options-label">Cash back options</div>
                                                                <div className="expense-toggle-row">
                                                                    <label className={'form-label'} htmlFor="ignoreCashBackOnCreatePayToNow">
                                                                        Ignore Cash Back?
                                                                    </label>
                                                                    <input
                                                                        className={'form-check-input'}
                                                                        type={'checkbox'}
                                                                        id="ignoreCashBackOnCreatePayToNow"
                                                                        checked={expenseProps.ignoreCashBackForPaymentsOnCreation}
                                                                        onChange={() => {
                                                                            setExpenseProps((prevState) => ({
                                                                                ...prevState,
                                                                                ignoreCashBackForPaymentsOnCreation: !prevState.ignoreCashBackForPaymentsOnCreation,
                                                                                cashBackOverwriteEnabled: false,
                                                                                cashBackOverwrite: ''
                                                                            }));
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="expense-toggle-row">
                                                                    <label className={'form-label'} htmlFor="cashBackOverwriteTogglePayToNow">
                                                                        Cash Back Overwrite?
                                                                    </label>
                                                                    <input
                                                                        className={'form-check-input'}
                                                                        type={'checkbox'}
                                                                        id="cashBackOverwriteTogglePayToNow"
                                                                        checked={expenseProps.cashBackOverwriteEnabled}
                                                                        onChange={() => {
                                                                            setExpenseProps((prevState) => ({
                                                                                ...prevState,
                                                                                ignoreCashBackForPaymentsOnCreation: false,
                                                                                cashBackOverwriteEnabled: !prevState.cashBackOverwriteEnabled,
                                                                                cashBackOverwrite: !prevState.cashBackOverwriteEnabled
                                                                                    ? prevState.cashBackOverwrite
                                                                                    : ''
                                                                            }));
                                                                        }}
                                                                    />
                                                                </div>
                                                                {expenseProps.cashBackOverwriteEnabled && (
                                                                    <div className="expense-input">
                                                                        <label className={'form-label'}>Cash Back Overwrite percentage</label>
                                                                        <input
                                                                            className={'form-control'}
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={expenseProps.cashBackOverwrite}
                                                                            onChange={(e) => {
                                                                                setExpenseProps((prevState) => ({
                                                                                    ...prevState,
                                                                                    cashBackOverwrite: e.target.value
                                                                                }));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </CreditCardSelect>
                                                        </div>
                                                    )}
                                                    {expenseProps.payToNowPayment.isCredit && (
                                                        <div className="expense-divider" />
                                                    )}
                                                </>
                                            )}
                                            <div className="expense-toggle-row">
                                                <label className={'form-label'} htmlFor='automaticPayment'>
                                                    Start automatic payments?
                                                </label>
                                                <input
                                                    className={'form-check-input'}
                                                    type={'checkbox'}
                                                    id='automaticPayment'
                                                    checked={expenseProps.automaticPayment.enabled}
                                                    onChange={() => {
                                                        setExpenseProps((prevState) => ({
                                                            ...prevState,
                                                            automaticPayment: {
                                                                ...prevState.automaticPayment,
                                                                enabled: !prevState.automaticPayment.enabled,
                                                                isCredit: false,
                                                                creditCardId: null,
                                                                ignoreCashBack: false,
                                                                cashBackOverwriteEnabled: false,
                                                                cashBackOverwrite: '',
                                                            },
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            {expenseProps.automaticPayment.enabled && (
                                                <div className="expense-toggle-row">
                                                    <label className={'form-label'} htmlFor='automaticPaymentCredit'>
                                                        Put automatic payments on credit?
                                                    </label>
                                                    <input
                                                        className={'form-check-input'}
                                                        type={'checkbox'}
                                                        id='automaticPaymentCredit'
                                                        checked={expenseProps.automaticPayment.isCredit}
                                                        onChange={() => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    isCredit: !prevState.automaticPayment.isCredit,
                                                                    creditCardId: null,
                                                                    ignoreCashBack: !prevState.automaticPayment.isCredit
                                                                        ? prevState.automaticPayment.ignoreCashBack
                                                                        : false,
                                                                    cashBackOverwriteEnabled: !prevState.automaticPayment.isCredit
                                                                        ? prevState.automaticPayment.cashBackOverwriteEnabled
                                                                        : false,
                                                                    cashBackOverwrite: !prevState.automaticPayment.isCredit
                                                                        ? prevState.automaticPayment.cashBackOverwrite
                                                                        : '',
                                                                },
                                                            }));
                                                            if (fieldErrors.automaticPaymentCreditCardId) {
                                                                setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {expenseProps.automaticPayment.enabled && expenseProps.automaticPayment.isCredit && (
                                                <div className="expense-input">
                                                    <CreditCardSelect
                                                        key={`auto-pay-${expenseProps.automaticPayment.isCredit}-${expenseProps.automaticPayment.creditCardId ?? 'none'}`}
                                                        required={true}
                                                        isInvalid={fieldErrors.automaticPaymentCreditCardId}
                                                        initialValue={expenseProps.automaticPayment.creditCardId || ''}
                                                        onManageOpen={() => setIsManageModalOpen(true)}
                                                        onManageClose={() => setIsManageModalOpen(false)}
                                                        onChange={(e) => {
                                                            setExpenseProps((prevState) => ({
                                                                ...prevState,
                                                                automaticPayment: {
                                                                    ...prevState.automaticPayment,
                                                                    creditCardId: e.target.value
                                                                },
                                                            }));
                                                            if (fieldErrors.automaticPaymentCreditCardId) {
                                                                setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                            }
                                                        }}
                                                    >
                                                        <div className="credit-card-options-label">Cash back options</div>
                                                        <div className="expense-toggle-row">
                                                            <label className={'form-label'} htmlFor="ignoreCashBackOnAutomatic">
                                                                Ignore Cash Back?
                                                            </label>
                                                            <input
                                                                className={'form-check-input'}
                                                                type={'checkbox'}
                                                                id="ignoreCashBackOnAutomatic"
                                                                checked={expenseProps.automaticPayment.ignoreCashBack}
                                                                onChange={() => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        automaticPayment: {
                                                                            ...prevState.automaticPayment,
                                                                            ignoreCashBack: !prevState.automaticPayment.ignoreCashBack,
                                                                            cashBackOverwriteEnabled: false,
                                                                            cashBackOverwrite: ''
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="expense-toggle-row">
                                                            <label className={'form-label'} htmlFor="cashBackOverwriteToggleAutomatic">
                                                                Cash Back Overwrite?
                                                            </label>
                                                            <input
                                                                className={'form-check-input'}
                                                                type={'checkbox'}
                                                                id="cashBackOverwriteToggleAutomatic"
                                                                checked={expenseProps.automaticPayment.cashBackOverwriteEnabled}
                                                                onChange={() => {
                                                                    setExpenseProps((prevState) => ({
                                                                        ...prevState,
                                                                        automaticPayment: {
                                                                            ...prevState.automaticPayment,
                                                                            ignoreCashBack: false,
                                                                            cashBackOverwriteEnabled: !prevState.automaticPayment.cashBackOverwriteEnabled,
                                                                            cashBackOverwrite: !prevState.automaticPayment.cashBackOverwriteEnabled
                                                                                ? prevState.automaticPayment.cashBackOverwrite
                                                                                : ''
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                        {expenseProps.automaticPayment.cashBackOverwriteEnabled && (
                                                            <div className="expense-input">
                                                                <label className={'form-label'}>Cash Back Overwrite percentage</label>
                                                                <input
                                                                    className={'form-control'}
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={expenseProps.automaticPayment.cashBackOverwrite}
                                                                    onChange={(e) => {
                                                                        setExpenseProps((prevState) => ({
                                                                            ...prevState,
                                                                            automaticPayment: {
                                                                                ...prevState.automaticPayment,
                                                                                cashBackOverwrite: e.target.value
                                                                            }
                                                                        }));
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </CreditCardSelect>
                                                </div>
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
}
