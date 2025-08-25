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
            if (line.trim().startsWith(":::details")) {
                // Inicio de details
                let nameSummary = line.trim().replace(":::details", "").trim();
                processedLines.push(
                    `REPLACE_SUMMARY_INIT_${nameSummary}_SUMMARY_INIT`
                );
                processedLines.push("");

                i++; // Avanzar a la siguiente línea
                while (i < lines.length && lines[i].trim() !== ":::") {
                    processedLines.push(lines[i]);
                    i++;
                }
                processedLines.push("");
                processedLines.push(
                    `REPLACE_SUMMARY_END`
                );
            } else if (line.trim().startsWith(":::iframe")) {
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
    // Configurar el renderer personalizado para los enlaces y encabezados
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
    
    // Personalizar el renderer para los encabezados H2 y H3
    let sectionCount = 0;
    let itemCount = 0;
    
    renderer.heading = function(element) {
        let id = '';

        if (element.depth === 2) {
            id = `section-${sectionCount}`;
            sectionCount++;
            itemCount = 0;
        } else if (element.depth === 3) {
            const currentSection = Math.max(0, sectionCount - 1);
            id = `section-${currentSection}-item-${itemCount}`;
            itemCount++;
        } else {
            // Para otros niveles de encabezado, usar el texto como base para el ID
            id = element.text.toLowerCase()
                .replace(/[^\w]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        return `<h${element.depth} id="${id}">${element.text}</h${element.depth}>`;
    };

    marked.setOptions({
        breaks: true,
        gfm: true,
        renderer: renderer,
        headerIds: true, // Activamos los IDs en los encabezados
        mangle: false,
    });

    // Primero protegemos los bloques de código
    const codeBlocks = new Map();
    // Mapa para guardar los códigos en línea con prefijos de lenguaje
    const inlineCodeBlocks = new Map();
    let blockCount = 0;
    let inlineCodeCount = 0;
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

    // Proteger código en línea con prefijo de lenguaje
    processedMarkdown = processedMarkdown.replace(/\b([a-z0-9_-]+)`((?:[^`]|\\`)+)`/g, (match, lang, code) => {
        // Verificar que el prefijo sea un identificador de lenguaje válido
        if (lang.match(/^[a-z0-9_-]+$/)) {
            const placeholder = `INLINE_CODE_${inlineCodeCount++}`;
            // Reemplazamos cualquier \` por ` en el código
            code = code.replace(/\\`/g, '`');
            inlineCodeBlocks.set(placeholder, { language: lang, code: code });
            return placeholder;
        }
        return match; // Devolver el match original si no parece un prefijo de lenguaje
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

    // Convertir el documento a HTML
    let finalHtml = doc.body.innerHTML;
    let finalJS = "";

    let numberSVGcontainer = 1;

    // Restaurar códigos en línea con prefijos de lenguaje
    for (const [placeholder, { language, code }] of inlineCodeBlocks) {
        // Escapamos el código HTML para asegurarnos de que se muestra correctamente
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // Usamos una expresión regular para asegurarnos de reemplazar solo placeholders completos
        // y no partes de texto que pudieran coincidir accidentalmente
        const regex = new RegExp(placeholder, "g");
        finalHtml = finalHtml.replace(
            regex,
            `<code class="language-${language}">${escapedCode}</code>`
        );
    }

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
                if (document.getElementById("page${numberSVGcontainer}")){
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
                    
                    center_svg${numberSVGcontainer}();
                }`;
            
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


    finalHtml = finalHtml.replace(/REPLACE_SUMMARY_INIT_(.*?)_SUMMARY_INIT/g, (match, key) => {
        if (key.startsWith("-open ")){
            key = key.replace("-open ", "");
            return `<details open>
                    <summary>${key}</summary>
                    <div class="content-wrapper-details">
                        <div class="contentDetails">`;
        }
        // Not default open details
        return `<details>
                    <summary>${key}</summary>
                    <div class="content-wrapper-details">
                        <div class="contentDetails">`;
    });

    finalHtml = finalHtml.replace(/REPLACE_SUMMARY_END/g, `            
                            </div>
                        </div>
                    </details>`
    );

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

    // This code makes the summary work with animation
    finalJS += `
        // Remover listener anterior del documento si existe
        if (window.detailsClickHandler) {
            document.removeEventListener('click', window.detailsClickHandler);
        }

        // Crear el handler
        window.detailsClickHandler = function(e) {
            const details = e.target.closest('details');
            if (!details) return;
            
            const summary = e.target.closest('summary');
            if (!summary) return;
            
            const contentWrapper = details.querySelector('.content-wrapper-details');
            if (!contentWrapper) return;
            
            e.preventDefault();
            
            if (details.open) {
                // Cerrar con animación
                contentWrapper.classList.add('animating');
                contentWrapper.classList.remove('opening');
                
                setTimeout(() => {
                    details.open = false;
                    contentWrapper.classList.remove('animating');
                }, 400);
            } else {
                // Abrir con animación
                details.open = true;
                contentWrapper.classList.add('animating');
                
                // Forzar reflow
                contentWrapper.offsetHeight;
                
                contentWrapper.classList.add('opening');
                
                setTimeout(() => {
                    contentWrapper.classList.remove('animating');
                }, 400);
            }
        };

        // Agregar un solo listener al documento
        document.addEventListener('click', window.detailsClickHandler);
        
        // Inicializar estado de contenido ya abierto
        document.querySelectorAll('details[open]').forEach(details => {
            const contentWrapper = details.querySelector('.content-wrapper-details');
            contentWrapper.classList.add('opening');
        });
    `

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