import React from 'react';

export const CreditCardPaySection = ({
    payModalCard,
    paymentAmount,
    paymentErrors,
    cashBackAmount,
    useCashBack,
    paymentDate,
    onAmountChange,
    onUseCashBackToggle,
    onCashBackChange,
    onPaymentDateChange
}) => (
    <>
        <div className="payment-section manage-credit-card-issuer">
            <label className="form-label">Payment Amount</label>
            <input
                className={`form-control${paymentErrors.amount ? ' is-invalid' : ''}`}
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={onAmountChange}
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
                    onChange={onUseCashBackToggle}
                />
            </div>
        </div>
        {useCashBack && (
            <div className="payment-section">
                <label className="form-label">Cash Back Amount</label>
                <span className="manage-credit-cards-muted">
                    Available: ${Number(payModalCard?.cashBackBalance ?? 0).toFixed(2)}
                </span>
                <input
                    className={`form-control${paymentErrors.cashBack ? ' is-invalid' : ''}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max={Number(payModalCard?.cashBackBalance ?? 0)}
                    value={cashBackAmount}
                    onChange={onCashBackChange}
                />
            </div>
        )}
        <div className="payment-section">
            <label className="form-label">Payment Date</label>
            <input
                className={`form-control${paymentErrors.date ? ' is-invalid' : ''}`}
                type="date"
                value={paymentDate}
                onChange={onPaymentDateChange}
            />
        </div>
    </>
);
