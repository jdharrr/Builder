import axios from "axios";
import Cookies from "js-cookie";
import {API_BASE_URL} from "./constants/api.js";

const getAccessToken = () => Cookies.get("access_token");

// Create axios instance with default configuration
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status ?? error?.status ?? null;
        if (status === 401) {
            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);

// User
export const validateToken = async () => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const result = await apiClient.get('/api/auth/validate/accessToken');
        return result.data?.isValid ?? result.data;
    } catch {
        return false;
    }
}

export const login = async (email, password) => {
    const loginRes = await apiClient.post('/api/auth/login', {
        email: email,
        password: password
    });

    return loginRes.data;
}

export const createUser = async (username, email, password) => {
    const result = await apiClient.post('/api/auth/create/user', {
        username,
        email,
        password
    });

    return result.data;
}

export const payScheduledPayments = async () => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.post('/api/payments/pay/scheduled');
    return result.data;
}

export const fetchUser = async () => {
    const result = await apiClient.get('/api/user');
    return result.data;
}

export const updateDarkMode = async (isDarkMode) => {
    const result = await apiClient.patch('/api/user/update/settings/darkMode', {
        isDarkMode
    });
    return result.data;
}

export const payCreditCardBalance = async (creditCardId, paymentAmount, paymentDate, cashBackAmount = 0) => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.post(`/api/payments/creditCards/${creditCardId}/pay`, {
        paymentAmount,
        paymentDate,
        cashBackAmount
    });

    return result.data;
}

// Expenses
export const fetchExpensesForCalendar = async (month, year) => {
    const expensesRes = await apiClient.get('/api/expenses/dashboard/calendar', {
        params: {
            month: month,
            year: year
        }
    });

    return expensesRes.data;
}

export const postExpense = async (expenseProps) => {
    const {
        name,
        cost,
        recurrenceRate,
        categoryId,
        description,
        startDate,
        endDate,
        dueLastDayOfMonth,
        oneTimePayment,
        payToNowPayment,
        automaticPayment,
    } = expenseProps;

    const token = getAccessToken();
    if (!token) throw new Error('401');

    const normalizedOneTimePayment = {
        isPaid: Boolean(oneTimePayment?.isPaid),
        isCredit: Boolean(oneTimePayment?.isCredit),
        paymentDate: oneTimePayment?.paymentDate || null,
        creditCardId: oneTimePayment?.isCredit ? (oneTimePayment?.creditCardId || null) : null,
    };

    const normalizedPayToNowPayment = {
        enabled: Boolean(payToNowPayment?.enabled),
        isCredit: Boolean(payToNowPayment?.isCredit),
        creditCardId: payToNowPayment?.isCredit ? (payToNowPayment?.creditCardId || null) : null,
    };

    const normalizedAutomaticPayment = {
        enabled: Boolean(automaticPayment?.enabled),
        creditCardId: automaticPayment?.isCredit ? (automaticPayment?.creditCardId || null) : null,
    };

    const result = await apiClient.post('/api/expenses/create', {
        name,
        cost,
        recurrenceRate,
        categoryId,
        description,
        startDate,
        endDate,
        endOfTheMonth: dueLastDayOfMonth,
        oneTimePayment: normalizedOneTimePayment,
        payToNowPayment: normalizedPayToNowPayment,
        automaticPayment: normalizedAutomaticPayment,
    });

    return result.data;
}

export const updateExpense = async (expenseId, expenseData) => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.patch(`/api/expenses/update/${expenseId}`, {
        name: expenseData.name,
        cost: expenseData.cost,
        description: expenseData.description,
        endDate: expenseData.endDate,
        categoryId: expenseData.categoryId,
        automaticPayments: expenseData.automaticPayments,
        automaticPaymentsCreditCardId: expenseData.automaticPaymentsCreditCardId,
    });

    return result.data;
};

export const deletePayments = async (paymentIds, expenseId) => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.delete(
        '/api/payments/unpay/dueDates',
        {
            data: {
                paymentIds,
                expenseId
            }
        }
    );

    return result.data;
};


