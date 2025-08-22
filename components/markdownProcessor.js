function processMarkdownWithIframes(markdownContent) {
    // Procesamos el contenido línea por línea
    const lines = markdownContent.split("\n");
    let inCodeBlock = false;
    let currentCodeBlock = {
        language: "",
        lines: [],
    };
    const codeBlocks = new Map();
    let codeBlockId = 0;
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detectar inicio/fin de bloque de código
        if (line.startsWith("```")) {
            if (!inCodeBlock) {
                // Inicio de bloque de código
                inCodeBlock = true;
                currentCodeBlock.language = line.slice(3).trim();
                currentCodeBlock.lines = [];
            } else {
                // Fin de bloque de código
                inCodeBlock = false;
                const placeholder = `CODE_BLOCK_${codeBlockId}`;
                codeBlocks.set(placeholder, {
                    language: currentCodeBlock.language,
                    code: currentCodeBlock.lines.join("\n"),
                });
                processedLines.push(placeholder);
                codeBlockId++;
                currentCodeBlock = { language: "", lines: [] };
            }
            continue;
        }

        if (inCodeBlock) {
            // Dentro de un bloque de código, guardar la línea sin procesar
            currentCodeBlock.lines.push(line);
        } else {
            // Fuera de un bloque de código, procesar iframes
            if (line.trim().startsWith(":::iframe")) {
                // Inicio de iframe
                let attributes = "";
                // Extraer todos los atributos de la línea
                const attributeRegex = /(\w+)="([^"]+)"/g;
                let match;
                while ((match = attributeRegex.exec(line)) !== null) {
                    const [, attr, value] = match;
                    if (attr !== "src") {
                        // Ignoramos src ya que lo manejamos aparte
                        attributes += ` ${attr}="${value}"`;
                    }
                }

                let iframeContent = [];
                i++; // Avanzar a la siguiente línea
                while (i < lines.length && lines[i].trim() !== ":::") {
                    iframeContent.push(lines[i]);
                    i++;
                }
                const url = iframeContent.join("").trim();
                const expandIcon = `<svg width="16" height="16" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill="currentColor" d="M3 21v-5h2v3h3v2zm13 0v-2h3v-3h2v5zM3 8V3h5v2H5v3zm16 0V5h-3V3h5v5z"/>
                            </svg>`;
                const contractIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3L13 13M3 13V7M3 13H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>`;
                processedLines.push(
                    `<div class="iframe-container"><iframe src="${url}" frameborder="0" allowfullscreen ${attributes}></iframe><button class="iframe-expand-button" title="Expand"><span class="expand-icon">${expandIcon}</span><span class="contract-icon" style="display: none;">${contractIcon}</span></button></div>`
                );
            } else {
                processedLines.push(line);
            }
        }
    }

    let processedContent = processedLines.join("\n");

    // Finalmente, restauramos los bloques de código sin procesar su contenido
    for (const [placeholder, { language, code }] of codeBlocks) {
        const copyButton = `<button class="code-copy-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 13H7a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 11V3a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>`;

        // Escapar el HTML pero preservar los saltos de línea
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        processedContent = processedContent.replace(
            placeholder,
            `<div class="code-block-wrapper">${copyButton}<pre><code class="language-${language}">${escapedCode}</code></pre></div>`
        );
    }

    return processedContent;
}

