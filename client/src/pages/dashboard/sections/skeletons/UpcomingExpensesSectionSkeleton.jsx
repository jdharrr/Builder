import React from 'react';

export const UpcomingExpensesSectionSkeleton = () => {
    const daysToShow = 4;
    const avgExpensesPerDay = 2;

    return (
        <div>
            <div className="tab-pills-container">
                <div className="tab-pills">
                    <button className="tab-pill active" disabled>
                        Upcoming Expenses
                    </button>
                    <button className="tab-pill" disabled>
                        Late Expenses
                    </button>
                </div>
            </div>

            <div className="tab-content-wrapper">
                <div className="upcoming-list">
                    {Array.from({ length: daysToShow }).map((_, dayIdx) => (
                        <div className="date-group" key={dayIdx}>
                            <div className="date-header placeholder-glow">
                                <span className="placeholder col-3" />
                            </div>
                            <div className="expense-items">
                                {Array.from({ length: avgExpensesPerDay }).map((_, expIdx) => (
                                    <div className="expense-item placeholder-glow" key={expIdx}>
                                        <div className="expense-name">
                                            <span className="placeholder col-7" />
                                        </div>
                                        <div className="expense-amount">
                                            <span className="placeholder col-6" />
                                        </div>
                                        <div className="expense-checkbox">
                                            <span className="placeholder col-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
