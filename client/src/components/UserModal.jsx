import React, {useEffect, useRef} from 'react';
import Cookies from "js-cookie";

import '../css/userModal.css';
import {fetchUser, updateDarkMode} from "../api.jsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";
import {getStatus} from "../util.jsx";
import {showSuccess, showError} from "../utils/toast.js";

export const UserModal = ({handleClose}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data: user = {}, isLoading } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            return await fetchUser();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClose]);

    const toggleDarkMode = useToggleDarkMode(navigate);
    const handleDarkModeChange = (isChecked) => {
        toggleDarkMode.mutate(isChecked);
    }
    const hasUserProfileData = Boolean(user?.username && user?.email);

    const handleLogout = () => {
        Cookies.remove('access_token');
        qc.clear();
        handleClose();
        showSuccess('Logged out.');
        window.location.assign('/login');
    };

    return (
        <div className="modal show d-block user-modal app-modal">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <div className="user-modal-title">
                            <span className="user-modal-eyebrow">Profile</span>
                            <h5 className="modal-title">User Settings</h5>
                        </div>
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            x
                        </button>
                    </div>
                    <div className="userModalBody modal-body">
                        <div className="user-modal-tabs">
                            <div className="tab-pills user-modal-pills" role="tablist">
                                <button
                                    className="tab-pill active"
                                    id={'general-tab'}
                                    type={'button'}
                                    data-bs-target={'#general-tab-content'}
                                    role={'tab'}
                                    data-bs-toggle={'tab'}
                                >
                                    General
                                </button>
                                <button
                                    className="tab-pill"
                                    id={'settings-tab'}
                                    type={'button'}
                                    data-bs-target={'#settings-tab-content'}
                                    role={'tab'}
                                    data-bs-toggle={'tab'}
                                >
                                    Settings
                                </button>
                            </div>
                        </div>

                        <div className={'tab-content user-modal-content'} >
                            <div className="tab-pane show active" id={'general-tab-content'} role={'tabpanel'}>
                                { !isLoading && hasUserProfileData ?
                                    (
                                        <div className={'user-modal-list'}>
                                            <div className={'user-modal-row'}>
                                                <span className="user-modal-label">Username</span>
                                                <span className="user-modal-value">{user.username}</span>
                                            </div >
                                            <div className={'user-modal-row'}>
                                                <span className="user-modal-label">Email</span>
                                                <span className="user-modal-value">{user.email}</span>
                                            </div>
                                            <div className={'user-modal-row'}>
                                                <span className="user-modal-label">Created</span>
                                                <span className="user-modal-value">{user.createdAt ? user.createdAt.substring(0, 10) : '—'}</span>
                                            </div>
                                            <div className={'user-modal-row'}>
                                                <span className="user-modal-label">Last Updated</span>
                                                <span className="user-modal-value">{user.updatedAt ? user.updatedAt.substring(0,10) : '—'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={'user-modal-list'}>
                                            {['Username', 'Email', 'Created', 'Last Updated'].map((label, idx) => (
                                                <div className={'user-modal-row placeholder-glow'} key={idx}>
                                                    <span className="placeholder col-7" />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }
                            </div>
                            <div className="tab-pane" id={'settings-tab-content'} role={'tabpanel'}>
                                { !isLoading && user?.settings ?
                                    (
                                        <div className={'user-modal-setting'}>
                                            <span className="user-modal-label">Dark Mode</span>
                                            <label className="user-modal-switch">
                                                <input
                                                    className={'form-check-input'}
                                                    type='checkbox'
                                                    role={'switch'}
                                                    checked={user.settings.darkMode}
                                                    onChange={(e) => handleDarkModeChange(e.target.checked)}
                                                />
                                                <span className="user-modal-switch-track" />
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-8" />
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const useToggleDarkMode = (navigate) => {
    const qc = useQueryClient();
    const queryKey = ['user'];

    return useMutation({
        mutationFn: (isChecked) => updateDarkMode(isChecked),
        onMutate: async (isChecked) => {
            await qc.cancelQueries({ queryKey: queryKey });

            const previous = qc.getQueryData(queryKey);

            qc.setQueryData(queryKey, (old) =>
                old
                    ? {
                        ...old,
                        settings: {
                            ...old.settings,
                            darkMode: isChecked,
                        }
                    }
                    : old
            );
            return { previous };
        },
        onError: (_err, _isChecked, context) => {
            if (getStatus(_err) === 401) {
                navigate('/login');
            } else {
                showError('Failed to update settings.');
            }

            if (context?.previous) {
                qc.setQueryData(queryKey, context.previous);
            }
        },
        onSuccess: () => {
            showSuccess('Settings updated.');
        },
        onSettled: () => {
            qc.refetchQueries({ queryKey: queryKey });
        },
    });
}
