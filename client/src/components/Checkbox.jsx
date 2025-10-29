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