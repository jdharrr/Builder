export const formatCurrency = (amount) => {
    const value = Number(amount ?? 0);
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
};
