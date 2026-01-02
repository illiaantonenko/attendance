<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('event_categories')->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('event_type', ['lecture', 'seminar', 'lab', 'exam'])->default('lecture');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->json('location')->nullable(); // {lat, lng, building, room}
            $table->integer('allowed_radius')->default(100); // meters
            $table->boolean('qr_enabled')->default(true);
            $table->boolean('geolocation_required')->default(false);
            $table->boolean('published')->default(false);
            $table->timestamps();

            $table->index(['start_time', 'end_time']);
            $table->index('teacher_id');
        });

        // Pivot table for event-group relationship
        Schema::create('event_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['event_id', 'group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_group');
        Schema::dropIfExists('events');
    }
};

