import React, {useState, useRef, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {getLateDatesForExpense, payDueDates} from '../../../api.jsx';
import {getStatus} from '../../../util.jsx';
import {showSuccess, showError} from '../../../utils/toast.js';
import {CreditCardSelect} from "../../../components/CreditCardSelect.jsx";

export const LateDatesModal = ({expense, handleClose, onPaymentSuccess}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const wrapperRef = useRef(null);

    const [selectedDates, setSelectedDates] = useState([]);
    const [showPaymentDateInput, setShowPaymentDateInput] = useState(false);
    const [paymentDate, setPaymentDate] = useState('');
    const [skippingDate, setSkippingDate] = useState(null);
    const [visibleLateDates, setVisibleLateDates] = useState([]);
    const [selectedCreditCardId, setSelectedCreditCardId] = useState('');

    // Fetch late dates for the expense
    const {data: lateDates = [], isLoading} = useQuery({
        queryKey: ['lateDates', expense.id],
        queryFn: async () => {
            return await getLateDatesForExpense(expense.id) ?? [];
        },
        staleTime: 0,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => {
            return getStatus(error) !== 401;
        },
    });

    useEffect(() => {
        setVisibleLateDates(lateDates);
    }, [lateDates]);

    // Mutation for paying selected dates
    const paySelectedMutation = useMutation({
        mutationFn: async () => {
            await payDueDates(expense.id, selectedDates, paymentDate, false, selectedCreditCardId || null);
        },
        onSuccess: () => {
            showSuccess(`Successfully paid ${selectedDates.length} date(s)`);
            qc.invalidateQueries(['lateExpenses']);
            qc.invalidateQueries(['lateDates']);
            onPaymentSuccess?.();
            handleClose();
        },
        onError: (error) => {
            if (getStatus(error) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to pay selected dates');
            }
        },
    });

    const toggleSelectAll = (isChecked) => {
        setSelectedDates(isChecked ? visibleLateDates : []);
    };

    const skipDateMutation = useMutation({
        mutationFn: (dueDate) => payDueDates(expense.id, [dueDate], undefined, true),
        onMutate: (dueDate) => {
            setSkippingDate(dueDate);
        },
        onSuccess: (_data, dueDate) => {
            showSuccess(`Skipped ${dueDate}`);
            setSelectedDates((prev) => prev.filter((date) => date !== dueDate));
            setVisibleLateDates((prev) => prev.filter((date) => date !== dueDate));
            qc.invalidateQueries(['lateExpenses']);
            qc.invalidateQueries(['lateDates']);
            onPaymentSuccess?.();
        },
        onError: (error) => {
            if (getStatus(error) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to skip date');
            }
        },
        onSettled: () => {
            setSkippingDate(null);
        }
    });

    // Click-outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (document.querySelector('.manage-credit-cards-modal')) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose]);

    // Handle checkbox change
    const handleCheckboxChange = (date, isChecked) => {
        if (isChecked) {
            setSelectedDates([...selectedDates, date]);
        } else {
            setSelectedDates(selectedDates.filter(d => d !== date));
        }
    };

    // Handle pay selected click
    const handlePaySelectedClick = () => {
        setShowPaymentDateInput(true);
    };

    const handleSkipDate = (date) => {
        if (!window.confirm(`Skip ${date}?`)) {
            return;
        }
        skipDateMutation.mutate(date);
    }

    // Handle back from payment date input
    const handleBackClick = () => {
        setShowPaymentDateInput(false);
        setPaymentDate('');
    };

    return (
        <div className='modal show d-block app-modal late-dates-modal'>
            <div className='modal-dialog'>
                <div className='modal-content' ref={wrapperRef}>
                    <div className='modal-header'>
                        <div className="late-dates-title">
                            <span className="late-dates-eyebrow">Late dates</span>
                            <div className="late-dates-heading">
                                <h5 className="modal-title">{expense.name}</h5>
                                <span className="late-dates-count">{visibleLateDates.length}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            x
                        </button>
                    </div>
                    <div className='modal-body'>
                        {isLoading ? (
                            <div className="text-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : !showPaymentDateInput ? (
                            <>
                                {visibleLateDates.length === 0 ? (
                                    <p className="modal-empty">No late dates found for this expense.</p>
                                ) : (
                                    <div className="payment-section">
                                        <div className="late-date-row late-date-row--select-all late-date-row--select-all-gray">
                                            <label className="late-date-main">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedDates.length === visibleLateDates.length}
                                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                                />
                                                <span className="late-date-value">Select all</span>
                                            </label>
                                        </div>
                                        <div className="late-dates-list">
                                            {visibleLateDates.map((date, idx) => (
                                                <div key={idx} className="late-date-row">
                                                    <label className="late-date-main">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedDates.includes(date)}
                                                            onChange={(e) => handleCheckboxChange(date, e.target.checked)}
                                                        />
                                                        <span className="late-date-value">{date}</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="late-date-skip"
                                                        disabled={skippingDate === date}
                                                        onClick={() => handleSkipDate(date)}
                                                    >
                                                        {skippingDate === date ? 'Skipping...' : 'Skip'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="payment-section late-dates-payment">
                                    <label className="form-label">Payment Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                    />
                                    <div className="late-dates-note">
                                        This date will be applied to all {selectedDates.length} selected late date(s).
                                    </div>
                                </div>
                                <CreditCardSelect
                                    label="Credit card (optional)"
                                    includeNoneOption={true}
                                    initialValue={selectedCreditCardId || ''}
                                    onChange={(e) => setSelectedCreditCardId(e.target.value)}
                                />
                            </>
                        )}
                    </div>
                    <div className='modal-footer'>
                        {!showPaymentDateInput ? (
                            <>
                                <button className="btn btn-secondary" onClick={handleClose}>
                                    Close
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePaySelectedClick}
                                    disabled={selectedDates.length === 0}
                                >
                                    Pay Selected ({selectedDates.length})
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-secondary" onClick={handleBackClick}>
                                    Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => paySelectedMutation.mutate()}
                                    disabled={!paymentDate || paySelectedMutation.isPending}
                                >
                                    {paySelectedMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
