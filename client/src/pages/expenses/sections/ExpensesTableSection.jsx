import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {
    deleteExpense,
    getExpenseSortOptions,
    getExpenseTableBatchActions,
    getExpenseTableFilterOptions,
    getExpenseSearchableColumns,
    updateExpenseActiveStatus,
    payDueDates,
    updateExpense,
    getAllExpenses,
    deletePayments
} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {ExpensePaymentInputModal} from "../../../components/ExpensePaymentInputModal.jsx";
import {Dropdown} from "../../../components/Dropdown.jsx";
import {DateRangeFilterInput} from "../components/filters/DateRangeFilterInput.jsx";
import {NumberRangeFilterInput} from "../components/filters/NumberRangeFilterInput.jsx";
import {TextFilterInput} from "../components/filters/TextFilterInput.jsx";

import '../css/expensesTableSection.css';
import {UnpayDatesModal} from "../components/UnpayDatesModal.jsx";
import {EditExpenseModal} from "../../../components/EditExpenseModal.jsx";
import {showSuccess, showWarning, showError} from "../../../utils/toast.js";
import {FaSearch} from "react-icons/fa";

//TODO: Fix exception handling on 401 after token expires
// Currently it causes the components to error out

// Search row extracted for readability
const SearchRow = ({
    searchableHeaders,
    selectActive,
    showInactiveExpenses,
    searchFilter,
    handleSearchInput,
    handleSearchApply
}) => (
    <tr>
        {selectActive && <th></th>}
        {showInactiveExpenses && <th></th>}
        {Object.entries(searchableHeaders).map(([column], idx) => (
            <th key={idx}>
                <div className="table-search-input-wrap">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={searchFilter.searchColumn === column ? searchFilter.searchValue : ''}
                        placeholder="Search..."
                        onChange={(e) => handleSearchInput(e, column)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearchApply(column);
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="table-search-apply-button"
                        onClick={() => handleSearchApply(column)}
                        aria-label={`Search ${column}`}
                    >
                        <FaSearch size={11} />
                    </button>
                </div>
            </th>
        ))}
    </tr>
);
export const ExpensesTableSection = ({
    enableSearch,
    setEnableSearch,
    showInactiveExpenses,
    setShowInactiveExpenses,
    selectActive,
    setSelectActive,
    selectedIds,
    setSelectedIds,
    onRequestCategoryUpdate
}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [selectedSort, setSelectedSort] = useState('CreatedDate');
    const [pageSize, setPageSize] = useState(10);
    const [viewUnpayDatesModal, setViewUnpayDatesModal] = useState({isShowing: false, expenseId: null});
    const [viewDateInputModal, setViewDateInputModal] = useState({isShowing: false, expense: {}});
    const [viewEditExpenseModal, setViewEditExpenseModal] = useState({isShowing: false, expense: null});

    const [sortDirection, setSortDirection] = useState('asc');
    const [searchFilter, setSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const [appliedSearchFilter, setAppliedSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });

    const [clickedActionRowId, setClickedActionRowId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [filterValues, setFilterValues] = useState({});
    const filterMenuRef = useRef(null);

    const { data: filterOptionsResponse } = useSuspenseQuery({
        queryKey: ['expenseFilterOptions'],
        queryFn: async () => {
            return await getExpenseTableFilterOptions();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const filterOptions = filterOptionsResponse?.filterOptions ?? [];

    const mappedFilters = useMemo(() => {
        return selectedFilters
            .map((filterName) => {
                const selectedOption = filterOptions.find((option) => option.filter === filterName);
                if (!selectedOption) return null;

                const value = filterValues[filterName];
                const filterType = selectedOption.filterType?.toLowerCase();

                if (filterType === 'daterange') {
                    if (!value?.startDate) return null;
                    return {
                        filter: filterName,
                        value1: value.startDate,
                        value2: value.endDate || null,
                    };
                }

                if (filterType === 'numberrange') {
                    if (!value?.min) return null;
                    return {
                        filter: filterName,
                        value1: value.min,
                        value2: value.max || null,
                    };
                }

                if (!value) return null;
                return {
                    filter: filterName,
                    value1: value,
                    value2: null,
                };
            })
            .filter(Boolean);
    }, [selectedFilters, filterOptions, filterValues]);

    useEffect(() => {
        if (!clickedActionRowId) return;

        const handleClickOutside = (event) => {
            if (event.target.closest('.cell-actions')) {
                return;
            }
            setClickedActionRowId(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [clickedActionRowId]);

    useEffect(() => {
        if (!filterMenuOpen) return;

        const handleClickOutside = (event) => {
            if (filterMenuRef.current?.contains(event.target)) {
                return;
            }
            setFilterMenuOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [filterMenuOpen]);

    const {data: searchableHeaders = []} = useSuspenseQuery({
        queryKey: ['expenseTableHeaders'],
        queryFn: async () => {
            return await getExpenseSearchableColumns();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
    });

    const { data: sortOptions = [] } = useSuspenseQuery({
        queryKey: ['expenseSortOptions'],
        queryFn: async () => {
            return await getExpenseSortOptions();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: batchActions = [] } = useSuspenseQuery({
        queryKey: ['expenseBatchActions'],
        queryFn: async () => {
            return await getExpenseTableBatchActions();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: expenses = [] } = useSuspenseQuery({
        queryKey: ['tableExpenses', selectedSort, sortDirection, appliedSearchFilter, showInactiveExpenses, mappedFilters],
        queryFn: async () => {
            return (enableSearch
                    ? await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses, appliedSearchFilter, mappedFilters)
                    : await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses, undefined, mappedFilters))
                ?? [];
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
    });

    useEffect(() => {
        if (selectActive) {
            setSelectedIds([]);
        }
    }, [selectActive, setSelectedIds])

    useEffect(() => {
        if (!enableSearch) {
            setSearchFilter({
                searchColumn: '',
                searchValue: '',
            });
            setAppliedSearchFilter({
                searchColumn: '',
                searchValue: '',
            });
        }
    }, [enableSearch]);

    const handleHeaderClick = (column) => {
        setSelectedSort(column);

        setSortDirection((prevState) => {
            return prevState === 'asc' ? 'desc' : 'asc';
        });
    }

    const handleSearchInput = (e, col) => {
        e.preventDefault();
        const value = e.target.value;

        setSearchFilter({
            searchValue: value,
            searchColumn: col,
        });
    }

    const handleSearchApply = (column) => {
        const nextValue = searchFilter.searchColumn === column ? searchFilter.searchValue : '';
        setAppliedSearchFilter({
            searchColumn: nextValue ? column : '',
            searchValue: nextValue,
        });
    }

    const deleteExpenseMutation = useDeleteExpense(navigate);
    const handleActionClick = async (e, action, expenseId) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            switch (action) {
                case 'Active':
                case 'Inactive': {
                    const isActive = action === 'Active';
                    if (isActive) {
                        const expense = expenses.find((item) => item.id === expenseId);
                        const today = new Date().toISOString().substring(0, 10);
                        if (expense?.endDate && expense.endDate < today) {
                            showWarning('End date must be today or later before marking this expense active.');
                            return;
                        }
                    }
                    const confirmMessage = isActive
                        ? 'Mark this expense as active?'
                        : 'Mark this expense as inactive?';
                    if (!window.confirm(confirmMessage)) {
                        return;
                    }
                    updateActiveMutation.mutate({ isActive, expenseId });
                    break;
                }
                case 'Pay':
                    handlePaidChangeAction(true, expenseId);
                    break;
                case 'Unpay':
                    handlePaidChangeAction(false, expenseId);
                    break;
                case 'Delete':
                    if (window.confirm("Are you sure you want to delete this expense?")) {
                        deleteExpenseMutation.mutate(expenseId);
                    }
                    break;
                case 'Edit': {
                    const expenseToEdit = expenses.find(e => e.id === expenseId);
                    setViewEditExpenseModal({ isShowing: true, expense: expenseToEdit });
                    break;
                }
                default:
                    showError('Invalid Expense Action');
            }
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            }
        }
    }

    const handlePaidChangeAction = (isPay, expenseId) => {
        const expense = expenses.find((expense) => expense.id === expenseId);
        if (isPay) {
            setViewDateInputModal({isShowing: true, expense: expense});
        } else {
            setViewUnpayDatesModal({isShowing: true, expenseId});
        }
    }

    const handleSortChange = (e, name) => {
        e.preventDefault();
        setSelectedSort(name);
    }

    const handlePageSizeChange = (e, value) => {
        e.preventDefault();
        if (value === 'All') {
            setPageSize('All');
            return;
        }

        const parsed = Number(value);
        setPageSize(Number.isNaN(parsed) ? 10 : parsed);
    }

    const handleBatchAction = (e, action) => {
        if (!selectedIds || selectedIds.length === 0) {
            showWarning("Please select at least one expense");
            return;
        }

        switch (action) {
            case "UpdateCategory":
                onRequestCategoryUpdate?.();
                break;
            default:
                break;
        }
    }

    const handleExpenseSelectSave = async (selectedIds, expenseId, removeFromCreditCard) => {
        deletePaymentsMutation.mutate({ selectedIds, expenseId, removeFromCreditCard });
    }

    const handleEditExpenseSave = async (expenseId, expenseData) => {
        updateExpenseMutation.mutate({ expenseId, expenseData });
    };

    const handleDateInputSave = async (paymentDate, dueDates, creditCardId) => {
        const expense = viewDateInputModal.expense;
        payDueDateMutation.mutate({ expenseId: expense.id, dueDates, paymentDate, creditCardId });
    }

    const handleSelectChange = (checked, id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }

    const handleFilterToggle = (filterId) => {
        setSelectedFilters((prev) => (
            prev.includes(filterId)
                ? prev.filter((id) => id !== filterId)
                : [...prev, filterId]
        ));
    };

    const handleFilterValueChange = (filterId, value) => {
        setFilterValues((prev) => ({
            ...prev,
            [filterId]: value
        }));
    };

    const handleRemoveFilter = (filterId) => {
        setSelectedFilters((prev) => prev.filter((id) => id !== filterId));
        setFilterValues((prev) => {
            const next = {...prev};
            delete next[filterId];
            return next;
        });
    };


    const updateActiveMutation = useMutation({
        mutationFn: ({ isActive, expenseId }) => updateExpenseActiveStatus(isActive, expenseId),
        onSuccess: () => {
            showSuccess("Active status successfully updated!");
            qc.refetchQueries({ queryKey: ['tableExpenses'] });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError("Failed to update active status for expense.");
            }
        }
    });

    const deletePaymentsMutation = useMutation({
        mutationFn: ({ selectedIds, expenseId, removeFromCreditCard }) => deletePayments(selectedIds, expenseId, removeFromCreditCard),
        onSuccess: (_data, variables) => {
            showSuccess(`Successfully deleted ${variables.selectedIds.length} payment(s)!`);
            setViewUnpayDatesModal({isShowing: false, expenseId: null});
            qc.refetchQueries({ queryKey: ['lateDates']});
        },
        onError: (err, variables) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to delete payment(s)');
            }
            if (variables?.expenseId) {
                qc.invalidateQueries({ queryKey: ['paymentsForExpense', variables.expenseId] });
            }
            qc.invalidateQueries({ queryKey: ['tableExpenses'] });
        }
    });

    const updateExpenseMutation = useMutation({
        mutationFn: ({ expenseId, expenseData }) => updateExpense(expenseId, expenseData),
        onSuccess: () => {
            showSuccess('Expense updated successfully!');
            setViewEditExpenseModal({ isShowing: false, expense: null });
            qc.refetchQueries({ queryKey: ['tableExpenses'] });
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to update expense');
            }
        }
    });

    const payDueDateMutation = useMutation({
        mutationFn: ({ expenseId, dueDates, paymentDate, creditCardId }) => payDueDates(expenseId, dueDates, paymentDate, false, creditCardId),
        onSuccess: () => {
            showSuccess('Payment saved!');
            setViewDateInputModal({isShowing: false, expense: null});
            qc.refetchQueries({ queryKey: ['tableExpenses']});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to save payment');
            }
        }
    });

    const pageSizeValue = pageSize === 'All' ? expenses.length : pageSize;
    const totalPages = pageSize === 'All'
        ? 1
        : Math.max(1, Math.ceil(expenses.length / pageSizeValue));

    useEffect(() => {
        if (pageSize === 'All') {
            setCurrentPage(1);
            return;
        }

        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [pageSize, totalPages]);

    const startIndex = pageSize === 'All' ? 0 : (currentPage - 1) * pageSizeValue;
    const endIndex = pageSize === 'All' ? expenses.length : startIndex + pageSizeValue;
    const displayedExpenses = expenses.slice(startIndex, endIndex);
    const selectedFilterOptions = filterOptions.filter((option) => selectedFilters.includes(option.filter));

    return (
        <div>
            <div className="expenses-toolbar">
                <div className="expenses-toolbar-row">
                    <div className="expenses-toolbar-group">
                        <div className="expenses-control">
                            <Dropdown
                                title={"Sort"}
                                options={showInactiveExpenses ? Object.entries(sortOptions) : Object.entries(sortOptions).filter(([name]) => name !== "Active")}
                                handleOptionChange={handleSortChange}
                            />
                        </div>
                        <div className="expenses-control">
                            <Dropdown
                                title={"Rows"}
                                options={Object.entries({10: '10', 25: '25', 50: '50', 100: '100', All: 'All'})}
                                handleOptionChange={handlePageSizeChange}
                                changeTitleOnOptionChange={true}
                            />
                        </div>
                        { selectActive &&
                            <div className="expenses-control">
                                <Dropdown
                                    title={"Batch Actions"}
                                    options={Object.entries(batchActions)}
                                    handleOptionChange={handleBatchAction}
                                />
                            </div>
                        }
                        <div className="expenses-control expenses-filter" ref={filterMenuRef}>
                            <button
                                type="button"
                                className={`btn dropdown-toggle border-dark-subtle expenses-filter-button${filterMenuOpen ? ' expenses-filter-button--active' : ''}`}
                                onClick={() => setFilterMenuOpen((prev) => !prev)}
                            >
                                Filters{selectedFilters.length ? ` (${selectedFilters.length})` : ''}
                            </button>
                            {filterMenuOpen && (
                                <div className="expenses-filter-menu">
                                    <div className="expenses-filter-options">
                                        {filterOptions.map((option) => (
                                            <label className="expenses-filter-option" key={option.filter}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedFilters.includes(option.filter)}
                                                    onChange={() => handleFilterToggle(option.filter)}
                                                />
                                                <span>{option.displayText}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="expenses-toolbar-toggles">
                        <label className="expenses-toggle" htmlFor="selectToggle">
                            <input className="form-check-input" type="checkbox" role="switch" id="selectToggle" onChange={() => setSelectActive((prev) => !prev)} />
                            <span>Select</span>
                        </label>
                        <label className="expenses-toggle" htmlFor="showInactiveToggle">
                            <input className="form-check-input" type="checkbox" role="switch" id="showInactiveToggle" onChange={() => setShowInactiveExpenses((prev) => !prev)} />
                            <span>Show Inactive</span>
                        </label>
                        <label className="expenses-toggle" htmlFor="searchToggle">
                            <input className="form-check-input" type="checkbox" role="switch" id="searchToggle" onChange={() => setEnableSearch((prevState) => (!prevState))} />
                            <span>Search</span>
                        </label>
                    </div>
                </div>
                {selectedFilterOptions.length > 0 && (
                    <div className="expenses-filter-inputs">
                        {selectedFilterOptions.map((option) => {
                            const filterType = option.filterType?.toLowerCase();
                            const onChange = (value) => handleFilterValueChange(option.filter, value);

                            if (filterType === 'daterange') {
                                return (
                                    <DateRangeFilterInput
                                        key={option.filter}
                                        label={option.displayText}
                                        onChange={onChange}
                                        onRemove={() => handleRemoveFilter(option.filter)}
                                    />
                                );
                            }

                            if (filterType === 'numberrange') {
                                return (
                                    <NumberRangeFilterInput
                                        key={option.filter}
                                        label={option.displayText}
                                        onChange={onChange}
                                        onRemove={() => handleRemoveFilter(option.filter)}
                                    />
                                );
                            }

                            return (
                                <TextFilterInput
                                    key={option.filter}
                                    label={option.displayText}
                                    onChange={onChange}
                                    onRemove={() => handleRemoveFilter(option.filter)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="expenses-table-wrap">
                <table className="table expenses-table" style={{cursor: "default", tableLayout: "fixed", width: "100%"}}>
                    <thead className="expenses-table-head">
                    <tr>
                        {selectActive && <th key={"select"} scope={'col'}></th>}
                        {showInactiveExpenses && <th key={'active'} scope={'col'} className="expenses-sortable" onClick={() => handleHeaderClick('active')}>Active</th>}
                        {Object.entries(searchableHeaders).map(([column, label], idx) => (
                            <th className={"text-center expenses-sortable"} key={idx} scope="col" onClick={() => handleHeaderClick(column)}>{label}</th>
                        ))}
                        <th key='actions' scope="col"></th>
                    </tr>
                    {enableSearch &&
                        <SearchRow
                            searchableHeaders={searchableHeaders}
                            selectActive={selectActive}
                            showInactiveExpenses={showInactiveExpenses}
                            searchFilter={searchFilter}
                            handleSearchInput={handleSearchInput}
                            handleSearchApply={handleSearchApply}
                        />
                    }
                    </thead>
                    <tbody className="expenses-table-body" >
                    {displayedExpenses.length === 0 ? (
                        <tr className="expenses-table-row">
                            <td
                                className="text-center cell"
                                colSpan={Object.keys(searchableHeaders).length + (selectActive ? 1 : 0) + (showInactiveExpenses ? 1 : 0) + 1}
                            >
                                No expenses found.
                            </td>
                        </tr>
                    ) : displayedExpenses.map((exp, idx) => (
                        <tr key={idx} className="expenses-table-row">
                            {selectActive &&
                                <td className="cell cell-select">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedIds.includes(exp.id)}
                                        onChange={(e) => handleSelectChange(e.target.checked, exp.id)}
                                    />
                                </td>
                            }
                            {showInactiveExpenses && <td className={'text-nowrap text-center cell cell-status'}>{exp.active ? "Yes" : "No"}</td>}
                            <td className={'text-nowrap text-center cell cell-date'}>{exp.createdAt}</td>
                            <td className={'text-nowrap text-center cell cell-date'}>{exp.updatedAt}</td>
                            <td className="cell cell-category text-center">
                                <span className="category-pill">{exp.categoryName || 'Uncategorized'}</span>
                            </td>
                            <td className={"text-truncate text-center cell cell-name"}>{exp.name}</td>
                            <td className="cell cell-amount text-center">${Number(exp.cost).toFixed(2)}</td>
                            <td className={'text-nowrap text-center cell cell-date'}>{exp.nextDueDate}</td>
                            <td className="cell cell-recurrence text-center">
                                <span className="recurrence-pill">
                                    {exp.recurrenceRate.charAt(0).toUpperCase() + exp.recurrenceRate.slice(1).toLowerCase()}
                                </span>
                            </td>
                            <td className={'text-nowrap text-center cell cell-date'}>{exp.startDate}</td>
                            <td className={'text-nowrap text-center cell cell-date'}>{exp.endDate ? exp.endDate : ''}</td>
                            <td className="cell cell-actions">
                                <div className="dropdown">
                                    <button
                                        type="button"
                                        className={`actions-button dropdown-toggle${clickedActionRowId === exp.id ? ' actions-button--active' : ''}`}
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                       onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           setClickedActionRowId(exp.id)
                                       }}
                                    >
                                        Actions
                                    </button>

                                    <ul className={`dropdown-menu ${clickedActionRowId === exp.id ? "show" : ""} actions-menu`} >
                                        {Object.entries(exp.tableActions).map(([action, label], idx) => (
                                            <li key={idx}><a className="dropdown-item" href="#" onClick={(e) => handleActionClick(e, action, exp.id)}>{label}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {pageSize !== 'All' && expenses.length > pageSizeValue && (
                <div className="expenses-pagination">
                    <button
                        type="button"
                        className="expenses-page-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                        Previous
                    </button>
                    <span className="expenses-page-indicator">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        className="expenses-page-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Next
                    </button>
                </div>
            )}

            {viewUnpayDatesModal.isShowing && viewUnpayDatesModal.expenseId &&
                <UnpayDatesModal
                    expenseId={viewUnpayDatesModal.expenseId}
                    handleSave={handleExpenseSelectSave}
                    handleClose={() => setViewUnpayDatesModal({isShowing: false, expenseId: null})}
                />
            }

            {viewDateInputModal.isShowing && viewDateInputModal.expense &&
                <ExpensePaymentInputModal
                    handleSave={handleDateInputSave}
                    handleClose={() => setViewDateInputModal({isShowing: false, expenses: {}})}
                    expense={viewDateInputModal.expense}
                />
            }

            {viewEditExpenseModal.isShowing && viewEditExpenseModal.expense &&
                <EditExpenseModal
                    expense={viewEditExpenseModal.expense}
                    handleSave={handleEditExpenseSave}
                    handleClose={() => setViewEditExpenseModal({ isShowing: false, expense: null })}
                />
            }
        </div>
    );
}

const useDeleteExpense = (navigate) => {
    const qc = useQueryClient();
    const queryKey = ['tableExpenses'];

    return useMutation({
        mutationFn: (expenseId) => deleteExpense(expenseId),
        onSuccess: () => {
            showSuccess('Expense deleted.');
        },
        onMutate: async (expenseId) => {
            await qc.cancelQueries({ queryKey: queryKey });

            const previous = qc.getQueriesData({ queryKey: queryKey });

            qc.setQueriesData({ queryKey: queryKey }, (old) => {
                return old ? old.filter(expense => expense.id !== expenseId) : old;
            });

            return { previous };
        },
        onError: (_err, _isChecked, context) => {
            if (getStatus(_err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to delete expense.');
            }

            if (context?.previous?.length) {
                context.previous.forEach(([key, data]) => {
                    qc.setQueryData(key, data);
                });
            }
        },
        onSettled: () => {
            qc.refetchQueries({ queryKey: queryKey });
        },
    });
}
