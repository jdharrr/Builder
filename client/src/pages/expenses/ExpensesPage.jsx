import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useQueryClient, useSuspenseQuery} from "@tanstack/react-query";

import {ExpensesTableSection} from "./sections/ExpensesTableSection.jsx";
import {
    categoryBatchUpdate,
    getAllExpenses,
    getExpenseSortOptions,
    getExpenseTableBatchActions
} from "../../api.jsx";
import {getStatus} from "../../util.jsx";
import {Card} from "../../components/Card.jsx";
import {Dropdown} from "../../components/Dropdown.jsx";

import './css/expensesPage.css';
import {UpdateCategoryModal} from "./components/UpdateCategoryModal.jsx";

export default function ExpensesPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [sortOptions, setSortOptions] = useState([]);
    const [selectedSort, setSelectedSort] = useState('CreatedDate');
    const [sortDirection, setSortDirection] = useState('asc');
    const [enableSearch, setEnableSearch] = useState(false);
    const [searchFilter, setSearchFilter] = useState({
        searchColumn: '',
        searchValue: '',
    });
    const [showInactiveExpenses, setShowInactiveExpenses] = useState(false);
    const [selectActive, setSelectActive] = useState(false);
    const [batchActions, setBatchActions] = useState([]);
    const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const { data: expenses = [] } = useSuspenseQuery({
        queryKey: ['allExpenses', selectedSort, sortDirection, searchFilter, showInactiveExpenses],
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

    const handleEnableSearchChange = (e) => {
        setEnableSearch(e.target.checked);
        if (!e.target.checked) {
            setSearchFilter({
                searchColumn: '',
                searchValue: '',
            });
        }
    }

    const handleBatchAction = (e, action) => {
        if (!selectedIds || selectedIds.length === 0) {
            alert("Please select at least one expense");
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
            alert("Successfully updated category");
        } catch (err) {
            if (getStatus(err) === 401) {
                navigate('/login');
            }
        }

        setShowUpdateCategoryModal(false);
        setSelectedIds([]);
        await qc.refetchQueries({ queryKey: ['allExpenses']});
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
                        <label className="form-check-label me-5">
                            Select
                        </label>
                        <input className="form-check-input" type="checkbox" onChange={() => setSelectActive((prev) => !prev)} />
                    </div>
                    <div className="form-check form-switch d-flex align-items-center">
                        <label className="form-check-label me-5">
                            Show Inactive
                        </label>
                        <input className="form-check-input" type="checkbox" onChange={() => setShowInactiveExpenses((prev) => !prev)} />
                    </div>
                    <div className="form-check form-switch d-flex align-items-center">
                        <label className="form-check-label me-5">
                            Search
                        </label>
                        <input className="form-check-input" type="checkbox" onChange={(e) => handleEnableSearchChange(e)} />
                    </div>
                </div>
                <ExpensesTableSection
                    expenses={expenses}
                    setSortDirection={setSortDirection}
                    setSelectedSort={setSelectedSort}
                    setSearchFilter={setSearchFilter}
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