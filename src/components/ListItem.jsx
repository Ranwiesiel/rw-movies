// import cacheImage from '../utils/CacheImage'
// import getImageFromCache from '../utils/GetImageCache'
import { useState, useEffect } from 'react'

const ListItem = (props) => {
    const [imgSrc, setImgSrc] = useState(null);
    
    // useEffect(() => {
        // if (!props.coverUrl) return;
        
        // const posterPath = props.coverUrl;
        // const fullImageUrl = `https://image.tmdb.org/t/p/w92${posterPath}`;
        
        // Try to get from cache first
        // const cachedImage = getImageFromCache(posterPath);
        
        // if (cachedImage) {
        //     setImgSrc(cachedImage);
        // } else {
        //     // If not in cache, fetch and cache it
        //     cacheImage(posterPath, fullImageUrl)
        //         .then(dataUrl => setImgSrc(dataUrl))
        //         .catch(() => setImgSrc(fullImageUrl)); // Fallback to direct URL
        // }
    // }, [props.coverUrl]);

    return (
        <div 
            onClick={() => window.open(`https://embed.su/embed/movie/${props.id}`, '_blank')}
            className='bg-white rounded-md border-[1.5px] border-stone-200 px-4 py-4 sm:py-2 hover:bg-yellow-50 hover:text-black cursor-pointer'
        >
            <div className="flex items-center">
                {/* {imgSrc && <img src={imgSrc} alt={props.title} className="w-12 h-16 mr-3 object-cover rounded" />} */}
                <div>
                    <p className='text-sm sm:text-md font-semibold'>{props.title}</p>
                    {props.rating && <p className='text-xs text-gray-600'>Rating: {props.rating}/10</p>}
                </div>
            </div>
        </div>
    )
}

export default ListItem