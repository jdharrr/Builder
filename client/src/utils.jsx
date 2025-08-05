import Cookies from "js-cookie";

export const getAccessToken = () => Cookies.get("access_token");

export function hasExpense(date, expenses) {
    if (!date) return false;

    return expenses.some(exp => {
        const [expY, expM, expD] = exp.next_due_date.substring(0, 10).split('-').map(Number);
        const [dateY, dateM, dateD] = date.split('-').map(Number);
        return (
            expY === dateY &&
            expM === dateM &&
            expD === dateD
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
