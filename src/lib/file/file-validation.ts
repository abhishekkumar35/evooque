export interface FileValidationRules {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export class FileValidationService {
  private static readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ];

  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.dll', '.bat', '.cmd', '.sh', '.js',
    '.vbs', '.ps1', '.msi', '.com', '.scr', '.jar'
  ];

  static validateFile(file: File, rules?: FileValidationRules): void {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES,
      allowedExtensions,
    } = rules || {};

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${this.formatSize(maxSize)} limit`);
    }

    // Check file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2);
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      throw new Error('File type not supported');
    }

    // Check file extension
    const extension = this.getFileExtension(file.name).toLowerCase();
    
    // Check for dangerous extensions
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      throw new Error('This file type is not allowed for security reasons');
    }

    // Check allowed extensions if specified
    if (allowedExtensions && !allowedExtensions.includes(extension)) {
      throw new Error('File extension not supported');
    }
  }

  static sanitizeFileName(fileName: string): string {
    // Remove any path traversal attempts
    const name = fileName.replace(/^.*[\\\/]/, '');
    
    // Remove any non-alphanumeric characters except for dots and dashes
    return name.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  private static getFileExtension(fileName: string): string {
    return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
} 