import { html } from "htm/preact";

// Variable para mantener una referencia a la instancia activa
let sidebarInstance = null;

// Función para inicializar la sidebar
export function initSidebar(data) {
    // Si ya existe una instancia, actualizar los datos
    if (sidebarInstance) {
        sidebarInstance.updateData(data);
        return sidebarInstance;
    }
    
    // Verificar que los elementos existan antes de crear la instancia
    if (document.getElementById('sidebar')) {
        sidebarInstance = new SidebarClass(data);
        return sidebarInstance;
    } else {
        console.error("No se pudo inicializar la sidebar: elementos del DOM no encontrados");
        return null;
    }
}

export function Sidebar() {
    return html`        
        <div class="sidebar-overlay" id="sidebarOverlay"></div>

        <div class="sidebar-component open" id="sidebar">
            <div class="sidebar-header">
                <div class="search-container">
                    <input type="text" autocomplete="off" class="search-input" placeholder="Search..." id="searchInput"/>
                    <button class="clear-button" id="clearButton">×</button>
                </div>
                <div class="search-controls" id="searchControls">
                    <button class="nav-button" id="prevBtn">◀ Previous</button>
                    <button class="nav-button" id="nextBtn">Next ▶</button>
                    <span class="search-counter" id="searchCounter">0/0</span>
                </div>
            </div>

            <div class="sidebar-content" id="sidebarContent">
                <!-- El contenido se generará dinámicamente -->
            </div>
        </div>
    `;
}

