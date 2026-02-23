import React, {useState} from 'react';
import {useQuery} from "@tanstack/react-query";
import {FaSearch} from "react-icons/fa";

import {getStatus} from "../../../../util.jsx";
import {getFilterDropdownOptions} from "../../../../api.jsx";

export const MultiSelectFilterInput = ({label, apiPath, onChange = () => {}, onRemove}) => {
    const [values, setValues] = useState([]);

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
        onChange(values);
    };

    const options = data?.options ?? [];
    const allSelected = options.length > 0 && values.length === options.length;

    return (
        <div className="expense-filter-input">
            {onRemove && (
                <button
                    type="button"
                    className="expense-filter-remove-button"
                    onClick={onRemove}
                    aria-label={`Remove ${label || 'multi select'} filter`}
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
                <div className="expense-filter-select-list">
                    {options.length > 0 ? (
                        <>
                            <label className={`expense-filter-select-option expense-filter-select-option--all${allSelected ? ' expense-filter-select-option--active' : ''}`}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={allSelected}
                                    disabled={isLoading}
                                    onChange={() => {
                                        setValues(allSelected ? [] : [...options]);
                                    }}
                                />
                                <span>Select all</span>
                            </label>
                            {options.map((option) => {
                                const isSelected = values.includes(option);
                                return (
                                    <label
                                        key={option}
                                        className={`expense-filter-select-option${isSelected ? ' expense-filter-select-option--active' : ''}`}
                                    >
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={isLoading}
                                            onChange={() => {
                                                setValues((prevState) => (
                                                    prevState.includes(option)
                                                        ? prevState.filter((value) => value !== option)
                                                        : [...prevState, option]
                                                ));
                                            }}
                                        />
                                        <span>{option}</span>
                                    </label>
                                );
                            })}
                        </>
                    ) : (
                        <div className="expense-filter-empty">
                            {isLoading ? 'Loading...' : 'No options'}
                        </div>
                    )}
                </div>
            </div>
            <button type="button" className="expense-filter-apply-button" onClick={handleApply} aria-label={`Apply ${label || 'multi select'} filter`}>
                <FaSearch size={12} />
            </button>
        </div>
    );
};
