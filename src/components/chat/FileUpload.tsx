import { useState, useRef } from 'react';
import { Paperclip, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { FileService } from '@/lib/file/file-service';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export function FileUpload({ onFileSelect, className }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 50MB limit');
    }

    const isAllowed = ALLOWED_TYPES.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -2));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      throw new Error('File type not supported');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFile(file);
      setSelectedFile(file);
      onFileSelect(file);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setSelectedFile(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />

      {selectedFile ? (
        <div className="flex items-center gap-2 rounded-lg bg-dark-100 p-2">
          <File className="h-4 w-4 text-primary-500" />
          <span className="text-sm text-white">{selectedFile.name}</span>
          <span className="text-xs text-gray-400">
            ({FileService.formatFileSize(selectedFile.size)})
          </span>
          <Button
            onClick={clearFile}
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          className="absolute bottom-full left-0 mb-2 w-64"
        />
      )}
    </div>
  );
} 