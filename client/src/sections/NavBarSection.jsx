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
            <nav className="navBarSection navbar sticky-top">
                <a className="navbar-brand navBrand" href="/dashboard">Budget & Expenses</a>

                <div className="navItemGroup ms-auto align-items-center">
                    <div className={'navItem'}>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                isActive ? "nav-link-item active" : "nav-link-item"
                            }
                        >
                            Dashboard
                        </NavLink>
                    </div>
                    <div className={'navItem'}>
                        <NavLink
                            to="/expenses"
                            className={({ isActive }) =>
                                isActive ? "nav-link-item active" : "nav-link-item"
                            }
                        >
                            Expenses
                        </NavLink>
                    </div>
                    <div className={'navItem'}>
                        <NavLink
                            to="/totals"
                            className={({ isActive }) =>
                                isActive ? "nav-link-item active" : "nav-link-item"
                            }
                        >
                            Totals
                        </NavLink>
                    </div>
                    <div
                         className="navUserButton"
                         onClick={() => setShowUserModal(true)}
                    >
                        <FaUser size={20} />
                    </div>
                </div>
            </nav>

            {showUserModal && <UserModal handleClose={handleUserModalClose} />}
        </>
    );
}
