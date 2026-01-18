export interface User {
    id: number;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    full_name: string;
    profile?: Profile;
    email_verified_at?: string;
    created_at: string;
}

export interface Profile {
    id: number;
    user_id: number;
    firstname: string;
    lastname: string;
    middlename?: string;
    phone?: string;
    avatar_url?: string;
    birthdate?: string;
}

export interface Event {
    id: number;
    teacher_id: number;
    category_id?: number;
    title: string;
    description?: string;
    event_type: 'lecture' | 'seminar' | 'lab' | 'exam';
    start_time: string;
    end_time: string;
    location?: Location;
    allowed_radius: number;
    qr_enabled: boolean;
    geolocation_required: boolean;
    published: boolean;
    teacher?: User;
    category?: EventCategory;
    groups?: Group[];
    registrations?: EventRegistration[];
    registrations_count?: number;
    attendance_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Location {
    lat: number;
    lng: number;
    building?: string;
    room?: string;
}

export interface EventCategory {
    id: number;
    name: string;
    color: string;
    text_color: string;
    description?: string;
}

export interface Group {
    id: number;
    name: string;
    code: string;
    year?: number;
    specialty?: string;
    description?: string;
    student_count?: number;
}

export interface EventRegistration {
    id: number;
    event_id: number;
    student_id: number;
    status: 'registered' | 'present' | 'absent' | 'late' | 'excused';
    check_in_time?: string;
    check_in_location?: Location;
    student?: User;
    event?: Event;
}

export interface QrCode {
    token: string;
    qr_code: string;
    qr_code_url: string;
    expires_at: string;
    ttl_seconds: number;
}

export interface PageProps {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Laravel Echo types
import Echo from 'laravel-echo';

declare global {
    interface Window {
        Echo: Echo;
    }
}

