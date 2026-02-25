import {validateDueDate} from "../../../util.jsx";

export const validateCreateExpense = ({expenseProps, resolvedStartDate}) => {
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

    const errors = {
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

    return {errors, costValue};
};

export const buildCreateExpensePayload = ({expenseProps, resolvedStartDate, costValue}) => {
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

    return payload;
};
