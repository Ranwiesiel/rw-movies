import { useState, useEffect, memo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { safeSetItem, safeGetItem, safeRemoveItem, getStorageUsage } from '../utils/StorageHandler'

// Storage utility for image caching with safety mechanisms
const imageStorage = {
    // Safely store an item with auto-cleanup if needed
    safeStore(key, value, timestampKey, timestamp) {
        // Use our new safeSetItem function instead of direct localStorage
        const valueStored = safeSetItem(key, value);
        const timestampStored = safeSetItem(timestampKey, timestamp);
        
        return valueStored && timestampStored;
    },
    
    // Clean up old image cache to make space
    cleanupOldImages() {
        // This function is now redundant as our StorageHandler 
        // automatically manages storage using LRU algorithm,
        // but we'll keep it for compatibility
        console.log("Image cleanup handled by StorageHandler");
    },
    
    // Get the right image size based on screen width
    getImageSize() {
        const width = window.innerWidth;
        if (width <= 640) return 'w154'; // Small screens
        if (width <= 1024) return 'w342'; // Medium screens
        return 'w500'; // Large screens
    }
};

// Global cache for images in memory (current session only)
const memoryImageCache = new Map();

// Image preload queue
const imagePreloadQueue = [];
let isPreloading = false;

// Process the preload queue
const processPreloadQueue = () => {
    if (isPreloading || imagePreloadQueue.length === 0) return;
    
    isPreloading = true;
    const nextItem = imagePreloadQueue.shift();
    
    const img = new Image();
    img.onload = () => {
        isPreloading = false;
        // Continue with the next item
        processPreloadQueue();
    };
    img.onerror = () => {
        isPreloading = false;
        // Continue even if there was an error
        processPreloadQueue(); 
    };
    img.src = nextItem;
};

const ListItem = memo((props) => {
    const [imgSrc, setImgSrc] = useState(null);
    const [thumbnailSrc, setThumbnailSrc] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [highResLoaded, setHighResLoaded] = useState(false);
    const imageRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Type defaults to 'movie' if not specified
    const { type = 'movie' } = props;

    // Use Intersection Observer to detect when item is visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                setIsIntersecting(entry.isIntersecting);
            },
            {
                root: null,
                rootMargin: '200px', // Load images 200px before they enter viewport
                threshold: 0.01
            }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => {
            if (imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, []);
    
    // Load image when item becomes visible
    useEffect(() => {
        if (!isIntersecting || !props.posterPath) return;
        
        // Reset states when poster path changes
        if (!imageLoading) setImageLoading(true);
        if (imageError) setImageError(false);
        setHighResLoaded(false);
        
        // Memory cache check (fastest)
        const memCacheKey = `${props.id}_${props.posterPath}`;
        if (memoryImageCache.has(memCacheKey)) {
            setImgSrc(memoryImageCache.get(memCacheKey));
            setImageLoading(false);
            setHighResLoaded(true);
            return;
        }
        
        // Try to get the image from storage cache (still fast)
        const imageKey = `image_${props.id}`;
        const timestampKey = `${imageKey}_timestamp`;
        
        // Use our new safeGetItem function instead of direct localStorage access
        const cachedImage = safeGetItem(imageKey);
        const cachedTimestamp = safeGetItem(timestampKey);
        const cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (cachedImage && cachedTimestamp) {
            const currentTime = new Date().getTime();
            if (currentTime - cachedTimestamp < cacheExpiry) {
                // Use the cached image if it's still valid
                setImgSrc(cachedImage);
                setImageLoading(false);
                setHighResLoaded(true);
                // Also update memory cache
                memoryImageCache.set(memCacheKey, cachedImage);
                return;
            } else {
                // Remove expired items
                safeRemoveItem(imageKey);
                safeRemoveItem(timestampKey);
            }
        }
        
        // First load a tiny thumbnail version for immediate display
        const thumbnailUrl = `https://image.tmdb.org/t/p/w92${props.posterPath}`;
        setThumbnailSrc(thumbnailUrl);
        
        // Then load the full size image
        const imageSize = imageStorage.getImageSize();
        const fullImageUrl = `https://image.tmdb.org/t/p/${imageSize}${props.posterPath}`;
        
        // Add to preload queue for high-res version
        imagePreloadQueue.push(fullImageUrl);
        processPreloadQueue();
        
        // Cache the image for future use
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
                    
                    // Update memory cache immediately
                    memoryImageCache.set(memCacheKey, base64data);
                    
                    // Set as the displayed image
                    setImgSrc(base64data);
                    setHighResLoaded(true);
                    
                    // Store in storage for persistent caching using our improved utility
                    imageStorage.safeStore(
                        imageKey,
                        base64data,
                        timestampKey, 
                        new Date().getTime()
                    );
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error caching image:', error);
                // If we failed to load the high-res, at least show the thumbnail
                setImgSrc(thumbnailSrc);
            });
    }, [isIntersecting, props.posterPath, props.id, props.title, thumbnailSrc]);

    // Handle thumbnail loading
    useEffect(() => {
        if (!thumbnailSrc) return;
        
        const img = new Image();
        img.onload = () => {
            // When thumbnail loads, show it immediately while waiting for high-res
            if (!highResLoaded) {
                setImgSrc(thumbnailSrc);
                setImageLoading(false);
            }
        };
        img.onerror = handleImageError;
        img.src = thumbnailSrc;
    }, [thumbnailSrc, highResLoaded]);

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };
    
    const handleImageLoad = () => {
        setImageLoading(false);
    };

    // Navigation handler with history tracking
    const handleClick = (e) => {
        const currentPath = location.pathname + location.search;
        
        // Updated to check for search param instead of path
        const isSearchPage = (path) => {
            return path.includes('search=');
        };
        
        if (type === 'movie') {
            if (e.ctrlKey || e.metaKey) {
                window.open(`/movie/${props.id}`, '_blank');
            } else {
                navigate(`/movie/${props.id}`, {
                    state: { 
                        fromPath: currentPath,
                        fromSearch: isSearchPage(currentPath),
                        timestamp: Date.now()
                    }
                });
            }
        } else { // TV show
            if (e.ctrlKey || e.metaKey) {
                window.open(`/tv/${props.id}`, '_blank');
            } else {
                navigate(`/tv/${props.id}`, {
                    state: { 
                        fromPath: currentPath,
                        fromSearch: isSearchPage(currentPath),
                        timestamp: Date.now()
                    }
                });
            }
        }
    };

    // Get title attribute with type-specific wording
    const getAccessibilityTitle = () => {
        return `${type === 'tv' ? 'Watch TV Show' : 'Watch Movie'}: ${props.title}`;
    };

    // Format the rating to show only one decimal if needed
    const formattedRating = props.rating ? 
        props.rating.toFixed(1).replace(/\.0$/, '') : null;

    return (
        <div 
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className='bg-white rounded-lg border border-gray-200 hover:border-blue-300 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col'
            title={getAccessibilityTitle()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
            aria-label={getAccessibilityTitle()}
            ref={imageRef}
        >
            <div className="flex flex-col h-full">
                {/* Image container with overlay effect on hover */}
                <div className="relative overflow-hidden aspect-[2/3]">
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    )}
                    
                    {imgSrc && !imageError ? (
                        <>
                            <img 
                                src={imgSrc} 
                                alt={props.title} 
                                loading="lazy"
                                className={`w-full h-full object-cover transition-transform duration-500 ${
                                    isHovered ? 'scale-110' : 'scale-100'
                                } ${!highResLoaded ? 'blur-sm scale-110' : ''}`}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                style={{ display: imageLoading ? 'none' : 'block' }}
                            />
                            
                            {/* Gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
                                isHovered ? 'opacity-100' : 'opacity-0'
                            }`}></div>
                            
                            {/* Rating on top corner */}
                            {formattedRating && (
                                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center">
                                    <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                    </svg>
                                    <span>{formattedRating}</span>
                                </div>
                            )}
                            
                            {/* Watch button on hover */}
                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                                isHovered ? 'opacity-100' : 'opacity-0'
                            }`}>
                                <div className="bg-blue-600/90 text-white px-4 py-2 rounded-full flex items-center space-x-1 transform transition-transform duration-300 hover:scale-110 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-medium">Watch Now</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <div className="text-gray-500 flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs">No Image Available</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Type indicator - positioned at top right */}
                    <div className="absolute top-2 right-2">
                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium ${
                            type === 'tv' 
                                ? 'bg-indigo-600/80 text-white' 
                                : 'bg-blue-600/80 text-white'
                        }`}>
                            {type}
                        </span>
                    </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-3 flex flex-col">
                    <h3 className='text-base font-semibold mb-1 line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors'>
                        {props.title}
                    </h3>
                    
                    {props.releaseDate && (
                        <div className="mt-auto pt-2">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                {props.releaseDate.split('-')[0] || 'N/A'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
});

ListItem.displayName = 'ListItem';

export default ListItem