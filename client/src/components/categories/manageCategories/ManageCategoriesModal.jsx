import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {FaPlus} from "react-icons/fa";

import {
    createExpenseCategory,
    deleteExpenseCategory,
    getAllExpenseCategories,
    updateExpenseCategoryName,
    updateExpenseCategoryActiveStatus
} from "../../../api.jsx";
import {showApiErrorToast, getStatus} from "../../../util.jsx";
import {showError, showSuccess, showWarning} from "../../../utils/toast.js";
import {useConfirmModal} from "../../../hooks/useConfirmModal.jsx";
import {Modal} from "../../Modal.jsx";
import {ManageCategoriesTableSection} from "./ManageCategoriesTableSection.jsx";
import {invalidateCategoryCaches, invalidateExpenseCaches, invalidateTotalsCaches} from "../../../utils/queryInvalidations.js";

import '../../../css/manageCategoriesModal.css';

export const ManageCategoriesModal = ({handleClose}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    // New category state
    const [showCreateCategoryInput, setShowCreateCategoryInput] = useState(false);
    const [editingCategory, setEditingCategory] = useState({ id: null, name: '' });

    // Category table state
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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
        setCurrentPage(1);
    }, [showActiveOnly, categories.length]);

    // Paged categories for table section
    const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const pagedCategories = categories.slice(startIndex, startIndex + pageSize);

    const createCategoryMutation = useMutation({
        mutationFn: (categoryName) => createExpenseCategory(categoryName),
        onSuccess: () => {
            showSuccess("Category created!");
            invalidateCategoryCaches(qc);
            invalidateTotalsCaches(qc);
            setShowCreateCategoryInput(false);
            setEditingCategory({ id: null, name: '' });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
                return;
            }
            showApiErrorToast(err, 'Failed to create category.');
        }
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({categoryId, newCategoryName}) => updateExpenseCategoryName(categoryId, newCategoryName),
        onSuccess: () => {
            showSuccess("Category updated!");
            setEditingCategory({ id: null, name: '' });
            invalidateCategoryCaches(qc);
            invalidateExpenseCaches(qc);
            invalidateTotalsCaches(qc);
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
                return;
            }
            showApiErrorToast(err, 'Failed to update category.');
        }
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (categoryId) => deleteExpenseCategory(categoryId),
        onSuccess: () => {
            showSuccess("Category removed.");
            invalidateCategoryCaches(qc);
            invalidateExpenseCaches(qc);
            invalidateTotalsCaches(qc);
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
                return;
            }
            showApiErrorToast(err, 'Failed to remove category.');
        }
    });

    const updateCategoryActiveMutation = useMutation({
        mutationFn: ({categoryId, isActive}) => updateExpenseCategoryActiveStatus(categoryId, isActive),
        onSuccess: (_data, variables) => {
            showSuccess(`Category ${variables.isActive ? 'activated' : 'deactivated'}.`);
            invalidateCategoryCaches(qc);
            invalidateExpenseCaches(qc);
            invalidateTotalsCaches(qc);
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
                return;
            }
            showApiErrorToast(err, 'Failed to update category status.');
        }
    });

    const handleSaveName = (category) => {
        const updatedName = editingCategory.name.trim();
        if (!updatedName) {
            showWarning('Category name cannot be empty.');
            return;
        }
        if (updatedName === category.name) {
            setEditingCategory({ id: null, name: '' });
            return;
        }
        updateCategoryMutation.mutate({categoryId: category.id, newCategoryName: updatedName});
    }

    const {openConfirm, confirmModal} = useConfirmModal();
    const handleDeleteCategory = (category) => {
        openConfirm(`Delete "${category.name}"? This cannot be undone.`, () => {
            deleteCategoryMutation.mutate(category.id);
        });
    }

    const handleNewCategorySave = async () => {
        const trimmed = editingCategory.name.trim();
        if (!trimmed) {
            showWarning('Please enter a category name.');
            return;
        }
        createCategoryMutation.mutate(trimmed);
    }

    const handleNewCategoryClose = () => {
        setShowCreateCategoryInput(false);
        setEditingCategory({ id: null, name: '' });
    }

    const modalContent = (
        <>
            <Modal
                title="Manage Categories"
                handleClose={handleClose}
                className="manage-categories-modal app-modal"
                showSave={false}
                ignoreOutsideClickSelectors={['.confirm-modal']}
            >
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
                                <button
                                    className={'addCategoryButton'}
                                    type='button'
                                    onClick={() => {
                                        setShowCreateCategoryInput(true);
                                        setEditingCategory({ id: null, name: '' });
                                    }}
                                >
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
                                        value={editingCategory.name}
                                        onChange={(event) => setEditingCategory({ id: null, name: event.target.value })}
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
                        <ManageCategoriesTableSection
                            isLoading={isLoading}
                            pagedCategories={pagedCategories}
                            editingCategory={editingCategory}
                            setEditingCategory={setEditingCategory}
                            setShowCreateCategoryInput={setShowCreateCategoryInput}
                            onSave={handleSaveName}
                            onDelete={handleDeleteCategory}
                            onToggleActive={(categoryId, isActive) => updateCategoryActiveMutation.mutate({
                                categoryId,
                                isActive
                            })}
                            isUpdatePending={updateCategoryMutation.isPending}
                            isDeletePending={deleteCategoryMutation.isPending}
                            isTogglePending={updateCategoryActiveMutation.isPending}
                        />
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
            </Modal>
            {confirmModal}
        </>
    );

    return createPortal(modalContent, document.body);
}