export function renderMarkdown(markdownContent) {
    // Configurar el renderer personalizado para los enlaces
    const renderer = new marked.Renderer();
    renderer.link = (element) => {
        const isNewWindow = element.text.endsWith(" new");
        const cleanText = isNewWindow
            ? element.text.slice(0, -4)
            : element.text;
        const target = isNewWindow
            ? 'target="_blank" rel="noopener noreferrer"'
            : "";
        return `<a href="${element.href}" ${target}${
            element.title ? ` title="${element.title}"` : ""
        }>${cleanText}</a>`;
    };

    marked.setOptions({
        breaks: true,
        gfm: true,
        renderer: renderer,
        headerIds: false,
        mangle: false,
    });

    // Primero protegemos los bloques de código
    const codeBlocks = new Map();
    let blockCount = 0;
    let inCodeBlock = false;
    let currentLanguage = "";
    let currentCode = [];
    const lines = markdownContent.split("\n");
    let protectedContent = [];
    let sidebarContent = []

    for (let line of lines) {
        if (!inCodeBlock && (line.startsWith("## ") || line.startsWith("### "))){
            sidebarContent.push(line);
        }

        if (line.startsWith("```")) {
            if (!inCodeBlock) {
                // Inicio de bloque de código
                inCodeBlock = true;
                currentLanguage = line.slice(3).trim();
                currentCode = [];
            } else {
                // Fin de bloque de código
                inCodeBlock = false;
                const placeholder = `CODE_BLOCK_${blockCount++}`;
                codeBlocks.set(placeholder, {
                    language: currentLanguage,
                    code: currentCode.join("\n"),
                });
                protectedContent.push(placeholder);
            }
            continue;
        }

        if (inCodeBlock) {
            currentCode.push(line);
        } else {
            // Si no estamos en un bloque de código, procesamos normalmente
            if (line.startsWith("#t ")) {
                protectedContent.push(`<plain>${line.substring(3)}</plain>`);
            } else if (line.startsWith("<")) {
                protectedContent.push(`<rawhtml>${line}</rawhtml>`);
            } else {
                protectedContent.push(line);
            }
        }
    }

    let processedMarkdown = protectedContent.join("\n");

    // Procesar saltos de línea múltiples
    processedMarkdown = processedMarkdown.replace(/\n\n\n+/g, (match) => {
        const lineBreakCount = match.length - 2;
        const brs = "<rawhtml><br></rawhtml>".repeat(lineBreakCount);
        return `\n\n${brs}\n\n`;
    });

    // Procesar iframes y convertir a HTML
    processedMarkdown = processMarkdownWithIframes(processedMarkdown);
    const rawHtml = marked.parse(processedMarkdown);

    // Post-procesar para restaurar texto plano y HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    const tagsToUnwrap = ["plain", "rawhtml"];

    doc.querySelectorAll("p").forEach((p) => {
        const extracted = [];
        const children = [...p.childNodes];

        for (let i = 0; i < children.length; i++) {
            const node = children[i];

            // Caso: <br> seguido de <plain|rawhtml> -> formar bloque [br, ...childrenOfTag]
            if (
                node.nodeType === Node.ELEMENT_NODE &&
                node.tagName.toLowerCase() === "br"
            ) {
                const next = children[i + 1];
                if (
                    next &&
                    next.nodeType === Node.ELEMENT_NODE &&
                    tagsToUnwrap.includes(next.tagName.toLowerCase())
                ) {
                    const block = [node, ...[...next.childNodes]]; // incluimos el <br> explícitamente
                    extracted.push(block);
                    node.remove(); // quitamos del DOM original
                    next.remove(); // quitamos la etiqueta que contenía los nodos
                    i++; // saltamos el siguiente porque ya lo procesamos
                    continue;
                }
            }

            // Caso: directamente <plain|rawhtml> (sin br previo)
            if (
                node.nodeType === Node.ELEMENT_NODE &&
                tagsToUnwrap.includes(node.tagName.toLowerCase())
            ) {
                const block = [...node.childNodes];
                extracted.push(block);
                node.remove();
            }
        }

        if (extracted.length) {
            // Construir un fragmento manteniendo el orden original
            const frag = doc.createDocumentFragment();

            extracted.forEach((block, index) => {
                // Si es el primer bloque y empieza con <br>, lo omitimos (quitamos el <br> inicial)
                let start = 0;
                if (
                    index === 0 &&
                    block[0] &&
                    block[0].nodeType === Node.ELEMENT_NODE &&
                    block[0].tagName.toLowerCase() === "br"
                ) {
                    start = 1;
                }
                for (let j = start; j < block.length; j++) {
                    frag.appendChild(block[j]);
                }
            });

            // Insertar todo de una vez después del <p>
            p.after(frag);
        }
    });

    let finalHtml = doc.body.innerHTML;
    let finalJS = "";

    let numberSVGcontainer = 1;

    // Restaurar los bloques de código
    for (const [placeholder, { language, code }] of codeBlocks) {
        let codeHtml = "";
        if (language.startsWith("svgcontainer")) {
            let attributes = "";
            // Extraer todos los atributos de la línea
            const attributeRegex = /(\w+)="([^"]+)"/g;
            let match;
            while ((match = attributeRegex.exec(language)) !== null) {
                const [, attr, value] = match;
                if (attr !== "src") {
                    // Ignoramos src ya que lo manejamos aparte
                    attributes += ` ${attr}="${value}"`;
                }
            }

            codeHtml = `<div
                id="SVGiewer${numberSVGcontainer}"
                class="SVG-viewer"
                ${attributes}
            >
            <button style="position: absolute; bottom: 10px; right: 10px;background: transparent; border: 0;">
                <svg id="zoom-in${numberSVGcontainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M4.929 4.929A10 10 0 1 1 19.07 19.07A10 10 0 0 1 4.93 4.93zM13 9a1 1 0 1 0-2 0v2H9a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2z"/></svg>
                <svg id="zoom-out${numberSVGcontainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34M16.5 11.5H8.5a0.5 0.5 0 0 0-0.5 0.5v1a0.5 0.5 0 0 0 0.5 0.5h8a0.5 0.5 0 0 0 0.5-0.5v-1a0.5 0.5 0 0 0-0.5-0.5"/></svg>
                <svg id="reset_zoom${numberSVGcontainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34m-6.489 5.8a1 1 0 0 0-1.218 1.567L10.585 12l-1.292 1.293l-.083.094a1 1 0 0 0 1.497 1.32L12 13.415l1.293 1.292l.094.083a1 1 0 0 0 1.32-1.497L13.415 12l1.292-1.293l.083-.094a1 1 0 0 0-1.497-1.32L12 10.585l-1.293-1.292l-.094-.083z"/></svg>
            </button>${code.replace("<svg ",`<svg id='page${numberSVGcontainer}'`)}</div>
            `;

            finalJS += `               
                window.zoomContainer${numberSVGcontainer} = svgPanZoom("#page${numberSVGcontainer}");
                
                let viewer${numberSVGcontainer} = document.getElementById('SVGiewer${numberSVGcontainer}');
                let rectElement${numberSVGcontainer} = viewer${numberSVGcontainer}.querySelector('svg>g>rect');

                function proper_height${numberSVGcontainer}(){
                    rectElement${numberSVGcontainer} = viewer${numberSVGcontainer}.querySelector('svg>g>rect');
                    if (rectElement${numberSVGcontainer}) {
                        // Get the dimensions of the rect
                        const rectWidth = rectElement${numberSVGcontainer}.getAttribute('width') || rectElement${numberSVGcontainer}.width.baseVal.value;
                        const rectHeight = rectElement${numberSVGcontainer}.getAttribute('height') || rectElement${numberSVGcontainer}.height.baseVal.value;
                        
                        // Calculate the ratio (height/width)
                        const aspectRatio = rectHeight / rectWidth;
                        
                        // Get the current width of the SVG-viewer
                        const viewerWidth = viewer${numberSVGcontainer}.offsetWidth;
                        
                        if (viewerWidth > 0) {
                            // Calculate the proportional height
                            const proportionalHeight = viewerWidth * aspectRatio;
                            
                            // Calculate 80vh in pixels
                            const maxHeight = window.innerHeight * 0.8;
                            
                            // Apply proportional height with limit of 80vh
                            const finalHeight = Math.min(proportionalHeight, maxHeight);
                            viewer${numberSVGcontainer}.style.height = finalHeight + 'px';
                        }
                    }
                }
                
                let resizeTimeout${numberSVGcontainer};
                window.addEventListener("resize", function () {
                    clearTimeout(resizeTimeout${numberSVGcontainer}); // Cancela cualquier timeout anterior
                    resizeTimeout${numberSVGcontainer} = setTimeout(function () {
                        viewer${numberSVGcontainer} = document.getElementById('SVGiewer${numberSVGcontainer}');
                        if (window.zoomContainer${numberSVGcontainer}) {
                            window.zoomContainer${numberSVGcontainer}.destroy();
                        }
                        proper_height${numberSVGcontainer}();
                        viewer${numberSVGcontainer}.querySelectorAll('.svg-pan-zoom_viewport').forEach(viewport => {
                            viewport.replaceWith(...viewport.childNodes);
                        });
                        window.zoomContainer${numberSVGcontainer} = svgPanZoom("#page${numberSVGcontainer}");
                        center_svg${numberSVGcontainer}();
                    }, 280); // 280ms después de que termine
                });
                
                proper_height${numberSVGcontainer}();

                // Button listeners
                document.getElementById('zoom-in${numberSVGcontainer}').addEventListener('click', function(ev){
                    ev.preventDefault()
                    window.zoomContainer${numberSVGcontainer}.zoomIn()
                });

                document.getElementById('zoom-out${numberSVGcontainer}').addEventListener('click', function(ev){
                    ev.preventDefault()
                    window.zoomContainer${numberSVGcontainer}.zoomOut()
                });
                
                function center_svg${numberSVGcontainer}(){
                    const zoomContainer = window.zoomContainer${numberSVGcontainer};
                    rectElement${numberSVGcontainer} = viewer${numberSVGcontainer}.querySelector('svg>g>rect');
                    
                    if (zoomContainer && rectElement${numberSVGcontainer}) {
                        zoomContainer.zoom(1);
                        zoomContainer.pan({
                            x: (viewer${numberSVGcontainer}.offsetWidth - (zoomContainer.getSizes().viewBox.width * zoomContainer.getSizes().realZoom))/2, 
                            y: (viewer${numberSVGcontainer}.offsetHeight - (zoomContainer.getSizes().viewBox.height * zoomContainer.getSizes().realZoom))/2 
                        });
                    }else{
                        window.zoomContainer${numberSVGcontainer}.resetZoom();
                        window.zoomContainer${numberSVGcontainer}.fit();
                        window.zoomContainer${numberSVGcontainer}.center();
                    }
                }

                document.getElementById('reset_zoom${numberSVGcontainer}').addEventListener('click', function(ev){
                    ev.preventDefault()
                    center_svg${numberSVGcontainer}();
                });
                
                center_svg${numberSVGcontainer}();`;
            numberSVGcontainer+=1;
        }else{
            // Escapar el contenido para mostrarlo como texto
            const escapedCode = code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            const copyButton = `<button class="code-copy-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 13H7a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 11V3a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>`;

            codeHtml = `<div class="code-block-wrapper">${copyButton}<pre><code class="language-${language}">${escapedCode}</code></pre></div>`;
        }
        finalHtml = finalHtml.replace(placeholder, codeHtml);
    }

    if (numberSVGcontainer > 1){
        finalJS += `
        //Center SVG inside SVG-viewer
        //If you have a lot of SVG use this and the id of SVG Viewer need to be SVGiewer{number} and window.zoomContainer need to be window.zoomContainer{number}:
        document.querySelectorAll('.SVG-viewer').forEach((viewer) => {
            const viewerId = viewer.id;
            const containerNumber = viewerId.replace('SVGiewer', '');
            const zoomContainer = window[\`zoomContainer\${containerNumber}\`];
            
            if (zoomContainer) {
                const rectElement = viewer.querySelector('svg>g>rect');
                
                if (rectElement) {
                    zoomContainer.zoom(1);
                    zoomContainer.pan({
                        x:
                            (viewer.offsetWidth -
                                zoomContainer.getSizes().viewBox.width *
                                    zoomContainer.getSizes().realZoom) /
                            2,
                        y:
                            (viewer.offsetHeight -
                                zoomContainer.getSizes().viewBox.height *
                                    zoomContainer.getSizes().realZoom) /
                            2,
                    });
                } else {
                    zoomContainer.resetZoom();
                    zoomContainer.fit();
                    zoomContainer.center();
                }
            }
        });
        
        /* Hacer que se desplaze lentamente */
        document.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", function (e) {
                const href = this.getAttribute("href") || this.getAttribute("xlink:href");
                
                // Solo procesar si es un enlace interno (empieza con #)
                if (href && href.startsWith("#")) {
                    e.preventDefault(); // evita el salto instantáneo

                    const targetId = href.substring(1); // substring quita el "#"
                    const target = document.getElementById(targetId);

                    if (target) {
                        const rect = target.getBoundingClientRect();
                        const scrollTop =
                            window.pageYOffset || document.documentElement.scrollTop;
                        const offset =
                            rect.top +
                            scrollTop -
                            window.innerHeight / 2 +
                            rect.height / 2;

                        window.scrollTo({
                            top: offset,
                            behavior: "smooth",
                        });
                    }
                }
            });
        });`;
    }

    // Add the sidebar
    finalHtml += `
        <div class="sidebar-overlay" id="sidebarOverlay"></div>

        <div class="sidebar-component" id="sidebar">
            <div class="sidebar-header">
                <svg id="sidebarToggle2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 16V8l-4 4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm5-2h9V5h-9z"/></svg>
                <div class="search-container">
                    <input type="text" autocomplete="off" class="search-input" placeholder="Search..." id="searchInput">
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
        </div>`

    // Reemplaza todas las coincidencias de <p></p>
    return [finalHtml.replace(/<p>\s*<\/p>/g, ""), sidebarContent, finalJS];
}