export const payDueDates = async (expenseId, dueDates, datePaid, isSkipped = false, creditCardId = null) => {
    const body = {
        expenseId: expenseId,
        dueDates: dueDates,
        isSkipped: isSkipped,
    };

    if (!isSkipped) {
        body.datePaid = datePaid ?? new Date().toISOString().substring(0,10);
    }
    if (creditCardId) {
        body.creditCardId = creditCardId;
    }
    const result = await apiClient.patch('/api/payments/pay/dueDates', body);

    return result.data;
}

export const getPaymentsForDate = async (date, expenses) => {
    if (!date || expenses.length < 1) return [];

    const expenseIds = expenses.map(exp => exp.id);
    const result = await apiClient.get('/api/expenses/expensePaymentsForDate', {
        params: {
            date: date,
            expenseIds: expenseIds
        }
    });

    return result.data;
}

export const fetchLateExpenses = async () => {
    const result = await apiClient.get('/api/expenses/late');
    return result.data;
}

export const getUpcomingExpenses = async () => {
    const result = await apiClient.get('/api/expenses/dashboard/upcoming');
    return result.data;
}

export const getAllExpenses = async (sortOption, sortDirection, showInactiveExpenses, searchFilter, filters = []) =>  {
    const params = new URLSearchParams();
    params.append('sort', sortOption);
    params.append('sortDir', sortDirection);
    params.append('showInactiveExpenses', String(showInactiveExpenses));

    if (searchFilter !== undefined) {
        params.append('searchValue', searchFilter.searchValue ?? '');
        params.append('searchColumn', searchFilter.searchColumn ?? '');
    }

    filters.forEach((filter, idx) => {
        params.append(`filters[${idx}].filter`, filter.filter);
        params.append(`filters[${idx}].value1`, filter.value1 ?? '');
        if (filter.value2 !== undefined && filter.value2 !== null) {
            params.append(`filters[${idx}].value2`, filter.value2);
        }
    });

    const result = await apiClient.get('/api/expenses/all', {
        params
    });

    return result.data;
}

export const createExpenseCategory = async (name) =>  {
    const result = await apiClient.post('/api/expenses/categories/create', {
        categoryName: name
    });

    return result.data;
}

export const getAllExpenseCategories = async (active = true) => {
    const result = await apiClient.get('/api/expenses/categories', {
        params: active === undefined ? {} : { active }
    });
    console.log(result.data)
    return result.data;
}

export const updateExpenseCategoryName = async (categoryId, newCategoryName) => {
    const result = await apiClient.patch('/api/expenses/categories/update/name', {
        categoryId: categoryId,
        newCategoryName: newCategoryName
    });

    return result.data;
}

export const updateExpenseCategoryActiveStatus = async (categoryId, isActive) => {
    const result = await apiClient.patch(`/api/expenses/categories/${categoryId}/update/active`, {
        active: isActive
    });

    return result.data;
}

export const deleteExpenseCategory = async (categoryId) => {
    const result = await apiClient.delete(`/api/expenses/categories/${categoryId}/delete`);

    return result.data;
}

export const getExpenseCategoriesWithTotalSpent = async (categoryChartRangeOption) => {
    const result = await apiClient.get('/api/expenses/categories/totalSpent', {
        params: {
            rangeOption: categoryChartRangeOption
        }
    });

    return result.data;
}

export const getCategoryAvgSpent = async (year) => {
    const result = await apiClient.get('/api/expenses/categories/avg', {
        params: { year }
    });
    return result.data?.categories ?? result.data?.Categories ?? result.data;
}

export const getExpenseSortOptions = async () => {
    const result = await apiClient.get('/api/expenses/table/options/sort');
    return result.data?.sortOptions ?? result.data;
}

export const getExpenseSearchableColumns = async () => {
    const result = await apiClient.get('/api/expenses/table/options/searchableColumns');
    return result.data?.searchableColumns ?? result.data;
}

