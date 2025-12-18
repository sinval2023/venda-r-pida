import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

export function useProductImages() {
  const [uploading, setUploading] = useState(false);

  const getProductImages = async (productId: string): Promise<ProductImage[]> => {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');

    if (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
    return data || [];
  };

  const uploadImage = async (file: File, productId: string, isPrimary: boolean = false): Promise<{ url?: string; error?: Error }> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Get current max display_order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingImages && existingImages.length > 0 
        ? existingImages[0].display_order + 1 
        : 0;

      // If this is primary, unset other primaries
      if (isPrimary) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);
      }

      // Insert into product_images table
      const { error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          display_order: nextOrder,
          is_primary: isPrimary,
        });

      if (insertError) throw insertError;

      return { url: publicUrl };
    } catch (error: any) {
      return { error };
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string): Promise<{ error?: Error }> => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error };
    }
  };

  const setPrimaryImage = async (imageId: string, productId: string): Promise<{ error?: Error }> => {
    try {
      // First, unset all primaries for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error };
    }
  };

  const reorderImages = async (images: { id: string; display_order: number }[]): Promise<{ error?: Error }> => {
    try {
      for (const img of images) {
        await supabase
          .from('product_images')
          .update({ display_order: img.display_order })
          .eq('id', img.id);
      }
      return {};
    } catch (error: any) {
      return { error };
    }
  };

  return {
    uploading,
    getProductImages,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
  };
}
