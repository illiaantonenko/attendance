<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Event $event): bool
    {
        // Admin can view all
        if ($user->isAdmin()) {
            return true;
        }

        // Teacher can view own events
        if ($user->isTeacher() && $event->teacher_id === $user->id) {
            return true;
        }

        // Student can view published events from their groups
        if ($user->isStudent() && $event->published) {
            $studentGroupIds = $user->groups()->pluck('groups.id');
            $eventGroupIds = $event->groups()->pluck('groups.id');
            
            // If event has no groups assigned, all students can see it
            if ($eventGroupIds->isEmpty()) {
                return true;
            }
            
            return $studentGroupIds->intersect($eventGroupIds)->isNotEmpty();
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Event $event): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $event->teacher_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $event->teacher_id === $user->id;
    }

    /**
     * Determine whether the user can generate QR codes.
     */
    public function generateQr(User $user, Event $event): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isTeacher() && $event->teacher_id === $user->id;
    }
}

