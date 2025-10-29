import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {
    deleteExpense,
    getExpenseSearchableColumns,
    getPaymentsForExpense,
    updateExpenseActiveStatus,
    updateExpensePaidStatus
} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {ExpensePayDateInputModal} from "../components/ExpensePayDateInputModal.jsx";
import {Checkbox} from "../../../components/Checkbox.jsx";

import '../css/expensesTableSection.css';
import {SelectFromListModal} from "../components/SelectFromListModal.jsx";

//TODO: Fix exception handling on 401 after token expires
// Currently it causes the components to error out

// TODO: error middleware (lol eventually) for toast pop up on api errors
export const ExpensesTableSection = ({expenses, setSortDirection, setSelectedSort, setSearchFilter, enableSearch, showInactiveExpenses, selectActive, selectedIds, setSelectedIds}) => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [viewSelectExpensesForActionModal, setViewSelectExpensesForActionModal] = useState({isShowing: false, payments: []});
    const [viewDateInputModal, setViewDateInputModal] = useState({isShowing: false, expense: {}});

    const [activeSearchFilter, setActiveSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });

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

    useEffect(() => {
        if (selectActive) {
            setSelectedIds([]);
        }
    }, [selectActive, setSelectedIds])

    const handleHeaderClick = (column) => {
        setSelectedSort(column);

        setSortDirection((prevState) => {
            return prevState === 'asc' ? 'desc' : 'asc';
        });
    }

    const handleSearchInput = (e, col) => {
        e.preventDefault();
        setActiveSearchFilter({
            searchValue: e.target.value,
            searchColumn: col,
        });
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
                        deleteExpenseMutation.mutate(expenseId);
                    }
                    break;
                case 'Edit':
                    //TODO: Open edit modal
                    break;
                default:
                    alert('Invalid Expense Action');
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

    const handleExpenseSelectSave = () => {

    }

    const handleDateInputSave = async (paymentDate, dueDatePaid) => {
        const expense = viewDateInputModal.expense;
        try {
            await updateExpensePaidStatus(expense.id, true, dueDatePaid, paymentDate);
            alert('Payment saved!');
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
            }

            // TODO: Pop up message if failed due to invalid due date
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
                <table className="table table-striped table-bordered" style={{cursor: "default"}}>
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
                        <tr>
                            {selectActive && <th></th>}
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
                    }
                    </thead>
                    <tbody className="table-group-divider" >
                    {expenses.map((exp, idx) => (
                        <tr key={idx}>
                            {selectActive &&
                                <td>
                                    <Checkbox isChecked={selectedIds.length > 0 && selectedIds.includes(exp.id)} handleCheckboxClick={handleSelectChange} itemId={exp.id} />
                                </td>
                            }
                            {showInactiveExpenses && <td className={'text-nowrap'}>{exp.active}</td>}
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
                <ExpensePayDateInputModal
                    handleSave={handleDateInputSave}
                    setViewDateInputModal={setViewDateInputModal}
                    expense={viewDateInputModal.expense}
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