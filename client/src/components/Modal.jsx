import React from 'react';

export const Modal = ({children, title, wrapperRef, handleSave, handleClose}) => {
    return (
        <div className='modal show d-block'>
            <div className='modal-dialog'>
                <div className='modal-content' ref={wrapperRef}>
                    <div className='modal-header'>
                        <h5 className="modal-title">{title}</h5>
                    </div>
                    <div className='modal-body'>
                        {children}
                    </div>
                    <div className={'modal-footer'}>
                        <button type="button" className="btn btn-primary" onClick={handleClose}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}