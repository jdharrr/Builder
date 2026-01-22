import React, {useEffect, useState, memo} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {
    deleteExpense,
    getExpenseSearchableColumns,
    updateExpenseActiveStatus,
    payDueDates,
    updateExpense,
    getAllExpenses,
    deletePayments
} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {ExpensePaymentInputModal} from "../../../components/ExpensePaymentInputModal.jsx";

import '../css/expensesTableSection.css';
import {UnpayDatesModal} from "../components/UnpayDatesModal.jsx";
import {EditExpenseModal} from "../../../components/EditExpenseModal.jsx";
import {showSuccess, showError} from "../../../utils/toast.js";
import {useDebounce} from "../../../hooks/useDebounce.js";

//TODO: Fix exception handling on 401 after token expires
// Currently it causes the components to error out

// Memoized search row component to prevent re-renders when table data changes
const SearchRow = memo(({
    searchableHeaders,
    selectActive,
    showInactiveExpenses,
    activeSearchFilter,
    handleSearchInput,
    handleSearchSubmit,
    handleSearchFocus
}) => (
    <tr>
        {selectActive && <th></th>}
        {showInactiveExpenses && <th></th>}
        {Object.entries(searchableHeaders).map(([column], idx) => (
            <th key={idx}>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={activeSearchFilter.searchColumn === column ? activeSearchFilter.searchValue : ''}
                    placeholder="Search..."
                    onChange={(e) => handleSearchInput(e, column)}
                    onKeyDown={(e) => handleSearchSubmit(e)}
                    onFocus={() => handleSearchFocus(column)}
                />
            </th>
        ))}
    </tr>
));
export const ExpensesTableSection = ({selectedSort, setSelectedSort, enableSearch, showInactiveExpenses, selectActive, selectedIds, setSelectedIds, pageSize = 10}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [viewUnpayDatesModal, setViewUnpayDatesModal] = useState({isShowing: false, expenseId: null});
    const [viewDateInputModal, setViewDateInputModal] = useState({isShowing: false, expense: {}});
    const [viewEditExpenseModal, setViewEditExpenseModal] = useState({isShowing: false, expense: null});

    const [sortDirection, setSortDirection] = useState('asc');
    const [searchFilter, setSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const [activeSearchFilter, setActiveSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const debouncedSearchFilter = useDebounce(activeSearchFilter, 500);

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

    const { data: expenses = [] } = useSuspenseQuery({
        queryKey: ['tableExpenses', selectedSort, sortDirection, searchFilter, showInactiveExpenses],
        queryFn: async () => {
            return (enableSearch ? await getAllExpenses(selectedSort, sortDirection, showInactiveExpenses, searchFilter)
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
        if (enableSearch && debouncedSearchFilter.searchValue) {
            setSearchFilter(debouncedSearchFilter);
        }
    }, [debouncedSearchFilter, enableSearch, setSearchFilter]);

    useEffect(() => {
        if (!enableSearch) {
            setSearchFilter({
                searchColumn: '',
                searchValue: '',
            });
            setActiveSearchFilter({
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

        setActiveSearchFilter({
            searchValue: value,
            searchColumn: col,
        });

        // Instantly clear if empty
        if (value === '') {
            setSearchFilter({ searchColumn: '', searchValue: '' });
        }
    }

    const handleSearchSubmit = (e) => {
        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();
        setSearchFilter({
            searchColumn: activeSearchFilter.searchColumn,
            searchValue: activeSearchFilter.searchValue,
        });
    }

    const handleSearchFocus = (col) => {
        if (col !== activeSearchFilter.searchColumn) {
            setActiveSearchFilter({ searchColumn: col, searchValue: '' });
        }
    };

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
                    await handlePaidChangeAction(true, expenseId);
                    break;
                case 'Unpay':
                    await handlePaidChangeAction(false, expenseId);
                    break;
                case 'Delete':
                    if (window.confirm("Are you sure you want to delete this expense?")) {
                        qc.clear();
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

    const handlePaidChangeAction = async (isPay, expenseId) => {
        const expense = expenses.find((expense) => expense.id === expenseId);
        if (isPay) {
            setViewDateInputModal({isShowing: true, expense: expense});
        } else {
            setViewUnpayDatesModal({isShowing: true, expenseId});
        }
    }

    const handleExpenseSelectSave = async (selectedIds) => {
        deletePaymentsMutation.mutate(selectedIds);
    }

    const handleEditExpenseSave = async (expenseId, expenseData) => {
        updateExpenseMutation.mutate({ expenseId, expenseData });
    };

    const handleDateInputSave = async (paymentDate, dueDates) => {
        const expense = viewDateInputModal.expense;
        payDueDateMutation.mutate({ expenseId: expense.id, dueDates, paymentDate });
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
        mutationFn: ({ expenseId, dueDates, paymentDate }) => payDueDates(expenseId, dueDates, paymentDate),
        onSuccess: () => {
            showSuccess('Payment saved!');
            setViewDateInputModal({isShowing: false, expense: null});
            qc.refetchQueries({ queryKey: ['allExpenses']});
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
                            activeSearchFilter={activeSearchFilter}
                            handleSearchInput={handleSearchInput}
                            handleSearchSubmit={handleSearchSubmit}
                            handleSearchFocus={handleSearchFocus}
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
    const queryKey = ['allExpenses'];

    return useMutation({
        mutationFn: (expenseId) => deleteExpense(expenseId),
        onSuccess: () => {
            showSuccess('Expense deleted.');
        },
        onMutate: async (expenseId) => {
            await qc.cancelQueries({ queryKey: queryKey });

            const previous = qc.getQueryData(queryKey);

            qc.setQueryData(queryKey, (old) => {
                return old ? old.filter(expense => expense.id !== expenseId)
                           : old;
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

            if (context?.previous) {
                qc.setQueryData(queryKey, context.previous);
            }
        },
        onSettled: () => {
            qc.refetchQueries({ queryKey: queryKey });
        },
    });
}
