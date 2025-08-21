<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'recurrence_rate',
        'category',
        'user_id',
        'next_due_date',
        'last_paid',
        'active',
        'last_cost',
        'prev_last_paid',
        'start_date',
        'end_date',
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
    protected function casts(): array {
        return [
            'next_due_date' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'active' => 'boolean',
            'cost' => 'decimal:2',
            'id' =>'integer',
            'user_id' =>'integer',
            'cost_updated_at' => 'datetime',
            'last_cost' => 'decimal:2',
            'prev_last_paid' => 'datetime'
        ];
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany {
        return $this->hasMany(Payment::class);
    }
}
