import React from 'react';
import {CreditCardSelect} from "../../creditCards/CreditCardSelect.jsx";
import {CashBackOptions} from "./CashBackOptions.jsx";

export const CreateExpensePaymentsSection = ({
    expenseProps,
    fieldErrors,
    isOnce,
    isStartDateBeforeToday,
    onExpensePropsChange,
    onFieldErrorClear,
    onManageOpen,
    onManageClose
}) => (
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
                                onExpensePropsChange((prevState) => {
                                    const isPaid = !prevState.oneTimePayment.isPaid;
                                    if (fieldErrors.oneTimeExpensePaymentDate && !isPaid) {
                                        onFieldErrorClear('oneTimeExpensePaymentDate');
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
                                onExpensePropsChange((prevState) => {
                                    const nextCredit = !prevState.oneTimePayment.isCredit;
                                    if (fieldErrors.oneTimeExpenseCreditCardId || fieldErrors.oneTimeExpensePaymentDate) {
                                        onFieldErrorClear('oneTimeExpenseCreditCardId');
                                        onFieldErrorClear('oneTimeExpensePaymentDate');
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
                                onExpensePropsChange((prevState) => {
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
                                    onFieldErrorClear('automaticPaymentCreditCardId');
                                }
                                if (fieldErrors.oneTimeExpenseCreditCardId || fieldErrors.oneTimeExpensePaymentDate) {
                                    onFieldErrorClear('oneTimeExpenseCreditCardId');
                                    onFieldErrorClear('oneTimeExpensePaymentDate');
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
                                    onExpensePropsChange((prevState) => ({
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
                                        onFieldErrorClear('automaticPaymentCreditCardId');
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
                                    onExpensePropsChange((prevState) => ({
                                        ...prevState,
                                        automaticPayment: {
                                            ...prevState.automaticPayment,
                                            creditCardId: e.target.value
                                        },
                                    }));
                                    if (fieldErrors.automaticPaymentCreditCardId) {
                                        onFieldErrorClear('automaticPaymentCreditCardId');
                                    }
                                }}
                            >
                                <CashBackOptions
                                    idPrefix="ignoreCashBackOnScheduledOnce"
                                    ignoreChecked={expenseProps.automaticPayment.ignoreCashBack}
                                    overwriteEnabled={expenseProps.automaticPayment.cashBackOverwriteEnabled}
                                    overwriteValue={expenseProps.automaticPayment.cashBackOverwrite}
                                    overwriteError={fieldErrors.automaticPaymentCashBackOverwrite}
                                    onToggleIgnore={() => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            automaticPayment: {
                                                ...prevState.automaticPayment,
                                                ignoreCashBack: !prevState.automaticPayment.ignoreCashBack,
                                                cashBackOverwriteEnabled: false,
                                                cashBackOverwrite: ''
                                            }
                                        }));
                                    }}
                                    onToggleOverwrite={() => {
                                        onExpensePropsChange((prevState) => ({
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
                                    onOverwriteChange={(e) => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            automaticPayment: {
                                                ...prevState.automaticPayment,
                                                cashBackOverwrite: e.target.value
                                            }
                                        }));
                                        if (fieldErrors.automaticPaymentCashBackOverwrite) {
                                            onFieldErrorClear('automaticPaymentCashBackOverwrite');
                                        }
                                    }}
                                />
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
                                onManageOpen={onManageOpen}
                                onManageClose={onManageClose}
                                onChange={(e) => {
                                    onExpensePropsChange((prevState) => ({
                                        ...prevState,
                                        oneTimePayment: {
                                            ...prevState.oneTimePayment,
                                            creditCardId: e.target.value
                                        },
                                    }));
                                    if (fieldErrors.oneTimeExpenseCreditCardId) {
                                        onFieldErrorClear('oneTimeExpenseCreditCardId');
                                    }
                                }}
                            >
                                <CashBackOptions
                                    idPrefix="ignoreCashBackOnCreateOneTime"
                                    ignoreChecked={expenseProps.ignoreCashBackForPaymentsOnCreation}
                                    overwriteEnabled={expenseProps.cashBackOverwriteEnabled}
                                    overwriteValue={expenseProps.cashBackOverwrite}
                                    onToggleIgnore={() => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            ignoreCashBackForPaymentsOnCreation: !prevState.ignoreCashBackForPaymentsOnCreation,
                                            cashBackOverwriteEnabled: false,
                                            cashBackOverwrite: ''
                                        }));
                                    }}
                                    onToggleOverwrite={() => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            ignoreCashBackForPaymentsOnCreation: false,
                                            cashBackOverwriteEnabled: !prevState.cashBackOverwriteEnabled,
                                            cashBackOverwrite: !prevState.cashBackOverwriteEnabled
                                                ? prevState.cashBackOverwrite
                                                : ''
                                        }));
                                    }}
                                    onOverwriteChange={(e) => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            cashBackOverwrite: e.target.value
                                        }));
                                    }}
                                />
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
                                    onExpensePropsChange((prevState) => ({
                                        ...prevState,
                                        oneTimePayment: {
                                            ...prevState.oneTimePayment,
                                            paymentDate: e.target.value
                                        },
                                    }));
                                    if (fieldErrors.oneTimeExpensePaymentDate) {
                                        onFieldErrorClear('oneTimeExpensePaymentDate');
                                    }
                                }}
                            />
                        </div>
                    )}
                </>
            ) : (
                <>
                    {isStartDateBeforeToday && (
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
                                    onExpensePropsChange((prevState) => ({
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
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            payToNowPayment: {
                                                ...prevState.payToNowPayment,
                                                isCredit: !prevState.payToNowPayment.isCredit,
                                                creditCardId: null,
                                            },
                                        }));
                                        if (fieldErrors.payToNowCreditCardId) {
                                            onFieldErrorClear('payToNowCreditCardId');
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
                                        onManageOpen={onManageOpen}
                                        onManageClose={onManageClose}
                                        onChange={(e) => {
                                            onExpensePropsChange((prevState) => ({
                                                ...prevState,
                                                payToNowPayment: {
                                                    ...prevState.payToNowPayment,
                                                    creditCardId: e.target.value
                                                },
                                            }));
                                            if (fieldErrors.payToNowCreditCardId) {
                                                onFieldErrorClear('payToNowCreditCardId');
                                            }
                                        }}
                                    >
                                        <CashBackOptions
                                            idPrefix="ignoreCashBackOnCreatePayToNow"
                                            ignoreChecked={expenseProps.ignoreCashBackForPaymentsOnCreation}
                                            overwriteEnabled={expenseProps.cashBackOverwriteEnabled}
                                            overwriteValue={expenseProps.cashBackOverwrite}
                                            onToggleIgnore={() => {
                                                onExpensePropsChange((prevState) => ({
                                                    ...prevState,
                                                    ignoreCashBackForPaymentsOnCreation: !prevState.ignoreCashBackForPaymentsOnCreation,
                                                    cashBackOverwriteEnabled: false,
                                                    cashBackOverwrite: ''
                                                }));
                                            }}
                                            onToggleOverwrite={() => {
                                                onExpensePropsChange((prevState) => ({
                                                    ...prevState,
                                                    ignoreCashBackForPaymentsOnCreation: false,
                                                    cashBackOverwriteEnabled: !prevState.cashBackOverwriteEnabled,
                                                    cashBackOverwrite: !prevState.cashBackOverwriteEnabled
                                                        ? prevState.cashBackOverwrite
                                                        : ''
                                                }));
                                            }}
                                            onOverwriteChange={(e) => {
                                                onExpensePropsChange((prevState) => ({
                                                    ...prevState,
                                                    cashBackOverwrite: e.target.value
                                                }));
                                            }}
                                        />
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
                                onExpensePropsChange((prevState) => ({
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
                                    onExpensePropsChange((prevState) => ({
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
                                        onFieldErrorClear('automaticPaymentCreditCardId');
                                    }
                                }}
                            />
                        </div>
                    )}
                    {expenseProps.automaticPayment.isCredit && (
                        <div className="expense-input">
                            <CreditCardSelect
                                key={`automatic-${expenseProps.automaticPayment.isCredit}-${expenseProps.automaticPayment.creditCardId ?? 'none'}`}
                                required={true}
                                isInvalid={fieldErrors.automaticPaymentCreditCardId}
                                initialValue={expenseProps.automaticPayment.creditCardId || ''}
                                onManageOpen={onManageOpen}
                                onManageClose={onManageClose}
                                onChange={(e) => {
                                    onExpensePropsChange((prevState) => ({
                                        ...prevState,
                                        automaticPayment: {
                                            ...prevState.automaticPayment,
                                            creditCardId: e.target.value
                                        },
                                    }));
                                    if (fieldErrors.automaticPaymentCreditCardId) {
                                        onFieldErrorClear('automaticPaymentCreditCardId');
                                    }
                                }}
                            >
                                <CashBackOptions
                                    idPrefix="ignoreCashBackOnCreateAutomatic"
                                    ignoreChecked={expenseProps.automaticPayment.ignoreCashBack}
                                    overwriteEnabled={expenseProps.automaticPayment.cashBackOverwriteEnabled}
                                    overwriteValue={expenseProps.automaticPayment.cashBackOverwrite}
                                    overwriteError={fieldErrors.automaticPaymentCashBackOverwrite}
                                    onToggleIgnore={() => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            automaticPayment: {
                                                ...prevState.automaticPayment,
                                                ignoreCashBack: !prevState.automaticPayment.ignoreCashBack,
                                                cashBackOverwriteEnabled: false,
                                                cashBackOverwrite: ''
                                            }
                                        }));
                                    }}
                                    onToggleOverwrite={() => {
                                        onExpensePropsChange((prevState) => ({
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
                                    onOverwriteChange={(e) => {
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            automaticPayment: {
                                                ...prevState.automaticPayment,
                                                cashBackOverwrite: e.target.value
                                            }
                                        }));
                                        if (fieldErrors.automaticPaymentCashBackOverwrite) {
                                            onFieldErrorClear('automaticPaymentCashBackOverwrite');
                                        }
                                    }}
                                />
                            </CreditCardSelect>
                        </div>
                    )}
                </>
            )}
        </div>
    </section>
);
