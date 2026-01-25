export const formatCost = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    if (typeof value === 'number') return `$${value.toFixed(2)}`;
    const trimmed = value.toString().trim();
    return trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
};

export const formatDate = (value) => {
    if (!value) return 'No due date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRecurrence = (value) => {
    if (!value) return 'One-time';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};
