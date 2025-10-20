import { html } from "htm/preact";

// Variable to maintain a reference to the active instance
let sidebarInstance = null;

// Function to initialize the sidebar
export function initSidebar(data) {
    // If an instance already exists, update the data
    if (sidebarInstance) {
        sidebarInstance.updateData(data);
        return sidebarInstance;
    }
    
    // Check that elements exist before creating the instance
    if (document.getElementById('sidebar')) {
        sidebarInstance = new SidebarClass(data);
        return sidebarInstance;
    } else {
        console.error("Could not initialize sidebar: DOM elements not found");
        return null;
    }
}

export function Sidebar() {
    return html`        
        <div class="sidebar-overlay" id="sidebarOverlay"></div>

        <div class="sidebar-component open" id="sidebar">
            <div class="sidebar-header">
                <div class="search-container">
                    <input type="text" autocomplete="off" class="search-input" placeholder="Search..." id="sidebarSearchInput"/>
                    <button class="clear-button" id="clearButton">×</button>
                </div>
                <div class="search-controls" id="searchControls">
                    <button class="nav-button" id="prevBtn">◀ Previous</button>
                    <button class="nav-button" id="nextBtn">Next ▶</button>
                    <span class="search-counter" id="searchCounter">0/0</span>
                </div>
            </div>

            <div class="sidebar-content" id="sidebarContent">
                <!-- Content will be generated dynamically -->
            </div>
        </div>
    `;
}

// Function to find the correct element in the DOM
function findDOMElement(result, data) {
    
    const entryContent = document.getElementsByClassName("entry-content")[0];
    if (!entryContent) {
        console.error("Entry-content container not found");
        return null;
    }

    const section = data.find(s => s.id === result.sectionId);
    if (!section) {
        console.error("Section not found with ID:", result.sectionId);
        return null;
    }
    
    if (result.type === 'section') {
        // For sections (##), search directly by ID
        const element = document.getElementById(result.sectionId);
        return element;
    } else if (result.type === 'item') {
        // For items (###), find by specific ID
        const item = section.items.find(i => i.id === result.itemId);
        if (!item) {
            console.error("Item not found with ID:", result.itemId);
            return null;
        }
        
        const sectionIndex = parseInt(result.sectionId.split('-')[1]);
        const itemIndex = section.items.indexOf(item);
        
        // The h3 element ID follows the format section-X-item-Y
        const itemId = `section-${sectionIndex}-item-${itemIndex}`;
        const element = document.getElementById(itemId);
        return element;
    } else if (result.type === 'subitem') {
        // For subitems (H4-H6)
        const item = section.items.find(i => i.id === result.itemId);
        if (!item || !item.subitems) {
            console.error("Parent item not found or has no subitems:", result.itemId);
            return null;
        }
        
        const subitem = item.subitems.find(s => s.id === result.subitemId);
        if (!subitem) {
            console.error("Subitem not found with ID:", result.subitemId);
            return null;
        }
        
        // Use the stored domId if available
        const subitemId = subitem.domId || 
            `section-${parseInt(result.sectionId.split('-')[1])}-item-${section.items.indexOf(item)}-subitem-${item.subitems.indexOf(subitem)}`;
        let element = document.getElementById(subitemId);
        
        // If we didn't find it with the expected ID, try searching by level and title
        if (!element && subitem.level) {
            
            // Search for all headers of the corresponding level
            const possibleElements = Array.from(document.querySelectorAll(`h${subitem.level}`));
            
            // Filter by similar content
            const titleNormalized = subitem.title.toLowerCase().trim();
            const match = possibleElements.find(el => 
                el.textContent.toLowerCase().trim() === titleNormalized);
            
            if (match) {
                element = match;
            }
        }
        
        return element;
    }
}

// Sidebar:
class SidebarClass {
    constructor(data) {
        this.data = this.processData(data);
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.actualHighlightedTimeout = null;
        this.actualHighlightedElement = null;
        
        // Initialize directly (we already verified sidebar existence in initSidebar)
        this.init();
    }

    init() {
        // Since initSidebar already verified the existence of 'sidebar', we only check other elements
        
        this.render();
        this.bindEvents();
        this.setupScrollSpy();
        
        // Initialize sidebar state according to screen size
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }
    
    updateData(newData) {
        // Process the new data
        this.data = this.processData(newData);

        // Clear active search if it exists
        this.clearSearch();

        // Re-render with the new data
        this.render();
    }


