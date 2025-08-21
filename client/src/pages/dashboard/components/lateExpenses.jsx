import React from 'react';

import '../css/lateExpenses.css';

export const LateExpenses = ({ lateExpenses }) => {
    return (
        <div className={'lateExpensesList list-group list-group-flush overflow-y-auto overflow-y-auto'}>
            {lateExpenses.map((expense, idx) => (
                <div className="list-group-item row" key={idx}>
                    <div>
                        {expense.name}
                    </div>
                </div>
            ))}
        </div>
    );
}