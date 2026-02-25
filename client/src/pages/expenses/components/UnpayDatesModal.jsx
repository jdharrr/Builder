import React, {useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {getPaymentsForExpense} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {useConfirmModal} from "../../../hooks/useConfirmModal.jsx";
import {Modal} from "../../../components/Modal.jsx";
import '../../../css/createExpenseForm.css';

export const UnpayDatesModal = ({expenseId, handleSave, handleClose, isSaving = false}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const {openConfirm, confirmModal} = useConfirmModal();

    const handleSaveClick = () => {
        const selectedPayments = payments.filter((payment) => selectedIds.includes(payment.id));
        const hasCreditCard = selectedPayments.some((payment) => payment.creditCardId || payment.creditCard);
        if (hasCreditCard) {
            openConfirm(
                "One or more payments are tied to a credit card. Do you want these to be removed from the credit card balance and cash back balance?",
                () => handleSave(selectedIds, expenseId, true),
                {
                    onCancel: () => handleSave(selectedIds, expenseId, false)
                }
            );
            return;
        }

        openConfirm(
            "Are you sure you want to unpay the selected payments?",
            () => handleSave(selectedIds, expenseId, false)
        );
    }

    const handleCheckboxClick = (checked, id) => {
        if (checked) {
            setSelectedIds((prevState) => [...prevState, id])
        } else {
            setSelectedIds((prev) => prev.filter((existingId) => existingId !== id));
        }
    }

    const { data: payments = [] } = useQuery({
        queryKey: ['paymentsForExpense', expenseId],
        queryFn: async () => {
            return await getPaymentsForExpense(expenseId);
        },
        enabled: !!expenseId,
        staleTime: 0,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    return (
        <>
            <Modal
                title="Select dates to mark unpaid"
                handleClose={handleClose}
                className="app-modal select-payments-modal"
                showSave={false}
                ignoreOutsideClickSelectors={['.confirm-modal']}
                footerContent={(
                    <>
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
                        <button
                            type="button"
                            className="btn btn-warning"
                            disabled={isSaving || selectedIds.length <= 0}
                            onClick={handleSaveClick}
                        >
                            Unpay Selected ({selectedIds.length})
                        </button>
                    </>
                )}
            >
                <div className="payment-list">
                    {payments && payments.length > 0 ? (
                        payments.map((item, idx) => (
                            <label key={idx} className="payment-row">
                                <div className="payment-row-details">
                                    <span className="payment-row-label">Due date</span>
                                    <span className="payment-row-value">{item.dueDatePaid}</span>
                                    <span className="payment-row-label">Paid on</span>
                                    <span className="payment-row-value">{item.paymentDate}</span>
                                    {item.skipped && (
                                        <span className="payment-row-skipped">Skipped</span>
                                    )}
                                </div>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={(e) => handleCheckboxClick(e.target.checked, item.id)}
                                />
                            </label>
                        ))
                    ) : (
                        <p className="modal-empty">This expense has no payments.</p>
                    )}
                </div>
            </Modal>
            {confirmModal}
        </>
    );
}
