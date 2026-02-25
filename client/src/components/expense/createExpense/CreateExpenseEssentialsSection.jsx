import React from 'react';
import {CategorySelect} from "../../categories/CategorySelect.jsx";

export const CreateExpenseEssentialsSection = ({
    expenseProps,
    fieldErrors,
    onNameChange,
    onCostChange,
    onCategoryChange,
    onDescriptionChange
}) => (
    <section className="expense-form-card">
        <header className="expense-card-header">
            <h6 className="expense-card-title">Essentials</h6>
        </header>
        <div className="expense-card-body">
            <div className="expense-input-grid">
                <div className="expense-input">
                    <label className={'form-label'}>Name</label>
                    <input
                        className={`form-control${fieldErrors.name ? ' is-invalid' : ''}`}
                        type='text'
                        value={expenseProps.name}
                        onChange={onNameChange}
                    />
                </div>
                <div className="expense-input">
                    <label className={'form-label'}>Cost</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control${fieldErrors.cost ? ' is-invalid' : ''}`}
                        value={expenseProps.cost}
                        onChange={onCostChange}
                    />
                </div>
                <div className="expense-input expense-input-span">
                    <CategorySelect
                        label="Category"
                        initialValue={expenseProps.categoryId ?? ''}
                        onChange={(e) => onCategoryChange(e.target.value)}
                    />
                </div>
                <div className="expense-input expense-input-span">
                    <label className={'form-label'}>Description</label>
                    <textarea
                        className={'form-control'}
                        rows={2}
                        value={expenseProps.description}
                        onChange={onDescriptionChange}
                    />
                </div>
            </div>
        </div>
    </section>
);
