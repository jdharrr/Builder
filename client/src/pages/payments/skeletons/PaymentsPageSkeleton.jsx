import React from 'react';

import '../css/paymentsPage.css';
import '../css/paymentsTableSection.css';

export default function PaymentsPageSkeleton() {
    return (
        <div className="payments-page">
            <div className="payments-hero">
                <div className="payments-hero-title">
                    <span className="payments-eyebrow">Payments</span>
                    <h1 className="payments-title">Payment Table</h1>
                    <p className="payments-subtitle">Review and organize payment history with the same table layout.</p>
                </div>
            </div>

            <div className="card payments-page-card" style={{width: 'min(90rem, 100%)'}}>
                <div className="card-body payments-page-body">
                    <div className="payments-toolbar">
                        <div className="payments-toolbar-row">
                            <div className="payments-toolbar-group">
                            <div className="payments-control placeholder-glow">
                                <span className="placeholder col-6" />
                            </div>
                            <div className="payments-control placeholder-glow">
                                <span className="placeholder col-5" />
                            </div>
                            <div className="payments-control placeholder-glow">
                                <span className="placeholder col-5" />
                            </div>
                            </div>
                            <div className="payments-toolbar-toggles">
                                {['Search', 'Show Skipped'].map((label) => (
                                    <div className="payments-toggle placeholder-glow" key={label}>
                                        <span className="placeholder col-6" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="payments-table-wrap">
                        <table className="table payments-table" style={{ cursor: "default", tableLayout: "fixed", width: "100%" }}>
                            <thead className="payments-table-head">
                                <tr>
                                    {['Payment Date', 'Due Date', 'Expense', 'Amount', 'Credit Card', ''].map((label) => (
                                        <th className="text-center payments-sortable" key={label} scope="col">{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="payments-table-body">
                                {Array.from({ length: 10 }).map((_, rowIdx) => (
                                    <tr key={rowIdx} className="placeholder-glow payments-table-row">
                                        {Array.from({ length: 6 }).map((__, colIdx) => (
                                            <td key={colIdx}>
                                                <span className="placeholder col-8" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
