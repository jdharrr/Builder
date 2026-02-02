import React, {useState} from 'react';
import {FaSearch} from "react-icons/fa";

export const TextFilterInput = ({label, onChange = () => {}, onRemove}) => {
    const [value, setValue] = useState('');

    const handleChange = (e) => {
        setValue(e.target.value);
    };

    const handleApply = () => {
        onChange(value);
    };

    return (
        <div className="expense-filter-input">
            {onRemove && (
                <button
                    type="button"
                    className="expense-filter-remove-button"
                    onClick={onRemove}
                    aria-label={`Remove ${label || 'text'} filter`}
                >
                    x
                </button>
            )}
            {label && (
                <label className="form-label">
                    {label}
                </label>
            )}
            <input
                type="text"
                className="form-control form-control-sm"
                value={value}
                onChange={handleChange}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApply();
                    }
                }}
            />
            <button type="button" className="expense-filter-apply-button" onClick={handleApply} aria-label={`Apply ${label || 'text'} filter`}>
                <FaSearch size={12} />
            </button>
        </div>
    );
};
