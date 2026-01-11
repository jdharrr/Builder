import React from 'react';

export const UpcomingExpensesSectionSkeleton = () => {
    const daysToShow = 7; // Match API response structure
    const avgExpensesPerDay = 3; // Reasonable average

    return (
        <div className={'border border-dark mt-3'}>
            {/* Tab navigation */}
            <ul className={'nav nav-tabs border-0 nav-fill'} role={'tablist'}>
                <li className={'nav-item'} role={'presentation'}>
                    <button className={'nav-link active border-0'} disabled>
                        Upcoming Expenses
                    </button>
                </li>
                <li className={'nav-item'} role={'presentation'}>
                    <button className={'nav-link border-0'} disabled>
                        Late Expenses
                    </button>
                </li>
            </ul>

            {/* Content */}
            <div className={'tab-content'}>
                <div className={'tab-pane fade show active'}>
                    <div className="upcomingList list-group list-group-flush" style={{width: '25rem'}}>
                        {Array.from({ length: daysToShow }).map((_, dayIdx) => (
                            <div className="list-group-item" key={dayIdx}>
                                {/* Day header */}
                                <div className="fw-medium placeholder-glow">
                                    <span className="placeholder col-3" />
                                </div>
                                {/* Expense items */}
                                <div>
                                    {Array.from({ length: avgExpensesPerDay }).map((_, expIdx) => (
                                        <div
                                            key={expIdx}
                                            className="px-2 py-1"
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "auto 1fr 6rem 6rem",
                                                alignItems: "center",
                                                columnGap: "0.5rem",
                                            }}
                                        >
                                            <div>•</div>
                                            <div className="flex-grow-1 placeholder-glow">
                                                <span className="placeholder col-8" />
                                            </div>
                                            <div className="placeholder-glow">
                                                <span className="placeholder col-10" />
                                            </div>
                                            <div className="d-flex justify-content-end align-items-center placeholder-glow">
                                                <span className="placeholder col-12" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
