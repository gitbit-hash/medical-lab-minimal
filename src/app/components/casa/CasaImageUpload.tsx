'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, X, Eye, Tag, Loader2 } from 'lucide-react';

interface CasaImageUploadProps {
  testId: string;
  onImagesUpdate: (images: any[]) => void;
}

export function CasaImageUpload({ testId, onImagesUpdate }: CasaImageUploadProps) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);


  // Load existing images when component mounts
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tests/${testId}/images`);
        if (response.ok) {
          const data = await response.json();
          setImages(data.images || []);
          onImagesUpdate(data.images || []);
        }
      } catch (error) {
        console.error('Failed to fetch images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [testId, onImagesUpdate]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', 'Sperm microscopy');
      formData.append('imageType', 'Morphology');

      try {
        const response = await fetch(`/api/tests/${testId}/images`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          // Update local state
          setImages(prev => [...prev, data.image]);
          // Notify parent
          onImagesUpdate([...images, data.image]);

          // Refresh the images list
          const refreshResponse = await fetch(`/api/tests/${testId}/images`);
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setImages(refreshData.images || []);
            onImagesUpdate(refreshData.images || []);
          }
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
    // Clear the file input
    if (e.target) e.target.value = '';
  }, [testId, images, onImagesUpdate]);
  const handleRemoveImage = async (imageId: string) => {
    setDeletingImageId(imageId);

    try {
      const response = await fetch(`/api/tests/${testId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Optimistically update local state
      setImages(prev => {
        const newImages = prev.filter(img => img.id !== imageId);
        onImagesUpdate(newImages);
        return newImages;
      });

      if (preview) {
        const deletedImage = images.find(img => img.id === imageId);
        if (deletedImage && preview === deletedImage.file_path) {
          setPreview(null);
        }
      }

    } catch (error) {
      console.error('Delete failed:', error);
      // Show error toast or message
      alert('Failed to delete image. Please try again.');
      // Refresh from server
      const response = await fetch(`/api/tests/${testId}/images`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
        onImagesUpdate(data.images || []);
      }
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleAddCaption = async (imageId: string, newCaption: string) => {
    try {
      await fetch(`/api/tests/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption: newCaption }),
      });

      // Update local state
      setImages(prev =>
        prev.map(img =>
          img.id === imageId ? { ...img, caption: newCaption } : img
        )
      );
    } catch (error) {
      console.error('Update caption failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading images...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-white">
        <input
          type="file"
          id="casa-images"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="casa-images"
          className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''
            }`}
        >
          {uploading ? (
            <div className="flex items-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            </div>
          ) : (
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
          )}
          <span className="text-gray-600 font-medium">
            {uploading ? 'Uploading...' : 'Upload Microscopy Images'}
          </span>
          <span className="text-sm text-gray-500 mt-2">
            Drag & drop or click to upload
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Supports JPG, PNG ONLY (max 5MB each)
          </span>
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-700">
              Uploaded Images ({images.length})
            </h4>
            <button
              onClick={() => {
                const input = document.getElementById('casa-images');
                if (input) input.click();
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              Add More Images
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative group border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={img.file_path}
                    alt={img.caption || 'Sperm microscopy image'}
                    className="w-full h-32 object-cover cursor-pointer bg-gray-100"
                    onClick={() => setPreview(img.file_path)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setPreview(img.file_path)}
                      className="p-2 bg-white rounded-full mr-2 hover:bg-gray-100"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      disabled={deletingImageId === img.id}
                      className={`p-2 ${deletingImageId === img.id
                        ? 'bg-gray-400'
                        : 'bg-red-500 hover:bg-red-600'
                        } text-white rounded-full`}
                      title="Delete"
                    >
                      {deletingImageId === img.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm">
                      <Tag className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-gray-600 capitalize">{img.image_type?.toLowerCase()}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {img.file_size && (img.file_size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>

                  {img.caption ? (
                    <div className="text-xs text-gray-600 truncate">{img.caption}</div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Add caption..."
                      className="w-full text-xs p-1 border rounded"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          handleAddCaption(img.id, e.target.value);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            handleAddCaption(img.id, target.value);
                          }
                        }
                      }}
                    />
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(img.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No images uploaded yet</p>
          <p className="text-sm text-gray-400">Upload microscopy images to see them here</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}