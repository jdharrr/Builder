import React, {useState} from 'react';
import {useQuery} from "@tanstack/react-query";
import {FaSearch} from "react-icons/fa";

import {getStatus} from "../../../../util.jsx";
import {getFilterDropdownOptions} from "../../../../api.jsx";

export const SingleSelectFilterInput = ({label, apiPath, onChange = () => {}, onRemove}) => {
    const [value, setValue] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['filterDropdownOptions', apiPath],
        queryFn: async () => {
            return await getFilterDropdownOptions(apiPath);
        },
        enabled: Boolean(apiPath),
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

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
                    aria-label={`Remove ${label || 'select'} filter`}
                >
                    x
                </button>
            )}
            {label && (
                <label className="form-label">
                    {label}
                </label>
            )}
            <div className={`expense-filter-select-wrap${isLoading ? ' expense-filter-loading' : ''}`}>
                <select
                    className="form-select form-select-sm"
                    value={value}
                    disabled={isLoading}
                    onChange={(e) => setValue(e.target.value)}
                >
                    <option value="">{isLoading ? 'Loading...' : 'Select...'}</option>
                    {data.options && data.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <button type="button" className="expense-filter-apply-button" onClick={handleApply} aria-label={`Apply ${label || 'select'} filter`}>
                <FaSearch size={12} />
            </button>
        </div>
    );
};
