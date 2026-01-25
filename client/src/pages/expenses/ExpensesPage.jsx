import React, {useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useMutation, useQueryClient} from "@tanstack/react-query";

import {ExpensesTableSection} from "./sections/ExpensesTableSection.jsx";
import {categoryBatchUpdate} from "../../api.jsx";
import {getStatus} from "../../util.jsx";
import {Card} from "../../components/Card.jsx";

import './css/expensesPage.css';
import {UpdateCategoryModal} from "./components/UpdateCategoryModal.jsx";
import {showSuccess, showError} from "../../utils/toast.js";

export default function ExpensesPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [enableSearch, setEnableSearch] = useState(false);
    const [showInactiveExpenses, setShowInactiveExpenses] = useState(false);
    const [selectActive, setSelectActive] = useState(false);
    const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

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
                <ExpensesTableSection
                    enableSearch={enableSearch}
                    setEnableSearch={setEnableSearch}
                    showInactiveExpenses={showInactiveExpenses}
                    setShowInactiveExpenses={setShowInactiveExpenses}
                    selectActive={selectActive}
                    setSelectActive={setSelectActive}
                    setSelectedIds={setSelectedIds}
                    selectedIds={selectedIds}
                    onRequestCategoryUpdate={() => setShowUpdateCategoryModal(true)}
                />
                {showUpdateCategoryModal && (
                    <UpdateCategoryModal
                        setShowUpdateCategoryModal={setShowUpdateCategoryModal}
                        handleSave={handleCategoryUpdateSave}
                    />
                )}
            </Card>
        </div>
    );
}
