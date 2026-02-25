import React, {useState} from 'react';

import {Modal} from '../Modal.jsx';
import {EditExpenseEssentialsSection} from "./editExpense/EditExpenseEssentialsSection.jsx";
import {EditExpenseTimelineSection} from "./editExpense/EditExpenseTimelineSection.jsx";
import {EditExpensePaymentsSection} from "./editExpense/EditExpensePaymentsSection.jsx";
import {buildEditExpensePayload, normalizeAutomaticPaymentOverwrite, validateEditExpense} from "./editExpense/editExpenseValidation.js";
import '../../css/createExpenseForm.css';

export const EditExpenseModal = ({expense, handleSave, handleClose, saveDisabled = false}) => {
    const normalizedAutomaticPaymentOverwrite = normalizeAutomaticPaymentOverwrite(
        expense.automaticPaymentCashBackOverwrite
    );

    const [expenseProps, setExpenseProps] = useState({
        name: expense.name || '',
        cost: expense.cost ?? '',
        categoryId: expense.categoryId || null,
        description: expense.description || '',
        endDate: expense.endDate || null,
        automaticPayments: expense.automaticPayments || false,
        automaticPaymentsUseCredit: Boolean(expense.automaticPaymentCreditCardId),
        automaticPaymentsCreditCardId: expense.automaticPaymentCreditCardId || null,
        automaticPaymentsIgnoreCashBack: expense.automaticPaymentIgnoreCashBack ?? false,
        automaticPaymentsCashBackOverwriteEnabled: !!normalizedAutomaticPaymentOverwrite,
        automaticPaymentsCashBackOverwrite: normalizedAutomaticPaymentOverwrite,
    });
    const [fieldErrors, setFieldErrors] = useState({
        name: false,
        cost: false,
        endDate: false,
        automaticPaymentsCashBackOverwrite: false,
    });
    const isPaidOneTimeExpense = expense.recurrenceRate === 'once' && expense.oneTimeExpenseIsPaid;

    const handleSaveForm = () => {
        const {errors} = validateEditExpense({expenseProps, expense});
        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean)) {
            return;
        }

        handleSave(expense.id, buildEditExpensePayload({expenseProps}));
    };

    return (
        <>
            <Modal
                title={'Edit Expense'}
                handleSave={handleSaveForm}
                handleClose={handleClose}
                className="app-modal"
                saveDisabled={saveDisabled}
            >
                <form className="create-expense-form">
                    <div className="expense-form-grid">
                        <div className="expense-form-column">
                            <EditExpenseEssentialsSection
                                expenseProps={expenseProps}
                                fieldErrors={fieldErrors}
                                isPaidOneTimeExpense={isPaidOneTimeExpense}
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
                                        categoryId: categoryId || null
                                    }));
                                }}
                                onDescriptionChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        description: e.target.value
                                    }));
                                }}
                            />

                            <EditExpenseTimelineSection
                                expense={expense}
                                expenseProps={expenseProps}
                                fieldErrors={fieldErrors}
                                onEndDateChange={(e) => {
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

                        <div className="expense-form-column">
                            <EditExpensePaymentsSection
                                expenseProps={expenseProps}
                                fieldErrors={fieldErrors}
                                isOnce={expense.recurrenceRate === 'once'}
                                onExpensePropsChange={setExpenseProps}
                                onFieldErrorClear={(field) => setFieldErrors((prev) => ({...prev, [field]: false}))}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};
