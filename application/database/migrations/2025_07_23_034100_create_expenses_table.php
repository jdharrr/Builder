<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations (applies the schema change).
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->decimal('cost', 10, 2);
            $table->text('description')->nullable();

            $table->date('recurring_date')->nullable();
            $table->enum('recurrence_rate', ['daily', 'weekly', 'monthly', 'yearly'])->nullable(); // or use string

            $table->date('last_paid')->nullable();
            $table->decimal('last_cost', 10, 2)->nullable();
            $table->timestamp('cost_updated_at')->nullable();

            $table->string('category')->nullable();

             $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->timestamps();

            $table->index('recurring_date');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations (rolls back the schema change).
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
