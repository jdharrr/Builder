import React, {useRef} from 'react';
import {useModalOutsideClick} from "../hooks/useModalOutsideClick.js";

export const Modal = ({
    children,
    title,
    handleSave = () => {},
    handleClose,
    className = '',
    saveLabel = 'Save',
    showSave = true,
    showClose = true,
    showFooter = true,
    footerContent = null,
    headerContent = null,
    saveDisabled = false,
    bodyClassName = '',
    disableOutsideClick = false,
    ignoreOutsideClickSelectors = [],
    onContentMouseDown
}) => {
    const modalClassName = `modal show d-block ${className}`.trim();
    const wrapperRef = useRef(null);

    useModalOutsideClick(wrapperRef, handleClose, {
        disabled: disableOutsideClick,
        ignoreSelectors: ignoreOutsideClickSelectors
    });

    return (
        <div className={modalClassName}>
            <div className='modal-dialog'>
                <div className='modal-content' ref={wrapperRef} onMouseDown={onContentMouseDown}>
                    {headerContent ? (
                        <div className='modal-header'>
                            {headerContent}
                        </div>
                    ) : (
                        <div className='modal-header'>
                            <h5 className="modal-title">{title}</h5>
                            {showClose && (
                                <button
                                    type="button"
                                    className="modal-close-button"
                                    onClick={handleClose}
                                    aria-label="Close"
                                >
                                    x
                                </button>
                            )}
                        </div>
                    )}
                    <div className={`modal-body${bodyClassName ? ` ${bodyClassName}` : ''}`}>
                        {children}
                    </div>
                    {showFooter && (
                        <div className={'modal-footer'}>
                            {footerContent ?? (
                                <>
                                    {showClose && (
                                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                            Close
                                        </button>
                                    )}
                                    {showSave && (
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handleSave}
                                            disabled={saveDisabled}
                                        >
                                            {saveLabel}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
