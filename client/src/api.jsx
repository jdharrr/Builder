import axios from "axios";

import {getAccessToken} from "./utils.jsx";

// User
export const validateToken = async () => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const _ = await axios.get('http://localhost:8000/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': "application/json",
                'Content-Type': 'application/json'
            }
        });
        return true;
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
    const result = await axios.patch('http://localhost:8000/api/user/update/settings', {
        dark_mode: isDarkMode,
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
        recurrence_rate,
        next_due_date,
        category,
        description,
        start_date,
        end_date,
    } = expenseProps;

    const token = getAccessToken();
    if (!token) throw new Error('401');
    const result = await axios.post('http://localhost:8000/api/expenses/createExpense', {
        name: name,
        cost: cost,
        recurrence_rate: recurrence_rate,
        next_due_date: next_due_date,
        category: category,
        description: description,
        start_date: start_date,
        end_date: end_date,
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

export const updateExpensePaidStatus = async (expenseId, isPaid, dueDate) => {
    const token = getAccessToken();
    const result = await axios.patch('http://localhost:8000/api/expenses/update/paidStatus', {
        expense_id: expenseId,
        is_paid: isPaid,
        due_date: dueDate
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

export const getPaymentsForDate = async (date, expenses) => {
    if (!date || expenses.length < 1) return [];

    const token = getAccessToken();
    const expenseIds = expenses.map(exp => exp.id);
    const result = await axios.get('http://localhost:8000/api/expenses/paymentsForDate', {
        withCredentials: true,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        params: {
            'date': date,
            'expense_ids': expenseIds
        }
    })

    return result.data;
}

export const getExpensesForDate = async (date) => {
    if (!date) return [];

    const token = getAccessToken();
    const result = await axios.get('http://localhost:8000/api/expenses/expensesForDate', {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        params: {
            'date': date,
        }
    });

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