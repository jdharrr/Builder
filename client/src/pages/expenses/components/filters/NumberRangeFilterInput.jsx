import React, {useState} from 'react';
import {FaSearch} from "react-icons/fa";

export const NumberRangeFilterInput = ({label, onChange = () => {}, onRemove}) => {
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');

    const handleMinChange = (e) => {
        setMinValue(e.target.value);
    };

    const handleMaxChange = (e) => {
        setMaxValue(e.target.value);
    };

    const handleApply = () => {
        onChange({ min: minValue, max: maxValue });
    };

    return (
        <div className="expense-filter-input">
            {onRemove && (
                <button
                    type="button"
                    className="expense-filter-remove-button"
                    onClick={onRemove}
                    aria-label={`Remove ${label || 'number range'} filter`}
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
                    type="number"
                    className="form-control form-control-sm"
                    value={minValue}
                    onChange={handleMinChange}
                />
                <span className="expense-filter-separator">to</span>
                <input
                    type="number"
                    className="form-control form-control-sm"
                    value={maxValue}
                    onChange={handleMaxChange}
                />
            </div>
            <button type="button" className="expense-filter-apply-button" onClick={handleApply} aria-label={`Apply ${label || 'number range'} filter`}>
                <FaSearch size={12} />
            </button>
        </div>
    );
};
