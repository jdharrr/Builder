import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";

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
import {showSuccess, showWarning, showError} from "../../utils/toast.js";

export default function ExpensesPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [sortOptions, setSortOptions] = useState([]);
    const [selectedSort, setSelectedSort] = useState('CreatedDate');
    const [enableSearch, setEnableSearch] = useState(false);
    const [showInactiveExpenses, setShowInactiveExpenses] = useState(false);
    const [selectActive, setSelectActive] = useState(false);
    const [batchActions, setBatchActions] = useState([]);
    const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        async function loadSortOptions() {
            try {
                const options = await getExpenseSortOptions();
                setSortOptions(options);
            } catch(e) {
                if (e.response.status === 401) {
                    navigate('/login');
                }
            }
        }

        loadSortOptions();
    }, [navigate])

    useEffect(() => {
        async function loadBatchActions() {
            try {
                const result =  await getExpenseTableBatchActions();
                setBatchActions(result);
            } catch (err) {
                if (getStatus(err) === 401) {
                    navigate('/login');
                }
            }
        }

        loadBatchActions()
    }, [navigate])

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

        try {
            await categoryBatchUpdate(selectedIds, category);
            showSuccess("Successfully updated category");
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            } else {
                showError("Failed to update category");
            }
        }

        setShowUpdateCategoryModal(false);
        setSelectedIds([]);
        await qc.refetchQueries({ queryKey: ['tableExpenses']});
    }

    return (
        <div className="expenses-page">
            <div className="expenses-hero">
                <div className="expenses-hero-title">
                    <span className="expenses-eyebrow">Expenses</span>
                    <h1 className="expenses-title">Expense Table</h1>
                    <p className="expenses-subtitle">Track, sort, and batch-edit your expenses without losing context.</p>
                </div>
                <div className="expenses-hero-stats">
                    <div className="expenses-stat">
                        <span className="expenses-stat-label">Selected</span>
                        <span className="expenses-stat-value">{selectedIds.length}</span>
                    </div>
                </div>
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
                />
                {showUpdateCategoryModal && <UpdateCategoryModal setShowUpdateCategoryModal={setShowUpdateCategoryModal} handleSave={handleCategoryUpdateSave} />}
            </Card>
        </div>
    );
}
