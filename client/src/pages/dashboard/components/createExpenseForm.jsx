import React, {useContext, useState} from 'react';
import {useNavigate} from "react-router-dom";

import {postExpense} from "../../../api.jsx";
import {ExpenseContext} from "../providers/expenses/expenseContext.jsx";

import '../css/createExpenseForm.css';

export const CreateExpenseForm = ({ setShowExpenseForm, date}) => {
    const { setExpenses } = useContext(ExpenseContext);
    const navigate = useNavigate();

    const [expenseProps, setExpenseProps] = useState({
        name: '',
        cost: 0.0,
        recurrence_rate: '',
        next_due_date: date,
        category: '',
        description: '',
    });

    const handleSaveForm = async () => {
        let isCreated = false;
        try {
            isCreated = await postExpense(expenseProps);
        } catch (err) {
            if (err.status === 401) {
                navigate('/login');
                return;
            }

            alert('Error creating expense.');
            return;
        }

        isCreated ? alert('Expense successfully created.'): alert('Failed to create Expense.');
        setExpenses((prevState) => [...prevState, expenseProps]);
        setShowExpenseForm(!isCreated);
    }

    const handleCloseForm = () => {
        setShowExpenseForm(false);
    }

    return (
      <div className='expenseFormOverlay'>
          <div className='expenseForm'>
              <h1>Create Expense</h1>
              <div className='expenseForm'>
                  <label>Name</label>
                  <input className={'expenseFormInput'} type='text'
                     onChange = {
                         (e) => {
                             setExpenseProps((prevState) => ({
                                 ...prevState,
                                 name: e.target.value
                             }));
                         }
                     }
                  />
                  <label>Cost</label>
                  <input className={'expenseFormInput'} type='text'
                     onChange = {
                         (e) => {
                             setExpenseProps((prevState) => ({
                                 ...prevState,
                                 cost: e.target.value
                             }));
                         }
                     }
                  />
                  <label>Recurrence Rate</label>
                  <input className={'expenseFormInput'} type='text'
                     onChange = {
                         (e) => {
                             setExpenseProps((prevState) => ({
                                 ...prevState,
                                 recurrence_rate: e.target.value
                             }));
                         }
                     }
                  />
                  <label>Category</label>
                  <input className={'expenseFormInput'} type='text'
                     onChange = {
                         (e) => {
                             setExpenseProps((prevState) => ({
                                 ...prevState,
                                 category: e.target.value
                             }));
                         }
                     }
                  />
                  <label>Description</label>
                  <input className={'expenseFormInput'} type='text'
                     onChange = {
                         (e) => {
                             setExpenseProps((prevState) => ({
                                 ...prevState,
                                 description: e.target.value
                             }));
                         }
                     }
                  />
              </div>
              <button onClick={handleSaveForm} >Save</button>
              <button onClick={handleCloseForm}>Close</button>
          </div>
      </div>
    );
}