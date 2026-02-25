export const invalidateExpenseCaches = (qc) => {
    qc.invalidateQueries({ queryKey: ['tableExpenses'] });
    qc.invalidateQueries({ queryKey: ['upcomingExpenses'] });
    qc.invalidateQueries({ queryKey: ['expenseTrackerExpenses'] });
    qc.invalidateQueries({ queryKey: ['lateExpenses'] });
};

export const invalidatePaymentCaches = (qc) => {
    qc.invalidateQueries({ queryKey: ['tablePayments'] });
};

export const invalidateLateDateCaches = (qc, expenseId) => {
    qc.invalidateQueries({ queryKey: ['lateDates'] });
    if (expenseId) {
        qc.invalidateQueries({ queryKey: ['lateDates', expenseId] });
    }
};

export const invalidatePaymentsForExpense = (qc, expenseId) => {
    if (!expenseId) return;
    qc.invalidateQueries({ queryKey: ['paymentsForExpense', expenseId] });
    qc.invalidateQueries({ queryKey: ['existingPayments', expenseId] });
};

export const invalidateTotalsCaches = (qc) => {
    qc.invalidateQueries({ queryKey: ['categories'] });
    qc.invalidateQueries({ queryKey: ['totalSpent'] });
    qc.invalidateQueries({ queryKey: ['monthlyTotals'] });
    qc.invalidateQueries({ queryKey: ['categoryAvgSpent'] });
};

export const invalidateCategoryCaches = (qc) => {
    qc.invalidateQueries({ queryKey: ['expenseCategories'] });
    qc.invalidateQueries({ queryKey: ['expenseCategories', 'monthlyTotals'] });
};
