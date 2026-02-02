import React, {useState} from 'react';
import {FaSearch} from "react-icons/fa";

export const DateRangeFilterInput = ({label, onChange = () => {}, onRemove}) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleStartChange = (e) => {
        setStartDate(e.target.value);
    };

    const handleEndChange = (e) => {
        setEndDate(e.target.value);
    };

    const handleApply = () => {
        onChange({ startDate, endDate });
    };

    return (
        <div className="expense-filter-input">
            {onRemove && (
                <button
                    type="button"
                    className="expense-filter-remove-button"
                    onClick={onRemove}
                    aria-label={`Remove ${label || 'date range'} filter`}
                >
                    x
                </button>
            )}
            {label && (
                <label className="form-label">
                    {label}
                </label>
            )}
            <div className="expense-filter-row">
                <input
                    type="date"
                    className="form-control form-control-sm"
                    value={startDate}
                    onChange={handleStartChange}
                />
                <span className="expense-filter-separator">to</span>
                <input
                    type="date"
                    className="form-control form-control-sm"
                    value={endDate}
                    onChange={handleEndChange}
                />
            </div>
            <button type="button" className="expense-filter-apply-button" onClick={handleApply} aria-label={`Apply ${label || 'date range'} filter`}>
                <FaSearch size={12} />
            </button>
        </div>
    );
};
