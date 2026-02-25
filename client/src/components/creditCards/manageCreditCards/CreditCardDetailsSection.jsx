import React from 'react';
import {FaTrash} from "react-icons/fa";

export const CreditCardDetailsSection = ({
    allOtherValue,
    newCardCompany,
    setNewCardCompany,
    rewardRules,
    createErrors,
    setCreateErrors,
    categories,
    isCategoriesLoading,
    availableRewardCategories,
    isAllOtherSelected,
    handleAddRewardRule,
    handleRemoveRewardRule,
    handleRewardRuleChange,
    handleResetRules
}) => (
    <div className="credit-card-details">
        <div className="credit-card-issuer manage-credit-card-issuer">
            <label className="form-label reward-rules-label">Credit Card Issuer</label>
            <input
                className={`form-control${createErrors.company ? ' is-invalid' : ''}`}
                type="text"
                value={newCardCompany}
                onChange={(e) => {
                    setNewCardCompany(e.target.value);
                    if (createErrors.company) {
                        setCreateErrors((prev) => ({...prev, company: false}));
                    }
                }}
                placeholder="Card issuer"
            />
        </div>
        <div className="reward-rules-section">
            <div className="reward-rules-header">
                <div className="reward-rules-title">
                    <span className="reward-rules-label">Cash Back Rules</span>
                </div>
                <div className="reward-rules-actions">
                    <button
                        className="btn btn-outline-danger btn-sm"
                        type="button"
                        onClick={handleResetRules}
                    >
                        Reset
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={handleAddRewardRule}
                        disabled={isCategoriesLoading || (availableRewardCategories.length === 0 && isAllOtherSelected)}
                    >
                        Add another
                    </button>
                </div>
            </div>
            <div className="reward-rules-list">
            {rewardRules.map((rule, index) => {
                const hasAllOtherSelectedElsewhere = rewardRules.some((otherRule, otherIndex) => (
                    otherIndex !== index && otherRule.categoryId === allOtherValue
                ));
                const canShowAllOther = rule.categoryId === allOtherValue || !hasAllOtherSelectedElsewhere;
                const availableCategories = categories.filter((category) => {
                    const isSelected = String(rule.categoryId) === String(category.id);
                    const isTaken = rewardRules.some((otherRule, otherIndex) => (
                        otherIndex !== index
                        && String(otherRule.categoryId) === String(category.id)
                    ));
                    return isSelected || !isTaken;
                });
                const hasRuleErrors = createErrors.rules[index] ?? {};

                return (
                    <div className="reward-rule-row" key={`${rule.categoryId}-${index}`}>
                        <div className="reward-rule-field">
                            <label className="form-label">Category</label>
                            <select
                                className={`form-select${hasRuleErrors.category ? ' is-invalid' : ''}`}
                                value={rule.categoryId}
                                onChange={(e) => handleRewardRuleChange(index, 'categoryId', e.target.value)}
                            >
                                <option value="">Select a category</option>
                                {availableCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                                {canShowAllOther && (
                                    <option value={allOtherValue}>All Other Categories</option>
                                )}
                            </select>
                        </div>
                        <div className="reward-rule-field reward-rule-percent">
                            <label className="form-label">Percent</label>
                            <div className="reward-rule-percent-field">
                                <input
                                    className={`form-control${hasRuleErrors.percent ? ' is-invalid' : ''}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={rule.cashBackPercent}
                                    onChange={(e) => handleRewardRuleChange(index, 'cashBackPercent', e.target.value)}
                                />
                                <span className="reward-rule-suffix">%</span>
                            </div>
                        </div>
                        {rewardRules.length > 1 && (
                            <button
                                className="reward-rule-remove"
                                type="button"
                                onClick={() => handleRemoveRewardRule(index)}
                                aria-label="Remove reward rule"
                            >
                                <FaTrash size={12} />
                            </button>
                        )}
                    </div>
                );
            })}
            </div>
        </div>
    </div>
);
