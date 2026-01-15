export const getStatus = (e) =>
    e?.response?.status ?? e?.status ?? e?.cause?.status ?? null;

const validateRecurrencePattern = (selectedDate, startDate, recurrenceRate, dueEndOfMonth) => {
    const selectedDay = Number(selectedDate.substring(8, 10));
    const selectedMonth = Number(selectedDate.substring(5, 7));
    const selectedYear = Number(selectedDate.substring(0, 4));
    const startDateDay = Number(startDate.substring(8, 10));
    const startDateMonth = Number(startDate.substring(5, 7));

    const oneDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((new Date(selectedDate) - new Date(startDate)) / oneDay);

    switch (recurrenceRate) {
        case 'daily':
            return true;

        case 'weekly':
            return diffDays % 7 === 0;

        case 'monthly':
            if (dueEndOfMonth) {
                const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                return selectedDay === daysInSelectedMonth;
            }
            return selectedDay === startDateDay;

        case 'yearly':
            return selectedMonth === startDateMonth && selectedDay === startDateDay;

        case 'once':
            return true;

        default:
            return false;
    }
};

export const validateDueDate = (selectedDate, expense, existingPayments) => {
    // Check if payment already exists
    if (existingPayments?.some(p => p.dueDatePaid === selectedDate.substring(0, 10))) {
        return { valid: false, error: 'PAYMENT_EXISTS' };
    }

    const selectedDateObj = new Date(selectedDate);
    const startDateObj = new Date(expense.startDate);
    const endDateObj = expense.endDate ? new Date(expense.endDate) : null;

    // Check date range
    if (selectedDateObj < startDateObj) {
        return { valid: false, error: 'BEFORE_START' };
    }
    if (endDateObj && selectedDateObj >= endDateObj) {
        return { valid: false, error: 'AFTER_END' };
    }

    // Check recurrence pattern match
    const recurrenceValid = validateRecurrencePattern(
        selectedDate,
        expense.startDate,
        expense.recurrenceRate,
        expense.dueEndOfMonth
    );

    return {
        valid: recurrenceValid,
        error: recurrenceValid ? null : 'INVALID_RECURRENCE'
    };
};