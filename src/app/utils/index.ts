
export function getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return ''; // Return an empty string if there's no file extension
    }
    return fileName.slice(lastDotIndex);
}