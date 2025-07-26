<?php

namespace app\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'cost',
        'description',
        'recurring_date',
        'recurrence_rate',
        'category',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [

    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [

        ];
    }

    public function user() {
        return $this->belongsTo(User::class);
    }
}
