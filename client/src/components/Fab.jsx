import React, {useContext, useEffect, useRef, useState} from 'react';
import { FaPlus } from 'react-icons/fa';

import {CreateExpenseModal} from "./CreateExpenseModal.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";
import {ManageCategoriesModal} from "./ManageCategoriesModal.jsx";
import {ManageCreditCardsModal} from "./ManageCreditCardsModal.jsx";

export const Fab = () => {
    const { showCreateExpenseForm, setShowCreateExpenseForm } = useContext(CreateExpenseFormContext);
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [showManageCreditCardsModal, setShowManageCreditCardsModal] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!showFabMenu) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowFabMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFabMenu]);

    const handleCreateExpenseClick = () => {
        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: true,
            isFab: true,
        }));
        setShowFabMenu(false);
    };

    const handleManageCategoriesClick = () => {
        setShowManageCategoriesModal(true);
        setShowFabMenu(false);
    };

    const handleManageCreditCardsClick = () => {
        setShowManageCreditCardsModal(true);
        setShowFabMenu(false);
    };

    return (
        <>
            <div className="fabWrapper" ref={menuRef}>
                <button
                    className="fabButton"
                    onClick={() => setShowFabMenu((prev) => !prev)}
                    aria-expanded={showFabMenu}
                    aria-haspopup="true"
                >
                    <FaPlus size={22} />
                </button>
                {showFabMenu && (
                    <div className="fabMenu">
                        <button type="button" className="fabMenuItem" onClick={handleCreateExpenseClick}>
                            Create Expense
                        </button>
                        <button type="button" className="fabMenuItem" onClick={handleManageCreditCardsClick}>
                            Manage Credit Cards
                        </button>
                        <button type="button" className="fabMenuItem" onClick={handleManageCategoriesClick}>
                            Manage Categories
                        </button>
                    </div>
                )}
            </div>

            { showCreateExpenseForm.isShowing && showCreateExpenseForm.isFab && <CreateExpenseModal includeStartDateInput={true} /> }
            { showManageCategoriesModal && (
                <ManageCategoriesModal handleClose={() => setShowManageCategoriesModal(false)} />
            )}
            { showManageCreditCardsModal && (
                <ManageCreditCardsModal handleClose={() => setShowManageCreditCardsModal(false)} />
            )}
        </>
    );
}
