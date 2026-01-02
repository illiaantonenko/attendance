<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QrToken extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'nonce',
        'token_hash',
        'expires_at',
        'used',
        'used_at',
        'used_by',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'used' => 'boolean',
        ];
    }

    /**
     * Get the event
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the user who used the token
     */
    public function usedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    /**
     * Check if token is expired
     */
    public function isExpired(): bool
    {
        return now() > $this->expires_at;
    }

    /**
     * Check if token is valid (not expired and not used)
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->used;
    }

    /**
     * Mark token as used
     */
    public function markAsUsed(int $userId): void
    {
        $this->update([
            'used' => true,
            'used_at' => now(),
            'used_by' => $userId,
        ]);
    }
}