export function showCopySuccess(button, originalHTML) {
    button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

    setTimeout(() => {
        button.innerHTML = originalHTML;
    }, 2000);
}

export function manageEscapeIframe() {
    const expandedIframe = document.querySelector(".iframe-container.expanded");
    if (expandedIframe) {
        const button = expandedIframe.querySelector(".iframe-expand-button");
        const expandIcon = button.querySelector(".expand-icon");
        const contractIcon = button.querySelector(".contract-icon");

        expandedIframe.classList.remove("expanded");
        expandIcon.style.display = "block";
        contractIcon.style.display = "none";
        button.title = "Expand";
    }

    // También manejar el cierre de imágenes en pantalla completa
    const fullscreenContainer = document.querySelector(
        ".fullscreen-image-container"
    );
    if (fullscreenContainer) {
        fullscreenContainer.classList.remove("visible");
        setTimeout(() => fullscreenContainer.remove(), 300);
        document.body.style.overflow = "auto";
    }
}

export function manageClickFloatButton(e) {
    // Para los botones de expandir iframe
    if (e.target.closest(".iframe-expand-button")) {
        const button = e.target.closest(".iframe-expand-button");
        const container = button.closest(".iframe-container");
        const expandIcon = button.querySelector(".expand-icon");
        const contractIcon = button.querySelector(".contract-icon");

        container.classList.toggle("expanded");
        // Cambiar la visibilidad de los iconos
        if (container.classList.contains("expanded")) {
            expandIcon.style.display = "none";
            contractIcon.style.display = "block";
            button.title = "Contraer";
            document.body.style.overflow = "hidden";
        } else {
            expandIcon.style.display = "block";
            contractIcon.style.display = "none";
            button.title = "Expand";
            document.body.style.overflow = "auto";
        }
    }

    // Para las imágenes
    if (
        e.target.tagName === "IMG" &&
        e.target.closest(".entry-content") &&
        !e.target.closest(".fullscreen-image-container")
    ) {
        // Crear el contenedor de pantalla completa
        const container = document.createElement("div");
        container.className = "fullscreen-image-container";

        // Crear el botón de cerrar
        const closeButton = document.createElement("button");
        closeButton.className = "fullscreen-image-close";
        closeButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

        // Crear la imagen
        const fullImage = document.createElement("img");
        fullImage.src = e.target.src;
        fullImage.alt = e.target.alt;

        // Agregar elementos al DOM
        container.appendChild(closeButton);
        container.appendChild(fullImage);
        document.body.appendChild(container);

        // Mostrar con animación
        requestAnimationFrame(() => {
            container.classList.add("visible");
        });

        document.body.style.overflow = "hidden";

        // Función para cerrar
        const closeFullscreen = () => {
            container.classList.remove("visible");
            setTimeout(() => container.remove(), 300);
            document.body.style.overflow = "auto";
        };

        // Manejar el cierre con el botón
        closeButton.onclick = (e) => {
            e.stopPropagation();
            closeFullscreen();
        };

        // Manejar el cierre al hacer clic en el fondo
        container.onclick = (e) => {
            if (e.target === container) {
                closeFullscreen();
            }
        };
    }

    // Para los botones de copiar código
    if (e.target.closest(".code-copy-button")) {
        const button = e.target.closest(".code-copy-button");
        const codeBlock = button.parentElement.querySelector("code");
        const code = codeBlock.textContent;
        const originalHTML = button.innerHTML;

        navigator.clipboard
            .writeText(code)
            .then(() => {
                showCopySuccess(button, originalHTML);
            })
            .catch((err) => {
                console.error("Error al copiar:", err);
            });
    }
}

