import { fileTypeFromBuffer } from 'file-type';

export async function detectContentType(head: Uint8Array): Promise<string | null> {
  const detected = await fileTypeFromBuffer(head);

  return detected?.mime ?? null;
}
