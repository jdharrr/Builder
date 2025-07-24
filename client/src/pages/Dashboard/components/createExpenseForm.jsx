import React, { useContext } from 'react';

import { ExpenseFormContext } from '../contexts/expenseFormContext.jsx';

import '../css/createExpenseForm.css';

export const CreateExpenseForm = () => {
    const { setShowExpenseForm } = useContext(ExpenseFormContext);

    const handleCloseForm = () => {
        setShowExpenseForm({ showing: false, day: null });
    }

    return (
      <div className='expenseFormOverlay'>
          <div className='expenseForm'>
              <h1>Create Expense</h1>
              <button onClick={handleCloseForm}>Close</button>
          </div>
      </div>
    );
}