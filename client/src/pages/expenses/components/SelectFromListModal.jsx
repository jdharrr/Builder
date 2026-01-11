import React, {useEffect, useRef, useState} from 'react';

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
                                    <div key={idx} className={'d-flex align-items-center'}>
                                        <div className="list-group-item border-0 p-2 flex-grow-1">
                                            <div><strong>Due Date:</strong> {item.dueDatePaid}</div>
                                            <div><strong>Paid on:</strong> {item.paymentDate}</div>
                                        </div>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={(e) => handleCheckboxClick(e.target.checked, item.id)}
                                        />
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