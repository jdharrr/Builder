import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {
    deleteExpense,
    getExpenseSortOptions,
    getExpenseTableBatchActions,
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

import '../css/expensesTableSection.css';
import {UnpayDatesModal} from "../components/UnpayDatesModal.jsx";
import {EditExpenseModal} from "../../../components/EditExpenseModal.jsx";
import {showSuccess, showWarning, showError} from "../../../utils/toast.js";
import {useDebounce} from "../../../hooks/useDebounce.js";

//TODO: Fix exception handling on 401 after token expires
// Currently it causes the components to error out

// Search row extracted for readability
const SearchRow = ({
    searchableHeaders,
    selectActive,
    showInactiveExpenses,
    searchFilter,
    handleSearchInput
}) => (
    <tr>
        {selectActive && <th></th>}
        {showInactiveExpenses && <th></th>}
        {Object.entries(searchableHeaders).map(([column], idx) => (
            <th key={idx}>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={searchFilter.searchColumn === column ? searchFilter.searchValue : ''}
                    placeholder="Search..."
                    onChange={(e) => handleSearchInput(e, column)}
                />
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
    const debouncedSearchFilter = useDebounce(searchFilter, 500);

    const [clickedActionRowId, setClickedActionRowId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

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
        queryKey: ['tableExpenses', selectedSort, sortDirection, debouncedSearchFilter, showInactiveExpenses],
        queryFn: async () => {
            return (enableSearch ? await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses, debouncedSearchFilter)
                    : await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses))
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

    // Auto-search after debounce delay
    useEffect(() => {
        if (!enableSearch) {
            setSearchFilter({
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

        // Instantly clear if empty
        if (value === '') {
            setSearchFilter({ searchColumn: '', searchValue: '' });
        }
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

    const handleExpenseSelectSave = async (selectedIds) => {
        deletePaymentsMutation.mutate(selectedIds);
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
        mutationFn: (ids) => deletePayments(ids),
        onSuccess: (_data, ids) => {
            showSuccess(`Successfully deleted ${ids.length} payment(s)!`);
            setViewUnpayDatesModal({isShowing: false, expenseId: null});
            qc.refetchQueries({ queryKey: ['lateDates']});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError('Failed to delete payment(s)');
            }
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

    return (
        <div>
            <div className="expenses-toolbar">
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
                        />
                    }
                    </thead>
                    <tbody className="expenses-table-body" >
                    {displayedExpenses.map((exp, idx) => (
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
                                        className="actions-button dropdown-toggle"
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
