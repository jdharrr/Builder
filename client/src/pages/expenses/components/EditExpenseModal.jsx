import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";

import {Modal} from '../../../components/Modal.jsx';
import {getAllExpenseCategories, createExpenseCategory} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {FaPlus} from "react-icons/fa";
import {NewCategoryInput} from "../../../components/NewCategoryInput.jsx";
import {showSuccess, showError} from "../../../utils/toast.js";

export const EditExpenseModal = ({expense, handleSave, handleClose}) => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [refreshCategories, setRefreshCategories] = useState(false);
    const [showCreateCategorySection, setShowCreateCategorySection] = useState(false);

    const [expenseProps, setExpenseProps] = useState({
        name: expense.name || null,
        cost: expense.cost || null,
        categoryId: expense.categoryId || null,
        description: expense.description || '',
        startDate: expense.startDate || null,
        endDate: expense.endDate || null,
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

    useEffect(() => {
        async function loadCategories() {
            try {
                const categories = await getAllExpenseCategories();
                setCategories(categories ?? []);
            } catch (err) {
                if (getStatus(err) === 401) {
                    navigate('/login');
                }
            }
        }

        loadCategories();
    }, [navigate, refreshCategories]);

    const handleSaveForm = () => {
        handleSave(expense.id, expenseProps);
    };

    const handleAddCategoryClick = () => {
        setShowCreateCategorySection((prevState) => !prevState);
    };

    const handleSaveCategoryClick = async (newCategoryName) => {
        try {
            await createExpenseCategory(newCategoryName);
            showSuccess("Category created!");
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            } else {
                showError('Failed to create category.');
            }
        }

        setRefreshCategories((prevState) => !prevState);
        setShowCreateCategorySection(false);
        setExpenseProps((prevState) => ({
            ...prevState,
            categoryId: newCategoryName
        }));
    };

    const handleCancelAddCategoryClick = () => {
        setShowCreateCategorySection(false);
    };

    return (
        <Modal title={'Edit Expense'} wrapperRef={wrapperRef} handleSave={handleSaveForm} handleClose={handleClose}>
            <form>
                <div className='mb-3'>
                    <label className={'form-label'}>Name</label>
                    <input
                        className={'form-control'}
                        type='text'
                        value={expenseProps.name}
                        onChange={(e) => {
                            setExpenseProps((prevState) => ({
                                ...prevState,
                                name: e.target.value
                            }));
                        }}
                    />
                </div>
                <div className='mb-3'>
                    <label className={'form-label'}>Cost</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        onChange={(e) => {
                            setExpenseProps((prev) => ({
                                ...prev,
                                cost: parseFloat(e.target.value || 0).toFixed(2),
                            }));
                        }}
                    />
                </div>
                <div className={'mb-3'}>
                    <label className={'form-label'}>
                        {expenseProps.recurrenceRate === 'once' ? 'Due Date' : 'Start Date'}
                    </label>
                    <input
                        className={'form-control'}
                        type='date'
                        value={expenseProps.startDate || ""}
                        onChange={(e) => {
                            setExpenseProps((prevState) => ({
                                ...prevState,
                                startDate: e.target.value
                            }));
                        }}
                    />
                    {expenseProps.recurrenceRate === 'monthly' &&
                        <div className='ms-1 mt-2'>
                            <label className={'form-label me-2'} htmlFor="dueEndOfMonth">Due on the last day of the month?</label>
                            <input
                                className={'form-check-input'}
                                type={'checkbox'}
                                id="dueEndOfMonth"
                                checked={expenseProps.dueLastDayOfMonth}
                                onChange={() => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        dueLastDayOfMonth: !prevState.dueLastDayOfMonth
                                    }));
                                }}
                            />
                        </div>
                    }
                </div>
                {expenseProps.recurrenceRate !== 'once' &&
                    <div className='mb-3'>
                        <label className={'form-label'}>End Date</label>
                        <input
                            className={'form-control'}
                            type='date'
                            value={expenseProps.endDate || ""}
                            onChange={(e) => {
                                setExpenseProps((prevState) => ({
                                    ...prevState,
                                    endDate: e.target.value
                                }));
                            }}
                        />
                    </div>
                }
                <div className='mb-3'>
                    <label className={'form-label'}>Category</label>
                    <div className={"row d-flex justify-content-center align-items-center me-2"}>
                        <div className={'col-11'}>
                            <select
                                className={'form-select'}
                                value={expenseProps.categoryId || ""}
                                onChange={(e) => {
                                    setExpenseProps((prevState) => ({
                                        ...prevState,
                                        categoryId: e.target.value
                                    }));
                                }}
                            >
                                <option value={""}>No Category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={'col-1'}>
                            <button className={'border-0 bg-white'} type='button' onClick={handleAddCategoryClick}>
                                <FaPlus size={16} color={'#0d6efd'}/>
                            </button>
                        </div>
                    </div>
                </div>
                {showCreateCategorySection &&
                    <NewCategoryInput handleSave={handleSaveCategoryClick} handleClose={handleCancelAddCategoryClick} />
                }
                <div className='mb-3'>
                    <label className={'form-label'}>Description</label>
                    <textarea
                        className={'form-control'}
                        rows={2}
                        value={expenseProps.description}
                        onChange={(e) => {
                            setExpenseProps((prevState) => ({
                                ...prevState,
                                description: e.target.value
                            }));
                        }}
                    />
                </div>
            </form>
        </Modal>
    );
};
