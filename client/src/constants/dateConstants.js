export const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

/**
 * Generates an array of years centered around the current year
 * @param {number} totalYears - Total number of years to generate (default: 51)
 * @param {number} yearsBeforeCurrent - Number of years before current year (default: 25)
 * @returns {number[]} Array of years
 */
export const getYearRange = (totalYears = 51, yearsBeforeCurrent = 25) => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: totalYears }, (_, i) => currentYear - yearsBeforeCurrent + i);
};
