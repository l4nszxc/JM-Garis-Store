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

        // Make request to ImgBB with proper timeout
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 15000 // 15 seconds timeout
        });

        if (response.data && response.data.success) {
            return response.data.data.url;
        } else {
            console.error('ImgBB response error:', response.data);
            throw new Error('Failed to upload image to ImgBB: ' + (response.data.error?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('ImgBB upload error:', error.message);
        if (error.response) {
            console.error('ImgBB error response:', error.response.data);
        }
        throw new Error('Image upload service error: ' + error.message);
    }
};

module.exports = { uploadToImgBB };