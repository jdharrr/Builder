import React from 'react';

import {ExpensesTableSectionSkeleton} from "../sections/skeletons/ExpenseTableSectionSkeleton.jsx";

import '../css/expensesPage.css';

export default function ExpensesPageSkeleton() {
    return (
        <div className="d-flex justify-content-center align-items-center">
            <div className="expensesCard card text-center m-5">
                <div className="card-body d-flex flex-column">
                    <div className={"d-flex align-items-center mb-2"}>
                        <div className="dropdown text-center me-2">
                            <button className="btn dropdown-toggle border-dark-subtle" type="button"
                                    data-bs-toggle="dropdown" aria-expanded="false"
                            >
                                Sort
                            </button>
                            <ul className="dropdown-menu" >
                                <li >
                                    <a className={"dropdown-item"} href={"#"}>
                                        Loading...
                                    </a>
                                </li>

                            </ul>
                        </div>
                        <div className="form-check form-switch d-flex align-items-center ms-auto">
                            <label className="form-check-label me-5">
                                Search
                            </label>
                            <input className="form-check-input" type="checkbox" disabled />
                        </div>
                    </div>
                    <ExpensesTableSectionSkeleton
                        selectActive={false}
                        showInactiveExpenses={false}
                        enableSearch={false}
                        rowCount={10}
                    />
                </div>
            </div>
        </div>
    );
}