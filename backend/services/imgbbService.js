const axios = require('axios');

const IMGBB_API_KEY = '349e0212aa15e99aa04a1b8c7fcdce49';

const uploadToImgBB = async (fileBuffer) => {
    try {
        // Convert buffer to base64
        const base64Image = fileBuffer.toString('base64');
        
        // Create form data
        const formData = new URLSearchParams();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Image);

        // Make request to ImgBB
        const response = await axios.post('https://api.imgbb.com/1/upload', formData);

        if (response.data.success) {
            return response.data.data.url;
        } else {
            throw new Error('Failed to upload image to ImgBB');
        }
    } catch (error) {
        console.error('ImgBB upload error:', error);
        throw error;
    }
};

module.exports = { uploadToImgBB };