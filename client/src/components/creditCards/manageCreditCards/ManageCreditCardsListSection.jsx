import React from 'react';
import {FaPen} from "react-icons/fa";

export const ManageCreditCardsListSection = ({
    isLoading,
    creditCards,
    onEdit,
    onPay,
    onCreate
}) => (
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
                                onClick={() => onEdit(card)}
                                aria-label="Edit credit card"
                            >
                                <FaPen size={12} />
                            </button>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                type="button"
                                onClick={() => onPay(card)}
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
                    onClick={onCreate}
                >
                    Add Credit Card
                </button>
            </div>
        </div>
    </div>
);
