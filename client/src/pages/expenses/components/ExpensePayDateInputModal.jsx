import React, {useEffect, useRef, useState} from 'react';

export const ExpensePayDateInputModal = ({handleSave, setViewDateInputModal, expense}) => {
    const [selectedDatePaid, setSelectedDatePaid] = useState(new Date().toISOString().substring(0,10));
    const [selectedDueDatePaid, setSelectedDueDatePaid] = useState(new Date().toISOString().substring(0,10));
    const [invalidDueDate, setInvalidDueDate] = useState(false);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        handleSelectedDueDatePaidChange(selectedDueDatePaid);
    }, [])

    const handleClose = () => {
        setViewDateInputModal({isShowing: false, expense: null});
    }

    const handleSaveClick = () => {
        if (invalidDueDate) {
            alert('Please enter a valid due date');
            return;
        }
        handleSave(selectedDatePaid, selectedDueDatePaid);
    }

    const handleSelectedDueDatePaidChange = (selectedDate) => {
        const selectedYear = Number(selectedDate.substring(0,4));
        const selectedMonth = Number(selectedDate.substring(5,7));
        const selectedDay = Number(selectedDate.substring(8,10));
        const startDateMonth = Number(expense.start_date.substring(5,7));
        const startDateDay = Number(expense.start_date.substring(8,10));
        const oneDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.round((new Date(selectedDate) - new Date(expense.start_date)) / oneDay);
        const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 2, 0).getDate();

        // Verify the due date the user is paying is valid
        if (new Date(selectedDate) <= new Date(expense.start_date)
            && (expense.end_date === null || new Date(selectedDate) >= new Date(expense.end_date))) {
            setInvalidDueDate(true);
            setSelectedDueDatePaid(selectedDate);
            return;
        }

        // TODO: fix this digusting code
        if (expense.recurrence_rate === 'daily') {
                setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrence_rate === 'weekly' && diffDays % 7 === 0) {
            setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrence_rate === 'monthly' && expense.due_end_of_month && selectedDay === daysInSelectedMonth) {
            setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrence_rate === 'monthly' && selectedDay === startDateDay) {
            setSelectedDueDatePaid(selectedDate);
        } else if (expense.recurrence_rate === 'yearly'
                   && selectedMonth === startDateMonth
                   && selectedDay === startDateDay) {
            setSelectedDueDatePaid(selectedDate);
        } else {
            setInvalidDueDate(true);
            setSelectedDueDatePaid(selectedDate);
            return;
        }

        setInvalidDueDate(false);
    }

    return (
        <div className="modal show d-block">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <h5 className="modal-title">Payments started on {expense?.start_date?.substring(0,10)}, recurs {expense.due_end_of_month ? 'at the end of every month' : expense.recurrence_rate}</h5>
                    </div>
                    <div className="modal-body">
                        <form>
                            <label className="form-label">Payment Date</label>
                            <input className={'form-control'} type={'date'} value={selectedDatePaid} onChange={(e) => setSelectedDatePaid(e.target.value)} />
                        </form>
                        {expense.recurrence_rate !== 'once' &&
                            <div>
                                <label className={'form-label mt-1'}>Select a due date to mark as paid</label>
                                <input className={'form-control'} type={'date'} value={selectedDueDatePaid} onChange={(e) => handleSelectedDueDatePaidChange(e.target.value)} />
                                {invalidDueDate &&
                                    <label className={"form-text text-danger"}>Invalid Date</label>
                                }
                            </div>
                        }
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={handleSaveClick}>Save</button>
                        <button type="button" className="btn btn-primary" onClick={handleClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}