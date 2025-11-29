export interface Promo {
    id: string;
    title: string;
    subtitle: string;
    description: string | null;
    image_url: string;
    gradient_start: string;
    gradient_end: string;
    link_type: 'category' | 'product' | 'store' | 'external';
    link_id: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    item_count: number;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    discount_price: number | null;
    category_id: string | null;
    images: string[];
    stock: number;
    unit: string;
    weight: string | null;
    rating: number;
    review_count: number;
    is_featured: boolean;
    is_on_sale: boolean;
    store_id: string | null;
    created_at: string;
    updated_at: string;
    category?: Category;
    store?: Store;
}

export interface Store {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    banner_image: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    rating: number;
    review_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Address {
    id: string;
    user_id: string;
    title: string;
    full_address: string;
    city: string;
    district: string;
    postal_code: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    birth_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    user_id: string;
    order_number: string;
    status: 'pending' | 'processing' | 'preparing' | 'on_delivery' | 'delivered' | 'cancelled';
    total_amount: number;
    delivery_fee: number;
    discount_amount: number;
    payment_method: 'cash' | 'card';
    delivery_address: Address;
    delivery_time: string | null;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    quantity: number;
    price: number;
    discount_price: number | null;
    created_at: string;
    product?: Product;
}

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    user?: User;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'order' | 'promotion' | 'general';
    is_read: boolean;
    data: object | null;
    created_at: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Favorite {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
    product?: Product;
}

export interface Coupon {
    id: string;
    code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    min_order_amount: number;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    valid_from: string;
    valid_until: string | null;
    created_at: string;
    updated_at: string;
}

export interface TermsAndConditions {
    id: string;
    content: string;
    version: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface PrivacyPolicy {
    id: string;
    content: string;
    version: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}