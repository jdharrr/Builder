import React from 'react';
import {FaLock} from "react-icons/fa";

export const EditExpenseTimelineSection = ({
    expense,
    expenseProps,
    fieldErrors,
    onEndDateChange
}) => (
    <section className="expense-form-card">
        <header className="expense-card-header">
            <h6 className="expense-card-title">Timeline</h6>
        </header>
        <div className="expense-card-body">
            <div className="expense-input-grid">
                <div className="expense-input">
                    <label className="form-label expense-label-row">
                        Recurrence
                        <span className="read-only-hint" title="Set on creation." aria-label="Set on creation.">
                            <FaLock size={10} />
                        </span>
                    </label>
                    <input
                        className="form-control read-only-field"
                        type="text"
                        value={expense.recurrenceRate
                            ? expense.recurrenceRate.charAt(0).toUpperCase() + expense.recurrenceRate.slice(1)
                            : 'Once'}
                        readOnly={true}
                    />
                </div>
                <div className="expense-input">
                    <label className="form-label expense-label-row">
                        Start Date
                        <span className="read-only-hint" title="Set on creation." aria-label="Set on creation.">
                            <FaLock size={10} />
                        </span>
                    </label>
                    <input
                        className="form-control read-only-field"
                        type="text"
                        value={expense.startDate ? expense.startDate.substring(0, 10) : ''}
                        readOnly={true}
                    />
                </div>
                {expense.recurrenceRate !== 'once' && (
                    <div className="expense-input">
                        <label className={'form-label'}>End Date</label>
                        <input
                            className={`form-control${fieldErrors.endDate ? ' is-invalid' : ''}`}
                            type='date'
                            value={expenseProps.endDate || ""}
                            onChange={onEndDateChange}
                        />
                    </div>
                )}
            </div>
        </div>
    </section>
);