// Sidebar:
export class SidebarSearch {
    constructor(data) {
        this.data = this.processData(data);
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    processData(data) {
        const sections = [];
        let currentSection = null;

        data.forEach(item => {
            if (item.startsWith('## ')) {
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    id: `section-${sections.length}`,
                    title: item.replace(/^##\s*/, ''),
                    items: [],
                    expanded: false
                };
            } else if (item.startsWith('### ') && currentSection) {
                currentSection.items.push({
                    id: `item-${currentSection.items.length}`,
                    title: item.replace(/^###\s*/, '')
                });
            }
        });

        if (currentSection) sections.push(currentSection);
        return sections;
    }

    render() {
        const content = document.getElementById('sidebarContent');
        
        if (this.data.length === 0) {
            content.innerHTML = '<div class="no-results">No data</div>';
            return;
        }

        const html = this.data.map(section => `
            <div class="section ${section.expanded ? 'expanded' : ''}" data-section-id="${section.id}">
                <div class="section-header">
                    <span class="section-title">${section.title}</span>
                    ${section.items.length > 0 ? '<span class="collapse-icon">▼</span>' : ''}
                </div>
                <div class="section-items">
                    ${section.items.map(item => `
                        <div class="section-item" data-item-id="${item.id}">
                            ${item.title}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        content.innerHTML = html;
    }

    bindEvents() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const toggle2 = document.getElementById('sidebarToggle2');
        const overlay = document.getElementById('sidebarOverlay');
        const searchInput = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearButton');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        // Toggle sidebar
        toggle.addEventListener('click', () => this.toggle());
        toggle2.addEventListener('click', () => this.toggle());
        overlay.addEventListener('click', () => this.close());

        // Búsqueda
        searchInput.addEventListener('input', (e) => this.search(e.target.value));
        clearBtn.addEventListener('click', () => this.clearSearch());

        // Navegación
        prevBtn.addEventListener('click', () => this.navigatePrev());
        nextBtn.addEventListener('click', () => this.navigateNext());

        // Teclado
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.shiftKey ? this.navigatePrev() : this.navigateNext();
            }
            if (e.key === 'Escape') this.clearSearch();
        });

