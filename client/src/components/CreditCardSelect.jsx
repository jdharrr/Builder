import React, {useEffect, useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {getCreditCards} from "../api.jsx";
import {getStatus} from "../util.jsx";
import {ManageCreditCardsModal} from "./ManageCreditCardsModal.jsx";

export const CreditCardSelect = ({
    label,
    onChange = () => {},
    required = false,
    isInvalid = false,
    includeNoneOption = false,
    noneLabel = 'No credit card',
    initialValue = ''
}) => {
    const [showManageCreditCardsModal, setShowManageCreditCardsModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(initialValue ?? '');

    const { data: creditCards = [] } = useQuery({
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
        setSelectedCard(initialValue ?? '');
    }, [initialValue]);

    const handleOnChange = (e) => {
        setSelectedCard(e.target.value);
        onChange(e);
    }

    return (
        <>
            <div className="payment-section credit-card-select">
                {label && (
                    <label className="form-label">
                        {label}{required ? ' *' : ''}
                    </label>
                )}
                <div className="row d-flex justify-content-center align-items-center me-2">
                    <div className="col">
                        <select
                            className={`form-select${isInvalid ? ' is-invalid' : ''}`}
                            value={selectedCard}
                            onChange={handleOnChange}
                        >
                            {includeNoneOption ? (
                                <option value="">{noneLabel}</option>
                            ) : (
                                <option value="">Select a credit card</option>
                            )}
                            {creditCards.map((card) => (
                                <option key={card.id} value={card.id}>
                                    {card.company || 'Unnamed card'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-auto">
                        <button
                            className="manageCategoriesButton"
                            type="button"
                            onClick={() => setShowManageCreditCardsModal(true)}
                        >
                            Manage
                        </button>
                    </div>
                </div>
            </div>
            {showManageCreditCardsModal && (
                <ManageCreditCardsModal
                    handleClose={() => setShowManageCreditCardsModal(false)}
                />
            )}
        </>
    );
};
