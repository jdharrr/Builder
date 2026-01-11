import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";

import {Modal} from '../../../components/Modal.jsx';
import {Dropdown} from '../../../components/Dropdown.jsx';
import {getStatus} from "../../../util.jsx";
import {createExpenseCategory, getAllExpenseCategories} from "../../../api.jsx";
import {NewCategoryInput} from "../../../components/NewCategoryInput.jsx";
import {FaPlus} from "react-icons/fa";
import {showSuccess, showError} from "../../../utils/toast.js";

export const UpdateCategoryModal = ({handleSave, setShowUpdateCategoryModal}) => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [refreshCategories, setRefreshCategories] = useState(false);
    const [showCreateCategoryInput, setShowCreateCategoryInput] = useState(false);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowUpdateCategoryModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowUpdateCategoryModal]);

    useEffect(() => {
        async function loadCategories() {
            try {
                const result = await getAllExpenseCategories();
                console.log(result);
                setCategories(result);
            } catch (err) {
                if (getStatus(err) === 401) {
                    navigate('/login');
                }
            }
        }

        loadCategories();
    }, [navigate, refreshCategories])

    const handleCategorySelect = (e, name) => {
        setSelectedCategory(name);
    }

    const handleCategorySave = async () => {
        handleSave(selectedCategory);
    }

    const handleNewCategorySave = async (categoryName) => {
        try {
            await createExpenseCategory(categoryName);
            showSuccess("Category created!");
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            } else {
                showError('Failed to create category.');
            }
        }

        setRefreshCategories((prevState) => !prevState);
        setShowCreateCategoryInput(false);
        setSelectedCategory(categoryName);
    }

    const handleNewCategoryClose = () => {
        setShowCreateCategoryInput(false);
    }

    return (
        <Modal title={"Select a new category"} wrapperRef={wrapperRef} handleSave={handleCategorySave} handleClose={() => setShowUpdateCategoryModal(false)}>
            <div className="d-flex flex-column">
                <div className="d-flex">
                    <Dropdown title={"Select a category"} options={categories.map(({ id, name }) => [id, name])} handleOptionChange={handleCategorySelect} changeTitleOnOptionChange={true} />
                    <button className={'border-0 bg-white'} type='button' onClick={() => setShowCreateCategoryInput(true)}>
                        <FaPlus size={16} color={'#0d6efd'}/>
                    </button>
                </div>
                {showCreateCategoryInput &&
                    <NewCategoryInput handleSave={handleNewCategorySave} handleClose={handleNewCategoryClose} />
                }
            </div>
        </Modal>
    );
}