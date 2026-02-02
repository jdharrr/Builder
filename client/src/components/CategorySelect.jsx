import React, {useEffect, useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {getAllExpenseCategories} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {ManageCategoriesModal} from "./ManageCategoriesModal.jsx";

export const CategorySelect = ({
    label,
    onChange = () => {},
    required = false,
    isInvalid = false,
    includeNoneOption = true,
    noneLabel = 'No Category',
    initialValue = '',
    onManageOpen = () => {},
    onManageClose = () => {}
}) => {
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(initialValue ?? '');

    const { data: categories = [] } = useQuery({
        queryKey: ['expenseCategories'],
        queryFn: async () => {
            return await getAllExpenseCategories();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    useEffect(() => {
        setSelectedCategory(initialValue ?? '');
    }, [initialValue]);

    const handleOnChange = (e) => {
        setSelectedCategory(e.target.value);
        onChange(e);
    }

    return (
        <>
            <div className="payment-section category-select">
                {label && (
                    <label className="form-label">
                        {label}{required ? ' *' : ''}
                    </label>
                )}
                <div className="row d-flex justify-content-center align-items-center me-2">
                    <div className="col">
                        <select
                            className={`form-select${isInvalid ? ' is-invalid' : ''}`}
                            value={selectedCategory}
                            onChange={handleOnChange}
                        >
                            {includeNoneOption ? (
                                <option value="">{noneLabel}</option>
                            ) : (
                                <option value="">Select a category</option>
                            )}
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-auto">
                        <button
                            className="manageCategoriesButton"
                            type="button"
                            onClick={() => {
                                setShowManageCategoriesModal(true);
                                onManageOpen();
                            }}
                        >
                            Manage
                        </button>
                    </div>
                </div>
            </div>
            {showManageCategoriesModal && (
                <ManageCategoriesModal
                    handleClose={() => {
                        setShowManageCategoriesModal(false);
                        onManageClose();
                    }}
                />
            )}
        </>
    );
};
