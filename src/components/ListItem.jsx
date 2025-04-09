import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Storage utility for image caching with safety mechanisms
const imageStorage = {
    // Safely store an item with auto-cleanup if needed
    safeStore(key, value, timestampKey, timestamp) {
        try {
            localStorage.setItem(key, value);
            localStorage.setItem(timestampKey, timestamp);
            return true;
        } catch (e) {
            console.warn('Image cache quota exceeded, cleaning up old images...');
            // If storage is full, try to clean up and retry
            if (e.name === 'QuotaExceededError' || e.code === 22 || 
                e.code === 1014 || // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    
                this.cleanupOldImages();
                
                // Try one more time
                try {
                    localStorage.setItem(key, value);
                    localStorage.setItem(timestampKey, timestamp);
                    return true;
                } catch (e2) {
                    console.error('Failed to cache image after cleanup:', e2);
                    return false;
                }
            }
            return false;
        }
    },
    
    // Clean up old image cache to make space
    cleanupOldImages() {
        const keysToCheck = [];
        
        // Find all image cache entries
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('image_') && !key.endsWith('_timestamp')) {
                const timestampKey = `${key}_timestamp`;
                const timestamp = localStorage.getItem(timestampKey);
                
                if (timestamp) {
                    keysToCheck.push({
                        key,
                        timestampKey,
                        time: parseInt(timestamp, 10)
                    });
                }
            }
        }
        
        if (keysToCheck.length === 0) return;
        
        // Sort by age (oldest first)
        keysToCheck.sort((a, b) => a.time - b.time);
        
        // Remove oldest 40% of images
        const removeCount = Math.ceil(keysToCheck.length * 0.4);
        for (let i = 0; i < removeCount; i++) {
            if (i < keysToCheck.length) {
                localStorage.removeItem(keysToCheck[i].key);
                localStorage.removeItem(keysToCheck[i].timestampKey);
            }
        }
    },
    
    // Limit image size by reducing quality or dimensions if needed
    optimizeImageData(base64Data, maxSizeKB = 50) {
        // If the image is already small enough, return it as is
        const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
        if (estimatedSize <= maxSizeKB * 1024) {
            return base64Data;
        }
        
        return base64Data; // In real implementation, you'd resize the image here
    }
};

const ListItem = (props) => {
    const [imgSrc, setImgSrc] = useState(null);
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();
    
    // Type defaults to 'movie' if not specified
    const { type = 'movie' } = props;
    
    useEffect(() => {
        if (!props.posterPath) return;
        
        // Try to get the image from localStorage first
        const imageKey = `image_${props.id}`;
        const cachedImage = localStorage.getItem(imageKey);
        const cachedTimestamp = localStorage.getItem(`${imageKey}_timestamp`);
        const cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (cachedImage && cachedTimestamp) {
            const currentTime = new Date().getTime();
            if (currentTime - parseInt(cachedTimestamp) < cacheExpiry) {
                // Use the cached image if it's still valid
                setImgSrc(cachedImage);
                return;
            }
        }
        
        // If no valid cached image, load from TMDB
        const fullImageUrl = `https://image.tmdb.org/t/p/w500${props.posterPath}`;
        setImgSrc(fullImageUrl);
        
        // Cache the image for future use with a reduced size/quality
        fetch(fullImageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                // Only store images smaller than 300KB to avoid quota issues
                if (blob.size > 300 * 1024) {
                    console.log(`Image for ${props.title} too large (${Math.round(blob.size/1024)}KB), not caching`);
                    return;
                }
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    // Store the image data with safeguards
                    imageStorage.safeStore(
                        imageKey,
                        base64data,
                        `${imageKey}_timestamp`, 
                        new Date().getTime().toString()
                    );
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error caching image:', error);
            });
    }, [props.posterPath, props.id, props.title]);

    const handleImageError = () => {
        setImageError(true);
    };

    // Handle different types (movie or tv)
    const handleClick = () => {
        if (type === 'movie') {
            // For movies, open directly
            window.open(`https://embed.su/embed/movie/${props.id}`, '_blank');
        } else {
            // For TV shows, navigate to the details page
            navigate(`/tv-shows/${props.id}`);
        }
    };

    return (
        <div 
            onClick={handleClick}
            className='bg-white rounded-md border-[1.5px] border-stone-200 p-4 hover:bg-yellow-50 hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col'
        >
            <div className="flex flex-col h-full">
                <div className="mb-3 flex justify-center">
                    {imgSrc && !imageError ? (
                        <img 
                            src={imgSrc} 
                            alt={props.title} 
                            loading="lazy"
                            className="h-64 object-cover rounded shadow-sm" 
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="h-64 w-full bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className='text-lg font-semibold mb-1 line-clamp-2'>{props.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                        {props.rating && (
                            <div className="flex items-center">
                                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span className='text-sm font-semibold'>{props.rating.toFixed(1)}</span>
                            </div>
                        )}
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{props.releaseDate?.split('-')[0] || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ListItem