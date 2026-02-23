import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {FaPen, FaTrash} from "react-icons/fa";

import {createCreditCard, getAllExpenseCategories, getCreditCards, payCreditCardBalance, updateCreditCard} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {showError, showSuccess, showWarning} from "../utils/toast.js";
import {Modal} from "./Modal.jsx";

import '../css/manageCreditCardsModal.css';
import '../css/createExpenseForm.css';

export const ManageCreditCardsModal = ({handleClose, onClose}) => {
    const allOtherValue = 'all_other';
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [newCardCompany, setNewCardCompany] = useState('');
    const [cardModal, setCardModal] = useState({isShowing: false, mode: 'create', card: null});
    const [rewardRules, setRewardRules] = useState([{ categoryId: '', cashBackPercent: '' }]);
    const [createErrors, setCreateErrors] = useState({ company: false, rules: [] });
    const [payModal, setPayModal] = useState({isShowing: false, card: null});
    const [paymentAmount, setPaymentAmount] = useState('');
    const [useCashBack, setUseCashBack] = useState(false);
    const [cashBackAmount, setCashBackAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
    const [paymentErrors, setPaymentErrors] = useState({amount: false, date: false, cashBack: false});

    const wrapperRef = useRef(null);
    const closeModal = useCallback(() => {
        handleClose();
        if (onClose) {
            onClose();
        }
    }, [handleClose, onClose]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (payModal.isShowing || cardModal.isShowing) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                closeModal();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeModal, payModal.isShowing, cardModal.isShowing]);

    const { data: creditCards = [], isLoading } = useQuery({
        queryKey: ['creditCards'],
        queryFn: async () => {
            return await getCreditCards();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
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

    const createCreditCardMutation = useMutation({
        mutationFn: ({creditCardCompany, rewardsRules}) => createCreditCard(creditCardCompany, rewardsRules),
        onSuccess: () => {
            showSuccess("Credit card created!");
            qc.invalidateQueries({ queryKey: ['creditCards'] });
            setNewCardCompany('');
            setRewardRules([{ categoryId: '', cashBackPercent: '' }]);
            setCreateErrors({ company: false, rules: [] });
            setCardModal({isShowing: false, mode: 'create', card: null});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to create credit card.');
            }
        }
    });

    const updateCreditCardMutation = useMutation({
        mutationFn: ({creditCardId, creditCardCompany, rewardsRules}) => (
            updateCreditCard(creditCardId, creditCardCompany, rewardsRules)
        ),
        onSuccess: () => {
            showSuccess("Credit card updated!");
            qc.invalidateQueries({ queryKey: ['creditCards'] });
            setCardModal({isShowing: false, mode: 'create', card: null});
            setNewCardCompany('');
            setRewardRules([{ categoryId: '', cashBackPercent: '' }]);
            setCreateErrors({ company: false, rules: [] });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to update credit card.');
            }
        }
    });

    const payCreditCardMutation = useMutation({
        mutationFn: ({creditCardId, amount, date, cashBackAmount: cashBack}) => payCreditCardBalance(creditCardId, amount, date, cashBack),
        onSuccess: () => {
            showSuccess('Payment recorded!');
            qc.invalidateQueries({ queryKey: ['creditCards'] });
            setPayModal({isShowing: false, card: null});
            setPaymentAmount('');
            setUseCashBack(false);
            setCashBackAmount('');
            setPaymentDate(new Date().toISOString().substring(0, 10));
            setPaymentErrors({amount: false, date: false, cashBack: false});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to record credit card payment.');
            }
        }
    });

    const resetCreateCardState = () => {
        setNewCardCompany('');
        setRewardRules([{ categoryId: '', cashBackPercent: '' }]);
        setCreateErrors({ company: false, rules: [] });
    };

    const handleOpenCreateCardModal = () => {
        resetCreateCardState();
        setCardModal({isShowing: true, mode: 'create', card: null});
    };

    const handleCreateCardSave = () => {
        if (createCreditCardMutation.isPending) {
            return;
        }
        if (updateCreditCardMutation.isPending) {
            return;
        }
        const trimmed = newCardCompany.trim();
        const filledRules = rewardRules.filter((rule) => (
            String(rule.categoryId || '').trim() !== '' || String(rule.cashBackPercent || '').trim() !== ''
        ));
        const nextErrors = {
            company: !trimmed,
            rules: rewardRules.map((rule) => {
                const hasCategory = String(rule.categoryId || '').trim() !== '';
                const hasPercent = String(rule.cashBackPercent || '').trim() !== '';
                const percentValue = Number(rule.cashBackPercent);
                return {
                    category: hasPercent && !hasCategory,
                    percent: hasCategory && (!Number.isFinite(percentValue) || percentValue <= 0)
                };
            })
        };

        const hasRuleErrors = nextErrors.rules.some((rule) => rule.category || rule.percent);
        setCreateErrors(nextErrors);

        if (nextErrors.company || hasRuleErrors) {
            showWarning('Please complete the credit card details.');
            return;
        }

        const selectedCategories = filledRules
            .map((rule) => (rule.categoryId === allOtherValue ? allOtherValue : String(rule.categoryId)))
            .filter(Boolean);
        const hasDuplicateCategories = new Set(selectedCategories).size !== selectedCategories.length;
        if (hasDuplicateCategories) {
            showWarning('Each category can only be used once.');
            return;
        }

        const rewardsRules = filledRules.map((rule) => ({
            categoryId: rule.categoryId === allOtherValue ? null : Number(rule.categoryId),
            allOtherCategories: rule.categoryId === allOtherValue,
            cashBackPercent: Number(rule.cashBackPercent)
        }));

        if (cardModal.mode === 'edit' && cardModal.card) {
            updateCreditCardMutation.mutate({
                creditCardId: cardModal.card.id,
                creditCardCompany: trimmed,
                rewardsRules
            });
            return;
        }

        createCreditCardMutation.mutate({
            creditCardCompany: trimmed,
            rewardsRules
        });
    };

    const handleOpenEditCardModal = (card) => {
        const rules = card.rewardRules ?? card.RewardRules ?? [];
        setNewCardCompany(card.company ?? '');
        setRewardRules(
            rules.length > 0
                ? rules.map((rule) => ({
                    categoryId: rule.allOtherCategories || rule.AllOtherCategories
                        ? allOtherValue
                        : (rule.categoryId ?? rule.CategoryId ?? ''),
                    cashBackPercent: rule.cashBackPercent ?? rule.CashBackPercent ?? ''
                }))
                : [{ categoryId: '', cashBackPercent: '' }]
        );
        setCreateErrors({ company: false, rules: [] });
        setCardModal({isShowing: true, mode: 'edit', card});
    };

    const handleAddRewardRule = () => {
        setRewardRules((prevRules) => ([...prevRules, { categoryId: '', cashBackPercent: '' }]));
    };

    const handleRemoveRewardRule = (index) => {
        setRewardRules((prevRules) => prevRules.filter((_rule, ruleIndex) => ruleIndex !== index));
        setCreateErrors((prev) => ({
            ...prev,
            rules: prev.rules.filter((_rule, ruleIndex) => ruleIndex !== index)
        }));
    };

    const handleOpenPayModal = (card) => {
        setPayModal({isShowing: true, card});
        setPaymentAmount('');
        setUseCashBack(false);
        setCashBackAmount('');
        setPaymentDate(new Date().toISOString().substring(0, 10));
        setPaymentErrors({amount: false, date: false, cashBack: false});
    };

    const handleClosePayModal = () => {
        setPayModal({isShowing: false, card: null});
        setPaymentErrors({amount: false, date: false, cashBack: false});
    };

    const handleCloseCreateCardModal = () => {
        setCardModal({isShowing: false, mode: 'create', card: null});
        setCreateErrors({ company: false, rules: [] });
    };

    const handlePaySave = () => {
        const amountValue = Number(paymentAmount);
        const cashBackValue = useCashBack ? Number(cashBackAmount) : 0;
        const availableCashBack = Number(payModal.card?.cashBackBalance ?? 0);
        const nextErrors = {
            amount: Number.isNaN(amountValue) || amountValue < 0,
            date: !paymentDate,
            cashBack: useCashBack && (
                Number.isNaN(cashBackValue)
                || cashBackValue <= 0
                || cashBackValue > availableCashBack
            )
        };

        const totalPayment = (Number.isNaN(amountValue) ? 0 : amountValue) + (Number.isNaN(cashBackValue) ? 0 : cashBackValue);
        if (totalPayment <= 0) {
            nextErrors.amount = true;
            if (useCashBack) {
                nextErrors.cashBack = true;
            }
        }

        setPaymentErrors(nextErrors);
        if (nextErrors.amount || nextErrors.date || nextErrors.cashBack || !payModal.card) {
            return;
        }

        payCreditCardMutation.mutate({
            creditCardId: payModal.card.id,
            amount: amountValue,
            date: paymentDate,
            cashBackAmount: cashBackValue
        });
    };

    const selectedRewardCategoryIds = rewardRules
        .map((rule) => String(rule.categoryId))
        .filter((categoryId) => categoryId && categoryId !== allOtherValue);
    const isAllOtherSelected = rewardRules.some((rule) => rule.categoryId === allOtherValue);
    const availableRewardCategories = categories.filter(
        (category) => !selectedRewardCategoryIds.includes(String(category.id))
    );

    const modalContent = (
        <div className="modal show d-block manage-credit-cards-modal app-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div
                    className={"modal-content"}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="modal-header">
                        <h5 className="modal-title">Manage Credit Cards</h5>
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
                        <div className="manage-credit-cards-body">
                            <div className="manage-credit-cards-card">
                                <span className="manage-credit-cards-label">Your Cards</span>
                                <div className="manage-credit-cards-list">
                                    {isLoading ? (
                                        <span className="manage-credit-cards-muted">Loading credit cards...</span>
                                    ) : creditCards.length === 0 ? (
                                        <span className="manage-credit-cards-muted">No credit cards yet.</span>
                                    ) : (
                                        creditCards.map((card) => (
                                            <div className="manage-credit-cards-row" key={card.id}>
                                                <div className="manage-credit-cards-info">
                                                    <span className="manage-credit-cards-name">
                                                        {card.company || 'Unnamed card'}
                                                    </span>
                                                    <span className="manage-credit-cards-balance">
                                                        Balance: ${Number(card.runningBalance ?? 0).toFixed(2)}
                                                    </span>
                                                    <span className="manage-credit-cards-cashback">
                                                        Cash back: ${Number(card.cashBackBalance ?? 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <button
                                                    className="manage-credit-cards-icon-button"
                                                    type="button"
                                                    onClick={() => handleOpenEditCardModal(card)}
                                                    aria-label="Edit credit card"
                                                >
                                                    <FaPen size={12} />
                                                </button>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    type="button"
                                                    onClick={() => handleOpenPayModal(card)}
                                                >
                                                    Pay
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="manage-credit-cards-create">
                                    <button
                                        className="btn btn-success"
                                        type="button"
                                        onClick={handleOpenCreateCardModal}
                                    >
                                        Add Credit Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
                    </div>
                </div>
            </div>
            {payModal.isShowing && (
                <Modal
                    title={`Pay ${payModal.card?.company || 'Credit Card'}`}
                    handleSave={handlePaySave}
                    handleClose={handleClosePayModal}
                    className="app-modal"
                    saveLabel="Pay"
                >
                    <div className="payment-section manage-credit-card-issuer">
                        <label className="form-label">Payment Amount</label>
                        <input
                            className={`form-control${paymentErrors.amount ? ' is-invalid' : ''}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentAmount}
                            onChange={(e) => {
                                setPaymentAmount(e.target.value);
                                if (paymentErrors.amount) {
                                    setPaymentErrors((prev) => ({...prev, amount: false}));
                                }
                            }}
                        />
                    </div>
                    <div className="payment-section">
                        <div className="manage-credit-cards-toggle-row">
                            <label className="form-label" htmlFor="cashBackToggle">Use cash back?</label>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="cashBackToggle"
                                checked={useCashBack}
                                onChange={() => {
                                    setUseCashBack((prev) => !prev);
                                    setCashBackAmount('');
                                    if (paymentErrors.cashBack) {
                                        setPaymentErrors((prev) => ({...prev, cashBack: false}));
                                    }
                                }}
                            />
                        </div>
                    </div>
                    {useCashBack && (
                        <div className="payment-section">
                            <label className="form-label">Cash Back Amount</label>
                            <span className="manage-credit-cards-muted">
                                Available: ${Number(payModal.card?.cashBackBalance ?? 0).toFixed(2)}
                            </span>
                            <input
                                className={`form-control${paymentErrors.cashBack ? ' is-invalid' : ''}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max={Number(payModal.card?.cashBackBalance ?? 0)}
                                value={cashBackAmount}
                                onChange={(e) => {
                                    const { value } = e.target;
                                    const numericValue = Number(value);
                                    const availableCashBack = Number(payModal.card?.cashBackBalance ?? 0);
                                    const isInvalid = !Number.isFinite(numericValue)
                                        || numericValue <= 0
                                        || numericValue > availableCashBack;

                                    setCashBackAmount(value);
                                    setPaymentErrors((prev) => ({
                                        ...prev,
                                        cashBack: value === '' ? false : isInvalid
                                    }));
                                }}
                            />
                        </div>
                    )}
                    <div className="payment-section">
                        <label className="form-label">Payment Date</label>
                        <input
                            className={`form-control${paymentErrors.date ? ' is-invalid' : ''}`}
                            type="date"
                            value={paymentDate}
                            onChange={(e) => {
                                setPaymentDate(e.target.value);
                                if (paymentErrors.date) {
                                    setPaymentErrors((prev) => ({...prev, date: false}));
                                }
                            }}
                        />
                    </div>
                </Modal>
            )}
            {cardModal.isShowing && (
                <Modal
                    title="Credit Card Details"
                    handleSave={handleCreateCardSave}
                    handleClose={handleCloseCreateCardModal}
                    className="app-modal"
                    saveLabel={cardModal.mode === 'edit' ? 'Update' : 'Create'}
                >
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
                                        onClick={() => {
                                            setRewardRules([{ categoryId: '', cashBackPercent: '' }]);
                                            setCreateErrors((prev) => ({...prev, rules: []}));
                                        }}
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

                                return (
                                    <div className="reward-rule-row" key={`${index}-${rule.categoryId}`}>
                                        <div className="reward-rule-field">
                                            <label className="form-label">Category</label>
                                            <select
                                                className={`form-select${createErrors.rules[index]?.category ? ' is-invalid' : ''}`}
                                                value={rule.categoryId}
                                                onChange={(e) => {
                                                    const { value } = e.target;
                                                    setRewardRules((prevRules) => prevRules.map((item, itemIndex) => (
                                                        itemIndex === index ? {...item, categoryId: value} : item
                                                    )));
                                                    if (createErrors.rules[index]?.category) {
                                                        setCreateErrors((prev) => ({
                                                            ...prev,
                                                            rules: prev.rules.map((error, errorIndex) => (
                                                                errorIndex === index ? {...error, category: false} : error
                                                            ))
                                                        }));
                                                    }
                                                }}
                                                disabled={isCategoriesLoading}
                                            >
                                                <option value="">Select category</option>
                                                {canShowAllOther && (
                                                    <option value={allOtherValue}>All Other Categories</option>
                                                )}
                                                {isCategoriesLoading ? (
                                                    <option value="" disabled>Loading categories...</option>
                                                ) : (
                                                    availableCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        <div className="reward-rule-field reward-rule-percent">
                                            <label className="form-label">Percent</label>
                                            <div className="reward-rule-percent-input">
                                                <input
                                                    className={`form-control${createErrors.rules[index]?.percent ? ' is-invalid' : ''}`}
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={rule.cashBackPercent}
                                                    onChange={(e) => {
                                                        const { value } = e.target;
                                                        setRewardRules((prevRules) => prevRules.map((item, itemIndex) => (
                                                            itemIndex === index ? {...item, cashBackPercent: value} : item
                                                        )));
                                                        if (createErrors.rules[index]?.percent) {
                                                            setCreateErrors((prev) => ({
                                                                ...prev,
                                                                rules: prev.rules.map((error, errorIndex) => (
                                                                    errorIndex === index ? {...error, percent: false} : error
                                                                ))
                                                            }));
                                                        }
                                                    }}
                                                    placeholder="2.5"
                                                />
                                                <span className="reward-rule-percent-suffix">%</span>
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
                </Modal>
            )}
        </div>
    );
    return createPortal(modalContent, document.body);
}
