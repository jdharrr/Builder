import {validateDueDate} from "../../../util.jsx";

export const normalizeAutomaticPaymentOverwrite = (value) => (
    value && value > 0 ? value : ''
);

export const validateEditExpense = ({expenseProps, expense}) => {
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

    const automaticPaymentOverwriteValue = Number(expenseProps.automaticPaymentsCashBackOverwrite);
    const automaticPaymentOverwriteInvalid = expenseProps.automaticPaymentsUseCredit
        && expenseProps.automaticPaymentsCashBackOverwriteEnabled
        && (Number.isNaN(automaticPaymentOverwriteValue) || automaticPaymentOverwriteValue <= 0);

    const errors = {
        name: !expenseProps.name?.trim(),
        cost: Number.isNaN(costValue) || costValue <= 0,
        endDate: !endDateValid,
        creditCardId: expenseProps.automaticPaymentsUseCredit && expenseProps.automaticPaymentsCreditCardId === null,
        automaticPaymentsCashBackOverwrite: automaticPaymentOverwriteInvalid,
    };

    return {errors};
};

export const buildEditExpensePayload = ({expenseProps}) => ({
    name: expenseProps.name,
    cost: expenseProps.cost,
    categoryId: expenseProps.categoryId,
    description: expenseProps.description,
    endDate: expenseProps.endDate,
    automaticPayments: expenseProps.automaticPayments,
    automaticPaymentsCreditCardId: expenseProps.automaticPaymentsUseCredit
        ? expenseProps.automaticPaymentsCreditCardId
        : null,
    automaticPaymentsIgnoreCashBack: expenseProps.automaticPaymentsUseCredit
        ? expenseProps.automaticPaymentsIgnoreCashBack
        : false,
    automaticPaymentsCashBackOverwrite: expenseProps.automaticPaymentsUseCredit
        && expenseProps.automaticPaymentsCashBackOverwriteEnabled
        ? Number(expenseProps.automaticPaymentsCashBackOverwrite)
        : null,
});
