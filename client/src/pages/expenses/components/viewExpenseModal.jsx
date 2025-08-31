import React, {useEffect, useRef} from 'react';

export const ViewExpenseModal = ({setShowViewExpenseModal}) => {
    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowViewExpenseModal((prevState) => ({
                   ...prevState,
                   isShowing: false,
                   expense: {}
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowViewExpenseModal]);

    const handleClose= () => {
        setShowViewExpenseModal((prevState) => ({
            ...prevState,
            isShowing: false,
            expense: {}
        }));
    }

    return (
        <div className="modal show d-block">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Expense</h5>
                    </div>
                    <div className="modal-body">
                        <div>
                            Expense Details
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={handleClose}>Close</button>
                        <button className="btn btn-primary">Edit</button>
                    </div>
                </div>
            </div>
        </div>
    );
}