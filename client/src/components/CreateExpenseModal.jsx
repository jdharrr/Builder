import React, {useContext, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {getAllExpenseCategories, getCreditCards, postExpense} from "../api.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";
import {MONTHS, getYearRange} from "../constants/dateConstants.js";
import {RECURRENCE_RATES} from "../constants/expenseConstants.js";

import '../css/createExpenseForm.css';
import {getStatus, validateDueDate} from "../util.jsx";
import {Dropdown} from "./Dropdown.jsx";
import {Modal} from "./Modal.jsx";
import {showSuccess, showError} from "../utils/toast.js";
import {ManageCategoriesModal} from "./ManageCategoriesModal.jsx";
import {ManageCreditCardsModal} from "./ManageCreditCardsModal.jsx";

export const CreateExpenseModal = ({includeStartDateInput}) => {
    const years = getYearRange();

    const navigate = useNavigate();
    const qc = useQueryClient();

    const {showCreateExpenseForm, setShowCreateExpenseForm} = useContext(CreateExpenseFormContext);
    const { date } = showCreateExpenseForm;

    const [category, setCategory] = useState('');
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [showManageCreditCardsModal, setShowManageCreditCardsModal] = useState(false);

    const [recurrenceRate, setRecurrenceRate] = useState('once');

    const [endOfMonthStartDate, setEndOfMonthStartDate] = useState({year: (new Date()).getFullYear(), month: MONTHS.at((new Date()).getMonth())});

    const [expenseProps, setExpenseProps] = useState({
        name: '',
        cost: 0.0,
        recurrenceRate: 'once',
        categoryId: null,
        description: '',
        startDate: includeStartDateInput ? null : date,
        endDate: null,
        dueLastDayOfMonth: false,
        oneTimeExpenseIsPaid: false,
        oneTimeExpenseIsCredit: false,
        oneTimeExpensePaymentDate: null,
        oneTimeExpenseCreditCardId: null,
        isAutomaticPayment: false,
        automaticPaymentIsCredit: false,
        automaticPaymentCreditCardId: null,
        payToNowIsCredit: false,
        payToNowCreditCardId: null,
        payToNow: false,
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
    });

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showManageCategoriesModal || showManageCreditCardsModal) {
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
    }, [setShowCreateExpenseForm, showManageCategoriesModal, showManageCreditCardsModal]);
    
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

    const { data: creditCards = [] } = useQuery({
        queryKey: ['creditCards'],
        queryFn: async () => {
            return await getCreditCards();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

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

        const nextErrors = {
            name: !expenseProps.name?.trim(),
            cost: Number.isNaN(costValue) || costValue <= 0,
            startDate: !startDateValid,
            endDate: !endDateValid,
            oneTimeExpenseCreditCardId: expenseProps.oneTimeExpenseIsCredit && !expenseProps.oneTimeExpenseCreditCardId,
            oneTimeExpensePaymentDate: (expenseProps.oneTimeExpenseIsCredit || expenseProps.oneTimeExpenseIsPaid)
                && !expenseProps.oneTimeExpensePaymentDate,
            payToNowCreditCardId: expenseProps.payToNowIsCredit && !expenseProps.payToNowCreditCardId,
            automaticPaymentCreditCardId: expenseProps.automaticPaymentIsCredit && !expenseProps.automaticPaymentCreditCardId,
        };

        setFieldErrors(nextErrors);
        if (nextErrors.name || nextErrors.cost || nextErrors.startDate || nextErrors.endDate
            || nextErrors.oneTimeExpenseCreditCardId || nextErrors.oneTimeExpensePaymentDate
            || nextErrors.payToNowCreditCardId || nextErrors.automaticPaymentCreditCardId) {
            return;
        }

        const payload = {
            ...expenseProps,
            cost: costValue,
        };

        if (expenseProps.dueLastDayOfMonth) {
            payload.startDate = resolvedStartDate;
        }
        console.log(payload);
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
        onSuccess: (isCreated) => {
            if (isCreated) {
                showSuccess('Expense successfully created.');
                qc.clear();
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
        setCategory(categoryId);
        setExpenseProps((prevState) => ({
            ...prevState,
            categoryId: categoryId,
        }));
    }

    const handleRecurrenceRateChange = (rate) => {
        setRecurrenceRate(rate);
        setExpenseProps((prevState) => ({
            ...prevState,
            recurrenceRate: rate,
            endDate: rate === 'once' ? null : prevState.endDate,
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
                className="create-expense-modal"
            >
                <form className="create-expense-form">
                    <div className='mb-3'>
                        <label className={'form-label'}>Name</label>
                        <input
                            className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`}
                            type='text'
                               onChange={
                                   (e) => {
                                       setExpenseProps((prevState) => ({
                                           ...prevState,
                                           name: e.target.value
                                       }));
                                       if (fieldErrors.name) {
                                           setFieldErrors((prev) => ({...prev, name: false}));
                                       }
                                   }
                               }
                        />
                    </div>
                    <div className='mb-3'>
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
                    <div className='mb-3'>
                        <label className={'form-label'}>Recurrence Rate</label>
                        <select className={'form-select'} value={recurrenceRate} onChange={(e) => handleRecurrenceRateChange(e.target.value)}>
                            {Object.entries(RECURRENCE_RATES).map(([rate, rateLabel]) => (
                                <option value={rate} key={rateLabel}>{rateLabel}</option>
                            ))}
                        </select>

                        {!includeStartDateInput
                        && expenseProps.recurrenceRate === 'monthly'
                        && expenseProps.startDate.substring(8,10) == new Date(new Date(expenseProps.startDate).getFullYear(), new Date(expenseProps.startDate).getMonth() + 1, 0).getDate()
                        &&
                            <div className='ms-1'>
                                <label className={'form-label me-2'} htmlFor="dueEndOfMonth1">Due on the last day of the month?</label>
                                <input className={'form-check-input mt-2'} type={'checkbox'} id="dueEndOfMonth1"
                                       onChange={() => {
                                           setExpenseProps((prevState) => ({
                                               ...prevState,
                                               dueLastDayOfMonth: !prevState.dueLastDayOfMonth
                                           }));
                                       }}
                                />
                            </div>
                        }
                    </div>
                    {includeStartDateInput && (
                        <div className={'mb-3'}>
                            {expenseProps.dueLastDayOfMonth ? (
                                <>
                                    <label className={'form-label'}>{expenseProps.recurrenceRate === 'once' ? 'Due Date' : 'Start Date'}</label>
                                    <div className="d-flex gap-2">
                                        <Dropdown title={endOfMonthStartDate.month} options={MONTHS} handleOptionChange={handleMonthChange} maxHeight={'20rem'} includeScrollbarY={true} />
                                        <Dropdown title={endOfMonthStartDate.year} options={years} handleYearChange={handleYearChange} maxHeight={'20rem'} includeScrollbarY={true} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label className={'form-label'}>{expenseProps.recurrenceRate === 'once' ? 'Due Date' : 'Start Date'}</label>
                                    <input
                                           className={`form-control${fieldErrors.startDate ? ' is-invalid' : ''}`}
                                           type='date'
                                           disabled={expenseProps.dueLastDayOfMonth}
                                           value={expenseProps.startDate || ""}
                                           onChange={
                                               (e) => {
                                                   setExpenseProps((prevState) => ({
                                                       ...prevState,
                                                       startDate: e.target.value
                                                   }));
                                                   if (fieldErrors.startDate) {
                                                       setFieldErrors((prev) => ({...prev, startDate: false}));
                                                   }
                                               }
                                           }
                                    />
                                </>
                            )}

                            {expenseProps.recurrenceRate === 'monthly' &&
                                <div className='ms-1'>
                                    <label className={'form-label me-2'} htmlFor="dueEndOfMonth2">Due on the last day of the month?</label>
                                    <input className={'form-check-input mt-2'} type={'checkbox'} id="dueEndOfMonth2"
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
                            }
                        </div>
                    )}
                    { expenseProps.recurrenceRate !== 'once' &&
                        <div className='mb-3'>
                            <label className={'form-label'}>End Date</label>
                            <input
                                   className={`form-control${fieldErrors.endDate ? ' is-invalid' : ''}`}
                                   type='date'
                                   onChange={
                                       (e) => {
                                           setExpenseProps((prevState) => ({
                                               ...prevState,
                                               endDate: e.target.value
                                           }));
                                           if (fieldErrors.endDate) {
                                               setFieldErrors((prev) => ({...prev, endDate: false}));
                                           }
                                       }
                                   }
                            />
                        </div>
                    }
                    <div className='mb-3'>
                    <label className={'form-label'}>Category</label>
                    <div className={"row d-flex justify-content-center align-items-center me-2"}>
                        <div className={'col'}>
                            <select className={'form-select'} value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
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
                        <textarea className={'form-control'} rows={2}
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
                    {expenseProps.recurrenceRate === 'once' &&
                        <div className='mb-3'>
                            <div className=''>
                                <label className={'form-label me-2'} htmlFor="paidCheckbox">Paid?</label>
                                <input
                                    className={'form-check-input'}
                                    type={'checkbox'}
                                    id="paidCheckbox"
                                    checked={expenseProps.oneTimeExpenseIsPaid}
                                    onChange={() => {
                                        setExpenseProps((prevState) => {
                                            const isPaid = !prevState.oneTimeExpenseIsPaid;
                                            if (fieldErrors.oneTimeExpensePaymentDate && !isPaid) {
                                                setFieldErrors((prev) => ({...prev, oneTimeExpensePaymentDate: false}));
                                            }
                                            return {
                                                ...prevState,
                                                oneTimeExpenseIsPaid: isPaid,
                                                oneTimeExpenseIsCredit: false,
                                                oneTimeExpenseCreditCardId: null,
                                            };
                                        });
                                    }}
                                />
                            </div>
                            <div className='mt-2'>
                                <label className={'form-label me-2'} htmlFor="creditCheckbox">Currently on credit?</label>
                                <input
                                    className={'form-check-input'}
                                    type={'checkbox'}
                                    id="creditCheckbox"
                                    checked={expenseProps.oneTimeExpenseIsCredit}
                                    onChange={() => {
                                        setExpenseProps((prevState) => {
                                            const nextCredit = !prevState.oneTimeExpenseIsCredit;
                                            if (fieldErrors.oneTimeExpenseCreditCardId || fieldErrors.oneTimeExpensePaymentDate) {
                                                setFieldErrors((prev) => ({
                                                    ...prev,
                                                    oneTimeExpenseCreditCardId: false,
                                                    oneTimeExpensePaymentDate: false
                                                }));
                                            }
                                            return {
                                                ...prevState,
                                                oneTimeExpenseIsCredit: nextCredit,
                                                oneTimeExpenseIsPaid: false,
                                                oneTimeExpenseCreditCardId: nextCredit ? prevState.oneTimeExpenseCreditCardId : null,
                                            };
                                        });
                                    }}
                                />
                            </div>
                            {expenseProps.oneTimeExpenseIsCredit && (
                                <div className="mt-2">
                                    <label className="form-label">Credit Card</label>
                                    <div className="row d-flex justify-content-center align-items-center me-2">
                                        <div className="col">
                                            <select
                                                className={`form-select${fieldErrors.oneTimeExpenseCreditCardId ? ' is-invalid' : ''}`}
                                                value={expenseProps.oneTimeExpenseCreditCardId || ""}
                                                onChange={(e) => {
                                                    setExpenseProps((prevState) => ({
                                                        ...prevState,
                                                        oneTimeExpenseCreditCardId: e.target.value
                                                    }));
                                                    if (fieldErrors.oneTimeExpenseCreditCardId) {
                                                        setFieldErrors((prev) => ({...prev, oneTimeExpenseCreditCardId: false}));
                                                    }
                                                }}
                                            >
                                                <option value={""}>Select a credit card</option>
                                                {creditCards.map((card) => (
                                                    <option key={card.id} value={card.id}>{card.company || 'Unnamed card'}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-auto">
                                            <button
                                                className={'manageCategoriesButton'}
                                                type='button'
                                                onClick={() => setShowManageCreditCardsModal(true)}
                                            >
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {(expenseProps.oneTimeExpenseIsPaid || expenseProps.oneTimeExpenseIsCredit) &&
                                <div className='mt-2'>
                                    <label className={'form-label'}>Paid on:</label>
                                    <input
                                        className={`form-control${fieldErrors.oneTimeExpensePaymentDate ? ' is-invalid' : ''}`}
                                        type='date'
                                        value={expenseProps.oneTimeExpensePaymentDate || ''}
                                        onChange={(e) => {
                                            setExpenseProps((prevState) => ({
                                                ...prevState,
                                                oneTimeExpensePaymentDate: e.target.value
                                            }));
                                            if (fieldErrors.oneTimeExpensePaymentDate) {
                                                setFieldErrors((prev) => ({...prev, oneTimeExpensePaymentDate: false}));
                                            }
                                        }}
                                    />
                                </div>
                            }
                        </div>
                    }
                    { expenseProps.recurrenceRate !== 'once' &&
                        <>
                            {isStartDateBeforeToday() && (
                                <div className='mb-0'>
                                    <label className={'form-label me-2'} htmlFor='payToNow'>
                                        Pay all due dates from start to today?
                                    </label>
                                    <input
                                        className={'form-check-input'}
                                        type={'checkbox'}
                                        id='payToNow'
                                        checked={expenseProps.payToNow}
                                        onChange={() => {
                                            setExpenseProps((prevState) => ({
                                                ...prevState,
                                                payToNow: !prevState.payToNow,
                                                payToNowIsCredit: false,
                                                payToNowCreditCardId: null,
                                            }));
                                        }}
                                    />
                                </div>
                            )}
                            {expenseProps.payToNow && (
                                <div className="mb-0">
                                    <label className={'form-label me-2'} htmlFor='payToNowCredit'>
                                        Pay to now with credit?
                                    </label>
                                    <input
                                        className={'form-check-input'}
                                        type={'checkbox'}
                                        id='payToNowCredit'
                                        checked={expenseProps.payToNowIsCredit}
                                        onChange={() => {
                                            setExpenseProps((prevState) => ({
                                                ...prevState,
                                                payToNowIsCredit: !prevState.payToNowIsCredit,
                                                payToNowCreditCardId: null
                                            }));
                                            if (fieldErrors.payToNowCreditCardId) {
                                                setFieldErrors((prev) => ({...prev, payToNowCreditCardId: false}));
                                            }
                                        }}
                                    />
                                    {expenseProps.payToNowIsCredit && (
                                        <div className="row d-flex justify-content-center align-items-center me-2 mb-1">
                                            <div className="col">
                                                <select
                                                    className={`form-select${fieldErrors.payToNowCreditCardId ? ' is-invalid' : ''}`}
                                                    value={expenseProps.payToNowCreditCardId || ""}
                                                    onChange={(e) => {
                                                        setExpenseProps((prevState) => ({
                                                            ...prevState,
                                                            payToNowCreditCardId: e.target.value
                                                        }));
                                                        if (fieldErrors.payToNowCreditCardId) {
                                                            setFieldErrors((prev) => ({...prev, payToNowCreditCardId: false}));
                                                        }
                                                    }}
                                                >
                                                    <option value={""}>Select a credit card</option>
                                                    {creditCards.map((card) => (
                                                        <option key={card.id} value={card.id}>{card.company || 'Unnamed card'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-auto">
                                                <button
                                                    className={'manageCategoriesButton'}
                                                    type='button'
                                                    onClick={() => setShowManageCreditCardsModal(true)}
                                                >
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="mb-2">
                                <div className="mb-1">
                                    <label className={'form-label me-2'} htmlFor='automaticPayment'>
                                        Start automatic payments?
                                    </label>
                                    <input
                                        className={'form-check-input'}
                                        type={'checkbox'}
                                        id='automaticPayment'
                                        checked={expenseProps.isAutomaticPayment}
                                        onChange={() => {
                                            setExpenseProps((prevState) => ({
                                                ...prevState,
                                                isAutomaticPayment: !prevState.isAutomaticPayment,
                                                automaticPaymentIsCredit: false,
                                                automaticPaymentCreditCardId: null,
                                            }));
                                        }}
                                    />
                                </div>
                                {expenseProps.isAutomaticPayment && (
                                    <div className="mb-1">
                                        <label className={'form-label me-2'} htmlFor='automaticPaymentCredit'>
                                            Automatically pay with credit?
                                        </label>
                                        <input
                                            className={'form-check-input'}
                                            type={'checkbox'}
                                            id='automaticPaymentCredit'
                                            checked={expenseProps.automaticPaymentIsCredit}
                                            onChange={() => {
                                                setExpenseProps((prevState) => ({
                                                    ...prevState,
                                                    automaticPaymentIsCredit: !prevState.automaticPaymentIsCredit,
                                                    automaticPaymentCreditCardId: null,
                                                }));
                                                if (fieldErrors.automaticPaymentCreditCardId) {
                                                    setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                {expenseProps.isAutomaticPayment && expenseProps.automaticPaymentIsCredit && (
                                    <div className="row d-flex justify-content-center align-items-center me-2 mb-1">
                                        <div className="col">
                                            <select
                                                className={`form-select${fieldErrors.automaticPaymentCreditCardId ? ' is-invalid' : ''}`}
                                                value={expenseProps.automaticPaymentCreditCardId || ""}
                                                onChange={(e) => {
                                                    setExpenseProps((prevState) => ({
                                                        ...prevState,
                                                        automaticPaymentCreditCardId: e.target.value
                                                    }));
                                                    if (fieldErrors.automaticPaymentCreditCardId) {
                                                        setFieldErrors((prev) => ({...prev, automaticPaymentCreditCardId: false}));
                                                    }
                                                }}
                                            >
                                                <option value={""}>Select a credit card</option>
                                                {creditCards.map((card) => (
                                                    <option key={card.id} value={card.id}>{card.company || 'Unnamed card'}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-auto">
                                            <button
                                                className={'manageCategoriesButton'}
                                                type='button'
                                                onClick={() => setShowManageCreditCardsModal(true)}
                                            >
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    }
                </form>
            </Modal>
            {showManageCategoriesModal && (
                <ManageCategoriesModal
                    handleClose={() => setShowManageCategoriesModal(false)}
                    onClose={() => {
                        setShowCreateExpenseForm((prev) => ({
                            ...prev,
                            isShowing: true,
                        }));
                    }}
                />
            )}
            {showManageCreditCardsModal && (
                <ManageCreditCardsModal
                    handleClose={() => setShowManageCreditCardsModal(false)}
                    onClose={() => {
                        setShowCreateExpenseForm((prev) => ({
                            ...prev,
                            isShowing: true,
                        }));
                    }}
                />
            )}
        </>
    );
}
