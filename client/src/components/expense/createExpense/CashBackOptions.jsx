import React from 'react';

export const CashBackOptions = ({
    idPrefix,
    ignoreChecked,
    overwriteEnabled,
    overwriteValue,
    overwriteError = false,
    onToggleIgnore,
    onToggleOverwrite,
    onOverwriteChange,
    showLabel = true
}) => (
    <>
        {showLabel && <div className="credit-card-options-label">Cash back options</div>}
        <div className="expense-toggle-row">
            <label className={'form-label'} htmlFor={`${idPrefix}-ignore`}>
                Ignore Cash Back?
            </label>
            <input
                className={'form-check-input'}
                type={'checkbox'}
                id={`${idPrefix}-ignore`}
                checked={ignoreChecked}
                onChange={onToggleIgnore}
            />
        </div>
        <div className="expense-toggle-row">
            <label className={'form-label'} htmlFor={`${idPrefix}-overwrite-toggle`}>
                Cash Back Overwrite?
            </label>
            <input
                className={'form-check-input'}
                type={'checkbox'}
                id={`${idPrefix}-overwrite-toggle`}
                checked={overwriteEnabled}
                onChange={onToggleOverwrite}
            />
        </div>
        {overwriteEnabled && (
            <div className="expense-input">
                <label className={'form-label'}>Cash Back Overwrite percentage</label>
                <input
                    className={`form-control${overwriteError ? ' is-invalid' : ''}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={overwriteValue}
                    onChange={onOverwriteChange}
                />
            </div>
        )}
    </>
);
