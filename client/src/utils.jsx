import Cookies from "js-cookie";

export const getAccessToken = () => Cookies.get("access_token");

export function hasExpense(day, expenses, month, year) {
    if (!day) return false;

    return expenses.some(exp => {
        const [y, m, d] = exp.next_due_date.substring(0, 10).split('-').map(Number);
        return (
            y === year &&
            m - 1 === month &&
            d === day
        );
    });
}

export const formatDate = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};