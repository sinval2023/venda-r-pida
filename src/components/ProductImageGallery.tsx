import { useState, useRef } from 'react';
import { Plus, X, Star, Loader2, GripVertical, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductImages, ProductImage } from '@/hooks/useProductImages';
import { toast } from '@/hooks/use-toast';
import { ImageLightbox } from './ImageLightbox';

interface ProductImageGalleryProps {
  productId?: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
}

export function ProductImageGallery({ 
  productId, 
  images, 
  onImagesChange,
  pendingFiles = [],
  onPendingFilesChange,
}: ProductImageGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadImage, deleteImage, setPrimaryImage, reorderImages } = useProductImages();
  const [localUploading, setLocalUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: `${file.name} não é uma imagem válida.`,
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o limite de 2MB.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (productId) {
      // Upload directly if product exists
      setLocalUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPrimary = images.length === 0 && i === 0;
        const { url, error } = await uploadImage(file, productId, isPrimary);
        
        if (error) {
          toast({
            title: 'Erro ao carregar imagem',
            description: error.message,
            variant: 'destructive',
          });
        } else if (url) {
          const newImage: ProductImage = {
            id: `temp-${Date.now()}-${i}`,
            product_id: productId,
            image_url: url,
            display_order: images.length + i,
            is_primary: isPrimary,
          };
          onImagesChange([...images, newImage]);
        }
      }
      setLocalUploading(false);
      toast({ title: `${files.length} imagem(ns) carregada(s)!` });
    } else {
      // Store pending files for new products
      if (onPendingFilesChange) {
        onPendingFilesChange([...pendingFiles, ...files]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (image: ProductImage) => {
    if (productId && !image.id.startsWith('temp-')) {
      const { error } = await deleteImage(image.id);
      if (error) {
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    }
    onImagesChange(images.filter(img => img.id !== image.id));
  };

  const handleSetPrimary = async (image: ProductImage) => {
    if (productId && !image.id.startsWith('temp-')) {
      const { error } = await setPrimaryImage(image.id, productId);
      if (error) {
        toast({
          title: 'Erro ao definir principal',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    }
    onImagesChange(images.map(img => ({
      ...img,
      is_primary: img.id === image.id,
    })));
  };

  const handleRemovePending = (index: number) => {
    if (onPendingFilesChange) {
      onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder images array
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update display_order
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      display_order: idx,
    }));

    onImagesChange(reorderedImages);

    // Persist to database if product exists
    if (productId) {
      const orderUpdates = reorderedImages
        .filter(img => !img.id.startsWith('temp-'))
        .map(img => ({ id: img.id, display_order: img.display_order }));
      
      if (orderUpdates.length > 0) {
        const { error } = await reorderImages(orderUpdates);
        if (error) {
          toast({
            title: 'Erro ao reordenar',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const isUploading = uploading || localUploading;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = images.map(img => ({ url: img.image_url, alt: 'Product image' }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Existing images */}
        {images.map((image, index) => (
          <div 
            key={image.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all
              ${image.is_primary ? 'border-yellow-500' : 'border-transparent'}
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index ? 'border-primary ring-2 ring-primary/30' : ''}
            `}
          >
            <img 
              src={image.image_url} 
              alt="Product" 
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <div className="absolute top-1 right-1 flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white/80 hover:text-white"
                  onClick={() => openLightbox(index)}
                  title="Ver em tela cheia"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <GripVertical className="h-4 w-4 text-white/70" />
              </div>
              {!image.is_primary && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-yellow-400 hover:text-yellow-300"
                  onClick={() => handleSetPrimary(image)}
                  title="Definir como principal"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-300"
                onClick={() => handleDelete(image)}
                title="Excluir"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {image.is_primary && (
              <div className="absolute top-1 left-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              </div>
            )}
          </div>
        ))}

        {/* Pending files preview (for new products) */}
        {pendingFiles.map((file, index) => (
          <div 
            key={`pending-${index}`}
            className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 group"
          >
            <img 
              src={URL.createObjectURL(file)} 
              alt="Pending" 
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-300"
                onClick={() => handleRemovePending(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded truncate">
              Pendente
            </div>
          </div>
        ))}

        {/* Add button */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <>
              <Plus className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground">Adicionar</span>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        Arraste para reordenar. Clique na estrela para definir a imagem principal.
      </p>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
