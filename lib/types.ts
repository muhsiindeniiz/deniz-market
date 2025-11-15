export interface User {
    id: string;
    email: string;
    full_name: string;
    phone: string;
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
    postal_code: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    item_count: number;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discount_price?: number;
    category_id: string;
    category?: Category;
    images: string[];
    stock: number;
    unit: string;
    weight?: string;
    rating: number;
    review_count: number;
    is_featured: boolean;
    is_on_sale: boolean;
    created_at: string;
}

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
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
    delivery_time?: string;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product: Product;
    quantity: number;
    price: number;
    discount_price?: number;
}

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    user?: User;
    rating: number;
    comment: string;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'order' | 'promotion' | 'general';
    is_read: boolean;
    data?: any;
    created_at: string;
}