    processData(data) {
        const sections = [];
        let currentSection = null;
        let currentItem = null;

        data.forEach(item => {
            if (item.startsWith('## ')) {
                // If there's an active section, save it
                if (currentSection) sections.push(currentSection);
                
                // Check if the item contains a path marker (for index.html folders)
                let title = item.replace(/^##\s*/, '');
                let folderPath = null;
                
                if (title.includes('|||')) {
                    const parts = title.split('|||');
                    title = parts[0];
                    folderPath = parts[1];
                }
                
                // Create a new section (H2)
                currentSection = {
                    id: `section-${sections.length}`,
                    title: title,
                    folderPath: folderPath, // Store the full folder path
                    items: [],
                    expanded: false
                };
                currentItem = null;
            } else if (item.startsWith('### ') && currentSection) {
                // Create a new item (H3) within the current section
                currentItem = {
                    id: `item-${currentSection.items.length}`,
                    title: item.replace(/^###\s*/, ''),
                    subitems: [] // For H4, H5, H6
                };
                currentSection.items.push(currentItem);
            } else if (item.startsWith('#### ') && currentSection && currentItem) {
                // H4 is added as subitem of an H3
                const sectionIndex = sections.length;
                const itemIndex = currentSection.items.length - 1;
                const subitemIndex = currentItem.subitems.length;
                
                currentItem.subitems.push({
                    id: `subitem-${subitemIndex}`,
                    domId: `section-${sectionIndex}-item-${itemIndex}-subitem-${subitemIndex}`,
                    title: item.replace(/^####\s*/, ''),
                    level: 4
                });
            } else if (item.startsWith('##### ') && currentSection && currentItem) {
                // H5 is added as subitem of an H3
                const sectionIndex = sections.length;
                const itemIndex = currentSection.items.length - 1;
                const subitemIndex = currentItem.subitems.length;
                
                currentItem.subitems.push({
                    id: `subitem-${subitemIndex}`,
                    domId: `section-${sectionIndex}-item-${itemIndex}-subitem-${subitemIndex}`,
                    title: item.replace(/^#####\s*/, ''),
                    level: 5
                });
            } else if (item.startsWith('###### ') && currentSection && currentItem) {
                // H6 is added as subitem of an H3
                const sectionIndex = sections.length;
                const itemIndex = currentSection.items.length - 1;
                const subitemIndex = currentItem.subitems.length;
                
                currentItem.subitems.push({
                    id: `subitem-${subitemIndex}`,
                    domId: `section-${sectionIndex}-item-${itemIndex}-subitem-${subitemIndex}`,
                    title: item.replace(/^######\s*/, ''),
                    level: 6
                });
            }
        });

        if (currentSection) sections.push(currentSection);
        return sections;
    }

    // Helper function to generate nested subitems HTML
    generateSubitemsHTML(item) {
        if (!item.subitems || item.subitems.length === 0) {
            return '';
        }

        // Separate subitems by level
        const h4Items = item.subitems.filter(s => s.level === 4);
        const h5Items = item.subitems.filter(s => s.level === 5);
        const h6Items = item.subitems.filter(s => s.level === 6);
        
        // Start building HTML
        let subitemsHTML = `<div class="subitems">`;
        
        // Helper function to get child subitems
        const getChildrenRange = (parent, level) => {
            const parentIndex = item.subitems.indexOf(parent);
            const nextSameLevelIndex = item.subitems.findIndex((s, i) => 
                i > parentIndex && s.level <= parent.level
            );
            
            return item.subitems.slice(
                parentIndex + 1, 
                nextSameLevelIndex !== -1 ? nextSameLevelIndex : undefined
            ).filter(s => s.level === level);
        };
        
        // Process H4 and their children
        h4Items.forEach(h4 => {
            subitemsHTML += `
                <div class="subitem level-4" data-subitem-id="${h4.id}">
                    ${h4.title}
                </div>
            `;
            
            // Search for H5 children of this H4
            const childH5s = getChildrenRange(h4, 5);
            
            // Process H5 and their H6 children
            childH5s.forEach(h5 => {
                subitemsHTML += `
                    <div class="subitem level-5" data-subitem-id="${h5.id}">
                        ${h5.title}
                    </div>
                `;
                
                // Search for H6 children of this H5
                const childH6s = getChildrenRange(h5, 6);
                
                // Add H6
                childH6s.forEach(h6 => {
                    subitemsHTML += `
                        <div class="subitem level-6" data-subitem-id="${h6.id}">
                            ${h6.title}
                        </div>
                    `;
                });
            });
        });
        
        // Process orphan H5s (without an H4 parent)
        const processedH5Ids = new Set();
        h4Items.forEach(h4 => {
            getChildrenRange(h4, 5).forEach(h5 => {
                processedH5Ids.add(h5.id);
            });
        });
        
        const orphanH5s = h5Items.filter(h5 => !processedH5Ids.has(h5.id));
        
        orphanH5s.forEach(h5 => {
            subitemsHTML += `
                <div class="subitem level-5" data-subitem-id="${h5.id}">
                    ${h5.title}
                </div>
            `;
            
            // Search for H6 children of this orphan H5
            const childH6s = getChildrenRange(h5, 6);
            
            // Add H6
            childH6s.forEach(h6 => {
                subitemsHTML += `
                    <div class="subitem level-6" data-subitem-id="${h6.id}">
                        ${h6.title}
                    </div>
                `;
            });
        });
        
        // Process orphan H6s (without an H5 parent)
        const processedH6Ids = new Set();
        [...h4Items, ...h5Items].forEach(parent => {
            getChildrenRange(parent, 6).forEach(h6 => {
                processedH6Ids.add(h6.id);
            });
        });
        
        const orphanH6s = h6Items.filter(h6 => !processedH6Ids.has(h6.id));
        
        orphanH6s.forEach(h6 => {
            subitemsHTML += `
                <div class="subitem level-6" data-subitem-id="${h6.id}">
                    ${h6.title}
                </div>
            `;
        });
        
        subitemsHTML += `</div>`;
        return subitemsHTML;
    }

    render() {
        const content = document.getElementById('sidebarContent');
        
        // Verify that the sidebar container exists
        if (!content) {
            console.error("Element 'sidebarContent' not found in DOM");
            return;
        }
        
        if (this.data.length === 0) {
            content.innerHTML = '<div class="no-results">No data</div>';
            return;
        }

        const html = this.data.map(section => `
            <div class="section ${section.expanded ? 'expanded' : ''}" data-section-id="${section.id}"${section.folderPath ? ` data-folder-path="${section.folderPath}"` : ''}>
                <div class="section-header toggle-area">
                    <span class="section-title">${section.title}</span>
                    ${section.items.length > 0 ? '<span class="collapse-icon">▼</span>' : ''}
                </div>
                <div class="section-items">
                    ${section.items.map(item => {
                        // Use the helper function to generate subitems
                        const subitemsHTML = this.generateSubitemsHTML(item);
                        
                        return `
                            <div class="section-item ${item.subitems && item.subitems.length > 0 ? 'has-subitems' : ''}" data-item-id="${item.id}">
                                ${item.title}
                                ${subitemsHTML}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');

        content.innerHTML = html;
        
        // Call custom render callback if it exists (for index.html custom handlers)
        if (typeof window.attachIndexFolderHandlers === 'function') {
            setTimeout(() => {
                window.attachIndexFolderHandlers();
            }, 10);
        }
    }

    bindEvents() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const overlay = document.getElementById('sidebarOverlay');
        const sidebarSearchInput = document.getElementById('sidebarSearchInput');
        const clearBtn = document.getElementById('clearButton');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        // Check that essential elements exist
        if (!sidebar) {
            console.error("Element 'sidebar' not found in DOM");
            return;
        }

        // Toggle sidebar - check elements before adding listeners
        if (toggle) toggle.addEventListener('click', () => this.toggle());
        if (overlay) overlay.addEventListener('click', () => this.close());
        
        // Handle window resize changes
        let lastWidth = window.innerWidth;

        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;

            // Only run if the change is in page width
            if (currentWidth !== lastWidth) {
                lastWidth = currentWidth;
                const isLargeScreen = currentWidth >= 1024;
                
                // On large screens, show sidebar automatically
                if (isLargeScreen && !sidebar.classList.contains('open')) {
                    if (document.body.dataset.openSidebarResize !== "false") {
                        this.open();
                    }
                } 
                // On small screens, hide sidebar if it's open
                else if (!isLargeScreen && sidebar.classList.contains('open')) {
                    this.close();
                }
            }
        });

        // Search
        if (sidebarSearchInput) {
            sidebarSearchInput.addEventListener('input', (e) => this.search(e.target.value));
            
            // Keyboard
            sidebarSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.shiftKey ? this.navigatePrev() : this.navigateNext();
                }
                if (e.key === 'Escape') this.clearSearch();
            });
        }
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearSearch());

