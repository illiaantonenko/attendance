import React from 'react';

interface SkeletonProps {
    className?: string;
}

// Base skeleton with pulse animation
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        />
    );
}

// Text line skeleton
export function SkeletonText({ className = '', lines = 1 }: SkeletonProps & { lines?: number }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Card skeleton
export function SkeletonCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
            <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <SkeletonText lines={3} />
        </div>
    );
}

// Table row skeleton
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

// Table skeleton
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-6 w-1/4" />
            </div>
            {/* Table */}
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3 text-left">
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Stats card skeleton
export function SkeletonStats({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                >
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            ))}
        </div>
    );
}

// List item skeleton
export function SkeletonListItem() {
    return (
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

// List skeleton
export function SkeletonList({ items = 5 }: { items?: number }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-6 w-1/4" />
            </div>
            {Array.from({ length: items }).map((_, i) => (
                <SkeletonListItem key={i} />
            ))}
        </div>
    );
}

// Dashboard skeleton
export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <SkeletonStats count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonList items={5} />
                <SkeletonCard />
            </div>
        </div>
    );
}

export default Skeleton;

