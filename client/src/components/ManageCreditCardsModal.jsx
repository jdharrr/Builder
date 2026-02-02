import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {FaPen} from "react-icons/fa";

import {createCreditCard, getCreditCards, payCreditCardBalance, updateCreditCardCompany} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {showError, showSuccess, showWarning} from "../utils/toast.js";
import {Modal} from "./Modal.jsx";

import '../css/manageCreditCardsModal.css';
import '../css/createExpenseForm.css';

export const ManageCreditCardsModal = ({handleClose, onClose}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [newCardCompany, setNewCardCompany] = useState('');
    const [cardEdits, setCardEdits] = useState({});
    const [editingCardId, setEditingCardId] = useState(null);
    const [payModal, setPayModal] = useState({isShowing: false, card: null});
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
    const [paymentErrors, setPaymentErrors] = useState({amount: false, date: false});

    const wrapperRef = useRef(null);
    const closeModal = useCallback(() => {
        handleClose();
        if (onClose) {
            onClose();
        }
    }, [handleClose, onClose]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (payModal.isShowing) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                closeModal();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeModal, payModal.isShowing]);

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

    useEffect(() => {
        setCardEdits(() => (
            creditCards.reduce((acc, card) => {
                acc[card.id] = card.company ?? '';
                return acc;
            }, {})
        ));
    }, [creditCards]);

    const createCreditCardMutation = useMutation({
        mutationFn: (creditCardCompany) => createCreditCard(creditCardCompany),
        onSuccess: () => {
            showSuccess("Credit card created!");
            qc.invalidateQueries({ queryKey: ['creditCards'] });
            setNewCardCompany('');
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
        mutationFn: ({creditCardId, creditCardCompany}) => updateCreditCardCompany(creditCardId, creditCardCompany),
        onSuccess: (_data, variables) => {
            showSuccess("Credit card updated!");
            setEditingCardId(null);
            setCardEdits((prevState) => ({
                ...prevState,
                [variables.creditCardId]: variables.creditCardCompany
            }));
            qc.invalidateQueries({ queryKey: ['creditCards'] });
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
        mutationFn: ({creditCardId, amount, date}) => payCreditCardBalance(creditCardId, amount, date),
        onSuccess: () => {
            showSuccess('Payment recorded!');
            qc.invalidateQueries({ queryKey: ['creditCards'] });
            setPayModal({isShowing: false, card: null});
            setPaymentAmount('');
            setPaymentDate(new Date().toISOString().substring(0, 10));
            setPaymentErrors({amount: false, date: false});
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

    const handleCreateCreditCard = () => {
        const trimmed = newCardCompany.trim();
        if (!trimmed) {
            showWarning('Please enter a credit card name.');
            return;
        }
        createCreditCardMutation.mutate(trimmed);
    }

    const handleSaveCreditCard = (card) => {
        const updatedCompany = (cardEdits[card.id] || '').trim();
        if (!updatedCompany) {
            showWarning('Credit card name cannot be empty.');
            return;
        }
        if (updatedCompany === (card.company ?? '')) {
            setEditingCardId(null);
            return;
        }
        updateCreditCardMutation.mutate({
            creditCardId: card.id,
            creditCardCompany: updatedCompany
        });
    }

    const handleCancelEdit = (card) => {
        setCardEdits((prevState) => ({
            ...prevState,
            [card.id]: card.company ?? ''
        }));
        setEditingCardId(null);
    }

    const handleOpenPayModal = (card) => {
        setPayModal({isShowing: true, card});
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().substring(0, 10));
        setPaymentErrors({amount: false, date: false});
    };

    const handleClosePayModal = () => {
        setPayModal({isShowing: false, card: null});
        setPaymentErrors({amount: false, date: false});
    };

    const handlePaySave = () => {
        const amountValue = Number(paymentAmount);
        const nextErrors = {
            amount: Number.isNaN(amountValue) || amountValue <= 0,
            date: !paymentDate
        };

        setPaymentErrors(nextErrors);
        if (nextErrors.amount || nextErrors.date || !payModal.card) {
            return;
        }

        payCreditCardMutation.mutate({
            creditCardId: payModal.card.id,
            amount: amountValue,
            date: paymentDate
        });
    };

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
                                                {editingCardId === card.id ? (
                                                    <>
                                                        <input
                                                            className="form-control manage-credit-cards-input"
                                                            type="text"
                                                            value={cardEdits[card.id] ?? ''}
                                                            onChange={(e) => {
                                                                const { value } = e.target;
                                                                setCardEdits((prevState) => ({
                                                                    ...prevState,
                                                                    [card.id]: value
                                                                }));
                                                            }}
                                                        />
                                                        <button
                                                            className="btn btn-outline-success btn-sm"
                                                            type="button"
                                                            disabled={updateCreditCardMutation.isPending}
                                                            onClick={() => handleSaveCreditCard(card)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            type="button"
                                                            onClick={() => handleCancelEdit(card)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="manage-credit-cards-info">
                                                            <span className="manage-credit-cards-name">
                                                                {card.company || 'Unnamed card'}
                                                            </span>
                                                            <span className="manage-credit-cards-balance">
                                                                ${Number(card.runningBalance ?? 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="manage-credit-cards-icon-button"
                                                            type="button"
                                                            onClick={() => setEditingCardId(card.id)}
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
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="manage-credit-cards-create">
                                    <label className="form-label">New Credit Card</label>
                                    <div className="manage-credit-cards-create-row">
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={newCardCompany}
                                            onChange={(e) => setNewCardCompany(e.target.value)}
                                            placeholder="Card issuer"
                                        />
                                        <button
                                            className="btn btn-success"
                                            type="button"
                                            onClick={handleCreateCreditCard}
                                            disabled={createCreditCardMutation.isPending}
                                        >
                                            Add
                                        </button>
                                    </div>
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
                    <div className="payment-section">
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
        </div>
    );
    return createPortal(modalContent, document.body);
}
