<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('auth/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('auth/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user', function (Request $request) {
            return $request->user();
        });
        
        Route::post('auth/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
        Route::post('auth/refresh', [\App\Http\Controllers\Api\AuthController::class, 'refresh']);
        
        // Events
        Route::apiResource('events', \App\Http\Controllers\Api\EventController::class)->names('api.events');
        Route::post('events/{event}/qr/generate', [\App\Http\Controllers\Api\QrController::class, 'generate']);
        Route::post('events/check-in', [\App\Http\Controllers\Api\CheckInController::class, 'checkIn']);
        
        // Users & Groups - managed via web routes for now
        // Route::apiResource('users', \App\Http\Controllers\Api\UserController::class)->names('api.users');
        // Route::apiResource('groups', \App\Http\Controllers\Api\GroupController::class)->names('api.groups');
        
        // Export
        Route::get('export/event/{event}', [\App\Http\Controllers\Api\ExportController::class, 'event']);
        Route::get('export/group/{group}', [\App\Http\Controllers\Api\ExportController::class, 'group']);
    });
});

