import React, {useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

import {ExpensesTableSection} from "./sections/ExpensesTableSection.jsx";
import {
    categoryBatchUpdate,
    getExpenseSortOptions,
    getExpenseTableBatchActions
} from "../../api.jsx";
import {getStatus} from "../../util.jsx";
import {Card} from "../../components/Card.jsx";
import {Dropdown} from "../../components/Dropdown.jsx";

import './css/expensesPage.css';
import {UpdateCategoryModal} from "./components/UpdateCategoryModal.jsx";
import {ManageCategoriesModal} from "../../components/ManageCategoriesModal.jsx";
import {showSuccess, showWarning, showError} from "../../utils/toast.js";

export default function ExpensesPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [selectedSort, setSelectedSort] = useState('CreatedDate');
    const [enableSearch, setEnableSearch] = useState(false);
    const [showInactiveExpenses, setShowInactiveExpenses] = useState(false);
    const [selectActive, setSelectActive] = useState(false);
    const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [pageSize, setPageSize] = useState(10);

    const { data: sortOptions = [] } = useQuery({
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

    const { data: batchActions = [] } = useQuery({
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

    const handleSortChange = (e, name) => {
        e.preventDefault();
        setSelectedSort(name);
    }

    const handleBatchAction = (e, action) => {
        if (!selectedIds || selectedIds.length === 0) {
            showWarning("Please select at least one expense");
            return;
        }

        switch (action) {
            case "UpdateCategory":
                setShowUpdateCategoryModal(true);
                break;
            default:
                break;
        }
    }

    const handleCategoryUpdateSave = async (category) => {
        if (!category || !selectedIds) {
            return;
        }
        updateCategoryMutation.mutate(category);
    }

    const updateCategoryMutation = useMutation({
        mutationFn: (category) => categoryBatchUpdate(selectedIds, category),
        onSuccess: () => {
            showSuccess("Successfully updated category");
            setShowUpdateCategoryModal(false);
            setSelectedIds([]);
            qc.refetchQueries({ queryKey: ['tableExpenses']});
        },
        onError: (err) => {
            if (getStatus(err) === 401) {
                showError('Session expired. Please log in again.');
                navigate('/login');
            } else {
                showError("Failed to update category");
            }
        }
    });

    const handlePageSizeChange = (e, value) => {
        e.preventDefault();
        if (value === 'All') {
            setPageSize('All');
            return;
        }

        const parsed = Number(value);
        setPageSize(Number.isNaN(parsed) ? 10 : parsed);
    }

    return (
        <div className="expenses-page">
            <div className="expenses-hero">
                <div className="expenses-hero-title">
                    <span className="expenses-eyebrow">Expenses</span>
                    <h1 className="expenses-title">Expense Table</h1>
                    <p className="expenses-subtitle">Track, sort, and batch-edit your expenses without losing context.</p>
                </div>
                {selectActive && (
                    <div className="expenses-hero-stats">
                        <div className="expenses-stat">
                            <span className="expenses-stat-label">Selected</span>
                            <span className="expenses-stat-value">{selectedIds.length}</span>
                        </div>
                    </div>
                )}
            </div>

            <Card className="expenses-page-card" bodyClassName="expenses-page-body" style={{width: 'min(90rem, 100%)'}}>
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
                <ExpensesTableSection
                    selectedSort={selectedSort}
                    setSelectedSort={setSelectedSort}
                    enableSearch={enableSearch}
                    showInactiveExpenses={showInactiveExpenses}
                    selectActive={selectActive}
                    setSelectedIds={setSelectedIds}
                    selectedIds={selectedIds}
                    pageSize={pageSize}
                />
                {showUpdateCategoryModal && (
                    <UpdateCategoryModal
                        setShowUpdateCategoryModal={setShowUpdateCategoryModal}
                        handleSave={handleCategoryUpdateSave}
                        isManageCategoriesOpen={showManageCategoriesModal}
                        handleManageCategories={() => {
                            setShowUpdateCategoryModal(false);
                            setShowManageCategoriesModal(true);
                        }}
                    />
                )}
                {showManageCategoriesModal && (
                    <ManageCategoriesModal
                        handleClose={() => setShowManageCategoriesModal(false)}
                        onClose={() => setShowUpdateCategoryModal(true)}
                    />
                )}
            </Card>
        </div>
    );
}