// Función para encontrar el elemento correcto en el DOM
function findDOMElement(result, data) {
    
    const entryContent = document.getElementsByClassName("entry-content")[0];
    if (!entryContent) {
        console.error("No se encontró el contenedor entry-content");
        return null;
    }

    const section = data.find(s => s.id === result.sectionId);
    if (!section) {
        console.error("No se encontró la sección con ID:", result.sectionId);
        return null;
    }
    
    if (result.type === 'section') {
        // Para secciones (##), buscar directamente por ID
        const element = document.getElementById(result.sectionId);
        return element;
    } else if (result.type === 'item') {
        // Para items (###), encontrar por ID específico
        const item = section.items.find(i => i.id === result.itemId);
        if (!item) {
            console.error("No se encontró el item con ID:", result.itemId);
            return null;
        }
        
        const sectionIndex = parseInt(result.sectionId.split('-')[1]);
        const itemIndex = section.items.indexOf(item);
        
        // El ID del elemento h3 sigue el formato section-X-item-Y
        const itemId = `section-${sectionIndex}-item-${itemIndex}`;
        const element = document.getElementById(itemId);
        return element;
    } else if (result.type === 'subitem') {
        // Para subitems (H4-H6)
        const item = section.items.find(i => i.id === result.itemId);
        if (!item || !item.subitems) {
            console.error("No se encontró el item padre o no tiene subitems:", result.itemId);
            return null;
        }
        
        const subitem = item.subitems.find(s => s.id === result.subitemId);
        if (!subitem) {
            console.error("No se encontró el subitem con ID:", result.subitemId);
            return null;
        }
        
        // Usar el domId almacenado si está disponible
        const subitemId = subitem.domId || 
            `section-${parseInt(result.sectionId.split('-')[1])}-item-${section.items.indexOf(item)}-subitem-${item.subitems.indexOf(subitem)}`;
        let element = document.getElementById(subitemId);
        
        // Si no lo encontramos con el ID esperado, intentemos buscar por el nivel y título
        if (!element && subitem.level) {
            
            // Buscar todos los encabezados del nivel correspondiente
            const possibleElements = Array.from(document.querySelectorAll(`h${subitem.level}`));
            
            // Filtrar por contenido similar
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
        
        // Inicializar directamente (ya verificamos la existencia del sidebar en initSidebar)
        this.init();
    }

    init() {
        // Como initSidebar ya verificó la existencia de 'sidebar', solo verificamos otros elementos
        
        this.render();
        this.bindEvents();
        this.setupScrollSpy();
        
        // Inicializar estado de la sidebar según el tamaño de pantalla
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }
    
    updateData(newData) {
        // Procesar los nuevos datos
        this.data = this.processData(newData);

        // Limpiar búsqueda activa si existe
        this.clearSearch();

        // Re-renderizar con los nuevos datos
        this.render();
    }


    processData(data) {
        const sections = [];
        let currentSection = null;
        let currentItem = null;

        data.forEach(item => {
            if (item.startsWith('## ')) {
                // Si hay una sección activa, la guardamos
                if (currentSection) sections.push(currentSection);
                
                // Creamos una nueva sección (H2)
                currentSection = {
                    id: `section-${sections.length}`,
                    title: item.replace(/^##\s*/, ''),
                    items: [],
                    expanded: false
                };
                currentItem = null;
            } else if (item.startsWith('### ') && currentSection) {
                // Creamos un nuevo item (H3) dentro de la sección actual
                currentItem = {
                    id: `item-${currentSection.items.length}`,
                    title: item.replace(/^###\s*/, ''),
                    subitems: [] // Para H4, H5, H6
                };
                currentSection.items.push(currentItem);
            } else if (item.startsWith('#### ') && currentSection && currentItem) {
                // H4 se añade como subitem de un H3
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
                // H5 se añade como subitem de un H3
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
                // H6 se añade como subitem de un H3
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

    render() {
        const content = document.getElementById('sidebarContent');
        
        // Verificar que el contenedor de la sidebar exista
        if (!content) {
            console.error("Elemento 'sidebarContent' no encontrado en el DOM");
            return;
        }
        
        if (this.data.length === 0) {
            content.innerHTML = '<div class="no-results">No data</div>';
            return;
        }

        const html = this.data.map(section => `
            <div class="section ${section.expanded ? 'expanded' : ''}" data-section-id="${section.id}">
                <div class="section-header toggle-area">
                    <span class="section-title">${section.title}</span>
                    ${section.items.length > 0 ? '<span class="collapse-icon">▼</span>' : ''}
                </div>
                <div class="section-items">
                    ${section.items.map(item => {
                        // Preparar estructura de subitems anidados
                        let subitemsHTML = '';
                        
                        if (item.subitems && item.subitems.length > 0) {
                            // Separar subitems por nivel
                            const h4Items = item.subitems.filter(s => s.level === 4);
                            const h5Items = item.subitems.filter(s => s.level === 5);
                            const h6Items = item.subitems.filter(s => s.level === 6);
                            
                            // Empezar a construir HTML
                            subitemsHTML = `<div class="subitems">`;
                            
                            // Función auxiliar para obtener subitems hijos
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
                            
                            // Procesar H4 y sus hijos
                            h4Items.forEach(h4 => {
                                subitemsHTML += `
                                    <div class="subitem level-4" data-subitem-id="${h4.id}">
                                        ${h4.title}
                                    </div>
                                `;
                                
                                // Buscar H5 hijos de este H4
                                const childH5s = getChildrenRange(h4, 5);
                                
                                // Procesar H5 y sus hijos H6
                                childH5s.forEach(h5 => {
                                    subitemsHTML += `
                                        <div class="subitem level-5" data-subitem-id="${h5.id}">
                                            ${h5.title}
                                        </div>
                                    `;
                                    
                                    // Buscar H6 hijos de este H5
                                    const childH6s = getChildrenRange(h5, 6);
                                    
                                    // Añadir H6
                                    childH6s.forEach(h6 => {
                                        subitemsHTML += `
                                            <div class="subitem level-6" data-subitem-id="${h6.id}">
                                                ${h6.title}
                                            </div>
                                        `;
                                    });
                                });
                            });
                            
                            // Procesar H5 huérfanos (sin un H4 padre)
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
                                
                                // Buscar H6 hijos de este H5 huérfano
                                const childH6s = getChildrenRange(h5, 6);
                                
                                // Añadir H6
                                childH6s.forEach(h6 => {
                                    subitemsHTML += `
                                        <div class="subitem level-6" data-subitem-id="${h6.id}">
                                            ${h6.title}
                                        </div>
                                    `;
                                });
                            });
                            
                            // Procesar H6 huérfanos (sin un H5 padre)
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
                        }
                        
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
    }

    bindEvents() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const overlay = document.getElementById('sidebarOverlay');
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearButton');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        // Verificar que los elementos esenciales existen
        if (!sidebar) {
            console.error("Elemento 'sidebar' no encontrado en el DOM");
            return;
        }

        // Toggle sidebar - comprobar elementos antes de agregar listeners
        if (toggle) toggle.addEventListener('click', () => this.toggle());
        if (overlay) overlay.addEventListener('click', () => this.close());
        
        // Manejar cambios de tamaño de ventana
        let lastWidth = window.innerWidth;

        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;

            // Solo ejecutar si el cambio es en el ancho de la página
            if (currentWidth !== lastWidth) {
                lastWidth = currentWidth;
                const isLargeScreen = currentWidth >= 1024;

                // En pantallas grandes, mostrar sidebar automáticamente
                if (isLargeScreen && !sidebar.classList.contains('open')) {
                    if (document.body.dataset.openSidebarResize !== "false") { this.open(); }
                } 
                // En pantallas pequeñas, ocultar sidebar si está abierta
                else if (!isLargeScreen && sidebar.classList.contains('open')) {
                    this.close();
                }
            }
        });

        // Búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.search(e.target.value));
            
            // Teclado
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.shiftKey ? this.navigatePrev() : this.navigateNext();
                }
                if (e.key === 'Escape') this.clearSearch();
            });
        }
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearSearch());

        // Navegación
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigatePrev());
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateNext());

        // Click en secciones
        sidebar.addEventListener('click', (e) => {
            // Click en el título de la sección - solo navegación, sin toggle
            if (e.target.closest('.section-title')) {
                const header = e.target.closest('.section-header');
                if (header) {
                    const sectionId = header.parentElement.dataset.sectionId;
                    
                    // Navegar al elemento del DOM
                    this.navigateToDOM(sectionId);
                }
                return;
            }

            // Click en un subitem (H4-H6) - solo navegación al DOM
            if (e.target.closest('.subitem')) {
                const subitem = e.target.closest('.subitem');
                const item = subitem.closest('.section-item');
                const section = item.closest('.section');
                
                if (subitem && item && section) {
                    const sectionId = section.dataset.sectionId;
                    const itemId = item.dataset.itemId;
                    const subitemId = subitem.dataset.subitemId;
                    
                    // Solo navegar al elemento del DOM para el subitem
                    this.navigateToDOM(sectionId, itemId, subitemId);
                }
                return;
            }
            
            // Click en un item (###) - solo navegación al DOM (evitar conflicto con subitems)
            if (e.target.closest('.section-item') && !e.target.closest('.subitem')) {
                const item = e.target.closest('.section-item');
                const section = item.closest('.section');
                
                if (item && section) {
                    const sectionId = section.dataset.sectionId;
                    const itemId = item.dataset.itemId;
                    
                    // Solo navegar al elemento del DOM, no hacer toggle
                    this.navigateToDOM(sectionId, itemId);
                }
                return;
            }

            // Click en el ícono de colapso o en el fondo del header - solo toggle
            const header = e.target.closest('.section-header');
            if (header) {
                // Asegurarse de que no se ha hecho clic en el título
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
        
        // Only activate the overlay on small screens
        if (window.innerWidth < 1024 && overlay) {
            overlay.classList.add('active');
            window.document.body.style.overflow = "hidden";
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

    // Función para navegar al elemento del DOM
    navigateToDOM(sectionId, itemId = null, subitemId = null) {
        // Crear un objeto result similar al de búsqueda para reutilizar findDOMElement
        const result = {
            sectionId: sectionId,
            itemId: itemId,
            subitemId: subitemId,
            type: subitemId ? 'subitem' : (itemId ? 'item' : 'section')
        };

        const domElement = findDOMElement(result, this.data);
        
        if (domElement) {
            if (window.innerWidth < 1024) {
                this.close();
            }
            // Hacer scroll al elemento en el contenido principal
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Agregar highlight temporal al elemento del DOM
            domElement.style.backgroundColor = '#454545';
            domElement.style.transition = 'background-color 0.3s ease';
            
            setTimeout(() => {
                domElement.style.backgroundColor = '';
            }, 2000);
        }
    }

    search(query) {
        if (!query.trim()) {
            this.clearSearch();
            return;
        }

        // Desactivar temporalmente ScrollSpy durante la búsqueda
        this.scrollSpyActive = false;
        this.clearSidebarHighlights();
        
        document.getElementById('clearButton').classList.add('visible');
        this.searchResults = [];

        // Filtrar secciones que contengan el término de búsqueda
        const filteredData = [];

        this.data.forEach(section => {
            const sectionMatches = this.countMatches(section.title, query);
            
            // Buscar coincidencias en items (H3)
            const itemsWithMatches = section.items.map(item => {
                const itemMatchCount = this.countMatches(item.title, query);
                
                // Buscar coincidencias en subitems (H4-H6)
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
                // Agregar la sección completa a los datos filtrados
                filteredData.push(section);

                // Agregar resultados de búsqueda por cada coincidencia en secciones (H2)
                for (let i = 0; i < sectionMatches; i++) {
                    this.searchResults.push({ 
                        sectionId: section.id, 
                        type: 'section',
                        matchIndex: i
                    });
                }
                
                // Agregar resultados de búsqueda para items (H3) y subitems (H4-H6)
                itemsWithMatches.forEach(item => {
                    // Agregar coincidencias en H3
                    for (let i = 0; i < item.matchCount; i++) {
                        this.searchResults.push({ 
                            sectionId: section.id, 
                            itemId: item.id, 
                            type: 'item',
                            matchIndex: i
                        });
                    }
                    
                    // Agregar coincidencias en H4-H6
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
        const regex = new RegExp(this.escapeRegex(query), 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }

    renderFiltered(sections) {
        const content = document.getElementById('sidebarContent');
        
        if (sections.length === 0) {
            content.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
            return;
        }

        const html = sections.map(section => `
            <div class="section ${section.expanded ? 'expanded' : ''}" data-section-id="${section.id}">
                <div class="section-header toggle-area">
                    <span class="section-title">${section.title}</span>
                    ${section.items.length > 0 ? '<span class="collapse-icon">▼</span>' : ''}
                </div>
                <div class="section-items">
                    ${section.items.map(item => {
                        // Preparar estructura de subitems anidados
                        let subitemsHTML = '';
                        
                        if (item.subitems && item.subitems.length > 0) {
                            // Separar subitems por nivel
                            const h4Items = item.subitems.filter(s => s.level === 4);
                            const h5Items = item.subitems.filter(s => s.level === 5);
                            const h6Items = item.subitems.filter(s => s.level === 6);
                            
                            // Empezar a construir HTML
                            subitemsHTML = `<div class="subitems">`;
                            
                            // Función auxiliar para obtener subitems hijos
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
                            
                            // Procesar H4 y sus hijos
                            h4Items.forEach(h4 => {
                                subitemsHTML += `
                                    <div class="subitem level-4" data-subitem-id="${h4.id}">
                                        ${h4.title}
                                    </div>
                                `;
                                
                                // Buscar H5 hijos de este H4
                                const childH5s = getChildrenRange(h4, 5);
                                
                                // Procesar H5 y sus hijos H6
                                childH5s.forEach(h5 => {
                                    subitemsHTML += `
                                        <div class="subitem level-5" data-subitem-id="${h5.id}">
                                            ${h5.title}
                                        </div>
                                    `;
                                    
                                    // Buscar H6 hijos de este H5
                                    const childH6s = getChildrenRange(h5, 6);
                                    
                                    // Añadir H6
                                    childH6s.forEach(h6 => {
                                        subitemsHTML += `
                                            <div class="subitem level-6" data-subitem-id="${h6.id}">
                                                ${h6.title}
                                            </div>
                                        `;
                                    });
                                });
                            });
                            
                            // Procesar H5 huérfanos (sin un H4 padre)
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
                                
                                // Buscar H6 hijos de este H5 huérfano
                                const childH6s = getChildrenRange(h5, 6);
                                
                                // Añadir H6
                                childH6s.forEach(h6 => {
                                    subitemsHTML += `
                                        <div class="subitem level-6" data-subitem-id="${h6.id}">
                                            ${h6.title}
                                        </div>
                                    `;
                                });
                            });
                            
                            // Procesar H6 huérfanos (sin un H5 padre)
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
                        }
                        
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
    }

    highlightText(query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        document.querySelectorAll('.sidebar-component .section-title, .sidebar-component .section-item, .sidebar-component .subitem').forEach(el => {
            const text = el.textContent;
            el.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        });
    }

    navigateToResult(index) {
        if (index < 0 || index >= this.searchResults.length) return;

        // Limpiar highlight anterior
        document.querySelectorAll('.sidebar-component .current-highlight').forEach(el => {
            el.classList.remove('current-highlight');
            el.classList.add('highlight');
        });

        const result = this.searchResults[index];
        const section = this.data.find(s => s.id === result.sectionId);

        // Expandir sección si es necesario
        if (section && !section.expanded) {
            section.expanded = true;
            document.querySelector(`[data-section-id="${result.sectionId}"]`).classList.add('expanded');
        }

        setTimeout(() => {
            let target;
            if (result.type === 'section') {
                target = document.querySelector(`[data-section-id="${result.sectionId}"] .section-title`);
            } else {
                target = document.querySelector(`[data-section-id="${result.sectionId}"]`).querySelector(`[data-item-id="${result.itemId}"]`);
            }

            if (target) {
                const highlight = target.querySelectorAll('.highlight')[result.matchIndex];
                if (highlight) {
                    highlight.classList.remove('highlight');
                    highlight.classList.add('current-highlight');
                }
                
                // Centrar con scroll al elemento sin mover la pagina entera
                const parent = document.getElementById("sidebarContent");
                parent.scrollTo({
                    top: target.offsetTop - parent.clientHeight / 2,
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
            if (!document.getElementById('searchInput').value) {
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
        document.getElementById('searchInput').value = '';
        document.getElementById('clearButton').classList.remove('visible');
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.render();
        this.updateSearchControls(false);
        
        // Reactivar ScrollSpy si estamos en pantalla grande
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
    
    // Implementación del ScrollSpy
    setupScrollSpy() {
        this.scrollSpyActive = true;
        // Usar throttle para evitar demasiadas actualizaciones durante el scroll
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
        
        // Activar también al redimensionar la ventana
        window.addEventListener('resize', () => {
            this.scrollSpyActive = true;
            this.highlightCurrentSection();
        });
        
        // Llamar una vez inicialmente para establecer el estado inicial
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
        
        // Encontrar el encabezado actualmente visible
        const scrollInit = window.innerHeight / 4;
        const scrollEnd = document.documentElement.scrollHeight - document.documentElement.clientHeight - scrollInit;
        const scrollY = window.scrollY;
        const scrollPosition = scrollY + (window.innerHeight / 2); // Agregar offset para mejor detección

        // Encontrar el header actualmente visible
        let currentHeader = null;
        for (let i = 0; i < headers.length; i++) {
            if (scrollY <= scrollInit) {
                // Si estamos en la parte superior de la página, resaltar el primer encabezado
                currentHeader = headers[0];
            }else if (scrollY >= scrollEnd) {
                // Si estamos en la parte inferior de la página, resaltar el último encabezado
                currentHeader = headers[headers.length - 1];
            }else if (headers[i]?.getBoundingClientRect().top + window.scrollY <= scrollPosition) {
                currentHeader = headers[i];
            } else {
                break;
            }
        }

        if (!currentHeader) {
            currentHeader = headers[0]; // Si no se encuentra, usar el primero
        }
        
        // Limpiar highlights anteriores
        this.clearSidebarHighlights();
        
        // Determinar tipo y posición del header
        const isH2 = currentHeader.tagName === 'H2';
        
        // Obtener ID del elemento actual
        const headerId = currentHeader.id;
        
        // Determinar la sección correspondiente
        let section;
        let sectionIndex;
        
        if (isH2) {
            // Si es un H2, buscar directamente por su ID
            section = this.data.find(s => s.id === headerId);
            sectionIndex = this.data.indexOf(section);
        } else {
            // Si es un H3, extraer la sección del ID (section-X-item-Y)
            const idParts = headerId.split('-');
            if (idParts.length >= 2) {
                sectionIndex = parseInt(idParts[1]);
                section = this.data[sectionIndex];
            }
        }
        
        // Si no se pudo determinar la sección por ID, intentar el método anterior
        if (!section) {
            const h2Elements = entryContent.querySelectorAll("h2");
            const h2Index = Array.from(h2Elements).indexOf(isH2 ? currentHeader : this.findParentH2(currentHeader));
            if (h2Index === -1) return;
            section = this.data[h2Index];
            if (!section) return;
        }
        
        // Encontrar y resaltar en sidebar
        const sidebarSection = document.querySelector(`[data-section-id="${section.id}"]`);
        if (sidebarSection) {
            // Expandir la sección si no está expandida
            if (!section.expanded) {
                section.expanded = true;
                sidebarSection.classList.add('expanded');
            }
            
            // Resaltar la sección o el item
            if (isH2) {
                // Resaltar la sección
                sidebarSection.querySelector('.section-header').classList.add('active');
            } else {
                // Es un h3, intentar extraer el índice del item del ID
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
                    // Método anterior como fallback
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
            
            // Hacer scroll en la barra lateral
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
        // Intentar determinar la sección a partir del ID del h3
        if (h3Element.id) {
            const idParts = h3Element.id.split('-');
            if (idParts.length >= 2) {
                const sectionIndex = idParts[1];
                const sectionId = `section-${sectionIndex}`;
                const h2Element = document.getElementById(sectionId);
                if (h2Element) return h2Element;
            }
        }
        
        // Método anterior como fallback
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
        
        // Buscar todos los h3 con IDs que coincidan con el patrón section-{sectionIndex}-item-*
        return Array.from(entryContent.querySelectorAll('h3'))
            .filter(h3 => {
                const idMatch = h3.id.match(new RegExp(`section-${sectionIndex}-item-\\d+`));
                return idMatch !== null;
            });
    }
}