export const updateExpenseActiveStatus  = async (isActive, expenseId) => {
    const result = await apiClient.patch(`/api/expenses/update/${expenseId}`, {
        active: isActive,
    });

    return result.data;
}

export const deleteExpense = async (expenseId) => {
    const result = await apiClient.delete(`/api/expenses/${expenseId}/delete`);

    return result.data;
}

export const getPaymentsForExpense = async (expenseId) => {
    const result = await apiClient.get(`/api/payments/expense/${expenseId}`);

    return result.data?.payments ?? result.data;
}

export const getAllPayments = async (sortOption, sortDirection, showSkipped, searchFilter, filters = []) => {
    const params = new URLSearchParams();
    params.append('sort', sortOption);
    params.append('sortDir', sortDirection);
    params.append('showSkipped', String(showSkipped));

    if (searchFilter !== undefined) {
        params.append('searchValue', searchFilter.searchValue ?? '');
        params.append('searchColumn', searchFilter.searchColumn ?? '');
    }

    filters.forEach((filter, idx) => {
        params.append(`filters[${idx}].filter`, filter.filter);
        params.append(`filters[${idx}].value1`, filter.value1 ?? '');
        if (filter.value2 !== undefined && filter.value2 !== null) {
            params.append(`filters[${idx}].value2`, filter.value2);
        }
    });

    const result = await apiClient.get('/api/payments/all', {
        params
    });

    return result.data;
}

export const getPaymentSortOptions = async () => {
    const result = await apiClient.get('/api/payments/table/options/sort');
    return result.data?.sortOptions ?? result.data;
}

export const getPaymentSearchableColumns = async () => {
    const result = await apiClient.get('/api/payments/table/options/searchableColumns');
    return result.data?.searchableColumns ?? result.data;
}

export const getPaymentTableFilterOptions = async () => {
    const result = await apiClient.get('/api/payments/table/options/filters');
    return result.data?.filterOptions ?? result.data;
}

export const getLateDatesForExpense = async (expenseId) => {
    const result = await apiClient.get(`/api/expenses/${expenseId}/lateDates`);

    return result.data?.lateDates ?? result.data;
}

export const getCategoryChartRangeOptions = async () => {
    const result = await apiClient.get('/api/expenses/categories/chart/rangeOptions');
    return result.data?.rangeOptions ?? result.data;
}

export const getExpenseTableBatchActions = async () => {
    const result = await apiClient.get('/api/expenses/table/options/batchActions');
    return result.data?.batchActions ?? result.data;
}

export const getExpenseTableFilterOptions = async () => {
    const result = await apiClient.get('/api/expenses/table/options/filters');
    return result.data?.filterOptions ?? result.data;
}

export const categoryBatchUpdate = async(expenseIds, categoryId) => {
    console.log(expenseIds, categoryId);
    await apiClient.patch('/api/expenses/update/batch/category', {
        expenseIds: expenseIds,
        categoryId: categoryId,
    });
}

export const getTotalSpent = async () => {
    const result = await apiClient.get('/api/payments/total');
    return result.data?.totalSpent ?? result.data;
}

export const getMonthlyTotals = async (year, categoryId = null) => {
    const params = { year };
    if (categoryId) {
        params.categoryId = categoryId;
    }
    const result = await apiClient.get('/api/payments/monthlyTotals', {
        params
    });
    return result.data;
}

export const getCreditCards = async () => {
    const result = await apiClient.get('/api/payments/creditCards');
    return result.data?.creditCards ?? result.data;
}

export const createCreditCard = async (creditCardCompany) => {
    const result = await apiClient.post('/api/payments/creditCards/create', {
        creditCardCompany
    });
    return result.data;
}

export const updateCreditCardCompany = async (creditCardId, creditCardCompany) => {
    const result = await apiClient.patch(`/api/payments/creditCards/${creditCardId}/update/company`, {
        newCompanyName: creditCardCompany
    });
    return result.data;
}
