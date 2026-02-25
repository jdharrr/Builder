import React, {useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {getAllExpenseCategories} from "../../api.jsx";
import {getStatus} from "../../util.jsx";
import {ManageCategoriesModal} from "./manageCategories/ManageCategoriesModal.jsx";

export const CategorySelect = ({
    label = null,
    onChange = () => {},
    required = false,
    isInvalid = false,
    initialValue = ''
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
                            <option value="">No Category</option>
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
                    }}
                />
            )}
        </>
    );
};
