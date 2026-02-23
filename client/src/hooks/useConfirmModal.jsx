import {useCallback, useState} from 'react';

import {ConfirmModal} from '../components/ConfirmModal.jsx';

export const useConfirmModal = () => {
    const [confirmState, setConfirmState] = useState({
        isShowing: false,
        title: 'Confirm',
        message: '',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        onConfirm: null,
        onCancel: null
    });

    const openConfirm = useCallback((message, onConfirm, options = {}) => {
        setConfirmState({
            isShowing: true,
            title: options.title ?? 'Confirm',
            message,
            confirmLabel: options.confirmLabel ?? 'Yes',
            cancelLabel: options.cancelLabel ?? 'No',
            onConfirm,
            onCancel: options.onCancel ?? null
        });
    }, []);

    const handleCancel = useCallback(() => {
        const cancelAction = confirmState.onCancel;
        setConfirmState((prev) => ({...prev, isShowing: false}));
        if (cancelAction) {
            cancelAction();
        }
    }, [confirmState]);

    const handleClose = useCallback(() => {
        setConfirmState((prev) => ({...prev, isShowing: false}));
    }, []);

    const handleConfirm = useCallback(() => {
        const confirmAction = confirmState.onConfirm;
        setConfirmState((prev) => ({...prev, isShowing: false}));
        if (confirmAction) {
            confirmAction();
        }
    }, [confirmState]);

    const confirmModal = confirmState.isShowing ? (
        <ConfirmModal
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            cancelLabel={confirmState.cancelLabel}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onClose={handleClose}
            className=""
        />
    ) : null;

    return {
        openConfirm,
        confirmModal,
        closeConfirm: handleClose
    };
};
