import { supabase } from './supabase';

export const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

export const uploadImage = async (
    bucket: string,
    path: string,
    file: Blob | File
): Promise<string | null> => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) throw error;
        return getPublicUrl(bucket, data.path);
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
};

export const deleteImage = async (bucket: string, path: string): Promise<boolean> => {
    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
};

export const STORAGE_BUCKETS = {
    CATEGORIES: 'categories',
    PRODUCT_IMAGES: 'product-images',
    PROMOS: 'promos',
} as const;