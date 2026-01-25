import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {FaPen, FaPlus} from "react-icons/fa";

import {
    createExpenseCategory,
    deleteExpenseCategory,
    getAllExpenseCategories,
    updateExpenseCategoryName,
    updateExpenseCategoryActiveStatus
} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {showError, showSuccess, showWarning} from "../utils/toast.js";

import '../css/manageCategoriesModal.css';

export const ManageCategoriesModal = ({handleClose, onClose}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [showCreateCategoryInput, setShowCreateCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryEdits, setCategoryEdits] = useState({});
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const wrapperRef = useRef(null);
    const closeModal = useCallback(() => {
        handleClose();
        if (onClose) {
            onClose();
        }
    }, [handleClose, onClose]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                closeModal();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeModal]);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['expenseCategories', showActiveOnly],
        queryFn: async () => {
            return await getAllExpenseCategories(showActiveOnly);
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    useEffect(() => {
        setCategoryEdits(() => (
            categories.reduce((acc, category) => {
                acc[category.id] = category.name;
                return acc;
            }, {})
        ));
    }, [categories]);

    useEffect(() => {
        setCurrentPage(1);
    }, [showActiveOnly, categories.length]);

    const activeCategoryCount = categories.reduce((count, category) => {
        if (category.active === false) return count;
        return count + 1;
    }, 0);

    const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const pagedCategories = categories.slice(startIndex, startIndex + pageSize);

    const createCategoryMutation = useMutation({
        mutationFn: (categoryName) => createExpenseCategory(categoryName),
        onSuccess: () => {
            showSuccess("Category created!");
            qc.invalidateQueries({ queryKey: ['expenseCategories'] });
            setShowCreateCategoryInput(false);
            setNewCategoryName('');
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else if (activeCategoryCount >= 15) {
                showError('Limit of active categories reached.');
            } else {
                showError('Failed to create category.');
            }
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({categoryId, newCategoryName}) => updateExpenseCategoryName(categoryId, newCategoryName),
        onSuccess: (_data, variables) => {
            showSuccess("Category updated!");
            setEditingCategoryId(null);
            setCategoryEdits((prevState) => ({
                ...prevState,
                [variables.categoryId]: variables.newCategoryName
            }));
            qc.invalidateQueries({ queryKey: ['expenseCategories'] });
            qc.refetchQueries({ queryKey: ['tableExpenses'] });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to update category.');
            }
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (categoryId) => deleteExpenseCategory(categoryId),
        onSuccess: () => {
            showSuccess("Category removed.");
            qc.invalidateQueries({ queryKey: ['expenseCategories'] });
            qc.refetchQueries({ queryKey: ['tableExpenses'] });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to remove category.');
            }
        }
    });

    const updateCategoryActiveMutation = useMutation({
        mutationFn: ({categoryId, isActive}) => updateExpenseCategoryActiveStatus(categoryId, isActive),
        onSuccess: (_data, variables) => {
            showSuccess(`Category ${variables.isActive ? 'activated' : 'deactivated'}.`);
            qc.invalidateQueries({ queryKey: ['expenseCategories'] });
            qc.refetchQueries({ queryKey: ['tableExpenses'] });
        },
        onError: (err, variables) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else if (variables?.isActive && activeCategoryCount >= 15) {
                showError('Limit of active categories reached.');
            } else {
                showError('Failed to update category status.');
            }
        }
    });

    const handleSaveName = (category) => {
        const updatedName = (categoryEdits[category.id] || '').trim();
        if (!updatedName) {
            showWarning('Category name cannot be empty.');
            return;
        }
        if (updatedName === category.name) {
            setEditingCategoryId(null);
            return;
        }
        updateCategoryMutation.mutate({categoryId: category.id, newCategoryName: updatedName});
    }

    const handleCancelEdit = (category) => {
        setCategoryEdits((prevState) => ({
            ...prevState,
            [category.id]: category.name
        }));
        setEditingCategoryId(null);
    }

    const handleDeleteCategory = (category) => {
        if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) {
            return;
        }
        deleteCategoryMutation.mutate(category.id);
    }

    const handleNewCategorySave = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            showWarning('Please enter a category name.');
            return;
        }
        createCategoryMutation.mutate(trimmed);
    }

    const handleNewCategoryClose = () => {
        setShowCreateCategoryInput(false);
        setNewCategoryName('');
    }

    return (
        <div className="modal show d-block manage-categories-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                    <div className={"modal-content"}>
                    <div className="modal-header">
                        <h5 className="modal-title">Manage Categories</h5>
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={closeModal}
                            aria-label="Close"
                        >
                            x
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="manage-categories-body">
                            <div className="manage-categories-card">
                                <div className="manage-categories-header">
                                    <span className="manage-categories-label">Categories</span>
                                    <label className="manage-categories-filter">
                                        <span>Show inactive?</span>
                                        <span className="manage-categories-switch">
                                            <input
                                                type="checkbox"
                                                checked={!showActiveOnly}
                                                onChange={(e) => setShowActiveOnly(!e.target.checked)}
                                            />
                                            <span className="manage-categories-switch-track" />
                                        </span>
                                    </label>
                                    {!showCreateCategoryInput && (
                                        <button className={'addCategoryButton'} type='button' onClick={() => setShowCreateCategoryInput(true)}>
                                            <FaPlus size={14} />
                                        </button>
                                    )}
                                </div>
                                {showCreateCategoryInput && (
                                    <div className="manage-categories-create">
                                        <span className="manage-categories-subtext">Create a new category</span>
                                        <div className="manage-categories-create-field">
                                            <label className="form-label">New Category Name</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(event) => setNewCategoryName(event.target.value)}
                                            />
                                            <div className="manage-categories-create-actions">
                                                <button className="btn btn-secondary" type="button" onClick={handleNewCategoryClose}>
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn btn-success"
                                                    type="button"
                                                    onClick={handleNewCategorySave}
                                                    disabled={createCategoryMutation.isPending}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="manage-categories-list">
                                    {isLoading ? (
                                        <span className="manage-categories-muted">Loading categories...</span>
                                    ) : categories.length === 0 ? (
                                        <span className="manage-categories-muted">No categories yet.</span>
                                    ) : (
                                        pagedCategories.map((category) => {
                                            const updatedName = categoryEdits[category.id] ?? category.name;
                                            const isDirty = updatedName.trim() !== category.name;

                                            return (
                                                <div className="manage-categories-row" key={category.id}>
                                                    {editingCategoryId === category.id ? (
                                                        <>
                                                            <input
                                                                className="form-control manage-categories-input"
                                                                type="text"
                                                                value={updatedName}
                                                                onChange={(event) => {
                                                                    const { value } = event.target;
                                                                    setCategoryEdits((prevState) => ({
                                                                        ...prevState,
                                                                        [category.id]: value
                                                                    }));
                                                                }}
                                                            />
                                                            <label className="manage-categories-toggle">
                                                                <span className="manage-categories-toggle-label">Active</span>
                                                                <span className="manage-categories-switch">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={category.active ?? true}
                                                                        disabled={updateCategoryActiveMutation.isPending}
                                                                        onChange={(e) => updateCategoryActiveMutation.mutate({
                                                                            categoryId: category.id,
                                                                            isActive: e.target.checked
                                                                        })}
                                                                    />
                                                                    <span className="manage-categories-switch-track" />
                                                                </span>
                                                            </label>
                                                            <div className="manage-categories-actions">
                                                                <button
                                                                    className="btn btn-outline-success btn-sm"
                                                                    type="button"
                                                                    disabled={!isDirty || updateCategoryMutation.isPending}
                                                                    onClick={() => handleSaveName(category)}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    type="button"
                                                                    onClick={() => handleCancelEdit(category)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="manage-categories-name">
                                                                <span>{category.name}</span>
                                                                {category.active === false && (
                                                                    <span className="manage-categories-inactive">Inactive</span>
                                                                )}
                                                            </div>
                                                            <div className="manage-categories-actions">
                                                                <button
                                                                    className="manage-categories-icon-button"
                                                                    type="button"
                                                                    onClick={() => setEditingCategoryId(category.id)}
                                                                    aria-label="Edit category"
                                                                >
                                                                    <FaPen size={12} />
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    type="button"
                                                                    disabled={deleteCategoryMutation.isPending}
                                                                    onClick={() => handleDeleteCategory(category)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                {categories.length > pageSize && (
                                    <div className="manage-categories-pagination">
                                        <button
                                            type="button"
                                            className="manage-categories-page-button"
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                        <span className="manage-categories-page-indicator">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="manage-categories-page-button"
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
