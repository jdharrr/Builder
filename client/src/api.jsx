import axios from "axios";
import Cookies from "js-cookie";
import {API_BASE_URL} from "./constants/api.js";
import qs from "qs";

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

// User
export const validateToken = async () => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const result = await apiClient.get('/api/auth/validateAccessToken');
        return result.data;
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

export const fetchUser = async () => {
    const result = await apiClient.get('/api/user');
    return result.data;
}

export const updateDarkMode = async (isDarkMode) => {
    const result = await apiClient.patch('/api/user/update/settings/darkMode', isDarkMode);
    return result.data;
}

// Expenses
export const fetchExpensesForCalendar = async (month, year) => {
    const expensesRes = await apiClient.get('/api/expenses/expensesForDashboardCalendar', {
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
        paidOnCreation,
        dueLastDayOfMonth,
        initialDatePaid,
        payToNow  // TODO: Backend needs to handle this - should pay all due dates from start to today
    } = expenseProps;

    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.post('/api/expenses/createExpense', {
        name: name,
        cost: cost,
        recurrenceRate: recurrenceRate,
        categoryId: categoryId,
        description: description,
        startDate: startDate,
        endDate: endDate,
        isPaidOnCreation: paidOnCreation,
        dueLastDayOfMonth: dueLastDayOfMonth,
        initialDatePaid: initialDatePaid,
        payToNow: payToNow,
    });

    return result.data;
}

// TODO: Backend endpoint needed - PATCH /api/expenses/update/expense
export const updateExpense = async (expenseId, expenseData) => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.patch('/api/expenses/update/expense', {
        expenseId: expenseId,
        name: expenseData.name,
        cost: expenseData.cost,
        description: expenseData.description,
        recurrenceRate: expenseData.recurrenceRate,
        startDate: expenseData.startDate,
        endDate: expenseData.endDate,
        categoryId: expenseData.categoryId,
        dueEndOfMonth: expenseData.dueLastDayOfMonth,
    });

    return result.data;
};

export const payAllOverdueDatesForExpense = async (expenseId) => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.post(`/api/expenses/payments/payAllOverdue/${expenseId}`);

    return result.data;
};

export const deletePayments = async (paymentIds) => {
    const token = getAccessToken();
    if (!token) throw new Error('401');

    const result = await apiClient.delete('/api/expenses/payments/unpayDueDates', {
        params: { paymentIds },
        paramsSerializer: params =>
            qs.stringify(params, { arrayFormat: 'repeat' })
    });

    return result.data;
};

export const payDueDate = async (expenseId, dueDate, datePaid) => {
    const body = {
        expenseId: expenseId,
        dueDate: dueDate
    };

    if (datePaid === undefined) {
        body.datePaid = new Date().toISOString().substring(0,10);
    }
    const result = await apiClient.patch('/api/expenses/payments/payDueDate', body);

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
    const result = await apiClient.get('/api/expenses/lateExpenses');
    return result.data;
}

export const getUpcomingExpenses = async () => {
    const result = await apiClient.get('/api/expenses/getUpcomingExpenses');
    return result.data;
}

export const getAllExpenses = async (sortOption, sortDirection, showInactiveExpenses, searchFilter) =>  {
    const params = {
        sort: sortOption,
        sortDir: sortDirection,
        showInactiveExpenses: showInactiveExpenses,
    };

    if (searchFilter !== undefined) {
        params.searchValue = searchFilter.searchValue;
        params.searchColumn = searchFilter.searchColumn;
    }

    const result = await apiClient.get('/api/expenses/getAllExpenses', {
        params: params
    });

    return result.data;
}

export const createExpenseCategory = async (name) =>  {
    const result = await apiClient.post('/api/expenses/categories/create', {
        categoryName: name
    });

    return result.data;
}

export const getAllExpenseCategories = async () => {
    const result = await apiClient.get('/api/expenses/categories');
    console.log(result.data)
    return result.data;
}

export const getExpenseCategoriesWithTotalSpent = async (categoryChartRangeOption) => {
    const result = await apiClient.get('/api/expenses/categories/categoriesTotalSpent', {
        params: {
            rangeOption: categoryChartRangeOption
        }
    });

    return result.data;
}

export const getExpenseSortOptions = async () => {
    const result = await apiClient.get('/api/expenses/table/sortOptions');
    return result.data;
}

export const getExpenseSearchableColumns = async () => {
    const result = await apiClient.get('/api/expenses/table/searchableColumns');
    return result.data;
}

export const updateExpenseActiveStatus  = async (isActive, expenseId) => {
    const result = await apiClient.patch('/api/expenses/update/activeStatus', {
        expenseId: expenseId,
        isActive: isActive,
    });

    return result.data;
}

export const deleteExpense = async (expenseId) => {
    const result = await apiClient.delete('/api/expenses/deleteExpense', {
        params: {
            expenseId: expenseId,
        }
    });

    return result.data;
}

export const getPaymentsForExpense = async (expenseId) => {
    const result = await apiClient.get('/api/expenses/payments/paymentsForExpense', {
        params: {
            expenseId: expenseId,
        }
    });

    return result.data;
}

export const getLateDatesForExpense = async (expenseId) => {
    const result = await apiClient.get('/api/expenses/lateDatesForExpense', {
        params: {
            expenseId: expenseId,
        }
    });

    return result.data;
}

export const getCategoryChartRangeOptions = async () => {
    const result = await apiClient.get('/api/expenses/categories/categoryChartRangeOptions');
    return result.data;
}

export const getExpenseTableBatchActions = async () => {
    const result = await apiClient.get('/api/expenses/table/getBatchActions');
    return result.data;
}

export const categoryBatchUpdate = async(expenseIds, categoryId) => {
    console.log(expenseIds, categoryId);
    await apiClient.patch('/api/expenses/update/batchCategoryUpdate', {
        expenseIds: expenseIds,
        categoryId: categoryId,
    });
}

export const getTotalSpent = async () => {
    const result = await apiClient.get('/api/expenses/payments/totalSpent');
    return result.data;
}