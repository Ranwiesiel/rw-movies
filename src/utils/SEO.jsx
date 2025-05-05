import { Helmet } from 'react-helmet-async';

/**
 * SEO component for managing document head tags
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} [props.keywords] - Page keywords (comma separated)
 * @param {string} [props.image] - OG image URL
 * @param {string} [props.url] - Canonical URL
 * @returns {JSX.Element} SEO component
 */
const SEO = ({ 
  title, 
  description, 
  keywords = 'movies, tv shows, entertainment',
  image = '/og-image.jpg',
  url = window.location.href 
}) => {
  const siteTitle = 'RanwUse Movies & TV Shows';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  
  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph (Facebook) meta tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical link */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;