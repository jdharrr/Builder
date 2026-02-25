import React from 'react';

import '../css/totalsPage.css';

export default function TotalsPageSkeleton() {
    return (
        <div className="totals-page">
            <div className="totals-hero placeholder-glow">
                <div className="totals-hero-title">
                    <span className="totals-eyebrow">Totals</span>
                    <h1 className="totals-title">Spending Overview</h1>
                    <p className="totals-subtitle">See where money goes and how much you have spent over time.</p>
                </div>
                <div className="totals-stat">
                    <span className="totals-stat-label">Total Spent</span>
                    <span className="placeholder col-6" />
                </div>
            </div>

            <div className="totals-grid">
                {['Category Breakdown', 'Monthly Spend', 'Avg Monthly Spend by Category'].map((title) => (
                    <div className="card totals-card" key={title} style={{width: '100%'}}>
                        <div className="card-header totals-card-header">
                            <h6 className="card-title">{title}</h6>
                        </div>
                        <div className="card-body totals-card-body placeholder-glow">
                            <div className="totals-range">
                                <span className="totals-stat-label">Loading</span>
                                <span className="placeholder col-4" />
                            </div>
                            <div className="totals-chart totals-chart--wide">
                                <span className="placeholder col-12" style={{height: '16rem', display: 'block'}} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
