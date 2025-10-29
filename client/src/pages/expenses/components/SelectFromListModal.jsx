import React, {useEffect, useRef, useState} from 'react';

import {Checkbox} from "../../../components/Checkbox.jsx";

export const SelectFromListModal = ({list, handleSave, handleClose, title}) => {
    const [selectedIds, setSelectedIds] = useState([]);

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

    const handleSaveClick = () => {
        handleSave(selectedIds);
    }

    const handleCheckboxClick = (checked, id) => {
        if (checked) {
            setSelectedIds((prevState) => [...prevState, id])
        } else {
            setSelectedIds((prev) => prev.filter((existingId) => existingId !== id));
        }
    }

    return (
        <div className="modal show d-block">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                    </div>
                    <div className="modal-body">
                        <div className="upcomingList list-group list-group-flush">
                            {list && list.length > 0 ? (
                                list.map((item, idx) => (
                                    <div key={idx} className={'d-flex'}>
                                        <div className="list-group-item border-0 p-2">
                                            {'Payment Id: ' +  item.id}
                                        </div>
                                        <Checkbox isChecked={selectedIds.includes(item.id)} handleCheckboxClick={handleCheckboxClick} itemId={item.id} />
                                    </div>
                                ))
                            ) : (
                                <p>This expense has no payments.</p>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" disabled={selectedIds.length <= 0} onClick={handleSaveClick}>Save</button>
                        <button type="button" className="btn btn-primary" onClick={handleClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}