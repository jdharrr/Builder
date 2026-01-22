import React, {useEffect, useRef, useState} from 'react';
import {useQuery} from "@tanstack/react-query";

import {Modal} from '../../../components/Modal.jsx';
import {Dropdown} from '../../../components/Dropdown.jsx';
import {getStatus} from "../../../util.jsx";
import {getAllExpenseCategories} from "../../../api.jsx";
import '../../../css/createExpenseForm.css';

export const UpdateCategoryModal = ({handleSave, setShowUpdateCategoryModal, handleManageCategories, isManageCategoriesOpen = false}) => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isManageCategoriesOpen) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowUpdateCategoryModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowUpdateCategoryModal, isManageCategoriesOpen]);

    const { data: categories = [] } = useQuery({
        queryKey: ['expenseCategories'],
        queryFn: async () => {
            return await getAllExpenseCategories();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;
            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const handleCategorySelect = (e, name) => {
        setSelectedCategory(name);
    }

    const handleCategorySave = async () => {
        handleSave(selectedCategory);
    }


    return (
        <Modal
            title={"Update Category"}
            wrapperRef={wrapperRef}
            handleSave={handleCategorySave}
            handleClose={() => setShowUpdateCategoryModal(false)}
            className="create-expense-modal update-category-modal"
        >
            <div className="update-category-body">
                <div className="update-category-card">
                    <span className="update-category-label">Select Category</span>
                    <p className="update-category-subtext">Choose the category you want to apply to all selected expenses.</p>
                    <div className="update-category-row">
                        <Dropdown
                            title={"Select a category"}
                            options={categories.map(({ id, name }) => [id, name])}
                            handleOptionChange={handleCategorySelect}
                            changeTitleOnOptionChange={true}
                        />
                        <button className={'manageCategoriesButton'} type='button' onClick={handleManageCategories}>
                            Manage
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
