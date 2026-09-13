import React, { useState, useRef } from 'react';
import { Image, Upload, X, Download, Eye, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

export default function ImageShare({
  isOpen,
  onClose,
  sharedImages,
  onSendImage,
  userName,
  isConnected
}) {
  const [isSending, setIsSending] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB', 'warning');
      return;
    }

    setIsSending(true);
    showToast('Sending photo to partner...', 'info');

    try {
      const res = await onSendImage(file, userName);
      if (res?.success) {
        showToast('Photo shared successfully! 💕', 'success');
      } else {
        showToast('Failed to share photo', 'error');
      }
    } catch (err) {
      showToast('Error sharing photo', 'error');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const syntheticEvent = { target: { files: [file] } };
      handleFileChange(syntheticEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col glass-strong shadow-2xl border-l border-white/15 bg-black/70 backdrop-blur-2xl animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Image size={18} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Shared Moments</h3>
              <p className="text-[11px] text-white/50">Send photos in real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="p-4 border-b border-white/10">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-rose-400/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white/5 hover:bg-white/10 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-rose-500/10 group-hover:bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2 transition-colors">
              <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs font-medium text-white/90">
              {isSending ? 'Sending photo...' : 'Click or drop a photo to send'}
            </p>
            <p className="text-[10px] text-white/40 mt-1">PNG, JPG, WEBP up to 5MB</p>
          </div>
        </div>

        {/* Gallery of Moments */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-xs font-medium text-rose-200/80 mb-3 flex items-center gap-1.5">
            <Sparkles size={13} /> Photo Gallery ({sharedImages?.length || 0})
          </h4>

          {!sharedImages || sharedImages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-white/40 space-y-2">
              <Image size={28} className="text-rose-500/30" />
              <p className="text-xs">No photos shared yet during this call.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {sharedImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-xl overflow-hidden glass border border-white/15 cursor-pointer shadow-md"
                  onClick={() => setSelectedPhoto(img)}
                >
                  <img
                    src={img.url}
                    alt={img.fileName || 'Shared'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Eye size={16} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white/80 truncate">
                    {img.isMe ? 'You' : img.senderName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Lightbox View */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="absolute top-5 right-5 flex items-center gap-3">
            <a
              href={selectedPhoto.url}
              download={selectedPhoto.fileName || 'couple-photo.jpg'}
              className="p-2.5 rounded-full glass hover:bg-white/20 text-white transition-colors"
              title="Download Photo"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-2.5 rounded-full glass hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/15">
            <img
              src={selectedPhoto.url}
              alt="Moment"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
          <p className="text-white/60 text-xs mt-3">
            Sent by {selectedPhoto.isMe ? 'You' : selectedPhoto.senderName}
          </p>
        </div>
      )}
    </>
  );
}
