import React, { useState, useRef } from 'react';
import { Upload, Image, Camera, FileText, Loader2, Trash2, Download, Eye } from 'lucide-react';

const ImageUploadComponent = ({ selectedModel, onSendMessage }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = [...e.dataTransfer.files];
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = [...e.target.files];
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }

    setIsUploading(true);
    
    for (const file of imageFiles) {
      try {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Convert file to base64 for AI analysis
        const base64 = await fileToBase64(file);
        
        // Upload to Puter cloud for storage
        const uploadedFile = await window.puter.fs.upload([file]);
        
        console.log('Upload response:', uploadedFile); // Debug
        
        // Get the file path from Puter response
        let filePath = '';
        if (Array.isArray(uploadedFile) && uploadedFile.length > 0) {
          filePath = uploadedFile[0].path || uploadedFile[0].name;
        } else if (uploadedFile.path) {
          filePath = uploadedFile.path;
        } else {
          filePath = uploadedFile.name || file.name;
        }
        
        const imageData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl: previewUrl,
          filePath: filePath,
          base64: base64, // For AI analysis
          uploadedFile: uploadedFile, // Store full response
          uploadedAt: new Date()
        };
        
        setUploadedImages(prev => [...prev, imageData]);
      } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        alert(`Lỗi upload ${file.name}: ${error.message}`);
      }
    }
    
    setIsUploading(false);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async (imageData, prompt = "Hãy mô tả chi tiết những gì bạn thấy trong ảnh này") => {
    setIsAnalyzing(true);
    
    try {
      const analysisPrompt = `${prompt}\n\n[Phân tích ảnh: ${imageData.name}]`;
      
      console.log('Analyzing image with base64...'); // Debug
      
      // Use base64 data for AI analysis (more reliable)
      const response = await window.puter.ai.chat(analysisPrompt, imageData.base64, {
        model: selectedModel
      });
      
      // Process response
      let aiResponseText = '';
      if (typeof response === 'string') {
        aiResponseText = response;
      } else if (response && response.message && response.message.content) {
        if (Array.isArray(response.message.content)) {
          aiResponseText = response.message.content[0]?.text || response.message.content[0];
        } else {
          aiResponseText = response.message.content;
        }
      } else if (response && response.content) {
        aiResponseText = response.content;
      } else {
        aiResponseText = 'AI đã phản hồi nhưng không thể hiển thị nội dung.';
      }
      
      // Send analysis result as message
      if (onSendMessage) {
        onSendMessage(analysisPrompt, aiResponseText, imageData);
      }
      
    } catch (error) {
      console.error('Lỗi phân tích ảnh:', error);
      
      // Try fallback with different approach
      try {
        console.log('Trying fallback analysis...');
        const fallbackResponse = await window.puter.ai.chat(
          `Phân tích ảnh: ${imageData.name}. ${prompt}. 
          
          Lưu ý: Không thể tải ảnh trực tiếp, vui lòng mô tả nội dung ảnh này dựa trên tên file hoặc thử upload ảnh khác với định dạng JPG/PNG.`, {
          model: selectedModel
        });
        
        if (onSendMessage) {
          onSendMessage(
            `Phân tích ảnh: ${imageData.name}`, 
            `⚠️ Không thể phân tích ảnh trực tiếp.\n\n${fallbackResponse}`, 
            imageData
          );
        }
      } catch (fallbackError) {
        if (onSendMessage) {
          onSendMessage(
            `Phân tích ảnh: ${imageData.name}`, 
            `❌ Lỗi phân tích ảnh: ${error.message}\n\n💡 Thử:\n- Sử dụng ảnh định dạng JPG/PNG\n- Chọn model khác (GPT-4o, Claude Vision)\n- Upload ảnh kích thước nhỏ hơn`, 
            imageData
          );
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractText = async (imageData) => {
    setIsAnalyzing(true);
    
    try {
      console.log('Extracting text using img2txt...'); // Debug
      
      // Use base64 for OCR
      const extractedText = await window.puter.ai.img2txt(imageData.base64);
      
      const ocrResult = extractedText || 'Không tìm thấy text trong ảnh';
      const prompt = `Trích xuất text từ ảnh: ${imageData.name}`;
      
      if (onSendMessage) {
        onSendMessage(prompt, `**Text được trích xuất:**\n\n${ocrResult}`, imageData);
      }
      
    } catch (error) {
      console.error('Lỗi OCR:', error);
      
      // Fallback: use vision model for text extraction
      try {
        console.log('OCR failed, using vision model...');
        const response = await window.puter.ai.chat(
          "Trích xuất tất cả text có trong ảnh này. Chỉ trả về text được tìm thấy, không thêm giải thích gì khác.", 
          imageData.base64, 
          { model: selectedModel }
        );
        
        // Process vision response
        let extractedText = '';
        if (typeof response === 'string') {
          extractedText = response;
        } else if (response && response.message && response.message.content) {
          extractedText = Array.isArray(response.message.content) 
            ? response.message.content[0]?.text || response.message.content[0]
            : response.message.content;
        } else {
          extractedText = 'Không thể trích xuất text bằng vision model';
        }
        
        if (onSendMessage) {
          onSendMessage(
            `OCR ảnh: ${imageData.name}`, 
            `**Text được trích xuất (via Vision):**\n\n${extractedText}`, 
            imageData
          );
        }
        
      } catch (fallbackError) {
        if (onSendMessage) {
          onSendMessage(
            `OCR ảnh: ${imageData.name}`, 
            `❌ Lỗi trích xuất text: ${error.message}\n\n💡 Thử:\n- Ảnh có text rõ ràng hơn\n- Định dạng JPG/PNG\n- Model khác có vision capability`, 
            imageData
          );
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // Cleanup preview URLs
      const removed = prev.find(img => img.id === imageId);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return filtered;
    });
  };

  const downloadImage = async (imageData) => {
    try {
      const link = document.createElement('a');
      link.href = imageData.previewUrl;
      link.download = imageData.name;
      link.click();
    } catch (error) {
      console.error('Lỗi download:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition duration-200 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className="flex justify-center">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-gray-600 font-medium">
              {isUploading ? 'Đang upload...' : 'Upload ảnh để phân tích'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Kéo thả ảnh vào đây hoặc click để chọn file
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Hỗ trợ: JPG, PNG, GIF, WebP • Tối đa 30MB
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition duration-200"
          >
            Chọn ảnh
          </button>
        </div>
      </div>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Ảnh đã upload ({uploadedImages.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={image.previewUrl}
                    alt={image.name}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Image Info */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-800 truncate">{image.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(image.size)} • {new Date(image.uploadedAt).toLocaleString('vi-VN')}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => analyzeImage(image)}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-1 bg-purple-500 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-600 disabled:opacity-50 transition duration-200"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span>Phân tích</span>
                    </button>
                    
                    <button
                      onClick={() => extractText(image)}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 disabled:opacity-50 transition duration-200"
                    >
                      <FileText className="h-4 w-4" />
                      <span>OCR</span>
                    </button>
                    
                    <button
                      onClick={() => downloadImage(image)}
                      className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition duration-200"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {uploadedImages.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Phân tích nhanh</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Mô tả chi tiết', prompt: 'Hãy mô tả rất chi tiết những gì bạn thấy trong ảnh này, bao gồm màu sắc, đối tượng, bối cảnh và cảm xúc' },
              { label: 'Trích xuất text', action: 'ocr' },
              { label: 'Phân tích biểu đồ', prompt: 'Phân tích biểu đồ/chart trong ảnh này và giải thích ý nghĩa của dữ liệu' },
              { label: 'Tìm lỗi code', prompt: 'Kiểm tra code trong ảnh này và tìm ra các lỗi hoặc cải tiến có thể' }
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  const lastImage = uploadedImages[uploadedImages.length - 1];
                  if (action.action === 'ocr') {
                    extractText(lastImage);
                  } else {
                    analyzeImage(lastImage, action.prompt);
                  }
                }}
                disabled={isAnalyzing || uploadedImages.length === 0}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 disabled:opacity-50 transition duration-200"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadComponent;