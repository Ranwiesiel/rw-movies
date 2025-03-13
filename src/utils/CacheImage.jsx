// Function to cache images in localStorage
const CacheImage = (imgPath, imgUrl) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for CORS policy
        img.onload = () => {
            try {
                // Create canvas to convert image to base64
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Get base64 representation
                const dataURL = canvas.toDataURL('image/jpeg');
                
                // Store in localStorage with expiry (1 day)
                const cacheItem = {
                    data: dataURL,
                    expiry: Date.now() + (24 * 60 * 60 * 1000)
            };
            localStorage.setItem(`img_cache_${imgPath}`, JSON.stringify(cacheItem));
            resolve(dataURL);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = (err) => reject(err);
        img.src = imgUrl;
    });
};


export default CacheImage