        // Navigation
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigatePrev());
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateNext());

        // Click on sections
        sidebar.addEventListener('click', (e) => {
            // Click on section title - only navigation, no toggle
            if (e.target.closest('.section-title')) {
                const header = e.target.closest('.section-header');
                if (header) {
                    const sectionId = header.parentElement.dataset.sectionId;
                    
                    // Navigate to DOM element
                    this.navigateToDOM(sectionId);
                }
                return;
            }

            // Click on a subitem (H4-H6) - only navigation to DOM
            if (e.target.closest('.subitem')) {
                const subitem = e.target.closest('.subitem');
                const item = subitem.closest('.section-item');
                const section = item.closest('.section');
                
                if (subitem && item && section) {
                    const sectionId = section.dataset.sectionId;
                    const itemId = item.dataset.itemId;
                    const subitemId = subitem.dataset.subitemId;
                    
                    // Only navigate to DOM element for the subitem
                    this.navigateToDOM(sectionId, itemId, subitemId);
                }
                return;
            }
            
            // Click on an item (###) - only navigation to DOM (avoid conflict with subitems)
            if (e.target.closest('.section-item') && !e.target.closest('.subitem')) {
                const item = e.target.closest('.section-item');
                const section = item.closest('.section');
                
                if (item && section) {
                    const sectionId = section.dataset.sectionId;
                    const itemId = item.dataset.itemId;
                    
                    // Only navigate to DOM element, don't toggle
                    this.navigateToDOM(sectionId, itemId);
                }
                return;
            }

            // Click on collapse icon or header background - only toggle
            const header = e.target.closest('.section-header');
            if (header) {
                // Make sure we didn't click on the title
                if (!e.target.closest('.section-title')) {
                    const sectionId = header.parentElement.dataset.sectionId;
                    this.toggleSection(sectionId);
                }
            }
            return;
        });
    }

    toggle() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        sidebar.classList.contains('open') && window.getComputedStyle(sidebar).display != "none" ? this.close() : this.open();
    }

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (!sidebar) return;
        
        sidebar.classList.remove('open');
        sidebar.style.display = 'grid';
             
        if (document.body.dataset.openSidebarResize === "false") {
            if (overlay) {
                overlay.classList.add('active');
                window.document.body.style.overflow = "hidden";
            }
        } else {
            if (window.innerWidth < 1024 && overlay) {
                overlay.classList.add('active');
                window.document.body.style.overflow = "hidden";
            }
        }

        // Refresh the content with the timeout so that display = 'grid' takes effect before opening the sidebar
        setTimeout(() => {
            sidebar.classList.add('open');
        }, 0);
    }

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        window.document.body.style.overflow = "auto";
        
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    toggleSection(sectionId) {
        const section = this.data.find(s => s.id === sectionId);
        if (section) {
            section.expanded = !section.expanded;
            document.querySelector(`[data-section-id="${sectionId}"]`).classList.toggle('expanded');
        }
    }

    // Function to navigate to DOM element
    navigateToDOM(sectionId, itemId = null, subitemId = null) {
        // Create a result object similar to search to reuse findDOMElement
        const result = {
            sectionId: sectionId,
            itemId: itemId,
            subitemId: subitemId,
            type: subitemId ? 'subitem' : (itemId ? 'item' : 'section')
        };

        const domElement = findDOMElement(result, this.data);
        
        if (domElement) {            
            // Close sidebar on small screens
            if (window.innerWidth < 1024 || document.body.dataset.openSidebarResize === "false") {
                this.close();
            }

            const clearHighlight = (clearElement) => {
                clearElement.style.backgroundColor = '';
                clearElement.style.color = '';
                clearElement.style.filter = '';
            }

            if (this.actualHighlightedElement) {
                clearTimeout(this.actualHighlightedTimeout);
                clearHighlight(this.actualHighlightedElement);
            }

            this.actualHighlightedElement = domElement;

            // Scroll to element in main content
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Wait for scroll to finish and element to be visible before applying highlight
            const applyHighlight = () => {
                clearTimeout(this.actualHighlightedTimeout);
                domElement.style.backgroundColor = 'var(--bg)';
                domElement.style.color = 'var(--text-color)';
                domElement.style.filter = 'invert(1)';
                domElement.style.transition = 'background-color 0.3s ease';

                this.actualHighlightedTimeout = setTimeout(() => {
                    clearHighlight(domElement);
                }, 2000);
            };

            // Detect when scroll ends
            let observer;
            let observerTimeout;

            const container = document.querySelector('.entry-content') || window;
            const scrollElement = container === window ? window : container;
            
            const onScrollEnd = (event) => {

                if (observerTimeout) clearTimeout(observerTimeout);
                observer?.disconnect();

                // Check if element is visible in viewport
                const targetRect = domElement.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                const isVisible = targetRect.top < viewportHeight && targetRect.bottom > 0;
                
                if (isVisible) {
                    // Element is visible, apply highlight
                    if (event) scrollElement.removeEventListener(event, onScrollEnd);
                    applyHighlight();
                } else {
                    // Element is not visible yet, use IntersectionObserver
                    if (event) scrollElement.removeEventListener(event, onScrollEnd);

                    observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                observer.disconnect();
                                applyHighlight();
                            }
                        });
                    }, {
                        threshold: 0.1
                    });
                    
                    observer.observe(domElement);
                    
                    // Cleanup observer after 5 seconds if element never becomes visible
                    observerTimeout = setTimeout(() => {
                        observer?.disconnect();
                    }, 5000);
                }
            };
            
            if ('onscrollend' in document.documentElement) {
                scrollElement.addEventListener('scrollend', onScrollEnd('scrollend'));
            } else {
                scrollElement.addEventListener('scroll', onScrollEnd('scroll'));
            }
            // Trigger once immediately in case scroll doesn't happen
            onScrollEnd();
        }
    }

    search(query) {
        if (!query.trim()) {
            this.clearSearch();
            return;
        }

        // Temporarily deactivate ScrollSpy during search
        this.scrollSpyActive = false;
        this.clearSidebarHighlights();
        
        document.getElementById('clearButton').classList.add('visible');
        this.searchResults = [];

        // Filter sections that contain the search term
        const filteredData = [];

        this.data.forEach(section => {
            const sectionMatches = this.countMatches(section.title, query);
            
            // Search for matches in items (H3)
            const itemsWithMatches = section.items.map(item => {
                const itemMatchCount = this.countMatches(item.title, query);
                
                // Search for matches in subitems (H4-H6)
                const subitemsWithMatches = item.subitems ? item.subitems.map(subitem => ({
                    ...subitem,
                    matchCount: this.countMatches(subitem.title, query)
                })).filter(subitem => subitem.matchCount > 0) : [];

                return {
                    ...item,
                    matchCount: itemMatchCount,
                    subitemsWithMatches
                };
            }).filter(item => item.matchCount > 0 || (item.subitemsWithMatches && item.subitemsWithMatches.length > 0));

            if (sectionMatches > 0 || itemsWithMatches.length > 0) {
                // Add the complete section to filtered data
                filteredData.push(section);

                // Add search results for each match in sections (H2)
                for (let i = 0; i < sectionMatches; i++) {
                    this.searchResults.push({ 
                        sectionId: section.id, 
                        type: 'section',
                        matchIndex: i
                    });
                }
                
                // Add search results for items (H3) and subitems (H4-H6)
                itemsWithMatches.forEach(item => {
                    // Add matches in H3
                    for (let i = 0; i < item.matchCount; i++) {
                        this.searchResults.push({ 
                            sectionId: section.id, 
                            itemId: item.id, 
                            type: 'item',
                            matchIndex: i
                        });
                    }
                    
                    // Add matches in H4-H6
                    if (item.subitemsWithMatches && item.subitemsWithMatches.length > 0) {
                        item.subitemsWithMatches.forEach(subitem => {
                            for (let i = 0; i < subitem.matchCount; i++) {
                                this.searchResults.push({
                                    sectionId: section.id,
                                    itemId: item.id,
                                    subitemId: subitem.id,
                                    type: 'subitem',
                                    level: subitem.level,
                                    matchIndex: i
                                });
                            }
                        });
                    }
                });
            }
        });

        this.renderFiltered(filteredData);
        this.highlightText(query);
        this.updateSearchControls(true);
        
        if (this.searchResults.length > 0) {
            this.currentResultIndex = 0;
            this.navigateToResult(0);
        } else {
            this.currentResultIndex = -1;
        }
    }

    countMatches(text, query) {
        // If text contains HTML tags, extract only the text content
        let textContent = text;
        if (/<[^>]*>/g.test(text)) {
            // Create a temporary element to extract text content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            textContent = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        const regex = new RegExp(this.escapeRegex(query), 'gi');
        const matches = textContent.match(regex);
        return matches ? matches.length : 0;
    }

    renderFiltered(sections) {
        const content = document.getElementById('sidebarContent');
        
        if (sections.length === 0) {
            content.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }

        const html = sections.map(section => `
            <div class="section ${section.expanded ? 'expanded' : ''}" data-section-id="${section.id}"${section.folderPath ? ` data-folder-path="${section.folderPath}"` : ''}>
                <div class="section-header toggle-area">
                    <span class="section-title">${section.title}</span>
                    ${section.items.length > 0 ? '<span class="collapse-icon">▼</span>' : ''}
                </div>
                <div class="section-items">
                    ${section.items.map(item => {
                        // Use the helper function to generate subitems
                        const subitemsHTML = this.generateSubitemsHTML(item);
                        
                        return `
                            <div class="section-item ${item.subitems && item.subitems.length > 0 ? 'has-subitems' : ''}" data-item-id="${item.id}">
                                ${item.title}
                                ${subitemsHTML}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');

        content.innerHTML = html;
        
        // Call custom render callback if it exists (for index.html custom handlers)
        if (typeof window.attachIndexFolderHandlers === 'function') {
            setTimeout(() => {
                window.attachIndexFolderHandlers();
            }, 10);
        }
    }

    highlightText(query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        document.querySelectorAll('.sidebar-component .section-title, .sidebar-component .section-item, .sidebar-component .subitem').forEach(el => {
            // Get only the text nodes, preserving HTML structure
            this.highlightTextInElement(el, regex);
        });
    }

    highlightTextInElement(element, regex) {
        // Process only text nodes to preserve HTML structure
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // Check if this text node's parent already has a highlight class
            let parent = node.parentNode;
            let hasHighlightedAncestor = false;
            
            while (parent && parent !== element) {
                if (parent.classList && parent.classList.contains('highlight')) {
                    hasHighlightedAncestor = true;
                    break;
                }
                parent = parent.parentNode;
            }
            
            // Only add text nodes that don't have highlighted ancestors
            if (!hasHighlightedAncestor) {
                textNodes.push(node);
            }
        }

        // Process text nodes in reverse order to avoid position issues
        textNodes.reverse().forEach(textNode => {
            const text = textNode.textContent;
            if (regex.test(text)) {
                const highlightedHTML = text.replace(regex, '<span class="highlight">$1</span>');
                if (highlightedHTML !== text) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = highlightedHTML;
                    
                    // Replace the text node with highlighted content
                    const fragment = document.createDocumentFragment();
                    while (tempDiv.firstChild) {
                        fragment.appendChild(tempDiv.firstChild);
                    }
                    textNode.parentNode.replaceChild(fragment, textNode);
                }
            }
        });
    }

    navigateToResult(index) {
        if (index < 0 || index >= this.searchResults.length) return;

        const result = this.searchResults[index];
        const section = this.data.find(s => s.id === result.sectionId);

        // Expand section if necessary
        if (section && !section.expanded) {
            section.expanded = true;
            document.querySelector(`[data-section-id="${result.sectionId}"]`).classList.add('expanded');
        }

        setTimeout(() => {
            let target;
            if (result.type === 'section') {
                target = document.querySelector(`[data-section-id="${result.sectionId}"] .section-title`);
            } else if (result.type === 'item') {
                target = document.querySelector(`[data-section-id="${result.sectionId}"]`).querySelector(`[data-item-id="${result.itemId}"]`);
            } else if (result.type === 'subitem') {
                target = document.querySelector(`[data-section-id="${result.sectionId}"]`).querySelector(`[data-item-id="${result.itemId}"] .subitem[data-subitem-id="${result.subitemId}"]`);
            }

            if (target) {
                // Clear previous highlights
                document.querySelectorAll('.sidebar-component .current-highlight').forEach(el => {
                    el.classList.remove('current-highlight');
                    el.classList.add('highlight');
                });

                const highlight = target.querySelectorAll('.highlight')[result.matchIndex];
                if (highlight) {
                    highlight.classList.remove('highlight');
                    highlight.classList.add('current-highlight');
                }
                
                // Center with scroll to element without moving the entire page
                const parent = document.getElementById("sidebarContent");
                const targetRect = target.getBoundingClientRect();
                const parentRect = parent.getBoundingClientRect();
                const targetRelativeTop = targetRect.top - parentRect.top + parent.scrollTop;
                
                parent.scrollTo({
                    top: targetRelativeTop - parent.clientHeight / 2,
                    behavior: 'smooth'
                });
            }

            this.updateCounter();
        }, 100);
    }

    navigatePrev() {
        if (this.currentResultIndex > 0) {
            this.currentResultIndex--;
        }else{
            this.currentResultIndex = this.searchResults.length - 1;
        }
        this.navigateToResult(this.currentResultIndex);
    }

    navigateNext() {
        if (this.currentResultIndex < this.searchResults.length - 1) {
            this.currentResultIndex++;
        }else{
            this.currentResultIndex = 0;
        }
        this.navigateToResult(this.currentResultIndex);
    }

    updateSearchControls(show) {
        const controls = document.getElementById('searchControls');
        const clearBtn = document.getElementById('clearButton');
        
        if (show && this.searchResults.length > 0) {
            controls.classList.add('active');
            clearBtn.classList.add('visible');
            this.updateCounter();
        } else {
            controls.classList.remove('active');
            if (!document.getElementById('sidebarSearchInput').value) {
                clearBtn.classList.remove('visible');
            }
        }
    }

    updateCounter() {
        const counter = document.getElementById('searchCounter');
        const current = this.currentResultIndex + 1;
        const total = this.searchResults.length;
        counter.textContent = `${current}/${total}`;
    }

    clearSearch() {
        document.getElementById('sidebarSearchInput').value = '';
        document.getElementById('clearButton').classList.remove('visible');
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.render();
        this.updateSearchControls(false);
        
        // Reactivate ScrollSpy if we're on large screen
        if (window.innerWidth >= 1024) {
            this.scrollSpyActive = true;
            setTimeout(() => {
                this.highlightCurrentSection();
            }, 100);
        }
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // ScrollSpy implementation
    setupScrollSpy() {
        this.scrollSpyActive = true;
        // Use throttle to avoid too many updates during scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking && this.scrollSpyActive) {
                window.requestAnimationFrame(() => {
                    this.highlightCurrentSection();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Also activate on window resize
        window.addEventListener('resize', () => {
            this.scrollSpyActive = true;
            this.highlightCurrentSection();
        });
        
        // Call once initially to set initial state
        setTimeout(() => {
            this.highlightCurrentSection();
        }, 300);
    }
    
    clearSidebarHighlights() {
        document.querySelectorAll('.section-header.active').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelectorAll('.section-item.active').forEach(el => {
            el.classList.remove('active');
        });
    }
    
    highlightCurrentSection() {
        if (!this.scrollSpyActive || !this.data || this.data.length === 0) return;
        
        const entryContent = document.getElementsByClassName("entry-content")[0];
        if (!entryContent) return;
        
        const headers = Array.from(entryContent.querySelectorAll('h2, h3'));
        if (headers.length === 0) return;
        
        // Find the currently visible header
        const scrollInit = window.innerHeight / 4;
        const scrollEnd = document.documentElement.scrollHeight - document.documentElement.clientHeight - scrollInit;
        const scrollY = window.scrollY;
        const scrollPosition = scrollY + (window.innerHeight / 2); // Add offset for better detection

        // Find the currently visible header
        let currentHeader = null;
        for (let i = 0; i < headers.length; i++) {
            if (scrollY <= scrollInit) {
                // If we're at the top of the page, highlight the first header
                currentHeader = headers[0];
            }else if (scrollY >= scrollEnd) {
                // If we're at the bottom of the page, highlight the last header
                currentHeader = headers[headers.length - 1];
            }else if (headers[i]?.getBoundingClientRect().top + window.scrollY <= scrollPosition) {
                currentHeader = headers[i];
            } else {
                break;
            }
        }

        if (!currentHeader) {
            currentHeader = headers[0]; // If not found, use the first one
        }
        
        // Clear previous highlights
        this.clearSidebarHighlights();
        
        // Determine type and position of header
        const isH2 = currentHeader.tagName === 'H2';
        
        // Get ID of current element
        const headerId = currentHeader.id;
        
        // Determine corresponding section
        let section;
        let sectionIndex;
        
        if (isH2) {
            // If it's an H2, search directly by its ID
            section = this.data.find(s => s.id === headerId);
            sectionIndex = this.data.indexOf(section);
        } else {
            // If it's an H3, extract the section from ID (section-X-item-Y)
            const idParts = headerId.split('-');
            if (idParts.length >= 2) {
                sectionIndex = parseInt(idParts[1]);
                section = this.data[sectionIndex];
            }
        }
        
        // If the section couldn't be determined by ID, try the previous method
        if (!section) {
            const h2Elements = entryContent.querySelectorAll("h2");
            const h2Index = Array.from(h2Elements).indexOf(isH2 ? currentHeader : this.findParentH2(currentHeader));
            if (h2Index === -1) return;
            section = this.data[h2Index];
            if (!section) return;
        }
        
        // Find and highlight in sidebar
        const sidebarSection = document.querySelector(`[data-section-id="${section.id}"]`);
        if (sidebarSection) {
            // Expand the section if it's not expanded
            if (!section.expanded) {
                section.expanded = true;
                sidebarSection.classList.add('expanded');
            }
            
            // Highlight the section or item
            if (isH2) {
                // Highlight the section
                sidebarSection.querySelector('.section-header').classList.add('active');
            } else {
                // It's an h3, try to extract the item index from ID
                const idParts = headerId.split('-');
                if (idParts.length >= 4 && idParts[2] === 'item') {
                    const itemIndex = parseInt(idParts[3]);
                    if (section.items[itemIndex]) {
                        const itemId = section.items[itemIndex].id;
                        const itemElement = sidebarSection.querySelector(`[data-item-id="${itemId}"]`);
                        if (itemElement) {
                            itemElement.classList.add('active');
                        }
                    }
                } else {
                    // Previous method as fallback
                    const h3Elements = this.getH3ElementsInSection(currentHeader);
                    const h3Index = h3Elements.indexOf(currentHeader);
                    
                    if (h3Index !== -1 && section.items[h3Index]) {
                        const itemId = section.items[h3Index].id;
                        const itemElement = sidebarSection.querySelector(`[data-item-id="${itemId}"]`);
                        if (itemElement) {
                            itemElement.classList.add('active');
                        }
                    }
                }
            }
            
            // Scroll in sidebar
            const sidebarContent = document.getElementById('sidebarContent');
            if (sidebarContent) {
                const elementToScroll = isH2 ? 
                    sidebarSection : 
                    sidebarSection.querySelector('.active') || sidebarSection;
                
                sidebarContent.scrollTo({
                    top: elementToScroll.offsetTop - sidebarContent.clientHeight / 3,
                    behavior: 'smooth'
                });
            }
        }
    }
    
    findParentH2(h3Element) {
        // Try to determine the section from h3 ID
        if (h3Element.id) {
            const idParts = h3Element.id.split('-');
            if (idParts.length >= 2) {
                const sectionIndex = idParts[1];
                const sectionId = `section-${sectionIndex}`;
                const h2Element = document.getElementById(sectionId);
                if (h2Element) return h2Element;
            }
        }
        
        // Previous method as fallback
        let currentElement = h3Element.previousElementSibling;
        while (currentElement) {
            if (currentElement.tagName === 'H2') {
                return currentElement;
            }
            currentElement = currentElement.previousElementSibling;
        }
        return null;
    }
    
    getH3ElementsInSection(h3Element) {
        const parentH2 = this.findParentH2(h3Element);
        if (!parentH2) return [];
        
        const sectionId = parentH2.id;
        const sectionMatch = sectionId.match(/section-(\d+)/);
        
        if (!sectionMatch) return [];
        
        const sectionIndex = parseInt(sectionMatch[1]);
        const entryContent = document.getElementsByClassName("entry-content")[0];
        if (!entryContent) return [];
        
        // Search for all h3s with IDs that match the pattern section-{sectionIndex}-item-*
        return Array.from(entryContent.querySelectorAll('h3'))
            .filter(h3 => {
                const idMatch = h3.id.match(new RegExp(`section-${sectionIndex}-item-\\d+`));
                return idMatch !== null;
            });
    }
}