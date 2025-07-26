<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations (applies the schema change).
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations (rolls back the schema change).
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
