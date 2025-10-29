import React, {useState} from 'react';

export const NewCategoryInput = ({handleSave, handleClose}) => {
    const [newCategory, setNewCategory] = useState(null);

    const handleSaveClick = () => {
        if (!newCategory) {
            alert("Please enter a category name");
            return;
        }

        handleSave(newCategory);
    }

    return (
        <div className='mb-3'>
            <label className={'form-label'}>New Category Name</label>
            <div className={"row g-2 d-flex justify-content-center align-items-center me-2"}>
                <div className={'col-8'}>
                    <input className={'form-control'} type='text' onChange={(e) => setNewCategory(e.target.value)} />
                </div>
                <div className={'col-4 p-0 d-flex'}>
                    <div className={'row ms-auto'}>
                        <div className={'col-auto g-0 pe-2'}>
                            <button className={'btn btn-primary'} type='button' onClick={handleClose}>
                                Cancel
                            </button>
                        </div>
                        <div className={'col-auto g-0'}>
                            <button className={'btn btn-primary'} type='button' onClick={handleSaveClick}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}