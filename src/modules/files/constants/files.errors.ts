export const FILE_ERROR_MESSAGE = {
  NOT_FOUND: 'File not found.',

  PURPOSE_NOT_ALLOWED: 'This kind of file cannot be uploaded here.',

  TYPE_NOT_ALLOWED: (allowed: string): string => `This file type is not allowed. Use ${allowed}.`,

  TOO_LARGE: (maximum: string): string => `The file is too large. The maximum is ${maximum}.`,

  TOO_MANY_UNATTACHED:
    'You have too many unfinished uploads. Use or remove some before uploading more.',

  QUOTA_EXCEEDED: 'This workspace has run out of storage.',

  NOT_UPLOADED: 'The file has not been uploaded yet.',

  SIZE_MISMATCH: 'The uploaded file does not match its declared size. Please upload it again.',

  REJECTED: 'This file was rejected and cannot be used.',

  PURPOSE_MISMATCH: 'This file cannot be used here.',

  NOT_ATTACHABLE: 'This file is not ready to be used yet.',

  ALREADY_ATTACHED: 'This file is already in use.',
} as const;
