import { useState, useRef } from "react";
import { Button } from "./button";
import { Upload, Camera, X, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  allowCamera?: boolean;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  accept = "image/*,application/pdf",
  multiple = false,
  maxSize = 10,
  allowCamera = false,
  onFilesSelected,
  className,
  children
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
    }
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    try {
      const fileArray = Array.from(files);
      fileArray.forEach(validateFile);
      
      const newFiles = multiple ? [...selectedFiles, ...fileArray] : fileArray;
      setSelectedFiles(newFiles);
      onFilesSelected?.(newFiles);
    } catch (error) {
      console.error("File validation error:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected?.(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "file-upload border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragOver ? "border-blue-400 bg-blue-400/10" : "border-white/30 hover:border-blue-400",
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        {children || (
          <>
            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2 text-white">Arraste ficheiros aqui</p>
            <p className="text-blue-300 mb-4">ou clique para selecionar</p>
            <div className="flex justify-center space-x-4">
              <Button
                type="button"
                className="bg-gradient-primary hover:shadow-glow"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                Selecionar Ficheiros
              </Button>
              {allowCamera && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-glass bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCamera();
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Câmera
                </Button>
              )}
            </div>
            <p className="text-xs text-blue-300 mt-4">
              {accept.includes('image') && 'JPG, PNG'} 
              {accept.includes('pdf') && ', PDF'} até {maxSize}MB
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {allowCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="camera"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-white">Ficheiros selecionados:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-blue-300">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
