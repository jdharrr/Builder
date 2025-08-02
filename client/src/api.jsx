import axios from "axios";
import {formatDate, getAccessToken} from "./utils.jsx";

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

export const fetchExpenses = async (dateFrom, dateTo) => {
    const token = getAccessToken();
    const expensesRes = await axios.get('http://localhost:8000/api/user/getExpensesInRange', {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        params: {
            'dateFrom': dateFrom,
            'dateTo': dateTo
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
        description
    } = expenseProps;
    const formattedDueDate = formatDate(next_due_date);

    const token = getAccessToken();
    if (!token) throw new Error('401');
    return await axios.post('http://localhost:8000/api/user/createExpense', {
        name: name,
        cost: cost,
        recurrence_rate: recurrence_rate,
        next_due_date: formattedDueDate,
        category: category,
        description: description
    }, {
        withCredentials: true,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    })
}