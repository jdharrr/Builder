import React from 'react';
import {CreditCardSelect} from "../../creditCards/CreditCardSelect.jsx";
import {CashBackOptions} from "../createExpense/CashBackOptions.jsx";

export const EditExpensePaymentsSection = ({
    expenseProps,
    fieldErrors,
    isOnce,
    onExpensePropsChange,
    onFieldErrorClear
}) => (
    <section className="expense-form-card">
        <header className="expense-card-header">
            <h6 className="expense-card-title">Payments</h6>
        </header>
        <div className="expense-card-body">
            {!isOnce && (
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
                                onExpensePropsChange((prevState) => ({
                                    ...prevState,
                                    automaticPayments: !prevState.automaticPayments,
                                    automaticPaymentsUseCredit: false,
                                    automaticPaymentsCreditCardId: null,
                                    automaticPaymentsIgnoreCashBack: false,
                                    automaticPaymentsCashBackOverwriteEnabled: false,
                                    automaticPaymentsCashBackOverwrite: '',
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
                                        onExpensePropsChange((prevState) => ({
                                            ...prevState,
                                            automaticPaymentsUseCredit: !prevState.automaticPaymentsUseCredit,
                                            automaticPaymentsCreditCardId: prevState.automaticPaymentsUseCredit
                                                ? null
                                                : prevState.automaticPaymentsCreditCardId,
                                            automaticPaymentsIgnoreCashBack: prevState.automaticPaymentsUseCredit
                                                ? false
                                                : prevState.automaticPaymentsIgnoreCashBack,
                                            automaticPaymentsCashBackOverwriteEnabled: prevState.automaticPaymentsUseCredit
                                                ? false
                                                : prevState.automaticPaymentsCashBackOverwriteEnabled,
                                            automaticPaymentsCashBackOverwrite: prevState.automaticPaymentsUseCredit
                                                ? ''
                                                : prevState.automaticPaymentsCashBackOverwrite,
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
                                            onExpensePropsChange((prevState) => ({
                                                ...prevState,
                                                automaticPaymentsCreditCardId: e.target.value || null
                                            }));
                                            if (fieldErrors.creditCardId) {
                                                onFieldErrorClear('creditCardId');
                                            }
                                        }}
                                    >
                                        <CashBackOptions
                                            idPrefix="automaticPaymentsEdit"
                                            ignoreChecked={expenseProps.automaticPaymentsIgnoreCashBack}
                                            overwriteEnabled={expenseProps.automaticPaymentsCashBackOverwriteEnabled}
                                            overwriteValue={expenseProps.automaticPaymentsCashBackOverwrite}
                                            overwriteError={fieldErrors.automaticPaymentsCashBackOverwrite}
                                            onToggleIgnore={() => {
                                                onExpensePropsChange((prevState) => ({
                                                    ...prevState,
                                                    automaticPaymentsIgnoreCashBack: !prevState.automaticPaymentsIgnoreCashBack,
                                                    automaticPaymentsCashBackOverwriteEnabled: false,
                                                    automaticPaymentsCashBackOverwrite: ''
                                                }));
                                            }}
                                            onToggleOverwrite={() => {
                                                onExpensePropsChange((prevState) => ({
                                                    ...prevState,
                                                    automaticPaymentsIgnoreCashBack: false,
                                                    automaticPaymentsCashBackOverwriteEnabled: !prevState.automaticPaymentsCashBackOverwriteEnabled,
                                                    automaticPaymentsCashBackOverwrite: !prevState.automaticPaymentsCashBackOverwriteEnabled
                                                        ? prevState.automaticPaymentsCashBackOverwrite
                                                        : ''
                                                }));
                                            }}
                                            onOverwriteChange={(e) => {
                                                onExpensePropsChange((prevState) => ({
                                                    ...prevState,
                                                    automaticPaymentsCashBackOverwrite: e.target.value
                                                }));
                                                if (fieldErrors.automaticPaymentsCashBackOverwrite) {
                                                    onFieldErrorClear('automaticPaymentsCashBackOverwrite');
                                                }
                                            }}
                                        />
                                    </CreditCardSelect>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    </section>
);
