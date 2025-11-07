import axios from "axios";
import Cookies from "js-cookie";

const apiEndpoint = 'https://localhost:7245';

const getAccessToken = () => Cookies.get("access_token");

// User
export const validateToken = async () => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const result = await axios.get(`${apiEndpoint}/api/auth/validateAccessToken`, {
            withCredentials: true,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': "application/json",
                'Content-Type': 'application/json'
            }
        });

        return result.data;
    } catch {
        return false;
    }
}

export const login = async (email, password) => {
    const loginRes = await axios.post(`${apiEndpoint}/api/auth/login`, {
        email: email,
        password: password
    }, {
        withCredentials: true,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });

    return loginRes.data;
}

export const fetchUser = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/user`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const updateDarkMode = async (isDarkMode) => {
    const token = getAccessToken();
    const result = await axios.patch(`${apiEndpoint}/api/user/update/settings/darkMode`,
        isDarkMode,
    {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

// Expenses
export const fetchExpensesForCalendar = async (month, year) => {
    const token = getAccessToken();
    const expensesRes = await axios.get(`${apiEndpoint}/api/expenses/expensesForDashboardCalendar`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        params: {
            'month': month,
            'year': year
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
        initialDatePaid
    } = expenseProps;

    const token = getAccessToken();
    if (!token) throw new Error('401');
    const result = await axios.post(`${apiEndpoint}/api/expenses/createExpense`, {
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
    }, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    })

    return result.data;
}

export const updateExpensePaidStatus = async (expenseId, isPaid, dueDate, datePaid) => {
    const token = getAccessToken();

    const body = {
        expenseId: expenseId,
        isPaid: isPaid,
        dueDate: dueDate
    };

    if (datePaid === undefined) {
        body.datePaid = new Date().toISOString().substring(0,10);
    }

    const result = await axios.patch(`${apiEndpoint}/api/expenses/update/paidStatus`, body, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getPaymentsForDate = async (date, expenses) => {
    if (!date || expenses.length < 1) return [];

    const token = getAccessToken();
    const expenseIds = expenses.map(exp => exp.id);
    const result = await axios.get(`${apiEndpoint}/api/expenses/expensePaymentsForDate`, {
        withCredentials: true,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        params: {
            'date': date,
            'expenseIds': expenseIds
        }
    })

    return result.data;
}

export const fetchLateExpenses = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/lateExpenses`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getUpcomingExpenses = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/getUpcomingExpenses`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getAllExpenses = async (sortOption, sortDirection, showInactiveExpenses, searchFilter) =>  {
    const token = getAccessToken();

    const params = {
        sort: sortOption,
        sortDir: sortDirection,
        showInactiveExpenses: showInactiveExpenses,
    };

    if (searchFilter !== undefined) {
        params.searchValue = searchFilter.searchValue;
        params.searchColumn = searchFilter.searchColumn;
    }

    const result = await axios.get(`${apiEndpoint}/api/expenses/getAllExpenses`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        params: params
    });

    return result.data;
}

export const createExpenseCategory = async (name) =>  {
    const token = getAccessToken();

    const result = await axios.post(`${apiEndpoint}/api/expenses/categories/create`, {
        categoryName: name
    }, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getAllExpenseCategories = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/categories`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });
    console.log(result.data)
    return result.data;
}

export const getExpenseCategoriesWithTotalSpent = async (categoryChartRangeOption) => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/categories/categoriesTotalSpent`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        params: {
            rangeOption: categoryChartRangeOption
        }
    });

    return result.data;
}

export const getExpenseSortOptions = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/table/sortOptions`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getExpenseSearchableColumns = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/table/searchableColumns`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const updateExpenseActiveStatus  = async (isActive, expenseId) => {
    const token = getAccessToken();

    const result = await axios.patch(`${apiEndpoint}/api/expenses/update/activeStatus`, {
        expenseId: expenseId,
        isActive: isActive,
    }, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const deleteExpense = async (expenseId) => {
    const token = getAccessToken();

    const result = await axios.delete(`${apiEndpoint}/api/expenses/deleteExpense`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        params: {
            expenseId: expenseId,
        }
    });

    return result.data;
}

export const getPaymentsForExpense = async (expenseId) => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/payments/paymentsForExpense`,{
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        params: {
            expenseId: expenseId,
        }
    });

    return result.data;
}

export const getLateDatesForExpense = async (expenseId) => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/lateDatesForExpense`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        params: {
            expenseId: expenseId,
        }
    });

    return result.data;
}

export const getCategoryChartRangeOptions = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/categories/categoryChartRangeOptions`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getExpenseTableBatchActions = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/table/getBatchActions`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const categoryBatchUpdate = async(expenseIds, categoryId) => {
    const token = getAccessToken();

    console.log(expenseIds, categoryId);
    await axios.patch(`${apiEndpoint}/api/expenses/update/batchCategoryUpdate`, {
        expenseIds: expenseIds,
        categoryId: categoryId,
    }, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    })
}

export const getTotalSpent = async () => {
    const token = getAccessToken();

    const result = await axios.get(`${apiEndpoint}/api/expenses/payments/totalSpent`, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}