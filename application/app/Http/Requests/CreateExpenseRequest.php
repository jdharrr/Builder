<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class  CreateExpenseRequest extends FormRequest
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
            'name'             => 'required|string|max:255|regex:/^[\pL\s\'.-]+$/u',
            'cost'             => 'required|numeric|regex:/^\d+(\.\d{1,2})?$/',
            'description'      => 'nullable|string|max:255|regex:/^[\pL\pN\s.,!?\-\'"]+$/u',
            'recurrenceRate'  => 'required|string|in:once,daily,weekly,monthly,yearly',
            'categoryId'      => 'nullable|integer',
            'nextDueDate'    => 'required|date_format:Y-m-d',
            'startDate'       => 'required|date_format:Y-m-d',
            'endDate'         => 'nullable|date_format:Y-m-d',
            'paidOnCreation' => 'required|boolean',
        ];
    }
}
