import React from 'react';
import {FaLock} from "react-icons/fa";
import {CategorySelect} from "../../categories/CategorySelect.jsx";

export const EditExpenseEssentialsSection = ({
    expenseProps,
    fieldErrors,
    isPaidOneTimeExpense,
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
                    <label className={`form-label${isPaidOneTimeExpense ? ' expense-label-row' : ''}`}>
                        Cost
                        {isPaidOneTimeExpense && (
                            <>
                                <span className="read-only-hint" title="Paid expenses can't be edited." aria-label="Paid expenses can't be edited.">
                                    <FaLock size={10} />
                                </span>
                                <span className="paid-pill">Paid</span>
                            </>
                        )}
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control${isPaidOneTimeExpense ? ' read-only-field' : ''}${fieldErrors.cost ? ' is-invalid' : ''}`}
                        value={expenseProps.cost ?? ''}
                        disabled={isPaidOneTimeExpense}
                        onChange={onCostChange}
                    />
                </div>
                <div className="expense-input expense-input-span">
                    <CategorySelect
                        label="Category"
                        initialValue={expenseProps.categoryId || ''}
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
