import axios from "axios";
import Cookies from "js-cookie";

const getAccessToken = () => Cookies.get("access_token");

// User
export const validateToken = async () => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const result = await axios.get('http://localhost:8000/api/auth/validateAccessToken', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': "application/json",
                'Content-Type': 'application/json'
            }
        });

        return result.data.valid;
    } catch {
        return false;
    }
}

export const login = async (username, password) => {
    const loginRes = await axios.post('http://localhost:8000/api/auth/login', {
        username: username,
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

    const result = await axios.get('http://localhost:8000/api/user', {
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
    const result = await axios.patch('http://localhost:8000/api/user/update/settings/darkMode', {
        darkMode: isDarkMode,
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

// Expenses
export const fetchExpensesForCalendar = async (month, year) => {
    const token = getAccessToken();
    const expensesRes = await axios.get('http://localhost:8000/api/expenses/expensesForDashboardCalendar', {
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
    const result = await axios.post('http://localhost:8000/api/expenses/createExpense', {
        name: name,
        cost: cost,
        recurrenceRate: recurrenceRate,
        categoryId: categoryId,
        description: description,
        startDate: startDate,
        endDate: endDate,
        paidOnCreation: paidOnCreation,
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

    if (datePaid !== undefined) {
        body.datePaid = datePaid;
    }

    const result = await axios.patch('http://localhost:8000/api/expenses/update/paidStatus', body, {
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
    const result = await axios.get('http://localhost:8000/api/expenses/expensePaymentsForDate', {
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

    const result = await axios.get('http://localhost:8000/api/expenses/lateExpenses', {
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

    const result = await axios.get('http://localhost:8000/api/expenses/getUpcomingExpenses', {
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

    const result = await axios.get('http://localhost:8000/api/expenses/getAllExpenses', {
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

    const result = await axios.post('http://localhost:8000/api/expenses/categories/create', {
        name: name
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

    const result = await axios.get('http://localhost:8000/api/expenses/categories', {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getExpenseSortOptions = async () => {
    const token = getAccessToken();

    const result = await axios.get('http://localhost:8000/api/expenses/page/sortOptions', {
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

    const result = await axios.get('http://localhost:8000/api/expenses/page/searchableColumns', {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    });

    return result.data;
}

export const getExpenseTableActions = async () => {
    const token = getAccessToken();

    const result = await axios.get('http://localhost:8000/api/expenses/page/tableActions', {
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

    const result = await axios.patch('http://localhost:8000/api/expenses/update/activeStatus', {
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

    const result = await axios.delete('http://localhost:8000/api/expenses/deleteExpense', {
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

    const result = await axios.get('http://localhost:8000/api/expenses/expensePayments/paymentsForExpense',{
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