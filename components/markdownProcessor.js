function processInlineCodeBlocks(
    text,
    inlineCodeBlocks,
    noPlaceHolder = false
) {
    let inlineCodeCount = 0;
    let result = text;

    // Regex más compatible: encuentra todos los backticks
    const allBackticks = [];
    let match;
    const regex = /`/g;

    while ((match = regex.exec(text)) !== null) {
        allBackticks.push(match.index);
    }

    // Filtrar solo backticks simples
    const singleBackticks = allBackticks.filter((pos) => {
        const before = pos > 0 && text[pos - 1] === "`";
        const after = pos < text.length - 1 && text[pos + 1] === "`";
        return !before && !after;
    });

    // Resto igual...
    const validBlocks = [];
    for (let i = 0; i < singleBackticks.length - 1; i += 2) {
        const start = singleBackticks[i];
        const end = singleBackticks[i + 1];

        if (end !== undefined) {
            const beforeBacktick = text.substring(0, start);
            const langMatch = beforeBacktick.match(/ ([a-zA-Z0-9]+)$/);

            if (langMatch) {
                const lang = langMatch[1];
                const code = text.substring(start + 1, end);
                validBlocks.push({
                    start: start - langMatch[0].length + 1,
                    end: end + 1,
                    lang,
                    code,
                });
            }
        }
    }

    validBlocks.reverse().forEach((block) => {
        let placeholder = `INLINE_CODE_${inlineCodeCount++}_CODE_INLINE`;
        if (noPlaceHolder) {
            placeholder = `<code class="language-${block.lang}">${block.code}</code>`;
        } else {
            inlineCodeBlocks.set(placeholder, {
                language: block.lang,
                code: block.code,
            });
        }
        result =
            result.substring(0, block.start) +
            ` ${placeholder}` +
            result.substring(block.end);
    });

    return [result, inlineCodeBlocks];
}

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

        // Detectar inicio/fin de bloque de código (con o sin espacios al inicio)
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("```")) {
            if (!inCodeBlock) {
                // Inicio de bloque de código
                inCodeBlock = true;
                currentCodeBlock.language = trimmedLine.slice(3).trim();
                currentCodeBlock.lines = [];
            } else {
                // Fin de bloque de código
                inCodeBlock = false;
                const placeholder = `CODE_BLOCK_${codeBlockId}_BLOCK_CODE`;
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
            // Detectar inicio/fin de bloque flotante
            if (line.trim().startsWith(":::float-")) {
                const floatId = line.trim().substring(":::float-".length);
                processedLines.push("");
                processedLines.push(
                    `<div class="float-container" id="float-${floatId}"><button class="float-close">×</button>`
                );
                processedLines.push("");
                i++;
                while (i < lines.length && lines[i].trim() !== ":::") {
                    processedLines.push(lines[i]);
                    i++;
                }
                processedLines.push("");
                processedLines.push("</div>");
                processedLines.push("");
            } else if (line.trim().startsWith(":::note")) {
                // Inicio de note
                processedLines.push('<div class="note-callout">');
                processedLines.push('<div class="callout-header">');
                processedLines.push(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 20H7.197c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C4 18.48 4 17.92 4 16.8V7.2c0-1.12 0-1.68.218-2.108c.192-.377.497-.682.874-.874C5.52 4 6.08 4 7.2 4h9.6c1.12 0 1.68 0 2.107.218c.377.192.683.497.875.874c.218.427.218.987.218 2.105V13m-7 7c.286-.003.466-.014.639-.055q.308-.075.578-.24c.202-.124.375-.296.72-.642l4.126-4.125c.346-.346.518-.52.642-.721q.165-.271.24-.579c.04-.172.051-.352.054-.638M13 20v-5.4c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C13.76 13 14.04 13 14.6 13H20"/></svg>'
                );
                processedLines.push("<span>Note</span>");
                processedLines.push("</div>");
                processedLines.push('<div class="callout-content">');
                processedLines.push("");

                // Procesar el contenido hasta encontrar el final del bloque
                i++;
                while (i < lines.length && lines[i].trim() !== ":::") {
                    processedLines.push(lines[i]);
                    i++;
                }

                processedLines.push("</div>");
                processedLines.push("</div>");
            } else if (line.trim().startsWith(":::warning")) {
                // Inicio de warning
                processedLines.push('<div class="warning-callout">');
                processedLines.push('<div class="callout-header">');
                processedLines.push(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12.5ZM2.725 21q-.575 0-.85-.537T1.8 19.4l9.2-16q.275-.5.75-.7t.95 0t.75.7l9.2 16q.275.5.075 1.063T21.9 21zm1.85-2h14.85L12 5zm7.425-1q.425 0 .713-.288T13 17q0-.425-.288-.713T12 16q-.425 0-.713.288T11 17q0 .425.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.713T12 10q-.425 0-.713.288T11 11v3q0 .425.288.713T12 15"></path></svg>'
                );
                processedLines.push("<span>Warning</span>");
                processedLines.push("</div>");
                processedLines.push('<div class="callout-content">');
                processedLines.push("");

                // Procesar el contenido hasta encontrar el final del bloque
                i++;
                while (i < lines.length && lines[i].trim() !== ":::") {
                    processedLines.push(lines[i]);
                    i++;
                }

                processedLines.push("</div>");
                processedLines.push("</div>");
            } else if (line.trim().startsWith(":::details")) {
                // Inicio de details
                let nameSummary = line.trim().replace(":::details", "").trim();
                if (nameSummary.startsWith("-open ")) {
                    nameSummary = nameSummary.replace("-open ", "");
                    processedLines.push(`<details open>
                            <summary>${nameSummary}</summary>
                            <div class="content-wrapper-details">
                                <div class="contentDetails">`);
                } else {
                    // Not default open details
                    processedLines.push(`<details>
                                <summary>${nameSummary}</summary>
                                <div class="content-wrapper-details">
                                    <div class="contentDetails">`);
                }
                processedLines.push("");

                i++; // Avanzar a la siguiente línea
                while (i < lines.length && lines[i].trim() !== ":::") {
                    processedLines.push(lines[i]);
                    i++;
                }
                processedLines.push("");
                processedLines.push("</div> </div> </details>");
                processedLines.push("");
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
    let subitemCounts = {}; // Objeto para manejar contadores de subitems por cada item

    renderer.heading = function (element) {
        let id = "";

        if (element.depth === 2) {
            id = `section-${sectionCount}`;
            sectionCount++;
            itemCount = 0;
            // Reiniciar contadores de subitems para la nueva sección
            subitemCounts = {};
        } else if (element.depth === 3) {
            const currentSection = Math.max(0, sectionCount - 1);
            id = `section-${currentSection}-item-${itemCount}`;
            itemCount++;
            // Inicializar contador de subitems para este item
            subitemCounts[`${currentSection}-${itemCount - 1}`] = 0;
        } else if (element.depth >= 4 && element.depth <= 6) {
            // Para H4-H6, mantener el formato consistente
            const currentSection = Math.max(0, sectionCount - 1);
            const currentItem = Math.max(0, itemCount - 1);
            const key = `${currentSection}-${currentItem}`;

            // Si el contador para este item no existe, inicializarlo
            if (subitemCounts[key] === undefined) {
                subitemCounts[key] = 0;
            }

            // Generar ID con el formato section-X-item-Y-subitem-Z
            id = `section-${currentSection}-item-${currentItem}-subitem-${subitemCounts[key]}`;
            subitemCounts[key]++;
        } else {
            // Para otros tipos de elementos (aunque no deberían existir)
            id = element.text
                .toLowerCase()
                .replace(/[^\w]+/g, "-")
                .replace(/(^-|-$)/g, "");
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
    let inlineCodeBlocks = new Map();
    let blockCount = 0;
    let inCodeBlock = false;
    let currentLanguage = "";
    let currentCode = [];
    const lines = markdownContent.split("\n");
    let protectedContent = [];
    let sidebarContent = [];

    for (let line of lines) {
        if (
            !inCodeBlock &&
            (line.startsWith("## ") ||
                line.startsWith("### ") ||
                line.startsWith("#### ") ||
                line.startsWith("##### ") ||
                line.startsWith("###### "))
        ) {
            // Put the headers contents in the sidebar with proper formatting
            let textHeader = processInlineCodeBlocks(
                line.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                inlineCodeBlocks,
                true
            )[0];
            sidebarContent.push(textHeader);
        }

        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("```")) {
            if (!inCodeBlock) {
                // Inicio de bloque de código
                inCodeBlock = true;
                currentLanguage = trimmedLine.slice(3).trim();
                currentCode = [];
            } else {
                // Fin de bloque de código
                inCodeBlock = false;
                const placeholder = `CODE_BLOCK_${blockCount++}_BLOCK_CODE`;
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
    [processedMarkdown, inlineCodeBlocks] = processInlineCodeBlocks(
        processedMarkdown,
        inlineCodeBlocks
    );

    // Procesar iframes y convertir a HTML
    const processedWithIframes = processMarkdownWithIframes(processedMarkdown);
    processedMarkdown = processedWithIframes;
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

    // Process the float element
    finalHtml = finalHtml.replace(/\(\?=([a-zA-Z0-9-_]+)\)/g, (match, id) => {
        return `<span class="float-trigger" data-float-id="${id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 28"><g fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="5" y="5" rx="4"/><path stroke-linecap="round" d="M12 15.52v-.01m-1.998-5.533C10.157 9.019 11 8.5 12 8.5s1.686.672 1.87 1.207c.183.535.144 1.344-.363 1.809s-.773.316-1.229.8a1.8 1.8 0 0 0-.278.432"/></g></svg>
        </span>`;
    });

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
            </button>${code.replace(
                "<svg ",
                `<svg id='page${numberSVGcontainer}'`
            )}</div>
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

            numberSVGcontainer += 1;
        } else {
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
        // Reemplazar el placeholder por el bloque de código, manejando posibles <br> antes/después
        const regex = new RegExp(`(<br>\\s*)?${placeholder}(\\s*<br>)?`, "g");
        finalHtml = finalHtml.replace(regex, codeHtml);
    }

    if (numberSVGcontainer > 1) {
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
    `;

    // Añadir el código JavaScript para manejar los elementos flotantes
    finalJS += `
    // Limpiar event listeners anteriores si existen
    if (window.floatEventListeners) {
        if (window.floatEventListeners.triggerClick) {
            window.floatEventListeners.triggerClick.forEach(item => {
                item.element.removeEventListener('click', item.handler);
            });
        }
        if (window.floatEventListeners.documentClick) {
            document.removeEventListener('click', window.floatEventListeners.documentClick);
        }
        if (window.floatEventListeners.documentKeydown) {
            document.removeEventListener('keydown', window.floatEventListeners.documentKeydown);
        }
    }
    
    // Inicializar el objeto para almacenar los event listeners
    window.floatEventListeners = {
        triggerClick: [],
        documentClick: null,
        documentKeydown: null,
        activeFloats: new Set()
    };
    
    // Manejar los elementos flotantes
    document.querySelectorAll('.float-trigger').forEach(trigger => {
        const clickHandler = function() {
            const floatId = this.getAttribute('data-float-id');
            const floatContainer = document.getElementById('float-' + floatId);
            
            if (!floatContainer) return;
            
            // Si el contenedor ya está visible, lo cerramos
            if (floatContainer.classList.contains('visible')) {
                floatContainer.classList.remove('visible');
                window.floatEventListeners.activeFloats.delete(floatId);
                return;
            }
            
            // Cerrar todos los contenedores flotantes que estén abiertos
            document.querySelectorAll('.float-container.visible').forEach(container => {
                container.classList.remove('visible');
                const openFloatId = container.id.replace('float-', '');
                window.floatEventListeners.activeFloats.delete(openFloatId);
            });
            
            // Mostrar el contenedor
            floatContainer.classList.add('visible');
            window.floatEventListeners.activeFloats.add(floatId);
            
            // Posicionar el contenedor flotante cerca del trigger
            const triggerRect = this.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const floatWidth = floatContainer.offsetWidth;
            const floatHeight = floatContainer.offsetHeight;
            
            // Calcular posición
            let left = triggerRect.left + window.scrollX;
            let top = triggerRect.bottom + window.scrollY + 10;
            
            // Ajustar si se sale de la pantalla
            if (left + floatWidth > windowWidth - 20) {
                left = windowWidth - floatWidth - 20;
            }
            
            if (top + floatHeight > window.scrollY + windowHeight - 20) {
                top = triggerRect.top + window.scrollY - floatHeight - 10;
            }
            
            floatContainer.style.left = left + 'px';
            floatContainer.style.top = top + 'px';
        };
        
        trigger.addEventListener('click', clickHandler);
        window.floatEventListeners.triggerClick.push({
            element: trigger,
            handler: clickHandler
        });
    });
    
    // Cerrar los elementos flotantes al hacer clic fuera
    const documentClickHandler = function(e) {
        if (e.target.classList.contains('float-close')) {
            const container = e.target.closest('.float-container');
            if (container) {
                container.classList.remove('visible');
                const floatId = container.id.replace('float-', '');
                window.floatEventListeners.activeFloats.delete(floatId);
            }
        } else if (!e.target.closest('.float-container') && !e.target.closest('.float-trigger')) {
            document.querySelectorAll('.float-container.visible').forEach(container => {
                container.classList.remove('visible');
                const floatId = container.id.replace('float-', '');
                window.floatEventListeners.activeFloats.delete(floatId);
            });
        }
    };
    
    document.addEventListener('click', documentClickHandler);
    window.floatEventListeners.documentClick = documentClickHandler;
    
    // Cerrar con ESC
    const documentKeydownHandler = function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.float-container.visible').forEach(container => {
                container.classList.remove('visible');
                const floatId = container.id.replace('float-', '');
                window.floatEventListeners.activeFloats.delete(floatId);
            });
        }
    };
    
    document.addEventListener('keydown', documentKeydownHandler);
    window.floatEventListeners.documentKeydown = documentKeydownHandler;
    
    // Método global para cerrar todos los elementos flotantes
    window.closeAllFloats = function() {
        document.querySelectorAll('.float-container.visible').forEach(container => {
            container.classList.remove('visible');
        });
        window.floatEventListeners.activeFloats.clear();
    };`;

    // // Quitar el primer p del li (titulo) para que no ocupe espacio
    // finalJS += `
    // document.querySelectorAll('li').forEach(li => {
    //     const primerParrafo = li.querySelector('p');
    //     if (primerParrafo) {
    //         const nuevoSpan = document.createElement('span');
    //         nuevoSpan.textContent = primerParrafo.textContent;
    //         primerParrafo.replaceWith(nuevoSpan);
    //     }
    // });`;

    return [finalHtml, sidebarContent, finalJS];
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
