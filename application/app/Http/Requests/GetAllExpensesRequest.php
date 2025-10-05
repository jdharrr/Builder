<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GetAllExpensesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'sort' => 'required|string',
            'sortDir' => 'required|string|in:asc,desc',
            'searchColumn' => 'nullable|string',
            'searchValue' => 'nullable|string',
            'showInactiveExpenses' => 'required|in:true,false',
        ];
    }
}
