import React, {useEffect, useRef} from 'react';

import '../css/userModal.css';
import {fetchUser, updateDarkMode} from "../api.jsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";
import {getStatus} from "../util.jsx";

export const UserModal = ({handleClose}) => {
    const navigate = useNavigate();

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
        throwOnError: (error) => { return getStatus(error) !== 401 },
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        }
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

    return (
        <div className="modal show d-block">
            <div className="modal-dialog" ref={wrapperRef}>
                <div className={"modal-content"}>
                    <div className="modal-header">
                        <h5 className="modal-title">User Profile</h5>
                    </div>
                    <div className="userModalBody modal-body">
                        <div className="row h-100">
                            <div className="col-3 border-end border-dark-subtle">
                                <ul className={'nav flex-column'}>
                                    <li className={'nav-item'} role={'presentation'}>
                                        <button className="nav-link active" id={'general-tab'} type={'button'}
                                                data-bs-target={'#general-tab-content'} role={'tab'} data-bs-toggle={'tab'}>
                                            General
                                        </button>
                                    </li>
                                    <li className={'nav-item'} role={'presentation'}>
                                        <button className="nav-link" id={'settings-tab'} type={'button'}
                                                data-bs-target={'#settings-tab-content'} role={'tab'} data-bs-toggle={'tab'}>
                                            Settings
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <div className="col-9">
                                <div className={'tab-content'} >
                                    <div className="tab-pane show active" id={'general-tab-content'} role={'tabpanel'}>
                                        { !isLoading ?
                                            (
                                                <div className={'list-group'}>
                                                    <div className={'list-group-item'}>
                                                        {`Username: ${user.username}`}
                                                    </div >
                                                    <div className={'list-group-item'}>
                                                        {`Email: ${user.email}`}
                                                    </div>
                                                    <div className={'list-group-item'}>
                                                        {`Created: ${user.createdAt.substring(0, 10)}`}
                                                    </div>
                                                    <div className={'list-group-item'}>
                                                        {`Last Updated: ${user.updatedAt.substring(0,10)}`}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>Loading...</p>
                                            )
                                        }
                                    </div>
                                    <div className="tab-pane" id={'settings-tab-content'} role={'tabpanel'}>
                                        { !isLoading ?
                                            (
                                                <div className={'form-check form-switch'}>
                                                    <input className={'form-check-input'} type='checkbox' role={'switch'} checked={user.settings.darkMode} onChange={(e) => handleDarkModeChange(e.target.checked)}/>
                                                    <label className="form-check-label">
                                                        Dark Mode
                                                    </label>
                                                </div>
                                            ) : (
                                                <p>Loading...</p>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={handleClose}>Close</button>
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
            }

            if (context?.previous) {
                qc.setQueryData(queryKey, context.previous);
            }
        },
        onSettled: () => {
            qc.refetchQueries({ queryKey: queryKey });
        },
    });
}