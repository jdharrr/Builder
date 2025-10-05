import React, {useContext, useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";

import {createExpenseCategory, getAllExpenseCategories, postExpense} from "../api.jsx";
import {CreateExpenseFormContext} from "../providers/expenses/CreateExpenseFormContext.jsx";

import '../css/createExpenseForm.css';
import {FaPlus} from "react-icons/fa";
import {getStatus} from "../util.jsx";

export const CreateExpenseForm = ({includeStartDateInput}) => {
    const recurrenceRates = {
        'once': 'Once',
        'daily': 'Daily',
        'weekly': 'Weekly',
        'monthly': 'Monthly',
        'yearly': 'Yearly',
    };

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 51 }, (_, i) => currentYear - 25 + i);

    const navigate = useNavigate();
    const qc = useQueryClient();

    const {showCreateExpenseForm, setShowCreateExpenseForm} = useContext(CreateExpenseFormContext);
    const { date } = showCreateExpenseForm;

    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState('')
    const [showCreateCategorySection, setShowCreateCategorySection] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [refreshCategories, setRefreshCategories] = useState(false);

    const [recurrenceRate, setRecurrenceRate] = useState('once');

    const [endOfMonthStartDate, setEndOfMonthStartDate] = useState({year: (new Date()).getFullYear(), month: months.at((new Date()).getMonth())});

    const [expenseProps, setExpenseProps] = useState({
        name: '',
        cost: 0.0,
        recurrenceRate: 'once',
        categoryId: null,
        description: '',
        startDate: includeStartDateInput ? null : date,
        endDate: null,
        paidOnCreation: false,
        dueLastDayOfMonth: false,
        initialDatePaid: null
    });

    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowCreateExpenseForm((prevState) => ({
                    ...prevState,
                    isShowing: false,
                    date: null,
                    isFab: false,
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowCreateExpenseForm]);
    
    useEffect(() => {
        async function loadCategories() {
            try {
                const categories = await getAllExpenseCategories();
                setCategories(categories ?? []);
            } catch (err) {
                if (getStatus(err) === 401) {
                    navigate('/login')
                }
            }
        }
        
        loadCategories();
    }, [navigate, refreshCategories]);

    const handleSaveForm = async () => {
        let isCreated = false;
        try {
            const payload = {
                ...expenseProps
            };

            if (expenseProps.dueLastDayOfMonth) {
                const monthIndex = months.indexOf(endOfMonthStartDate.month);
                payload.startDate = new Date(endOfMonthStartDate.year, monthIndex + 1, 0).toISOString().substring(0, 10);
            }

            isCreated = await postExpense(payload);
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
                return;
            }
            alert('Error creating expense.');
            return;
        }

        isCreated ? alert('Expense successfully created.'): alert('Failed to create Expense.');
        if (isCreated) {
            // An expense has been added, refresh any stale lists
            handleExpenseRefresh();
            setShowCreateExpenseForm((prevState) => ({
                ...prevState,
                isShowing: false,
                date: null,
                isFab: false
            }));
        }
    }

    const handleCloseForm = () => {
        setShowCreateExpenseForm((prevState) => ({
            ...prevState,
            isShowing: false,
            date: null,
            isFab: false
        }));
    }

    const handleExpenseRefresh = async () => {
        await qc.refetchQueries({ queryKey: ['expenseTrackerExpenses']});
        await qc.refetchQueries({ queryKey: ['upcomingExpenses']});
        await qc.refetchQueries({ queryKey: ['lateExpenses']});
        await qc.refetchQueries({ queryKey: ['allExpenses']});
    }

    const handleAddCategoryClick = () => {
        setShowCreateCategorySection((prevState) => !prevState);
    }

    const handleSaveCategoryClick = async () => {
        if (newCategoryName === '') {
            return;
        }

        try {
            await createExpenseCategory(newCategoryName);
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            }

            alert('Failed to create category.');
        }

        setRefreshCategories((prevState) => !prevState);
        setShowCreateCategorySection((prevState) => !prevState);
        setCategory(newCategoryName);
    }

    const handleCancelAddCategoryClick = () => {
        setShowCreateCategorySection((prevState) => !prevState);
    }

    const handleCategoryChange = (categoryId) => {
        setCategory(categoryId);
        setExpenseProps((prevState) => ({
            ...prevState,
            categoryId: categoryId,
        }));
    }

    const handleRecurrenceRateChange = (rate) => {
        setRecurrenceRate(rate);
        setExpenseProps((prevState) => ({
            ...prevState,
            recurrenceRate: rate,
            endDate: rate === 'once' ? null : prevState.endDate,
            dueLastDayOfMonth: false,
        }));
    }

    return (
        <div>
            <div className='modal show d-block'>
                <div className='modal-dialog'>
                    <div className='modal-content' ref={wrapperRef}>
                        <div className='modal-header'>
                            <h5 className="modal-title">{date === null ? 'Create Expense' : 'Create Expense For ' + date.substring(0,10)}</h5>
                        </div>
                        <div className='modal-body'>
                            <form>
                                <div className='mb-3'>
                                    <label className={'form-label'}>Name</label>
                                    <input className={'form-control'} type='text'
                                           onChange={
                                               (e) => {
                                                   setExpenseProps((prevState) => ({
                                                       ...prevState,
                                                       name: e.target.value
                                                   }));
                                               }
                                           }
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
                                <div className='mb-3'>
                                    <label className={'form-label'}>Recurrence Rate</label>
                                    <select className={'form-select'} value={recurrenceRate} onChange={(e) => handleRecurrenceRateChange(e.target.value)}>
                                        {Object.entries(recurrenceRates).map(([rate, rateLabel]) => (
                                            <option value={rate} key={rateLabel}>{rateLabel}</option>
                                        ))}
                                    </select>

                                    {!includeStartDateInput
                                    && expenseProps.recurrenceRate === 'monthly'
                                    && expenseProps.startDate.substring(8,10) == new Date(new Date(expenseProps.startDate).getFullYear(), new Date(expenseProps.startDate).getMonth() + 1, 0).getDate()
                                    &&
                                        <div className='ms-1'>
                                            <label className={'form-text me-2'}>Due on the last day of the month?</label>
                                            <input className={'form-check-input mt-2'} type={'checkbox'}
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
                                {includeStartDateInput && (
                                    <div className={'mb-3'}>
                                        {expenseProps.dueLastDayOfMonth ? (
                                            <>
                                                <label className={'form-label'}>{expenseProps.recurrenceRate === 'once' ? 'Due Date' : 'Start Date'}</label>
                                                <div className="d-flex gap-2">
                                                    <div className="dropdown">
                                                        <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            {endOfMonthStartDate.month}
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                            {months.map((monthLabel, idx) => (
                                                                <li key={idx}><a className="dropdown-item" href="#"
                                                                    onClick={() => {
                                                                        setEndOfMonthStartDate((prevState) => ({
                                                                            ...prevState,
                                                                            month: monthLabel,
                                                                        }));
                                                                    }}
                                                                >
                                                                    {monthLabel}
                                                                </a></li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="dropdown">
                                                        <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                            {endOfMonthStartDate.year}
                                                        </button>
                                                        <ul className="dropdown-menu"
                                                            style={{
                                                                maxHeight: "200px",
                                                                overflowY: "auto",
                                                            }}
                                                        >
                                                            {years.map((year, idx) => (
                                                                <li key={idx}><a className="dropdown-item" href="#"
                                                                    onClick={() => {
                                                                        setEndOfMonthStartDate((prevState) => ({
                                                                            ...prevState,
                                                                            year: year,
                                                                        }));
                                                                    }}
                                                                >
                                                                    {year}
                                                                </a></li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <label className={'form-label'}>{expenseProps.recurrenceRate === 'once' ? 'Due Date' : 'Start Date'}</label>
                                                <input className={'form-control'} type='date'
                                                       disabled={expenseProps.dueLastDayOfMonth}
                                                       value={expenseProps.startDate || ""}
                                                       onChange={
                                                           (e) => {
                                                               setExpenseProps((prevState) => ({
                                                                   ...prevState,
                                                                   startDate: e.target.value
                                                               }));
                                                           }
                                                       }
                                                />
                                            </>
                                        )}

                                        {expenseProps.recurrenceRate === 'monthly' &&
                                            <div className='ms-1'>
                                                <label className={'form-text me-2'}>Due on the last day of the month?</label>
                                                <input className={'form-check-input mt-2'} type={'checkbox'}
                                                       onChange={() => {
                                                           setExpenseProps((prevState) => ({
                                                               ...prevState,
                                                               startDate: null,
                                                               dueLastDayOfMonth: !prevState.dueLastDayOfMonth
                                                           }));
                                                       }}
                                                />

                                            </div>
                                        }
                                    </div>
                                )}
                                { expenseProps.recurrenceRate !== 'once' &&
                                    <div className='mb-3'>
                                        <label className={'form-label'}>End Date</label>
                                        <input className={'form-control'} type='date'
                                               onChange={
                                                   (e) => {
                                                       setExpenseProps((prevState) => ({
                                                           ...prevState,
                                                           endDate: e.target.value
                                                       }));
                                                   }
                                               }
                                        />
                                    </div>
                                }
                                <div className='mb-3'>
                                    <label className={'form-label'}>Category</label>
                                    <div className={"row d-flex justify-content-center align-items-center me-2"}>
                                        <div className={'col-11'}>
                                            <select className={'form-select'} value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
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
                                    <div className='mb-3'>
                                        <label className={'form-label'}>New Category Name</label>
                                        <div className={"row g-2 d-flex justify-content-center align-items-center me-2"}>
                                            <div className={'col-8'}>
                                                <input className={'form-control'} type='text' onChange={(e) => setNewCategoryName(e.target.value)} />
                                            </div>
                                            <div className={'col-4 p-0 d-flex'}>
                                                <div className={'row ms-auto'}>
                                                    <div className={'col-auto g-0 pe-2'}>
                                                        <button className={'btn btn-primary'} type='button' onClick={handleCancelAddCategoryClick}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <div className={'col-auto g-0'}>
                                                        <button className={'btn btn-primary'} type='button' onClick={handleSaveCategoryClick}>
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                                <div className='mb-3'>
                                <label className={'form-label'}>Description</label>
                                    <textarea className={'form-control'} rows={2}
                                           onChange={
                                               (e) => {
                                                   setExpenseProps((prevState) => ({
                                                       ...prevState,
                                                       description: e.target.value
                                                   }));
                                               }
                                           }
                                    />
                                </div>
                                <div className='mb-3'>
                                    <div className=''>
                                        <label className={'form-label me-2'}>{expenseProps.recurrenceRate === 'once' ? 'Paid?' : 'Initial Payment?'}</label>
                                        <input className={'form-check-input'} type={'checkbox'} checked={expenseProps.paidOnCreation}
                                              onChange={
                                                  () => {
                                                      setExpenseProps((prevState) => ({
                                                          ...prevState,
                                                          paidOnCreation: !prevState.paidOnCreation
                                                      }));
                                                  }
                                              }
                                        />
                                    </div>
                                    {expenseProps.paidOnCreation &&
                                        <div className=''>
                                            <label className={'form-label'}>Payment Date</label>
                                            <input className={'form-control'} type='date'
                                                   onChange={
                                                       (e) => {
                                                           setExpenseProps((prevState) => ({
                                                               ...prevState,
                                                               initialDatePaid: e.target.value
                                                           }));
                                                       }
                                                   }
                                            />
                                        </div>
                                    }
                                </div>
                            </form>
                        </div>
                        <div className={'modal-footer'}>
                            <button type="button" className="btn btn-primary" onClick={handleCloseForm}>Close</button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveForm}>Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}