/** This file contains all configuration settings for the blog application.
 * 
 * ----------------------------------------------------------------------------------
 * Start of Configuration
 * ----------------------------------------------------------------------------------
 */

const CONFIG = {
    /**
     * Content Repository Configuration
     * URL where search.json and posts are hosted
     * Use "." for same origin
     * Use full URL for production hosting
     */
    contentUrl: "https://s4mc.github.io/Files/Blog-Code",

    /**
     * Security Configuration
     */
    security: {
        /**
         * Domain Whitelist
         * Only domains in this object can serve blog posts.
         * Prevents XSS attacks via URL manipulation.
         * 
         * Each domain can specify if it allows only markdown files (onlyMarkdown: true/false)
         * 
         * Note: Relative paths (./file.md) are always allowed
         */
        allowedDomains: {
            // Add your own domains here:
            // "https://your-username.github.io": { onlyMarkdown: true },
            // "https://your-custom-domain.com": { onlyMarkdown: false },
            "https://s4mc.github.io": { 
                onlyMarkdown: false
            },
        },

        /**
         * Default Only Markdown: Fallback setting for domains not explicitly configured, for relative paths and for the editor
         * Only markdown posts are allowed and no scripts inside the markdown are executed.
         */
        onlyMarkdown: false,

        /**
         * Strict Mode: Only allow posts listed in search.json
         */
        strictMode: false,
    },

    /**
     * Application Metadata
     */
    app: {
        name: "Blog Code",
        copyright: "© <year> Blog Code", // <year> will be replaced with current year
    },

};


/**
 * ----------------------------------------------------------------------------------
 * End of Configuration
 * ----------------------------------------------------------------------------------
 */


// Export for ES modules
export default CONFIG;

// Also make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.BLOG_CONFIG = CONFIG;
}



/**
 * Check if a domain is allowed and get its configuration
 * @param {string} url - The URL to check
 * @returns {Object|null} - Returns { allowed: boolean, onlyMarkdown: boolean } or null if not allowed
 */
export function isAllowedDomain(url) {
    try {
        // Allow relative paths (local files) with default onlyMarkdown setting
        if (url.startsWith('./') || url.startsWith('../')) {
            return { allowed: true, onlyMarkdown: CONFIG.security.onlyMarkdown };
        }

        const urlObj = new URL(url);
        const origin = urlObj.origin;

        // Check if origin is in allowedDomains
        if (CONFIG.security.allowedDomains[origin]) {
            return {
                allowed: true,
                onlyMarkdown: CONFIG.security.allowedDomains[origin].onlyMarkdown ?? CONFIG.security.onlyMarkdown
            };
        }

        // Check for wildcard
        if (CONFIG.security.allowedDomains['*']) {
            return {
                allowed: true,
                onlyMarkdown: CONFIG.security.allowedDomains['*'].onlyMarkdown ?? CONFIG.security.onlyMarkdown
            };
        }

        return null; // Not allowed
    } catch (e) {
        console.error('[Security] Invalid URL:', url);
        return null;
    }
}



/**
 * Helper function to resolve relative paths to absolute URLs
 * @param {string} path - The path from search.json (can be relative or absolute)
 * @param {boolean} isFilenameOnly - If true, assumes path is just a filename and prepends 'posts/' automatically
 * @returns {string} - Absolute URL
 */
export function resolveContentPath(path) {

    if (!path.endsWith(".html") && !path.endsWith(".md")) {
        path += ".md";
    }

    // If already an absolute URL (starts with http:// or https://), return as-is
    if (path.match(/^https?:\/\//)) {
        return path;
    }
    
    const cleanPath = "posts/" + path.replace(/^\.?\//, '');
    
    // Ensure contentUrl doesn't end with / and path doesn't start with /
    const baseUrl = CONFIG.contentUrl.replace(/\/$/, '');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    
    return baseUrl + finalPath;
}



/**
 * Cache for search.json content
 * Stores the fetched data to avoid multiple requests
 */
let searchJsonCache = null;
let searchJsonPromise = null;

/**
 * Get search.json content with caching
 * Fetches search.json once and caches the result
 * Subsequent calls return the cached data
 * @returns {Promise<Object>} - Promise that resolves to the search.json content
 */
export async function getSearchJson() {
    // If already cached, return cached data
    if (searchJsonCache !== null) {
        return Promise.resolve(searchJsonCache);
    }

    // If fetch is in progress, return the existing promise
    if (searchJsonPromise !== null) {
        return searchJsonPromise;
    }

    // Start new fetch
    searchJsonPromise = fetch(`${CONFIG.contentUrl}/search.json`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Failed to load search.json: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            searchJsonCache = data;
            searchJsonPromise = null;
            return data;
        })
        .catch(err => {
            searchJsonPromise = null;
            console.error('[getSearchJson] Error loading search.json:', err);
            throw err;
        });

    return searchJsonPromise;
}

/**
 * Clear the search.json cache
 * Useful if you need to force a refresh
 */
export function clearSearchJsonCache() {
    searchJsonCache = null;
    searchJsonPromise = null;
}


