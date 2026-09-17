import { apiUtil } from './apiUtil';

/**
 * Uploads a file to Cloudinary using a signed URL from the backend.
 * @param {object} file - The file object from document picker (uri, type, name).
 * @param {string} folder - The folder name (optional, default 'general').
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (file, type = 'help') => {
    try {
        // 1. Get Signature from Backend
        // Changed 'folder' to 'type' as per strict documentation
        const signatureRes = await apiUtil.get(`/upload/signature?type=${type}`);

        if (!signatureRes.data.success) {
            throw new Error(signatureRes.data.message || 'Failed to get upload signature');
        }

        const { signature, timestamp, cloud_name, api_key, public_id, folder, ...rest } = signatureRes.data.data;

        // 2. Prepare Form Data for Cloudinary
        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || 'upload.jpg',
        });
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('public_id', public_id);
        
        if (folder) {
            formData.append('folder', folder);
        }

        // Append any other parameters returned by the backend (e.g. resource_type, overwrite)
        Object.keys(rest).forEach(key => {
            if (rest[key]) {
                formData.append(key, rest[key]);
            }
        });

        // 3. Upload directly to Cloudinary - Using 'auto' to support audio/video/image
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                // Note: Don't set Content-Type for FormData, fetch does it automatically with boundary
            },
        });

        const uploadData = await uploadRes.json();

        if (uploadData.secure_url) {
            return uploadData.secure_url;
        } else {
            console.error("Cloudinary Upload Error Details:", JSON.stringify(uploadData, null, 2));
            throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
        }

    } catch (error) {
        console.error("Upload Service Error:", error);
        throw error;
    }
};
