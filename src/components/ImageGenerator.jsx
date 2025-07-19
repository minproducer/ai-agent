import React, { useState, useEffect } from 'react';
import { Image, Loader2, Trash2, Download, Copy, ExternalLink } from 'lucide-react';

const ImageGenerator = () => {
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [useTestMode, setUseTestMode] = useState(false); // Add test mode toggle

  useEffect(() => {
    loadSavedImages();
  }, []);

  const loadSavedImages = async () => {
    try {
      const savedImagesData = await window.puter.kv.get('generatedImages');
      if (savedImagesData) {
        setGeneratedImages(JSON.parse(savedImagesData));
      }
    } catch (error) {
      console.error('Lỗi tải ảnh:', error);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    try {
      console.log('Generating image with prompt:', imagePrompt);
      console.log('Test mode:', useTestMode);
      
      // Try to generate image - start with chosen mode
      let imageElement;
      let actualTestMode = useTestMode;
      
      try {
        imageElement = await window.puter.ai.txt2img(imagePrompt, useTestMode);
      } catch (error) {
        console.log('Generation failed:', error);
        
        // If failed due to insufficient funds and we're not in test mode, try test mode
        if (error.error?.code === 'insufficient_funds' && !useTestMode) {
          console.log('Insufficient funds, trying test mode...');
          actualTestMode = true;
          imageElement = await window.puter.ai.txt2img(imagePrompt, true);
          
          // Auto-switch to test mode for future generations
          setUseTestMode(true);
          alert('💡 Account credit low - switched to Test Mode for free image generation!');
        } else {
          throw error; // Re-throw if it's a different error
        }
      }
      
      console.log('Generated image element:', imageElement);
      
      // Extract image URL from the image element
      let imageUrl = '';
      if (imageElement && imageElement.src) {
        imageUrl = imageElement.src;
      } else if (typeof imageElement === 'string') {
        imageUrl = imageElement;
      } else {
        throw new Error('Không thể lấy URL ảnh từ response');
      }
      
      // Create lightweight image data - ONLY store essential info
      const imageData = {
        id: Date.now(),
        prompt: imagePrompt.substring(0, 100), // Limit prompt length significantly  
        url: imageUrl, // Keep the URL (this is what we need to display)
        timestamp: new Date().toISOString(),
        generated: true,
        testMode: actualTestMode // Track which mode was used
      };
      
      console.log('Image data to save:', imageData);
      
      // Add to local state first
      const newImages = [...generatedImages, imageData];
      setGeneratedImages(newImages);
      
      // Try to save to storage with aggressive size management
      try {
        await saveImagesToStorage(newImages);
        console.log('Images saved successfully');
      } catch (storageError) {
        console.warn('Storage error, using memory only:', storageError);
        
        // If storage completely fails, just keep in memory and warn user
        alert('⚠️ Ảnh được tạo thành công nhưng không thể lưu vào storage do kích thước quá lớn. Ảnh vẫn hiển thị trong session này. Hãy download ảnh để lưu trữ!');
      }
      
      setImagePrompt('');
    } catch (error) {
      console.error('Lỗi tạo ảnh:', error);
      
      // Handle different error types
      let errorMessage = 'Vui lòng thử lại!';
      
      if (error.error?.code === 'insufficient_funds') {
        errorMessage = 'Account credit không đủ. Vui lòng chuyển sang Test Mode hoặc nạp thêm credit.';
        setUseTestMode(true); // Auto-enable test mode
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ Lỗi tạo ảnh: ${errorMessage}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const saveImagesToStorage = async (images) => {
    // Create ultra-lightweight data - only essential info
    const ultraLightImages = images.slice(-3).map(img => ({ // Only keep last 3 images max
      id: img.id,
      prompt: String(img.prompt).substring(0, 50), // Very short prompts
      url: img.url.startsWith('data:') ? '' : img.url, // Don't save base64 URLs, only real URLs
      timestamp: typeof img.timestamp === 'string' ? img.timestamp.substring(0, 19) : new Date(img.timestamp).toISOString().substring(0, 19), // Shorter timestamp
      generated: true
    }));
    
    // Filter out images with base64 URLs (too large)
    const filteredImages = ultraLightImages.filter(img => img.url && !img.url.startsWith('data:'));
    
    if (filteredImages.length === 0) {
      console.log('No valid URLs to save (all are base64)');
      throw new Error('Cannot save base64 images - too large for storage');
    }
    
    const dataString = JSON.stringify(filteredImages);
    const dataSizeKB = new Blob([dataString]).size / 1024;
    
    console.log(`Attempting to save ${dataSizeKB.toFixed(2)}KB of image metadata for ${filteredImages.length} images`);
    
    // Puter KV limit is ~400KB
    if (dataSizeKB > 300) {
      // If still too large, keep only 1 most recent image
      const singleImage = [filteredImages[filteredImages.length - 1]];
      const singleDataString = JSON.stringify(singleImage);
      const singleSizeKB = new Blob([singleDataString]).size / 1024;
      
      console.log(`Reduced to ${singleSizeKB.toFixed(2)}KB with 1 image`);
      
      if (singleSizeKB > 300) {
        throw new Error('Even single image metadata too large');
      }
      
      await window.puter.kv.set('generatedImages', singleDataString);
    } else {
      await window.puter.kv.set('generatedImages', dataString);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const filteredImages = generatedImages.filter(img => img.id !== imageId);
      setGeneratedImages(filteredImages);
      
      // Only try to save if we have non-base64 images
      const hasValidImages = filteredImages.some(img => img.url && !img.url.startsWith('data:'));
      
      if (hasValidImages) {
        await saveImagesToStorage(filteredImages);
      } else {
        console.log('Only base64 images remaining - keeping in memory only');
      }
    } catch (error) {
      console.error('Lỗi xóa ảnh từ storage (nhưng đã xóa khỏi UI):', error);
      // Even if storage save fails, the image is already removed from UI
      // This is acceptable behavior
    }
  };

  const downloadImage = async (imageData) => {
    try {
      // Fetch the image and create a download link
      const response = await fetch(imageData.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${imageData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi download ảnh:', error);
      alert('Không thể download ảnh. Vui lòng right-click và "Save image as"');
    }
  };

  const copyImageUrl = (imageData) => {
    navigator.clipboard.writeText(imageData.url).then(() => {
      alert('Đã copy URL ảnh!');
    }).catch(error => {
      console.error('Lỗi copy URL:', error);
      
      // Fallback: show URL in prompt
      prompt('Copy URL này:', imageData.url);
    });
  };

  const openImageInNewTab = (imageData) => {
    window.open(imageData.url, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="border-b bg-gray-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">Tạo ảnh với AI</h2>
      </div>

      <div className="p-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-800">Generation Mode</h3>
            <p className="text-sm text-gray-600">
              {useTestMode ? 'Test Mode - Free generation with sample images' : 'Production Mode - High quality images (uses credits)'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useTestMode}
              onChange={(e) => setUseTestMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {useTestMode ? 'Test' : 'Production'}
            </span>
          </label>
        </div>

        <div className="flex space-x-3 mb-6">
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateImage()}
            placeholder="Mô tả ảnh bạn muốn tạo (VD: Một chú mèo dễ thương trong vườn hoa)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isGeneratingImage}
          />
          <button
            onClick={generateImage}
            disabled={isGeneratingImage || !imagePrompt.trim()}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center space-x-2"
          >
            {isGeneratingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            <span>{isGeneratingImage ? 'Đang tạo...' : 'Tạo ảnh'}</span>
          </button>
        </div>

        {/* Credit Management Info */}
        <div className={`border rounded-lg p-4 mb-6 ${
          useTestMode 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <h3 className={`font-medium mb-2 ${
            useTestMode ? 'text-blue-800' : 'text-yellow-800'
          }`}>
            {useTestMode ? '🧪 Test Mode Active' : '💎 Production Mode'}
          </h3>
          <ul className={`text-sm space-y-1 ${
            useTestMode ? 'text-blue-700' : 'text-yellow-700'
          }`}>
            {useTestMode ? (
              <>
                <li>• <strong>Free:</strong> No credit cost</li>
                <li>• <strong>Quality:</strong> Sample/demo images</li>
                <li>• <strong>Speed:</strong> Fast generation</li>
                <li>• <strong>Best for:</strong> Testing prompts and layouts</li>
              </>
            ) : (
              <>
                <li>• <strong>Quality:</strong> High-resolution DALL-E images</li>
                <li>• <strong>Cost:</strong> Uses account credits</li>
                <li>• <strong>Commercial:</strong> Can be used commercially</li>
                <li>• <strong>Auto-fallback:</strong> Switches to test mode if credits low</li>
              </>
            )}
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generatedImages.map((image) => (
            <div key={image.id} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <img
                src={image.url}
                alt={image.prompt}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  console.error('Image load error for:', image.url);
                  e.target.style.opacity = '0.5';
                  e.target.alt = 'Lỗi tải ảnh';
                }}
              />
              
              {/* Hover overlay with action buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition duration-200 flex space-x-2">
                  <button
                    onClick={() => downloadImage(image)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition duration-200"
                    title="Download ảnh"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => openImageInNewTab(image)}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition duration-200"
                    title="Mở ảnh mới"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => copyImageUrl(image)}
                    className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition duration-200"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-200"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{image.prompt}</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    {new Date(image.timestamp).toLocaleDateString('vi-VN')} • {new Date(image.timestamp).toLocaleTimeString('vi-VN')}
                  </p>
                  {image.testMode && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      Test Mode
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {generatedImages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Chưa có ảnh nào được tạo</p>
            <p className="text-sm">Nhập mô tả ảnh và bấm "Tạo ảnh" để bắt đầu</p>
          </div>
        )}

        {/* Storage info */}
        {generatedImages.length > 5 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ <strong>Lưu ý về Storage:</strong> Do giới hạn lưu trữ, chỉ giữ tối đa 10 ảnh gần nhất. 
              Hãy download ảnh quan trọng để lưu trữ lâu dài!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;