import Cookies from "js-cookie";

export const getAccessToken = () => Cookies.get("access_token");

export const formatDate = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const deepCopyArray = (arr) => {
    if (!arr) return [];

    const array = Array.isArray(arr) ? arr : [arr];
    return array.map((item) => ({...item}));
}