        // Click en secciones
        sidebar.addEventListener('click', (e) => {
            // Click en el título de la sección - toggle Y navegación al DOM
            if (e.target.closest('.section-title')) {
                const header = e.target.closest('.section-header');
                if (header) {
                    const sectionId = header.parentElement.dataset.sectionId;
                    
                    // Navegar al elemento del DOM
                    this.navigateToDOM(sectionId);
                }
                return;
            }

            // Click en un item (###) - solo navegación al DOM
            if (e.target.closest('.section-item')) {
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

            // Click en el ícono de colapso - solo toggle
            const header = e.target.closest('.section-header');
            if (header) {
                const sectionId = header.parentElement.dataset.sectionId;
                this.toggleSection(sectionId);
            }
            return;
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('active');
        this.isOpen = true;
    }

    close() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
        this.isOpen = false;
    }

    toggleSection(sectionId) {
        const section = this.data.find(s => s.id === sectionId);
        if (section) {
            section.expanded = !section.expanded;
            document.querySelector(`[data-section-id="${sectionId}"]`).classList.toggle('expanded');
        }
    }

    // Función para navegar al elemento del DOM
    navigateToDOM(sectionId, itemId = null) {
        // Crear un objeto result similar al de búsqueda para reutilizar findDOMElement
        const result = {
            sectionId: sectionId,
            itemId: itemId,
            type: itemId ? 'item' : 'section'
        };

        const domElement = findDOMElement(result, this.data);
        
        if (domElement) {
            this.close();
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

        document.getElementById('clearButton').classList.add('visible');
        this.searchResults = [];

        // Filtrar secciones que contengan el término de búsqueda
        const filteredData = [];

        this.data.forEach(section => {
            const sectionMatches = this.countMatches(section.title, query);
            const itemsWithMatches = section.items.map(item => ({
                ...item,
                matchCount: this.countMatches(item.title, query)
            })).filter(item => item.matchCount > 0);

            if (sectionMatches > 0 || itemsWithMatches.length > 0) {
                // Agregar la sección completa a los datos filtrados
                filteredData.push(section);

                // Agregar resultados de búsqueda por cada coincidencia
                for (let i = 0; i < sectionMatches; i++) {
                    this.searchResults.push({ 
                        sectionId: section.id, 
                        type: 'section',
                        matchIndex: i
                    });
                }
                
                itemsWithMatches.forEach(item => {
                    for (let i = 0; i < item.matchCount; i++) {
                        this.searchResults.push({ 
                            sectionId: section.id, 
                            itemId: item.id, 
                            type: 'item',
                            matchIndex: i
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

        console.log(sections.items);

        const html = sections.map(section => `
            <div class="section ${section.expanded ? 'expanded' : ''}" data-section-id="${section.id}">
                <div class="section-header">
                    <span class="section-title">${section.title}</span>
                    ${section.items.length > 0 ? '<span class="collapse-icon">▼</span>' : ''}
                </div>
                <div class="section-items">
                    ${section.items.map(item => `
                        <div class="section-item" data-item-id="${item.id}">
                            ${item.title}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        content.innerHTML = html;
    }

    highlightText(query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        document.querySelectorAll('.sidebar-component .section-title, .sidebar-component .section-item').forEach(el => {
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
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Función para encontrar el elemento correcto en el DOM
function findDOMElement(result, data) {
    const entryContent = document.getElementsByClassName("entry-content")[0];
    if (!entryContent) return null;

    const section = data.find(s => s.id === result.sectionId);
    if (!section) return null;

    const sectionIndex = data.indexOf(section);
    
    if (result.type === 'section') {
        // Para secciones (##), buscar el h2 correspondiente
        const h2Elements = entryContent.querySelectorAll("h2");
        return h2Elements[sectionIndex] || null;
    } else {
        // Para items (###), encontrar el h3 correcto dentro de la sección
        const item = section.items.find(i => i.id === result.itemId);
        if (!item) return null;

        const itemIndex = section.items.indexOf(item);
        
        // Obtener el h2 de la sección
        const h2Elements = entryContent.querySelectorAll("h2");
        const sectionH2 = h2Elements[sectionIndex];
        
        if (!sectionH2) return null;

        // Buscar h3 desde el h2 hacia adelante
        let currentElement = sectionH2.nextElementSibling;
        let h3Count = 0;

        while (currentElement) {
            if (currentElement.tagName === 'H2') {
                // Si encontramos otro h2, hemos salido de la sección
                break;
            }
            
            if (currentElement.tagName === 'H3') {
                if (h3Count === itemIndex) {
                    return currentElement;
                }
                h3Count++;
            }
            
            currentElement = currentElement.nextElementSibling;
        }

        return null;
    }
}