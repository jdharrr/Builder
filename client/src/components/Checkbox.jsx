/**
 * @deprecated This component is no longer used and will be removed in a future update.
 * Use inline checkboxes with the standardized patterns instead:
 * - Pattern A: Yes/no questions with labels on the LEFT
 * - Pattern B: Toggle switches with labels on the RIGHT
 * - Pattern C: Selection checkboxes with no labels
 */
import React from 'react';

export const Checkbox = ({label, handleCheckboxClick, isChecked, itemId}) => {
    return (
        <>
            {label !== undefined && <label>{label}</label>}
            <div className="form-check pt-2">
                <input className="form-check-input" type="checkbox" checked={isChecked}
                       onChange={(e) => handleCheckboxClick(e.target.checked, itemId)}
                />
            </div>
        </>
    );
}