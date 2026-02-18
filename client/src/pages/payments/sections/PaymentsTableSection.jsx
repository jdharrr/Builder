import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {FaSearch} from "react-icons/fa";

import {Dropdown} from "../../../components/Dropdown.jsx";
import {deletePayments, getAllPayments, getPaymentSearchableColumns, getPaymentSortOptions, getPaymentTableFilterOptions} from "../../../api.jsx";
import {getStatus} from "../../../util.jsx";
import {DateRangeFilterInput} from "../../expenses/components/filters/DateRangeFilterInput.jsx";
import {NumberRangeFilterInput} from "../../expenses/components/filters/NumberRangeFilterInput.jsx";
import {TextFilterInput} from "../../expenses/components/filters/TextFilterInput.jsx";

import '../css/paymentsTableSection.css';

// Search row extracted for readability
const SearchRow = ({ searchableHeaders, searchFilter, handleSearchInput, handleSearchApply, showSkipped }) => (
    <tr>
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
        {showSkipped && <th></th>}
        <th></th>
    </tr>
);

export const PaymentsTableSection = () => {
    const qc = useQueryClient();
    const [selectedSort, setSelectedSort] = useState('');
    const [sortDirection, setSortDirection] = useState('desc');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showSkipped, setShowSkipped] = useState(false);
    const [enableSearch, setEnableSearch] = useState(false);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [filterValues, setFilterValues] = useState({});
    const [searchFilter, setSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const [appliedSearchFilter, setAppliedSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const [clickedActionRowId, setClickedActionRowId] = useState(null);
    const filterMenuRef = useRef(null);

    const {data: searchableHeaders = {}} = useSuspenseQuery({
        queryKey: ['paymentTableHeaders'],
        queryFn: async () => {
            return await getPaymentSearchableColumns();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 },
    });

    const { data: sortOptions = {} } = useSuspenseQuery({
        queryKey: ['paymentSortOptions'],
        queryFn: async () => {
            return await getPaymentSortOptions();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const { data: filterOptionsResponse } = useSuspenseQuery({
        queryKey: ['paymentFilterOptions'],
        queryFn: async () => {
            return await getPaymentTableFilterOptions();
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

    const filterOptions = filterOptionsResponse?.filterOptions ?? [];

    useEffect(() => {
        const sortKeys = Object.keys(sortOptions);
        if (!selectedSort && sortKeys.length > 0) {
            setSelectedSort(sortKeys[0]);
        }
    }, [selectedSort, sortOptions]);

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

    const { data: payments = [] } = useSuspenseQuery({
        queryKey: ['tablePayments', selectedSort, sortDirection, appliedSearchFilter, showSkipped, mappedFilters],
        queryFn: async () => {
            if (!selectedSort) {
                return [];
            }
            return (enableSearch
                ? await getAllPayments(selectedSort, sortDirection, showSkipped, appliedSearchFilter, mappedFilters)
                : await getAllPayments(selectedSort, sortDirection, showSkipped, undefined, mappedFilters));
        },
        staleTime: 60_000,
        retry: (failureCount, error) => {
            if (getStatus(error) === 401) return false;

            return failureCount < 2;
        },
        throwOnError: (error) => { return getStatus(error) !== 401 }
    });

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

    useEffect(() => {
        if (pageSize === 'All') {
            setCurrentPage(1);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [pageSize, payments.length]);

    const handleSortChange = (e, name) => {
        e.preventDefault();
        setSelectedSort(name);
    };

    const handleHeaderClick = (column) => {
        setSelectedSort(column);
        setSortDirection((prevState) => prevState === 'asc' ? 'desc' : 'asc');
    };

    const handlePageSizeChange = (e, value) => {
        e.preventDefault();
        if (value === 'All') {
            setPageSize('All');
            return;
        }

        const parsed = Number(value);
        setPageSize(Number.isNaN(parsed) ? 10 : parsed);
    };

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

    const deletePaymentsMutation = useMutation({
        mutationFn: ({ selectedIds, expenseId, removeFromCreditCard }) => deletePayments(selectedIds, expenseId, removeFromCreditCard),
        onSuccess: () => {
            setClickedActionRowId(null);
            qc.invalidateQueries({ queryKey: ['tablePayments'] });
        },
        onError: () => {
            qc.invalidateQueries({ queryKey: ['tablePayments'] });
        }
    });

    const handleActionClick = (e, action, payment) => {
        e.stopPropagation();
        e.preventDefault();

        switch (action) {
            case 'DeletePayment': {
                if (!window.confirm("Are you sure you want to delete this payment?")) {
                    return;
                }
                const hasCreditCard = payment?.creditCardId || payment?.creditCard;
                const removeFromCreditCard = hasCreditCard
                    ? window.confirm("Remove the cost from the credit card balance as well?")
                    : false;
                deletePaymentsMutation.mutate({
                    selectedIds: [payment.id],
                    expenseId: payment.expenseId,
                    removeFromCreditCard
                });
                break;
            }
            default:
                break;
        }
    };

    const paymentColumnValues = {
        PaymentDate: (payment) => payment.paymentDate,
        DueDate: (payment) => payment.dueDatePaid,
        Category: (payment) => (
            <span className="category-pill">
                {payment.categoryName || payment.category || 'Uncategorized'}
            </span>
        ),
        RecurrenceRate: (payment) => (
            <span className="recurrence-pill">
                {payment.recurrenceRate
                    ? payment.recurrenceRate.charAt(0).toUpperCase() + payment.recurrenceRate.slice(1).toLowerCase()
                    : ''}
            </span>
        ),
        ExpenseName: (payment) => payment.expenseName,
        Amount: (payment) => `$${Number(payment.cost).toFixed(2)}`,
        CreditCard: (payment) => payment.creditCard || '',
    };

    const paymentColumnClasses = {
        PaymentDate: 'text-nowrap text-center cell cell-date',
        DueDate: 'text-nowrap text-center cell cell-date',
        Category: 'cell cell-category text-center',
        RecurrenceRate: 'cell cell-recurrence text-center',
        ExpenseName: 'text-truncate text-center cell cell-name',
        Amount: 'cell cell-amount text-center',
        CreditCard: 'text-nowrap text-center cell cell-date',
    };

    const pageSizeValue = pageSize === 'All' ? payments.length : pageSize;
    const totalPages = pageSize === 'All'
        ? 1
        : Math.max(1, Math.ceil(payments.length / pageSizeValue));

    const startIndex = pageSize === 'All' ? 0 : (currentPage - 1) * pageSizeValue;
    const endIndex = pageSize === 'All' ? payments.length : startIndex + pageSizeValue;
    const displayedPayments = payments.slice(startIndex, endIndex);
    const selectedFilterOptions = filterOptions.filter((option) => selectedFilters.includes(option.filter));

    const extraHeaderCount = showSkipped ? 2 : 1;

    return (
        <div>
            <div className="payments-toolbar">
                <div className="payments-toolbar-row">
                    <div className="payments-toolbar-group">
                        <div className="payments-control">
                            <Dropdown
                                title={"Sort"}
                                options={Object.entries(sortOptions)}
                                handleOptionChange={handleSortChange}
                            />
                        </div>
                        <div className="payments-control">
                            <Dropdown
                                title={"Rows"}
                                options={Object.entries({10: '10', 25: '25', 50: '50', 100: '100', All: 'All'})}
                                handleOptionChange={handlePageSizeChange}
                                changeTitleOnOptionChange={true}
                            />
                        </div>
                        <div className="payments-control payments-filter" ref={filterMenuRef}>
                            <button
                                type="button"
                                className={`btn dropdown-toggle border-dark-subtle payments-filter-button${filterMenuOpen ? ' payments-filter-button--active' : ''}`}
                                onClick={() => setFilterMenuOpen((prev) => !prev)}
                            >
                                Filters{selectedFilters.length ? ` (${selectedFilters.length})` : ''}
                            </button>
                            {filterMenuOpen && (
                                <div className="payments-filter-menu">
                                    <div className="payments-filter-options">
                                        {filterOptions.map((option) => (
                                            <label className="payments-filter-option" key={option.filter}>
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
                    <div className="payments-toolbar-toggles">
                        <label className="payments-toggle" htmlFor="paymentSearchToggle">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="paymentSearchToggle"
                                onChange={() => setEnableSearch((prevState) => (!prevState))}
                            />
                            <span>Search</span>
                        </label>
                        <label className="payments-toggle" htmlFor="showSkippedToggle">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="showSkippedToggle"
                                onChange={() => setShowSkipped((prev) => !prev)}
                            />
                            <span>Show Skipped</span>
                        </label>
                    </div>
                </div>
                {selectedFilterOptions.length > 0 && (
                    <div className="payments-filter-inputs">
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
            <div className="payments-table-wrap">
                <table className="table payments-table" style={{cursor: "default", tableLayout: "fixed", width: "100%"}}>
                    <thead className="payments-table-head">
                    <tr>
                        {Object.entries(searchableHeaders).map(([column, label], idx) => (
                            <th className={"text-center payments-sortable"} key={idx} scope="col" onClick={() => handleHeaderClick(column)}>{label}</th>
                        ))}
                        {showSkipped && <th className="text-center" scope="col">Skipped</th>}
                        <th className="text-center" scope="col"></th>
                    </tr>
                    {enableSearch &&
                        <SearchRow
                            searchableHeaders={searchableHeaders}
                            searchFilter={searchFilter}
                            handleSearchInput={handleSearchInput}
                            handleSearchApply={handleSearchApply}
                            showSkipped={showSkipped}
                        />
                    }
                    </thead>
                    <tbody className="payments-table-body">
                    {displayedPayments.length === 0 ? (
                        <tr className="payments-table-row">
                            <td className="text-center cell" colSpan={Object.keys(searchableHeaders).length + extraHeaderCount}>
                                No payments found.
                            </td>
                        </tr>
                    ) : displayedPayments.map((payment) => (
                        <tr key={payment.id} className="payments-table-row">
                            {Object.keys(searchableHeaders).map((column) => (
                                <td key={column} className={paymentColumnClasses[column] ?? 'text-nowrap text-center cell cell-date'}>
                                    {paymentColumnValues[column]?.(payment) ?? ''}
                                </td>
                            ))}
                            {showSkipped && (
                                <td className={'text-nowrap text-center cell cell-status'}>{payment.skipped ? 'Yes' : 'No'}</td>
                            )}
                            <td className="cell cell-actions">
                                <div className="dropdown">
                                    <button
                                        type="button"
                                        className={`actions-button dropdown-toggle${clickedActionRowId === payment.id ? ' actions-button--active' : ''}`}
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setClickedActionRowId(payment.id);
                                        }}
                                    >
                                        Actions
                                    </button>
                                    <ul className={`dropdown-menu ${clickedActionRowId === payment.id ? "show" : ""} actions-menu`}>
                                        {Object.entries(payment.tableActions ?? {}).map(([action, label], idx) => (
                                            <li key={idx}>
                                                <a
                                                    className="dropdown-item"
                                                    href="#"
                                                    onClick={(e) => handleActionClick(e, action, payment)}
                                                >
                                                    {label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {pageSize !== 'All' && payments.length > pageSizeValue && (
                <div className="payments-pagination">
                    <button
                        type="button"
                        className="payments-page-button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                        Previous
                    </button>
                    <span className="payments-page-indicator">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        className="payments-page-button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
