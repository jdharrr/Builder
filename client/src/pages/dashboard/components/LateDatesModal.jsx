import React, {useState, useRef, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {getLateDatesForExpense, payDueDate, payAllOverdueDatesForExpense} from '../../../api.jsx';
import {getStatus} from '../../../util.jsx';
import {showSuccess, showError} from '../../../utils/toast.js';

export const LateDatesModal = ({expense, handleClose, onPaymentSuccess}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const wrapperRef = useRef(null);

    const [selectedDates, setSelectedDates] = useState([]);
    const [showPaymentDateInput, setShowPaymentDateInput] = useState(false);
    const [paymentDate, setPaymentDate] = useState('');

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
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            } else {
                showError('Failed to fetch late dates');
            }
        },
    });

    // Mutation for paying selected dates
    const paySelectedMutation = useMutation({
        mutationFn: async () => {
            // Pay each selected date with the same payment date
            for (const date of selectedDates) {
                await payDueDate(expense.id, date, paymentDate);
            }
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
                navigate('/login');
            } else {
                showError('Failed to pay selected dates');
            }
        },
    });

    // Mutation for paying all late dates
    const payAllMutation = useMutation({
        mutationFn: () => payAllOverdueDatesForExpense(expense.id),
        onSuccess: () => {
            showSuccess('Successfully paid all late dates');
            qc.invalidateQueries(['lateExpenses']);
            qc.invalidateQueries(['lateDates']);
            onPaymentSuccess?.();
            handleClose();
        },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            } else {
                showError('Failed to pay all dates');
            }
        },
    });

    // Click-outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
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

    // Handle back from payment date input
    const handleBackClick = () => {
        setShowPaymentDateInput(false);
        setPaymentDate('');
    };

    return (
        <div className='modal show d-block create-expense-modal late-dates-modal'>
            <div className='modal-dialog'>
                <div className='modal-content' ref={wrapperRef}>
                    <div className='modal-header'>
                        <div className="late-dates-title">
                            <span className="late-dates-eyebrow">Late dates</span>
                            <div className="late-dates-heading">
                                <h5 className="modal-title">{expense.name}</h5>
                                <span className="late-dates-count">{lateDates.length}</span>
                            </div>
                        </div>
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
                                {lateDates.length === 0 ? (
                                    <p className="modal-empty">No late dates found for this expense.</p>
                                ) : (
                                    <div className="late-dates-list">
                                        {lateDates.map((date, idx) => (
                                            <label key={idx} className="late-date-row">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedDates.includes(date)}
                                                    onChange={(e) => handleCheckboxChange(date, e.target.checked)}
                                                />
                                                <span className="late-date-value">{date}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="late-dates-payment">
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
                        )}
                    </div>
                    <div className='modal-footer'>
                        {!showPaymentDateInput ? (
                            <>
                                <button className="btn btn-secondary" onClick={handleClose}>
                                    Close
                                </button>
                                <button
                                    className="btn btn-warning"
                                    onClick={() => payAllMutation.mutate()}
                                    disabled={lateDates.length === 0 || payAllMutation.isPending}
                                >
                                    {payAllMutation.isPending ? 'Paying...' : 'Pay All'}
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
