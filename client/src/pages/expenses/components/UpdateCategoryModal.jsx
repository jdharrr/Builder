import React, {useState} from 'react';

import {Modal} from '../../../components/Modal.jsx';
import {CategorySelect} from "../../../components/categories/CategorySelect.jsx";
import '../../../css/createExpenseForm.css';

export const UpdateCategoryModal = ({handleSave, setShowUpdateCategoryModal, saveDisabled = false}) => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const handleCategorySave = async () => {
        handleSave(selectedCategory);
    }

    return (
        <Modal
            title={"Update Category"}
            handleSave={handleCategorySave}
            handleClose={() => setShowUpdateCategoryModal(false)}
            className="app-modal update-category-modal"
            saveDisabled={saveDisabled || !selectedCategory}
        >
            <div className="update-category-body">
                <div className="update-category-card">
                    <span className="update-category-label">Select Category</span>
                    <p className="update-category-subtext">Choose the category you want to apply to all selected expenses.</p>
                    <CategorySelect
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
}
