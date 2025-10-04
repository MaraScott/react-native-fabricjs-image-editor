import { Platform } from 'react-native';

/**
 * Platform-aware file upload utility
 * Uses expo-document-picker for mobile/Expo apps
 * Falls back to standard HTML input for web
 */

// Type definitions for the result
export interface FileUploadResult {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
}

/**
 * Opens file picker and returns selected file information
 * Works on both Expo (mobile/desktop) and web platforms
 * Returns the file content as a string (already read and ready to use)
 */
export async function pickFile(options?: {
    type?: string | string[];
    multiple?: boolean;
}): Promise<FileUploadResult | null> {
    const isExpoApp = Platform.OS !== 'web' || typeof document === 'undefined';

    if (isExpoApp) {
        // Use Expo's document picker for native apps
        const fileInfo = await pickFileExpo(options);
        if (!fileInfo) return null;

        // Read the file content for native platforms
        const content = await readFileContent(fileInfo.uri);
        if (!content) return null;

        // Return with content instead of URI
        return {
            ...fileInfo,
            uri: content, // Replace URI with actual content
        };
    } else {
        // Use HTML input for web (already returns content)
        return pickFileWeb(options);
    }
}

/**
 * Opens image picker and returns selected image file
 * Works on both Expo (mobile/desktop) and web platforms
 * Returns the image as a data URI (base64) ready to be used in an img src
 */
export async function pickImageFile(options?: {
    multiple?: boolean;
}): Promise<FileUploadResult | null> {
    const isExpoApp = Platform.OS !== 'web' || typeof document === 'undefined';

    if (isExpoApp) {
        // Use Expo's document picker for native apps
        const fileInfo = await pickFileExpo({
            type: 'image/*',
            multiple: options?.multiple,
        });
        if (!fileInfo) return null;

        // Read the image as base64 for native platforms
        const base64Content = await readImageAsBase64(fileInfo.uri, fileInfo.mimeType);
        if (!base64Content) return null;

        // Return with base64 data URI
        return {
            ...fileInfo,
            uri: base64Content, // Data URI ready for use
        };
    } else {
        // Use HTML input for web
        return pickImageWeb(options);
    }
}

/**
 * Expo implementation using expo-document-picker
 */
async function pickFileExpo(options?: {
    type?: string | string[];
    multiple?: boolean;
}): Promise<FileUploadResult | null> {
    try {
        // Dynamic import to avoid issues when running on web
        const DocumentPicker = await import('expo-document-picker');

        console.log('[FileUpload] Opening document picker on mobile...');

        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*', // Allow all file types (JSON files might not be recognized on some devices)
            multiple: options?.multiple || false,
            copyToCacheDirectory: true,
        });

        console.log('[FileUpload] Document picker result:', result);

        if (result.canceled || !result.assets || result.assets.length === 0) {
            console.log('[FileUpload] User canceled or no file selected');
            return null;
        }

        const file = result.assets[0];
        console.log('[FileUpload] File selected:', {
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
        });

        return {
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
        };
    } catch (error) {
        console.error('[FileUpload] Error picking file with Expo:', error);
        return null;
    }
}

/**
 * Web implementation using HTML input element
 */
function pickFileWeb(options?: {
    type?: string | string[];
    multiple?: boolean;
}): Promise<FileUploadResult | null> {
    return new Promise((resolve) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options?.multiple || false;

            if (options?.type) {
                const acceptTypes = Array.isArray(options.type) ? options.type : [options.type];
                input.accept = acceptTypes.join(',');
            } else {
                input.accept = 'application/json';
            }

            input.onchange = async (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0];

                if (!file) {
                    resolve(null);
                    return;
                }

                // For web, we need to convert the file to a data URL or blob URL
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        uri: reader.result as string,
                        name: file.name,
                        mimeType: file.type,
                        size: file.size,
                    });
                };
                reader.onerror = () => {
                    console.error('Error reading file:', reader.error);
                    resolve(null);
                };
                reader.readAsText(file);
            };

            input.oncancel = () => {
                resolve(null);
            };

            input.click();
        } catch (error) {
            console.error('Error picking file on web:', error);
            resolve(null);
        }
    });
}

/**
 * Web implementation for image files using HTML input element
 */
function pickImageWeb(options?: { multiple?: boolean }): Promise<FileUploadResult | null> {
    return new Promise((resolve) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options?.multiple || false;
            input.accept = 'image/*';

            input.onchange = async (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0];

                if (!file) {
                    resolve(null);
                    return;
                }

                // For images, we need to convert to data URL (base64)
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        uri: reader.result as string, // Data URL
                        name: file.name,
                        mimeType: file.type,
                        size: file.size,
                    });
                };
                reader.onerror = () => {
                    console.error('[FileUpload] Error reading image:', reader.error);
                    resolve(null);
                };
                reader.readAsDataURL(file); // Read as data URL for images
            };

            input.oncancel = () => {
                resolve(null);
            };

            input.click();
        } catch (error) {
            console.error('[FileUpload] Error picking image on web:', error);
            resolve(null);
        }
    });
}

/**
 * Reads the content of a file URI
 * Handles both Expo file URIs and web data URIs
 */
async function readFileContent(uri: string): Promise<string | null> {
    try {
        const isExpoApp = Platform.OS !== 'web' || typeof document === 'undefined';

        if (isExpoApp) {
            // For Expo, use FileSystem
            console.log('[FileUpload] Reading file content from:', uri);
            const FileSystem = await import('expo-file-system');
            const content = await FileSystem.readAsStringAsync(uri);
            console.log('[FileUpload] File content read successfully, length:', content?.length);
            return content;
        } else {
            // For web, the URI is already the file content (from FileReader.readAsText)
            console.log('[FileUpload] Using web file content, length:', uri?.length);
            return uri;
        }
    } catch (error) {
        console.error('[FileUpload] Error reading file content:', error);
        return null;
    }
}

/**
 * Reads an image file and converts it to base64 data URI
 * For use with native platforms
 */
async function readImageAsBase64(uri: string, mimeType?: string): Promise<string | null> {
    try {
        console.log('[FileUpload] Reading image as base64 from:', uri);
        const FileSystem = await import('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Determine mime type
        const mime = mimeType || 'image/jpeg';

        // Create data URI
        const dataUri = `data:${mime};base64,${base64}`;
        console.log('[FileUpload] Image converted to base64, length:', dataUri?.length);

        return dataUri;
    } catch (error) {
        console.error('[FileUpload] Error reading image as base64:', error);
        return null;
    }
}
