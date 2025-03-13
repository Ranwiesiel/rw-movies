// Function to get cached image or fetch it
const getImageFromCache = (imgPath) => {
    const cacheKey = `img_cache_${imgPath}`;
    const cachedImg = localStorage.getItem(cacheKey);

    if (cachedImg) {
        try {
            const cacheData = JSON.parse(cachedImg);
            
            // Check if cache has expired
            if (cacheData.expiry > Date.now()) {
                return cacheData.data; // Return cached image
            } else {
                localStorage.removeItem(cacheKey); // Remove expired cache
            }
        } catch (_) {
            localStorage.removeItem(cacheKey); // Remove invalid cache
        }
    }

    return null; // No valid cache found
};

export default getImageFromCache