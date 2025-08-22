import React, {useContext, useEffect, useRef} from 'react';

import {UserContext} from "../providers/user/userContext.jsx";

import '../css/userModal.css';
import {updateDarkMode} from "../api.jsx";

export const UserModal = ({handleClose}) => {
    const { user, setUser } = useContext(UserContext);

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

    const handleDarkModeChange = async (isChecked) => {
        setUser((prevUser) => ({
            ...prevUser,
            setting: {
                ...prevUser.setting,
                dark_mode: isChecked
            }
        }))

        try {
            await updateDarkMode(isChecked);
        } catch {
            setUser(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    dark_mode: !isChecked,
                },
            }));
        }
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
                                        <div>
                                            {`Username: ${user.username}`}
                                        </div>
                                        <div>
                                            {`Email: ${user.email}`}
                                        </div>
                                        <div>
                                            {`User Created: ${user.created_at.substring(0, 10)}`}
                                        </div>
                                        <div>
                                            {`User Last Updated: ${user.updated_at.substring(0,10)}`}
                                        </div>
                                    </div>
                                    <div className="tab-pane" id={'settings-tab-content'} role={'tabpanel'}>
                                        <div className={'form-check form-switch'}>
                                            <input className={'form-check-input'} type='checkbox' role={'switch'} checked={!!user?.settings?.dark_mode} onChange={(e) => handleDarkModeChange(e.target.checked)}/>
                                            <label className="form-check-label">
                                                Dark Mode
                                            </label>
                                        </div>
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