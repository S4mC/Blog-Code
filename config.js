/**
 * Blog Code Configuration File
 * 
 * This file contains all configuration settings for the blog application.
 * 
 */

/**
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
         * Only domains in this list can serve blog posts.
         * Prevents XSS attacks via URL manipulation.
         * 
         * Note: Relative paths (./posts/file.md) are always allowed for local development
         */
        allowedDomains: [
            "https://s4mc.github.io",
            // Add your own domains here:
            // "https://your-username.github.io",
            // "https://your-custom-domain.com",
        ],

        /**
         * Strict Mode: Only allow posts listed in search.json
         * 
         * When enabled (true):
         * - Only posts that exist in search.json can be loaded
         * - Provides an extra layer of security
         * - Useful for production to prevent direct file access
         * 
         * When disabled (false):
         * - Any file from allowed domains can be loaded
         * - Useful for development and testing
         * 
         * Default: false (disabled)
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
 * Helper function to resolve relative paths to absolute URLs
 * @param {string} path - The path from search.json (can be relative or absolute)
 * @param {boolean} isFilenameOnly - If true, assumes path is just a filename and prepends 'posts/' automatically
 * @returns {string} - Absolute URL
 */
export function resolveContentPath(path, isFilenameOnly = false) {
    // If already an absolute URL (starts with http:// or https://), return as-is
    if (path.match(/^https?:\/\//)) {
        return path;
    }
    
    // If isFilenameOnly is true and path doesn't contain directory separators, prepend 'posts/'
    // This handles cases like: resolveContentPath("myfile.md", true) -> baseUrl/posts/myfile.md
    let processedPath = path;
    if (isFilenameOnly) {
        // Clean any leading ./ or /
        processedPath = path.replace(/^\.?\//, '');
        
        // If the path doesn't already start with 'posts/', prepend it
        if (!processedPath.startsWith('posts/')) {
            processedPath = 'posts/' + processedPath;
        }
    }
    
    // If relative path, combine with contentUrl
    // Remove leading ./ if present
    const cleanPath = processedPath.replace(/^\.\//, '');
    
    // Ensure contentUrl doesn't end with / and path doesn't start with /
    const baseUrl = CONFIG.contentUrl.replace(/\/$/, '');
    const finalPath = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    
    return baseUrl + finalPath;
}
