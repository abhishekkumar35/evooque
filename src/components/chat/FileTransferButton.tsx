import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fileTransferService } from '@/lib/webrtc/file-transfer';
import { useToastStore } from '@/components/ui/toast';
import { FileValidationService } from '@/lib/file/file-validation';

interface FileTransferButtonProps {
  peerId: string;
  className?: string;
}

export function FileTransferButton({ peerId, className }: FileTransferButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((state) => state.addToast);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file
      FileValidationService.validateFile(file);

      // Sanitize file name
      const sanitizedName = FileValidationService.sanitizeFileName(file.name);
      const safeFile = new File([file], sanitizedName, { type: file.type });

      // Calculate checksum for integrity verification
      const checksum = await FileValidationService.calculateChecksum(safeFile);

      await fileTransferService.sendFile(peerId, safeFile, checksum);
      addToast({
        type: 'info',
        message: `Starting file transfer: ${sanitizedName}`,
        duration: 3000,
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: (error as Error).message || 'Failed to send file',
        duration: 5000,
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept={FileValidationService.DEFAULT_ALLOWED_TYPES.join(',')}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="ghost"
        size="icon"
        className={className}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
    </>
  );
} 