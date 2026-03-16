const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const WEBP_RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46];

function startsWithSignature(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[offset + index] === value);
}

export function matchesFileSignature(buffer: Buffer, mimeType: string): boolean {
  const bytes = new Uint8Array(buffer);

  switch (mimeType) {
    case "image/jpeg":
      return startsWithSignature(bytes, JPEG_SIGNATURE);
    case "image/png":
      return startsWithSignature(bytes, PNG_SIGNATURE);
    case "image/webp":
      return (
        startsWithSignature(bytes, WEBP_RIFF_SIGNATURE) &&
        startsWithSignature(bytes, WEBP_WEBP_SIGNATURE, 8)
      );
    case "application/pdf":
      return startsWithSignature(bytes, PDF_SIGNATURE);
    default:
      return false;
  }
}
