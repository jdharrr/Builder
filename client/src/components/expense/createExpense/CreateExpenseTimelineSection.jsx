import React from 'react';
import {Dropdown} from "../../Dropdown.jsx";
import {MONTHS} from "../../../constants/dateConstants.js";

export const CreateExpenseTimelineSection = ({
    expenseProps,
    fieldErrors,
    recurrenceRates,
    includeStartDateInput,
    isOnce,
    isMonthly,
    endOfMonthStartDate,
    years,
    onRecurrenceRateChange,
    onMonthChange,
    onYearChange,
    onStartDateChange,
    onEndDateChange,
    onToggleDueLastDayOfMonth,
    onToggleDueLastDayOfMonthWithReset
}) => (
    <section className="expense-form-card">
        <header className="expense-card-header">
            <h6 className="expense-card-title">Timeline</h6>
        </header>
        <div className="expense-card-body">
            <div className="expense-input-grid">
                <div className="expense-input">
                    <label className={'form-label'}>Recurrence Rate</label>
                    <select
                        className={'form-select'}
                        value={expenseProps.recurrenceRate}
                        onChange={(e) => onRecurrenceRateChange(e.target.value)}
                    >
                        {recurrenceRates.map((rate) => (
                            <option value={rate} key={rate}>{rate}</option>
                        ))}
                    </select>

                    {!includeStartDateInput
                    && isMonthly
                    && expenseProps.startDate?.substring(8,10)
                        === new Date(
                            new Date(expenseProps.startDate).getFullYear(),
                            new Date(expenseProps.startDate).getMonth() + 1,
                            0
                        ).getDate()
                    && (
                        <div className="expense-toggle-row">
                            <label className={'form-label'} htmlFor="dueEndOfMonth1">
                                Due on the last day of the month?
                            </label>
                            <input
                                className={'form-check-input'}
                                type={'checkbox'}
                                id="dueEndOfMonth1"
                                checked={expenseProps.dueLastDayOfMonth}
                                onChange={onToggleDueLastDayOfMonth}
                            />
                        </div>
                    )}
                </div>

                {includeStartDateInput && (
                    <div className="expense-input">
                        {expenseProps.dueLastDayOfMonth ? (
                            <>
                                <label className={'form-label'}>
                                    {isOnce ? 'Due Date' : 'Start Date'}
                                </label>
                                <div className="expense-dropdown-row">
                                    <Dropdown
                                        title={endOfMonthStartDate.month}
                                        options={MONTHS}
                                        handleOptionChange={onMonthChange}
                                        maxHeight={'20rem'}
                                        includeScrollbarY={true}
                                    />
                                    <Dropdown
                                        title={endOfMonthStartDate.year}
                                        options={years}
                                        handleYearChange={onYearChange}
                                        maxHeight={'20rem'}
                                        includeScrollbarY={true}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <label className={'form-label'}>
                                    {isOnce ? 'Due Date' : 'Start Date'}
                                </label>
                                <input
                                    className={`form-control${fieldErrors.startDate ? ' is-invalid' : ''}`}
                                    type='date'
                                    disabled={expenseProps.dueLastDayOfMonth}
                                    value={expenseProps.startDate || ""}
                                    onChange={onStartDateChange}
                                />
                            </>
                        )}
                    </div>
                )}

                {!isOnce && (
                    <div className="expense-input">
                        <label className={'form-label'}>End Date</label>
                        <input
                            className={`form-control${fieldErrors.endDate ? ' is-invalid' : ''}`}
                            type='date'
                            value={expenseProps.endDate || ''}
                            onChange={onEndDateChange}
                        />
                    </div>
                )}
            </div>

            {includeStartDateInput && isMonthly && (
                <div className="expense-toggle-row">
                    <label className={'form-label'} htmlFor="dueEndOfMonth2">
                        Due on the last day of the month?
                    </label>
                    <input
                        className={'form-check-input'}
                        type={'checkbox'}
                        id="dueEndOfMonth2"
                        checked={expenseProps.dueLastDayOfMonth}
                        onChange={onToggleDueLastDayOfMonthWithReset}
                    />
                </div>
            )}
        </div>
    </section>
);
