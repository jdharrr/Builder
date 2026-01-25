import React, {useEffect, useRef, useState} from 'react';

import {Modal} from '../../../components/Modal.jsx';
import {CategorySelect} from "../../../components/CategorySelect.jsx";
import '../../../css/createExpenseForm.css';

export const UpdateCategoryModal = ({handleSave, setShowUpdateCategoryModal}) => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (document.querySelector('.manage-categories-modal')) {
                return;
            }
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowUpdateCategoryModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowUpdateCategoryModal]);

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
                    <CategorySelect
                        label={null}
                        includeNoneOption={false}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
}
