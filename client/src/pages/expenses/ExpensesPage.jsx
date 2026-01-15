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
        <div className="d-flex justify-content-center">
            <Card>
                <div className={"d-flex mb-2"}>
                    <Dropdown title={"Sort"} options={showInactiveExpenses ? Object.entries(sortOptions) : Object.entries(sortOptions).filter(([name]) => name !== "Active")} handleOptionChange={handleSortChange} />
                    { selectActive &&
                        <div className={'ms-1'}>
                            <Dropdown title={"Batch Actions"} options={Object.entries(batchActions)} handleOptionChange={handleBatchAction} />
                        </div>
                    }
                    <div className="form-check form-switch d-flex align-items-center ms-auto">
                        <input className="form-check-input" type="checkbox" role="switch" id="selectToggle" onChange={() => setSelectActive((prev) => !prev)} />
                        <label className="form-check-label ms-2" htmlFor="selectToggle">
                            Select
                        </label>
                    </div>
                    <div className="form-check form-switch d-flex align-items-center ms-3">
                        <input className="form-check-input" type="checkbox" role="switch" id="showInactiveToggle" onChange={() => setShowInactiveExpenses((prev) => !prev)} />
                        <label className="form-check-label ms-2" htmlFor="showInactiveToggle">
                            Show Inactive
                        </label>
                    </div>
                    <div className="form-check form-switch d-flex align-items-center ms-3">
                        <input className="form-check-input" type="checkbox" role="switch" id="searchToggle" onChange={() => setEnableSearch((prevState) => (!prevState))} />
                        <label className="form-check-label ms-2" htmlFor="searchToggle">
                            Search
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