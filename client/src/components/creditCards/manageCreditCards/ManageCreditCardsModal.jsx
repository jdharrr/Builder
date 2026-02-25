import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {createCreditCard, getAllExpenseCategories, getCreditCards, payCreditCardBalance, updateCreditCard} from "../../../api.jsx";
import {showApiErrorToast, getStatus} from "../../../util.jsx";
import {showError, showSuccess, showWarning} from "../../../utils/toast.js";
import {Modal} from "../../Modal.jsx";
import {ManageCreditCardsListSection} from "./ManageCreditCardsListSection.jsx";
import {CreditCardPaySection} from "./CreditCardPaySection.jsx";
import {CreditCardDetailsSection} from "./CreditCardDetailsSection.jsx";
import {invalidateExpenseCaches, invalidatePaymentCaches, invalidateTotalsCaches} from "../../../utils/queryInvalidations.js";

import '../../../css/manageCreditCardsModal.css';
import '../../../css/createExpenseForm.css';

export const ManageCreditCardsModal = ({handleClose}) => {
    const allOtherValue = 'all_other';
    const navigate = useNavigate();
    const qc = useQueryClient();

    // Edit/Create credit card state
    const [newCardCompany, setNewCardCompany] = useState('');
    const [cardModal, setCardModal] = useState({isShowing: false, mode: 'create', card: null});
    const [rewardRules, setRewardRules] = useState([{ categoryId: '', cashBackPercent: '' }]);
    const [createErrors, setCreateErrors] = useState({ company: false, rules: [] });

    // Pay credit card state
    const [payModal, setPayModal] = useState({isShowing: false, card: null});
    const [paymentAmount, setPaymentAmount] = useState('');
    const [useCashBack, setUseCashBack] = useState(false);
    const [cashBackAmount, setCashBackAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
    const [paymentErrors, setPaymentErrors] = useState({amount: false, date: false, cashBack: false});

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
            invalidateTotalsCaches(qc);
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
                showApiErrorToast(err, 'Failed to create credit card.');
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
            invalidateTotalsCaches(qc);
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
                showApiErrorToast(err, 'Failed to update credit card.');
            }
        }
    });

    const payCreditCardMutation = useMutation({
        mutationFn: ({creditCardId, amount, date, cashBackAmount: cashBack}) => payCreditCardBalance(creditCardId, amount, date, cashBack),
        onSuccess: () => {
            showSuccess('Payment recorded!');
            qc.invalidateQueries({ queryKey: ['creditCards'] });
            invalidateExpenseCaches(qc);
            invalidatePaymentCaches(qc);
            invalidateTotalsCaches(qc);
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
                showApiErrorToast(err, 'Failed to record credit card payment.');
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
        const rules = card.rewardRules ?? [];
        setNewCardCompany(card.company ?? '');
        setRewardRules(
            rules.length > 0
                ? rules.map((rule) => ({
                    categoryId: rule.allOtherCategories
                        ? allOtherValue
                        : (rule.categoryId ?? ''),
                    cashBackPercent: rule.cashBackPercent ?? ''
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

    const handleRewardRuleChange = (index, field, value) => {
        setRewardRules((prevRules) => prevRules.map((rule, ruleIndex) => (
            ruleIndex === index ? { ...rule, [field]: value } : rule
        )));
        const errorField = field === 'categoryId' ? 'category' : 'percent';
        setCreateErrors((prev) => {
            const nextRules = [...(prev.rules ?? [])];
            const existing = nextRules[index] ?? {};
            nextRules[index] = { ...existing, [errorField]: false };
            return { ...prev, rules: nextRules };
        });
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

    const selectedRewardCategoryIds = rewardRules.map(
        (rule) => String(rule.categoryId)
    ).filter(
        (categoryId) => categoryId && categoryId !== allOtherValue
    );

    const isAllOtherSelected = rewardRules.some(
        (rule) => rule.categoryId === allOtherValue
    );

    // Removing already used categories for reward rules
    const availableRewardCategories = categories.filter(
        (category) => !selectedRewardCategoryIds.includes(String(category.id))
    );

    const modalContent = (
        <>
            <Modal
                title="Manage Credit Cards"
                handleClose={handleClose}
                className="manage-credit-cards-modal app-modal"
                showSave={false}
                disableOutsideClick={payModal.isShowing || cardModal.isShowing}
            >
                <ManageCreditCardsListSection
                    isLoading={isLoading}
                    creditCards={creditCards}
                    onEdit={handleOpenEditCardModal}
                    onPay={handleOpenPayModal}
                    onCreate={handleOpenCreateCardModal}
                />
            </Modal>
            {payModal.isShowing && (
                <Modal
                    title={`Pay ${payModal.card?.company || 'Credit Card'}`}
                    handleSave={handlePaySave}
                    handleClose={handleClosePayModal}
                    className="app-modal"
                    bodyClassName="manage-credit-cards-pay-body"
                    saveLabel="Pay"
                    saveDisabled={payCreditCardMutation.isPending}
                >
                    <CreditCardPaySection
                        payModalCard={payModal.card}
                        paymentAmount={paymentAmount}
                        paymentErrors={paymentErrors}
                        cashBackAmount={cashBackAmount}
                        useCashBack={useCashBack}
                        paymentDate={paymentDate}
                        onAmountChange={(e) => {
                            setPaymentAmount(e.target.value);
                            if (paymentErrors.amount) {
                                setPaymentErrors((prev) => ({...prev, amount: false}));
                            }
                        }}
                        onUseCashBackToggle={() => {
                            setUseCashBack((prev) => !prev);
                            setCashBackAmount('');
                            if (paymentErrors.cashBack) {
                                setPaymentErrors((prev) => ({...prev, cashBack: false}));
                            }
                        }}
                        onCashBackChange={(e) => {
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
                        onPaymentDateChange={(e) => {
                            setPaymentDate(e.target.value);
                            if (paymentErrors.date) {
                                setPaymentErrors((prev) => ({...prev, date: false}));
                            }
                        }}
                    />
                </Modal>
            )}
            {cardModal.isShowing && (
                <Modal
                    title="Credit Card Details"
                    handleSave={handleCreateCardSave}
                    handleClose={handleCloseCreateCardModal}
                    className="app-modal"
                    saveLabel={cardModal.mode === 'edit' ? 'Update' : 'Create'}
                    saveDisabled={createCreditCardMutation.isPending || updateCreditCardMutation.isPending}
                >
                    <CreditCardDetailsSection
                        allOtherValue={allOtherValue}
                        newCardCompany={newCardCompany}
                        setNewCardCompany={setNewCardCompany}
                        rewardRules={rewardRules}
                        createErrors={createErrors}
                        setCreateErrors={setCreateErrors}
                        categories={categories}
                        isCategoriesLoading={isCategoriesLoading}
                        availableRewardCategories={availableRewardCategories}
                        isAllOtherSelected={isAllOtherSelected}
                        handleAddRewardRule={handleAddRewardRule}
                        handleRemoveRewardRule={handleRemoveRewardRule}
                        handleRewardRuleChange={handleRewardRuleChange}
                        handleResetRules={() => {
                            setRewardRules([{ categoryId: '', cashBackPercent: '' }]);
                            setCreateErrors((prev) => ({...prev, rules: []}));
                        }}
                    />
                </Modal>
            )}
        </>
    );
    return createPortal(modalContent, document.body);
}
