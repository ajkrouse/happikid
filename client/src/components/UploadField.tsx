import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileImage, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function UploadField({
  label,
  value = "",
  onChange,
  accept = "image/*",
  maxSizeMB = 5,
  required = false,
  placeholder = "No file selected",
  className
}: UploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return "Please select an image file";
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64 data URL for now
      // In a real app, this would upload to a cloud storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setIsUploading(false);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded`
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "Failed to read the file",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the file",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <Label className="text-base font-medium">
        {label} {required && "*"}
      </Label>
      <p className="text-sm text-gray-600 mb-3">
        Upload an image file (max {maxSizeMB}MB)
      </p>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${value ? 'bg-green-50 border-green-300' : 'hover:border-gray-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          data-testid={`input-upload-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />

        {!value ? (
          <div className="text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              {isDragging ? "Drop file here" : "Drag & drop a file here, or"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={isUploading}
              data-testid={`button-browse-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              Browse Files
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPG, PNG, GIF • Max size: {maxSizeMB}MB
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FileImage className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-700">File uploaded</span>
            </div>
            
            {/* Preview for image files */}
            {value.startsWith('data:image/') && (
              <img
                src={value}
                alt="Preview"
                className="max-w-32 max-h-32 mx-auto rounded border mb-2"
              />
            )}
            
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                disabled={isUploading}
                data-testid={`button-replace-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Replace File
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isUploading}
                data-testid={`button-remove-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Validation warning */}
      {required && !value && (
        <div className="flex items-center gap-1 mt-2 text-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs">This field is required</span>
        </div>
      )}
    </div>
  );
}