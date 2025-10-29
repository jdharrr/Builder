import React, {useState} from 'react';
import { FaUser } from 'react-icons/fa';
import {NavLink} from "react-router-dom";
import {UserModal} from "../components/UserModal.jsx";

import '../css/navBar.css';

export const NavBarSection = () => {
    const [showUserModal, setShowUserModal] = useState(false);

    const handleUserModalClose = () => {
        setShowUserModal(false);
    }

    return (
        <>
            <nav className="navBarSection navbar px-4 sticky-top">
                <a className="navbar-brand" href="/dashboard">Budget & Expenses</a>

                <div className="navItemGroup ms-auto align-items-center gap-5">
                    <div className={'navItem px-3'}>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                isActive ? "text-primary fw-bold nav-link" : "nav-link"
                            }
                        >
                            Dashboard
                        </NavLink>
                    </div>
                    <div className={'navItem px-3'}>
                        <NavLink
                            to="/expenses"
                            className={({ isActive }) =>
                                isActive ? "text-primary fw-bold nav-link" : "nav-link"
                            }
                        >
                            Expenses
                        </NavLink>
                    </div>
                    <div className={'navItem px-3'}>
                        <NavLink
                            to="/totals"
                            className={({ isActive }) =>
                                isActive ? "text-primary fw-bold nav-link" : "nav-link"
                            }
                        >
                            Totals
                        </NavLink>
                    </div>
                    <div className="border rounded-circle p-2"
                         style={{ cursor: "pointer" }}
                         onClick={() => setShowUserModal(true)}
                    >
                        <FaUser size={24} />
                    </div>
                </div>
            </nav>

            {showUserModal && <UserModal handleClose={handleUserModalClose} />}
        </>
    );
}