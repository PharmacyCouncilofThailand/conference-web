// ===========================================
// TypeScript Types for Backend API
// Backend: ngrok URL
// ===========================================

// ========== EVENT TYPES ==========

export interface Event {
    id: string;
    code: string;
    name: string;
    title?: string; // API compatibility - mapped from eventName
    description: string;
    eventType: 'single_room' | 'multi_session' | 'single' | 'conference';
    status: 'draft' | 'published' | 'cancelled';
    venue: string;
    capacity: number;
    cpeCredits: string | number;
    startDate: string;
    endDate: string;
    registrationOpens: string;
    registrationCloses: string;
    ticketTypes?: TicketType[];
    sessions?: Session[];
    // UI compatibility fields
    coverImage?: string;
    videoUrl?: string; // Add videoUrl for MP4/WebM uploads
    maxCapacity?: number;
    imageUrl?: string;
    venueImage?: string;
    image?: string;
    speakers?: Speaker[];
    images?: EventImage[];
    attachments?: EventAttachment[];
    documents?: { name: string; url: string }[];
    // Legacy fields for existing pages
    rounds?: Round[];
    price?: number;
    category?: string;
    schedule?: ScheduleItem[];
    createdAt?: string;
    location?: string;
    mapUrl?: string; // Add mapUrl for iframe embedding
    date?: string;
    time?: string;
    registeredCount?: number;
    firstSessionStart?: string;
    websiteUrl?: string | null;
}

export interface TicketType {
    id: string;
    name: string;
    ticketCategory: 'primary' | 'addon';
    category?: 'early_bird' | 'regular' | 'late' | 'onsite' | 'member' | 'public' | 'vip';
    priority?: 'early_bird' | 'regular' | 'late' | 'onsite';
    // Add-on grouping key (backend tracks purchased add-ons by this)
    groupName?: string;
    price: number;
    currency?: string;
    quota?: number;
    soldCount?: number;
    salesStart?: string;
    salesEnd?: string;
    saleStartDate?: string;
    saleEndDate?: string;
    // API compatibility
    description?: string;
    available?: number;
    maxPerOrder?: number;
    benefits?: string[];
    features?: string[];
    badgeText?: string | null;
    originalPrice?: number | string | null;
    isActive?: boolean;
    allowedRoles?: string[];
    allowedStudentLevels?: string[];
    sessions?: Array<{
        id: number;
        sessionCode?: string;
        sessionName: string;
        description?: string | null;
        startTime?: string;
        endTime?: string;
        room?: string | null;
        maxCapacity?: number;
    }>;
    optionalSessions?: Array<{
        id: number;
        sessionCode?: string;
        sessionName: string;
        description?: string | null;
        startTime?: string;
        endTime?: string;
        room?: string | null;
        maxCapacity?: number;
        requiresOptIn?: boolean;
        enrolledCount?: number;
        seatsRemaining?: number | null;
        isFull?: boolean;
    }>;
}

export interface Round {
    id: string;
    date: string;
    time: string;
    location: string;
    mapUrl?: string;
    capacity: number;
    registered: number;
}

export interface ScheduleItem {
    time: string;
    title: string;
    speaker?: string;
}

export interface Session {
    id: string;
    sessionCode: string;
    sessionName: string;
    description?: string;
    room?: string;
    startTime: string;
    endTime: string;
    speakers?: string;
    maxCapacity: number;
    isMainSession?: boolean;
    requiresOptIn?: boolean;
    enrolledCount?: number;
    seatsRemaining?: number | null;
    isFull?: boolean;
}

export interface Speaker {
    id: string;
    name: string;
    title: string;
    organization: string;
    imageUrl?: string;
}

export interface EventImage {
    id: number;
    eventId: number;
    imageUrl: string;
    caption?: string;
    imageType: 'cover' | 'venue';
    sortOrder: number;
}

export interface EventAttachment {
    id: number;
    eventId: number;
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    description?: string;
}

// ========== REGISTRATION TYPES ==========

export interface RegistrationRequest {
    eventId: string;
    ticketTypeId?: string;
    email: string;
    phone?: string;
    nameTh?: string;
    nameEn?: string;
    licenseNumber?: string;
    promoCode?: string;
    // API compatibility
    firstName?: string;
    lastName?: string;
    organization?: string;
    attendeeType?: string;
}

export interface RegistrationResponse {
    registration: {
        id: string;
        registrationNumber: string;
        qrCode: string;
        amount: number;
    };
}

// ========== MEMBER VERIFICATION ==========

export interface MemberVerifyResponse {
    valid: boolean;
    member?: {
        id: string;
        name: string;
        licenseNumber: string;
    };
}

// ========== PAYMENT TYPES ==========

export interface CheckoutResponse {
    checkoutUrl: string;
    sessionId: string;
}

export interface PaymentVerifyResponse {
    status: 'paid' | 'unpaid' | 'processing';
    registrationId: string;
}

// ========== FEEDBACK ==========

export interface FeedbackRequest {
    registrationId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    suggestions?: string;
}

// ========== API RESPONSE ==========

export interface ApiResponse<T> {
    data: T;
    total?: number;
    success?: boolean;
    message?: string;
}
