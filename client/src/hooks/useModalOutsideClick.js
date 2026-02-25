import {useEffect} from 'react';

export const useModalOutsideClick = (
    wrapperRef,
    onClose,
    { ignoreSelectors = [], disabled = false } = {}
) => {
    useEffect(() => {
        if (disabled) {
            return;
        }

        const selectors = ['.Toastify', ...ignoreSelectors];

        const handleClickOutside = (event) => {
            if (selectors.some((selector) => event.target.closest(selector))) {
                return;
            }

            if (!wrapperRef?.current) {
                return;
            }

            if (wrapperRef.current.contains(event.target)) {
                return;
            }

            const modalElement = event.target.closest('.modal');
            if (modalElement && !modalElement.contains(wrapperRef.current)) {
                return;
            }

            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef, onClose, disabled, ignoreSelectors]);
};
