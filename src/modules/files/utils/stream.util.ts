import type { Readable } from 'node:stream';

export async function readToBuffer(stream: Readable, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);

    total += buffer.length;

    if (total > maxBytes) {
      stream.destroy();

      throw new RangeError(`Object exceeds the ${maxBytes}-byte bound.`);
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}
