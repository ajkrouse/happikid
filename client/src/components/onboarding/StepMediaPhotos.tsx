import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info, Camera, Upload } from "lucide-react";
import type { UploadedImage } from "@/types/onboarding";

interface StepMediaPhotosProps {
  uploadedImages: UploadedImage[];
  imageUrlInput: string;
  isDragOver: boolean;
  addImageMutationPending: boolean;
  onImageUrlInputChange: (value: string) => void;
  onAddImageUrl: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveImage: (index: number) => void;
  onSetPrimaryImage: (index: number) => void;
  onUpdateCaption: (index: number, caption: string) => void;
  tips?: string[];
}

export function StepMediaPhotos({
  uploadedImages,
  imageUrlInput,
  isDragOver,
  addImageMutationPending,
  onImageUrlInputChange,
  onAddImageUrl,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveImage,
  onSetPrimaryImage,
  onUpdateCaption,
  tips,
}: StepMediaPhotosProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos & Media
          </CardTitle>
          <CardDescription>Add photos to showcase your facility and programs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragOver ? "text-blue-500" : "text-gray-400"}`} />
            <p className="text-lg font-medium text-brand-evergreen mb-2">
              {isDragOver ? "Drop photos here" : "Upload Photos"}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop photos here, or click to browse (JPG, PNG, GIF up to 5MB)
            </p>
            <input type="file" accept="image/*" multiple onChange={onFileUpload} className="hidden" id="file-upload" />
            <Button variant="outline" type="button" className="pointer-events-none" onClick={(e) => e.stopPropagation()}>
              Choose Photos
            </Button>
          </div>

          <div className="border border-brand-evergreen/10 rounded-lg p-4">
            <Label className="text-sm font-medium mb-2 block">Or add image from URL</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrlInput}
                onChange={(e) => onImageUrlInputChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1"
              />
              <Button onClick={onAddImageUrl} disabled={!imageUrlInput.trim() || addImageMutationPending}>
                {addImageMutationPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          {uploadedImages.length > 0 ? (
            <div>
              <Label className="text-sm font-medium mb-3 block">Uploaded Images</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="relative">
                      <img
                        src={image.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.35em' fill='%23374151'%3EImage Error%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {image.isPrimary && <Badge className="absolute top-2 left-2 bg-action-teal">Primary</Badge>}
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => onRemoveImage(index)}>
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={image.caption}
                        onChange={(e) => onUpdateCaption(index, e.target.value)}
                        placeholder="Add a caption..."
                        className="text-sm"
                      />
                      {!image.isPrimary && (
                        <Button variant="outline" size="sm" onClick={() => onSetPrimaryImage(index)} className="w-full">
                          Set as Primary
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Add some photos to make your profile more appealing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {tips && tips.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900">Pro Tips</span>
            </div>
            <ul className="text-sm text-purple-700 space-y-1">
              {tips.map((tip, i) => <li key={i}>• {tip}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
