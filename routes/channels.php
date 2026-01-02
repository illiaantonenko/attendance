<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Channel for event attendance updates
Broadcast::channel('event.{eventId}', function ($user, $eventId) {
    // Allow teachers and admins to listen to event channels
    if (in_array($user->role, ['admin', 'teacher'])) {
        return true;
    }
    // Students can listen if they are in a group assigned to the event
    return $user->events()->where('events.id', $eventId)->exists();
});

// Channel for event attendance updates (public for now, can be restricted later)
Broadcast::channel('attendance.{eventId}', function ($user, $eventId) {
    // Teachers and admins can listen
    return in_array($user->role, ['admin', 'teacher']);
});

