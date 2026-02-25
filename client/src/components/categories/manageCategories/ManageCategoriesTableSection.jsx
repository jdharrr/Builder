import React from 'react';
import {FaPen} from "react-icons/fa";

export const ManageCategoriesTableSection = ({
    isLoading,
    pagedCategories,
    editingCategory,
    setEditingCategory,
    setShowCreateCategoryInput,
    onSave,
    onDelete,
    onToggleActive,
    isUpdatePending,
    isDeletePending,
    isTogglePending
}) => {
    const handleEditStart = (category) => {
        setShowCreateCategoryInput(false);
        setEditingCategory({ id: category.id, name: category.name });
    };

    const handleEditChange = (value) => {
        setEditingCategory((prev) => ({
            ...prev,
            name: value
        }));
    };

    const handleEditCancel = () => {
        setEditingCategory({ id: null, name: '' });
    };

    return (
        <div className="manage-categories-list">
        {isLoading ? (
            <span className="manage-categories-muted">Loading categories...</span>
        ) : pagedCategories.length === 0 ? (
            <span className="manage-categories-muted">No categories yet.</span>
        ) : (
            pagedCategories.map((category) => {
                const updatedName = editingCategory.id === category.id
                    ? editingCategory.name
                    : category.name;
                const isDirty = updatedName.trim() !== category.name;

                return (
                    <div className="manage-categories-row" key={category.id}>
                        {editingCategory.id === category.id ? (
                            <>
                                <input
                                    className="form-control manage-categories-input"
                                    type="text"
                                    value={updatedName}
                                    onChange={(event) => handleEditChange(event.target.value)}
                                />
                                <label className="manage-categories-toggle">
                                    <span className="manage-categories-toggle-label">Active</span>
                                    <span className="manage-categories-switch">
                                        <input
                                            type="checkbox"
                                            checked={category.active ?? true}
                                            disabled={isTogglePending}
                                            onChange={(e) => onToggleActive(category.id, e.target.checked)}
                                        />
                                        <span className="manage-categories-switch-track" />
                                    </span>
                                </label>
                                <div className="manage-categories-actions">
                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        type="button"
                                        disabled={!isDirty || isUpdatePending}
                                        onClick={() => onSave(category)}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        type="button"
                                        onClick={handleEditCancel}
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
                                        onClick={() => handleEditStart(category)}
                                        aria-label="Edit category"
                                    >
                                        <FaPen size={12} />
                                    </button>
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        type="button"
                                        disabled={isDeletePending}
                                        onClick={() => onDelete(category)}
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
    );
};
