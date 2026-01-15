import React, {useEffect, useState, memo} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {
    deleteExpense,
    getExpenseSearchableColumns,
    getPaymentsForExpense,
    updateExpenseActiveStatus,
    payDueDate,
    updateExpense,
    getAllExpenses,
    deletePayments
} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {ExpensePaymentInputModal} from "../../../components/ExpensePaymentInputModal.jsx";

import '../css/expensesTableSection.css';
import {SelectFromListModal} from "../components/SelectFromListModal.jsx";
import {EditExpenseModal} from "../components/EditExpenseModal.jsx";
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
export const ExpensesTableSection = ({selectedSort, setSelectedSort, enableSearch, showInactiveExpenses, selectActive, selectedIds, setSelectedIds}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [viewSelectExpensesForActionModal, setViewSelectExpensesForActionModal] = useState({isShowing: false, payments: []});
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
        onError: (error) => {
            if (getStatus(error) === 401) {
                queueMicrotask(() => navigate('/login', { replace: true }));
            }
        },
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
        onError: (error) => {
            if (getStatus(error) === 401) {
                navigate('/login');
            }
        },
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
                    await updateExpenseActiveStatus(true, expenseId);
                    await qc.refetchQueries({ queryKey: ['allExpenses']});
                    break;
                case 'Inactive':
                    await updateExpenseActiveStatus(false, expenseId);
                    await qc.refetchQueries({ queryKey: ['allExpenses']});
                    break;
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
                case 'Edit':
                    const expenseToEdit = expenses.find(e => e.id === expenseId);
                    setViewEditExpenseModal({ isShowing: true, expense: expenseToEdit });
                    break;
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
            const paymentsForExpense = await getPaymentsForExpense(expenseId);
            setViewSelectExpensesForActionModal({isShowing: true, payments: paymentsForExpense});
        }
    }

    const handleExpenseSelectSave = async (selectedIds) => {
        try {
            // Delete all selected payments
            await deletePayments(selectedIds);

            showSuccess(`Successfully deleted ${selectedIds.length} payment(s)!`);
            setViewSelectExpensesForActionModal({isShowing: false, payments: []});
            await qc.refetchQueries({ queryKey: ['lateDates']});
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            } else {
                showError('Failed to delete payment(s)');
            }
        }
    }

    const handleEditExpenseSave = async (expenseId, expenseData) => {
        try {
            await updateExpense(expenseId, expenseData);
            showSuccess('Expense updated successfully!');
            setViewEditExpenseModal({ isShowing: false, expense: null });
            await qc.refetchQueries({ queryKey: ['tableExpenses'] });
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            } else {
                showError('Failed to update expense');
            }
        }
    };

    const handleDateInputSave = async (paymentDate, dueDatePaid) => {
        const expense = viewDateInputModal.expense;
        try {
            await payDueDate(expense.id, dueDatePaid, paymentDate);
            showSuccess('Payment saved!');
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            } else {
                showError('Failed to save payment');
            }
        }
        setViewDateInputModal({isShowing: true, expense: null});
        await qc.refetchQueries({ queryKey: ['allExpenses']});
    }

    const handleSelectChange = (checked, id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }

    return (
        <div>
            <div className={"table-responsive"} style={{ maxWidth: '100%' }}>
                <table className="table table-striped table-bordered" style={{cursor: "default", tableLayout: "fixed", width: "100%"}}>
                    <thead style={{cursor: 'pointer'}} >
                    <tr>
                        {selectActive && <th key={"select"} scope={'col'}></th>}
                        {showInactiveExpenses && <th key={'active'} scope={'col'} onClick={() => handleHeaderClick('active')}>Active</th>}
                        {Object.entries(searchableHeaders).map(([column, label], idx) => (
                            <th className={"text-center"} key={idx} scope="col" onClick={() => handleHeaderClick(column)}>{label}</th>
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
                    <tbody className="table-group-divider" >
                    {expenses.map((exp, idx) => (
                        <tr key={idx}>
                            {selectActive &&
                                <td>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedIds.includes(exp.id)}
                                        onChange={(e) => handleSelectChange(e.target.checked, exp.id)}
                                    />
                                </td>
                            }
                            {showInactiveExpenses && <td className={'text-nowrap text-center'}>{exp.active ? "Yes" : "No"}</td>}
                            <td className={'text-nowrap'}>{exp.createdAt}</td>
                            <td className={'text-nowrap'}>{exp.updatedAt}</td>
                            <td>{exp.categoryName}</td>
                            <td className={"text-truncate"}>{exp.name}</td>
                            <td>${exp.cost}</td>
                            <td className={'text-nowrap'}>{exp.nextDueDate}</td>
                            <td>{exp.recurrenceRate.charAt(0).toUpperCase() + exp.recurrenceRate.slice(1).toLowerCase()}</td>
                            <td className={'text-nowrap'}>{exp.startDate}</td>
                            <td className={'text-nowrap'}>{exp.endDate ? exp.endDate : ''}</td>
                            <td>
                                <div className="dropdown">
                                    <a className="btn btn-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"
                                       onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           setClickedActionRowId(exp.id)
                                       }}
                                    >
                                        Actions
                                    </a>

                                    <ul className={`dropdown-menu ${clickedActionRowId === exp.id ? "show" : ""}`} >
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

            {viewSelectExpensesForActionModal.isShowing && viewSelectExpensesForActionModal.payments &&
                <SelectFromListModal
                    handleSave={handleExpenseSelectSave}
                    handleClose={() => setViewSelectExpensesForActionModal({isShowing: false, payments: []})}
                    title={'Select an expense to mark as unpaid'}
                    list={viewSelectExpensesForActionModal.payments}
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
                navigate('/login');
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