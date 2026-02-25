import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {getExpenseRecurrenceRates, postExpense} from "../../../api.jsx";
import {CreateExpenseFormContext} from "../../../providers/expenses/CreateExpenseFormContext.jsx";
import {MONTHS, getYearRange} from "../../../constants/dateConstants.js";

import '../../../css/createExpenseForm.css';
import {showApiErrorToast, getStatus} from "../../../util.jsx";
import {Modal} from "../../Modal.jsx";
import {showSuccess, showError} from "../../../utils/toast.js";
import {invalidateExpenseCaches, invalidatePaymentCaches, invalidateTotalsCaches} from "../../../utils/queryInvalidations.js";
import {CreateExpenseEssentialsSection} from "./CreateExpenseEssentialsSection.jsx";
import {CreateExpenseTimelineSection} from "./CreateExpenseTimelineSection.jsx";
import {CreateExpensePaymentsSection} from "./CreateExpensePaymentsSection.jsx";
import {buildCreateExpensePayload, validateCreateExpense} from "./createExpenseValidation.js";

export const CreateExpenseModal = ({includeStartDateInput}) => {
    const years = getYearRange();

    const navigate = useNavigate();
    const qc = useQueryClient();

    const {showCreateExpenseForm, setShowCreateExpenseForm} = useContext(CreateExpenseFormContext);
    const { date } = showCreateExpenseForm;

    const [endOfMonthStartDate, setEndOfMonthStartDate] = useState({year: (new Date()).getFullYear(), month: MONTHS.at((new Date()).getMonth())});
    const [expenseProps, setExpenseProps] = useState({
        name: '',
        cost: '',
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

    const handleSaveForm = async () => {
        const monthIndex = MONTHS.indexOf(endOfMonthStartDate.month);
        const resolvedStartDate = expenseProps.dueLastDayOfMonth
            ? new Date(endOfMonthStartDate.year, monthIndex + 1, 0).toISOString().substring(0, 10)
            : expenseProps.startDate;
        const {errors, costValue} = validateCreateExpense({expenseProps, resolvedStartDate});

        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean)) {
            return;
        }
        const payload = buildCreateExpensePayload({expenseProps, resolvedStartDate, costValue});
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
        onSuccess: (response, payload) => {
            if (response?.isCreated) {
                showSuccess('Expense successfully created.');
                invalidateExpenseCaches(qc);
                invalidatePaymentCaches(qc);
                invalidateTotalsCaches(qc);
                const hasCreditCardPayment = Boolean(
                    payload?.oneTimePayment?.creditCardId
                    || payload?.automaticPayment?.creditCardId
                    || payload?.payToNowPayment?.creditCardId
                );
                if (hasCreditCardPayment) {
                    qc.invalidateQueries({ queryKey: ['creditCards'] });
                }
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
            showApiErrorToast(err, 'Error creating expense.');
        }
    });

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
                handleSave={handleSaveForm}
                handleClose={handleCloseForm}
                className={`app-modal${isManageModalOpen ? ' create-expense-modal--suppressed' : ''}`}
                saveDisabled={createExpenseMutation.isPending}
            >
                <form className="create-expense-form">
                    <div className="expense-form-grid">
                        <div className="expense-form-column">
                            <CreateExpenseEssentialsSection
                                expenseProps={expenseProps}
                                fieldErrors={fieldErrors}
                                onNameChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        name: e.target.value
                                    }));
                                    if (fieldErrors.name) {
                                        setFieldErrors((prev) => ({...prev, name: false}));
                                    }
                                }}
                                onCostChange={(e) => {
                                    const { value } = e.target;
                                    setExpenseProps((prev) => ({
                                        ...prev,
                                        cost: value === '' ? '' : Number(value).toFixed(2),
                                    }));
                                    if (fieldErrors.cost) {
                                        setFieldErrors((prev) => ({...prev, cost: false}));
                                    }
                                }}
                                onCategoryChange={(categoryId) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        categoryId: categoryId || null,
                                    }));
                                }}
                                onDescriptionChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        description: e.target.value
                                    }));
                                }}
                            />

                            <CreateExpenseTimelineSection
                                expenseProps={expenseProps}
                                fieldErrors={fieldErrors}
                                recurrenceRates={recurrenceRates}
                                includeStartDateInput={includeStartDateInput}
                                isOnce={isOnce}
                                isMonthly={isMonthly}
                                endOfMonthStartDate={endOfMonthStartDate}
                                years={years}
                                onRecurrenceRateChange={handleRecurrenceRateChange}
                                onMonthChange={handleMonthChange}
                                onYearChange={handleYearChange}
                                onStartDateChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        startDate: e.target.value
                                    }));
                                    if (fieldErrors.startDate) {
                                        setFieldErrors((prev) => ({...prev, startDate: false}));
                                    }
                                }}
                                onEndDateChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        endDate: e.target.value
                                    }));
                                    if (fieldErrors.endDate) {
                                        setFieldErrors((prev) => ({...prev, endDate: false}));
                                    }
                                }}
                                onToggleDueLastDayOfMonth={() => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        dueLastDayOfMonth: !prevState.dueLastDayOfMonth
                                    }));
                                }}
                                onToggleDueLastDayOfMonthWithReset={() => {
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

                        <div className="expense-form-column">
                            <CreateExpensePaymentsSection
                                expenseProps={expenseProps}
                                fieldErrors={fieldErrors}
                                isOnce={isOnce}
                                isStartDateBeforeToday={isStartDateBeforeToday()}
                                onExpensePropsChange={setExpenseProps}
                                onFieldErrorClear={(field) => setFieldErrors((prev) => ({...prev, [field]: false}))}
                                onManageOpen={() => setIsManageModalOpen(true)}
                                onManageClose={() => setIsManageModalOpen(false)}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
}
