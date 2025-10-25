'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  uploadPreset = 'fan_products', 
  folder = 'fan-products',
  allowPdf = false, // New prop to allow PDF uploads
  label = 'Add Image' // Customizable label
}) {
  const [uploading, setUploading] = useState(false);
  const widgetRef = useRef(null);
  const [fileType, setFileType] = useState(null); // Track if current file is image or pdf
  const [fileName, setFileName] = useState(null); // Track filename for display

  useEffect(() => {
    // Load Cloudinary Upload Widget script
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
    
    // Detect file type and extract filename from URL
    if (currentImageUrl) {
      const isPdf = currentImageUrl.toLowerCase().includes('.pdf') || currentImageUrl.toLowerCase().includes('upload/pdf');
      setFileType(isPdf ? 'pdf' : 'image');
      
      // Extract filename from URL
      try {
        const urlParts = currentImageUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const decodedFileName = decodeURIComponent(fileNameWithExt.split('?')[0]);
        setFileName(decodedFileName);
      } catch (e) {
        setFileName('Uploaded file');
      }
    } else {
      setFileName(null);
    }
  }, [currentImageUrl]);

  function openUploadWidget() {
    if (!window.cloudinary) {
      alert('Cloudinary widget is loading, please try again in a moment.');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    console.log('Cloudinary cloud name:', cloudName);
    console.log('All env vars:', process.env);
    
    if (!cloudName) {
      alert('Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to environment variables.');
      return;
    }

    if (!widgetRef.current) {
      // Determine allowed formats and resource type
      const allowedFormats = allowPdf 
        ? ['jpg', 'jpeg', 'png', 'webp', 'pdf']
        : ['jpg', 'jpeg', 'png', 'webp'];
      
      // Use 'raw' for PDFs to ensure proper access
      const resourceType = allowPdf ? 'raw' : 'image';
      
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset, // Configurable preset
          sources: ['local', 'camera'],
          multiple: false,
          maxFileSize: 10000000, // 10MB max (increased for PDFs)
          clientAllowedFormats: allowedFormats,
          cropping: false, // Optional cropping
          showSkipCropButton: true, // Allow skipping crop
          folder: folder, // Configurable folder
          resourceType: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error('Upload error:', error);
            const errorMsg = error.message || error.statusText || 'Unknown error';
            alert('Upload failed: ' + errorMsg + '\n\nPlease check:\n1. Upload preset "' + uploadPreset + '" exists\n2. Preset is set to "Unsigned"');
            setUploading(false);
            return;
          }

          if (!result) {
            console.error('No result from upload');
            setUploading(false);
            return;
          }

          console.log('Upload event:', result.event);

          if (result.event === 'success') {
            console.log('Upload successful:', result.info);
            if (result.info && result.info.secure_url) {
              onImageUploaded(result.info.secure_url);
              
              // Detect and set file type
              const isPdf = result.info.format === 'pdf' || result.info.resource_type === 'raw';
              setFileType(isPdf ? 'pdf' : 'image');
              
              // Set filename
              const uploadedFileName = result.info.original_filename || result.info.public_id || 'Uploaded file';
              setFileName(`${uploadedFileName}${result.info.format ? '.' + result.info.format : ''}`);
              
              setUploading(false);
              widgetRef.current.close();
            } else {
              console.error('No secure_url in result');
              alert('Upload completed but no URL received');
              setUploading(false);
            }
          }

          if (result.event === 'close') {
            setUploading(false);
          }

          if (result.event === 'abort') {
            setUploading(false);
          }
        }
      );
    }

    setUploading(true);
    widgetRef.current.open();
  }

  function removeImage() {
    if (confirm('Remove this image?')) {
      onImageUploaded(null);
    }
  }

  return (
    <div>
      {currentImageUrl ? (
        <div style={{ display: 'inline-block' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {fileType === 'pdf' ? (
              // PDF Display
              <a
                href={currentImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 150,
                  height: 150,
                  borderRadius: 8,
                  border: '2px solid #e5e7eb',
                  background: '#f3f4f6',
                  textDecoration: 'none',
                  color: '#374151',
                  gap: 8
                }}
              >
                <div style={{ fontSize: 48 }}>📄</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>PDF File</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Click to view</div>
              </a>
            ) : (
              // Image Display
              <Image
                src={currentImageUrl}
                alt="Uploaded file"
                width={150}
                height={150}
                style={{ 
                  borderRadius: 8, 
                  objectFit: 'cover',
                  border: '2px solid #e5e7eb'
                }}
                unoptimized
              />
            )}
            <button
              type="button"
              onClick={removeImage}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Filename display */}
          {fileName && (
            <div style={{ 
              marginTop: 8, 
              fontSize: 12, 
              color: '#4b5563',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              fontWeight: 500
            }}>
              📎 {fileName}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openUploadWidget}
          disabled={uploading}
          style={{
            width: 150,
            height: 150,
            border: '2px dashed #d1d5db',
            borderRadius: 8,
            background: '#f9fafb',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#6b7280',
            fontSize: 14,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.background = '#f9fafb';
          }}
        >
          {uploading ? (
            <>
              <div>⏳</div>
              <div>Uploading...</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32 }}>{allowPdf ? '📎' : '📷'}</div>
              <div style={{ fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {allowPdf ? 'Image or PDF, max 10MB' : 'Square, max 10MB'}
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}

