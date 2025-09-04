function obtainAttributes(e){const s=/(\w+)="([^"]+)"/g;let t,n="";for(;(t=s.exec(e))!==null;){const[,e,s]=t;e!=="src"&&(n+=` ${e}="${s}"`)}return n}function escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function processBalancedDelimiters(e,t){let s=e;const{findPattern:i,openChar:a,closeChar:r,processMatch:c,shouldProcess:l=()=>!0}=t,o=[];let n;for(;(n=i.exec(e))!==null;){const t={fullMatch:n,start:n.index,...n.groups||{}};let s=1,i=n.index+n[0].length,c=-1;for(;i<e.length&&s>0;){const t=e[i];if(t===a)s++;else if(t===r&&(s--,s===0)){c=i;break}i++}c!==-1&&(t.end=c+1,t.content=e.substring(n.index+n[0].length,c),l(t)&&o.push(t))}return o.reverse().forEach(t=>{const n=c(t,e);n!==null&&(s=s.substring(0,t.start)+n+s.substring(t.end))}),s}function processInlineCodeBlocks(e,t,n=!1){let c=0,s=e;const i=[];let a;const l=/`/g;for(;(a=l.exec(e))!==null;)i.push(a.index);const o=i.filter(t=>{const n=t>0&&e[t-1]==="`",s=t<e.length-1&&e[t+1]==="`";return!n&&!s}),r=[];for(let t=0;t<o.length-1;t+=2){const n=o[t],s=o[t+1];if(s!==0[0]){const o=e.substring(0,n),t=o.match(/ ([a-zA-Z0-9]+)$/);if(t){const o=t[1],i=e.substring(n+1,s);r.push({start:n-t[0].length+1,end:s+1,lang:o,code:i})}}}return r.reverse().forEach(e=>{let o=`INLINE_CODE_${c++}_CODE_INLINE`;n?o=`<code class="language-${e.lang}">${e.code}</code>`:t.set(o,{language:e.lang,code:e.code}),s=s.substring(0,e.start)+` ${o}`+s.substring(e.end)}),[s,t]}function processCodeBlocksAndTitles(e){let r=0,n=!1,o="",s=[],i=[],t=[],a=new Map;const c=e.split(`
`);for(let e of c){const l=e.trim();if(l.startsWith("```")){if(n){n=!1;const e=`CODE_BLOCK_${r++}_BLOCK_CODE`;a.set(e,{language:o,code:s.join(`
`)}),t.push(e)}else n=!0,o=l.slice(3).trim(),s=[];continue}if(n)s.push(e);else if(e.startsWith("## ")||e.startsWith("### ")||e.startsWith("#### ")||e.startsWith("##### ")||e.startsWith("###### ")){let n=processInlineCodeBlocks(e.replace(/</g,"&lt;").replace(/>/g,"&gt;"),[],!0)[0];i.push(n),t.push(e)}else e.startsWith("#t ")?t.push(`<plain>${e.substring(3)}</plain>`):e.startsWith("<")?t.push(`<rawhtml>${e}</rawhtml>`):t.push(e)}return[t.join(`
`),a,i]}function processMarkdownBlocks(e){const n=e.split(`
`);let t=[];function s(e){for(t.push(""),e++;e<n.length&&n[e].trim()!==":::";)t.push(n[e]),e++;return t.push(""),e}for(let e=0;e<n.length;e++){const o=n[e];if(o.trim().startsWith(":::float-")){const n=o.trim().substring(":::float-".length);t.push(""),t.push(`<div class="float-container" id="float-${n}"><button class="float-close">×</button>`),e=s(e),t.push("</div>"),t.push("")}else if(o.trim().startsWith(":::note"))t.push('<div class="note-callout">'),t.push('<div class="callout-header">'),t.push('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 20H7.197c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C4 18.48 4 17.92 4 16.8V7.2c0-1.12 0-1.68.218-2.108c.192-.377.497-.682.874-.874C5.52 4 6.08 4 7.2 4h9.6c1.12 0 1.68 0 2.107.218c.377.192.683.497.875.874c.218.427.218.987.218 2.105V13m-7 7c.286-.003.466-.014.639-.055q.308-.075.578-.24c.202-.124.375-.296.72-.642l4.126-4.125c.346-.346.518-.52.642-.721q.165-.271.24-.579c.04-.172.051-.352.054-.638M13 20v-5.4c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C13.76 13 14.04 13 14.6 13H20"/></svg>'),t.push("<span>Note</span>"),t.push("</div>"),t.push('<div class="callout-content">'),e=s(e),t.push("</div>"),t.push("</div>");else if(o.trim().startsWith(":::warning"))t.push('<div class="warning-callout">'),t.push('<div class="callout-header">'),t.push('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12.5ZM2.725 21q-.575 0-.85-.537T1.8 19.4l9.2-16q.275-.5.75-.7t.95 0t.75.7l9.2 16q.275.5.075 1.063T21.9 21zm1.85-2h14.85L12 5zm7.425-1q.425 0 .713-.288T13 17q0-.425-.288-.713T12 16q-.425 0-.713.288T11 17q0 .425.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.713T12 10q-.425 0-.713.288T11 11v3q0 .425.288.713T12 15"></path></svg>'),t.push("<span>Warning</span>"),t.push("</div>"),t.push('<div class="callout-content">'),e=s(e),t.push("</div>"),t.push("</div>");else if(o.trim().startsWith(":::details")){let n=o.trim().replace(":::details","").trim(),i=!1;n.startsWith("-open ")&&(n=n.replace("-open ",""),i=!0),t.push(`<details${i?" open":""}>
                            <summary>${n}</summary>
                            <div class="content-wrapper-details">
                                <div class="contentDetails">`),e=s(e),t.push("</div> </div> </details>"),t.push("")}else if(o.trim().startsWith(":::iframe")){let i=obtainAttributes(o),s=[];for(e++;e<n.length&&n[e].trim()!==":::";)s.push(n[e]),e++;const a=s.join("").trim(),r=`<svg width="16" height="16" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M3 21v-5h2v3h3v2zm13 0v-2h3v-3h2v5zM3 8V3h5v2H5v3zm16 0V5h-3V3h5v5z"/>
                        </svg>`,c=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3L13 13M3 13V7M3 13H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`;t.push(`<div class="iframe-container"><iframe src="${a}" frameborder="0" allowfullscreen ${i}></iframe><button class="iframe-expand-button" title="Expand"><span class="expand-icon">${r}</span><span class="contract-icon" style="display: none;">${c}</span></button></div>`)}else t.push(o)}return t.join(`
`)}export function renderMarkdown(e){const c=new marked.Renderer;c.link=e=>{const t=e.text.endsWith(" new"),n=t?e.text.slice(0,-4):e.text,s=t?'target="_blank" rel="noopener noreferrer"':"";return`<a href="${e.href}" ${s}${e.title?` title="${e.title}"`:""}>${n}</a>`};let r=0,a=0,o={};c.heading=function(e){let t="";if(e.depth===2)t=`section-${r}`,r++,a=0,o={};else if(e.depth===3){const e=Math.max(0,r-1);t=`section-${e}-item-${a}`,a++,o[`${e}-${a-1}`]=0}else if(e.depth>=4&&e.depth<=6){const n=Math.max(0,r-1),s=Math.max(0,a-1),e=`${n}-${s}`;o[e]===0[0]&&(o[e]=0),t=`section-${n}-item-${s}-subitem-${o[e]}`,o[e]++}else t=e.text.toLowerCase().replace(/[^\w]+/g,"-").replace(/(^-|-$)/g,"");return`<h${e.depth} id="${t}">${e.text}</h${e.depth}>`};let d=new Map,l=new Map,u=[],n="";[n,d,u]=processCodeBlocksAndTitles(e),n=n.replace(/\n\n\n+/g,e=>{const t=e.length-2,n="<rawhtml><br></rawhtml>".repeat(t);return`

${n}

`}),[n,l]=processInlineCodeBlocks(n,l),n=processBalancedDelimiters(n,{findPattern:/\[(?<linkText>[^\]]+)\]\((?<hrefStart>#)/g,openChar:"(",closeChar:")",shouldProcess:e=>{const t=e.content;return t.includes(" ")||t.includes("(")||t.includes(")")||t.includes("<")||t.includes(">")||t.includes('"')||t.includes("=")||t.includes("&")||t.includes("%")},processMatch:(e)=>{const n=e.linkText,s=e.hrefStart+e.content;let o=s.replace(/"/g,"%22").replace(/ /g,"%20").replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/</g,"%3C").replace(/>/g,"%3E").replace(/&/g,"%26");return`[${n}](${o})`}});const h=processMarkdownBlocks(n);n=h,marked.setOptions({breaks:!0,gfm:!0,renderer:c,headerIds:!0,mangle:!1});let s=marked.parse(n),i="";s=s.replace(/\(\?=([a-zA-Z0-9-_]+)\)/g,(e,t)=>`<span class="float-trigger" data-float-id="${t}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 28"><g fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="5" y="5" rx="4"/><path stroke-linecap="round" d="M12 15.52v-.01m-1.998-5.533C10.157 9.019 11 8.5 12 8.5s1.686.672 1.87 1.207c.183.535.144 1.344-.363 1.809s-.773.316-1.229.8a1.8 1.8 0 0 0-.278.432"/></g></svg>
        </span>`);for(const[e,{language:t,code:n}]of l){const o=escapeHtml(n),i=new RegExp(e,"g");s=s.replace(i,`<code class="language-${t}">${o}</code>`)}let t=1;for(const[a,{language:e,code:o}]of d){let n="";if(e.startsWith("svgcontainer")){let s=obtainAttributes(e);n=`<div
                id="SVGiewer${t}"
                class="SVG-viewer"
                ${s}
            >
            <button style="position: absolute; bottom: 10px; right: 10px;background: transparent; border: 0;">
                <svg id="zoom-in${t}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M4.929 4.929A10 10 0 1 1 19.07 19.07A10 10 0 0 1 4.93 4.93zM13 9a1 1 0 1 0-2 0v2H9a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2z"/></svg>
                <svg id="zoom-out${t}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34M16.5 11.5H8.5a0.5 0.5 0 0 0-0.5 0.5v1a0.5 0.5 0 0 0 0.5 0.5h8a0.5 0.5 0 0 0 0.5-0.5v-1a0.5 0.5 0 0 0-0.5-0.5"/></svg>
                <svg id="reset_zoom${t}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34m-6.489 5.8a1 1 0 0 0-1.218 1.567L10.585 12l-1.292 1.293l-.083.094a1 1 0 0 0 1.497 1.32L12 13.415l1.293 1.292l.094.083a1 1 0 0 0 1.32-1.497L13.415 12l1.292-1.293l.083-.094a1 1 0 0 0-1.497-1.32L12 10.585l-1.293-1.292l-.094-.083z"/></svg>
            </button>${o.replace("<svg ",`<svg id='page${t}'`)}</div>
            `,i+=`
                if (document.getElementById("page${t}")){
                window.zoomContainer${t} = svgPanZoom("#page${t}");
                    
                    let viewer${t} = document.getElementById('SVGiewer${t}');
                    let rectElement${t} = viewer${t}.querySelector('svg>g>rect');

                    function proper_height${t}(){
                        rectElement${t} = viewer${t}.querySelector('svg>g>rect');
                        if (rectElement${t}) {
                            // Get the dimensions of the rect
                            const rectWidth = rectElement${t}.getAttribute('width') || rectElement${t}.width.baseVal.value;
                            const rectHeight = rectElement${t}.getAttribute('height') || rectElement${t}.height.baseVal.value;
                            
                            // Calculate the ratio (height/width)
                            const aspectRatio = rectHeight / rectWidth;
                            
                            // Get the current width of the SVG-viewer
                            const viewerWidth = viewer${t}.offsetWidth;
                            
                            if (viewerWidth > 0) {
                                // Calculate the proportional height
                                const proportionalHeight = viewerWidth * aspectRatio;
                                
                                // Calculate 80vh in pixels
                                const maxHeight = window.innerHeight * 0.8;
                                
                                // Apply proportional height with limit of 80vh
                                const finalHeight = Math.min(proportionalHeight, maxHeight);
                                viewer${t}.style.height = finalHeight + 'px';
                            }
                        }
                    }
                    
                    let resizeTimeout${t};
                    window.addEventListener("resize", function () {
                        clearTimeout(resizeTimeout${t}); // Cancela cualquier timeout anterior
                        resizeTimeout${t} = setTimeout(function () {
                            viewer${t} = document.getElementById('SVGiewer${t}');
                            if (window.zoomContainer${t}) {
                                window.zoomContainer${t}.destroy();
                            }
                            proper_height${t}();
                            viewer${t}.querySelectorAll('.svg-pan-zoom_viewport').forEach(viewport => {
                                viewport.replaceWith(...viewport.childNodes);
                            });
                            window.zoomContainer${t} = svgPanZoom("#page${t}");
                            center_svg${t}();
                        }, 280); // 280ms after it finishes
                    });
                    
                    proper_height${t}();

                    // Button listeners
                    document.getElementById('zoom-in${t}').addEventListener('click', function(ev){
                        ev.preventDefault()
                        window.zoomContainer${t}.zoomIn()
                    });

                    document.getElementById('zoom-out${t}').addEventListener('click', function(ev){
                        ev.preventDefault()
                        window.zoomContainer${t}.zoomOut()
                    });
                    
                    function center_svg${t}(){
                        const zoomContainer = window.zoomContainer${t};
                        rectElement${t} = viewer${t}.querySelector('svg>g>rect');
                        
                        if (zoomContainer && rectElement${t}) {
                            zoomContainer.zoom(1);
                            zoomContainer.pan({
                                x: (viewer${t}.offsetWidth - (zoomContainer.getSizes().viewBox.width * zoomContainer.getSizes().realZoom))/2, 
                                y: (viewer${t}.offsetHeight - (zoomContainer.getSizes().viewBox.height * zoomContainer.getSizes().realZoom))/2 
                            });
                        }else{
                            window.zoomContainer${t}.resetZoom();
                            window.zoomContainer${t}.fit();
                            window.zoomContainer${t}.center();
                        }
                    }

                    document.getElementById('reset_zoom${t}').addEventListener('click', function(ev){
                        ev.preventDefault()
                        center_svg${t}();
                    });
                    
                    center_svg${t}();
                }`,t+=1}else{const t=escapeHtml(o),s=`<button class="code-copy-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 13H7a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 11V3a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>`;n=`<div class="code-block-wrapper">${s}<pre><code class="language-${e}">${t}</code></pre></div>`}const r=new RegExp(`(<br>\\s*)?${a}(\\s*<br>)?`,"g");s=s.replace(r,n)}return t>1&&(i+=`
        //Center SVG inside SVG-viewer
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
        });`),i+=`
        /* Make it scroll slowly with special functionalities */
        document.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", function (e) {
                const href = this.getAttribute("href") || this.getAttribute("xlink:href");
                
                // Only process if it's an internal link (starts with #)
                if (href && href.startsWith("#")) {
                    e.preventDefault(); // prevents instant jump

                    let target = null;
                    const entryContent = document.querySelector('.entry-content');
                    let targetId = href.substring(1); // substring removes the "#"
                    
                    targetId = decodeURIComponent(targetId);
                    
                    // Check if it's a special link with parameters
                    if (targetId.includes('=')) {
                        
                        // Use indexOf to properly handle values with spaces or special characters
                        const equalIndex = targetId.indexOf('=');
                        const type = targetId.substring(0, equalIndex);
                        const value = targetId.substring(equalIndex + 1);
                        
                        if (type === 'h' && !isNaN(value)) {
                            // Search for the specified h{number} (e.g. #h=1 searches for the first h1)
                            const headingLevel = parseInt(value);
                            if (headingLevel >= 1 && headingLevel <= 6) {
                                const headings = entryContent ? 
                                    entryContent.querySelectorAll(\`h\${headingLevel}\`) : 
                                    document.querySelectorAll(\`h\${headingLevel}\`);
                                if (headings.length > 0) {
                                    target = headings[0];
                                }
                            }
                        } else if (type.match(/^h[1-6]$/)) {
                            // Search by position or by text in the specified h type
                            const headingLevel = parseInt(type.substring(1));
                            
                            if (headingLevel >= 1 && headingLevel <= 6) {
                                const headings = entryContent ? 
                                    entryContent.querySelectorAll(\`h\${headingLevel}\`) : 
                                    document.querySelectorAll(\`h\${headingLevel}\`);
                                
                                if (!isNaN(value)) {
                                    // Search by position (e.g. #h2=3 searches for the third h2)
                                    const elementIndex = parseInt(value) - 1; // Convert to 0-based index
                                    if (elementIndex >= 0 && headings.length > elementIndex) {
                                        target = headings[elementIndex];
                                    }
                                } else {
                                    // Search by text (e.g. #h2=Introduction searches for the first h2 containing "Introduction")
                                    const searchText = decodeURIComponent(value);
                                    target = Array.from(headings).find(heading => 
                                        heading.textContent.toLowerCase().includes(searchText.toLowerCase())
                                    );
                                }
                            }
                        } else if (type === 'text') {
                            const searchText = decodeURIComponent(value);
                            const searchArea = entryContent || document;

                            // Search directly in all elements
                            const allElements = searchArea.querySelectorAll('*');
                            target = Array.from(allElements).find(element => 
                                element.textContent.includes(searchText)
                            );
                        } else if (type === 'query') {
                            // Execute custom querySelector (e.g. #query=document.querySelector("selector"))
                            try {
                                const queryString = decodeURIComponent(value);
                                // Evaluate the query safely
                                target = eval(queryString);
                            } catch (error) {
                                console.warn('Error executing query selector:', error);
                                target = null;
                            }
                        }
                    } else {
                        // Normal search by ID
                        target = document.getElementById(targetId);
                    }

                    if (target) {
                        const container = document.getElementsByClassName('entry-content')[0];
                        if (container) {
                            const containerRect = container.getBoundingClientRect();
                            const targetRect = target.getBoundingClientRect();
                            
                            // Calculate the relative position of target within the container
                            const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
                            
                            // Calculate offset to center in the container
                            const offset = relativeTop - container.clientHeight / 2 + targetRect.height / 2;
                            
                            container.scrollTo({
                                top: Math.max(0, offset),
                                behavior: 'smooth'
                            });
                        }
                        
                        // Add highlighting animation to the target element
                        if (window.isHighlighting == target) {
                            return; // Do nothing if already animating
                        }
                        window.isHighlighting = target;

                        setTimeout(() => {
                            // Clear previous animations
                            document.querySelectorAll('.target-highlight').forEach(el => {
                                el.classList.remove('target-highlight');
                                // Restore original display if it was changed
                                if (el.dataset.originalDisplay) {
                                    el.style.display = el.dataset.originalDisplay;
                                    delete el.dataset.originalDisplay;
                                }
                            });
                            
                            // Check if element is inline or computed inline
                            const computedStyle = window.getComputedStyle(target);
                            const isInline = computedStyle.display === 'inline';
                            
                            // Store original display and temporarily change to inline-block if needed
                            if (isInline) {
                                target.dataset.originalDisplay = computedStyle.display;
                                target.style.display = 'inline-block';
                            }
                            
                            // Add highlighting class
                            target.classList.add('target-highlight');
                            
                            // Remove class after animation
                            window.highlightTargetTimeoutOut = setTimeout(() => {
                                target.classList.remove('target-highlight');
                                // Restore original display if it was changed
                                if (target.dataset.originalDisplay) {
                                    target.style.display = target.dataset.originalDisplay;
                                    delete target.dataset.originalDisplay;
                                }
                                window.isHighlighting = false;
                            }, 1100);
                        }, 300); // Reduced from 500ms to 300ms to be faster
                    }
                }
            });
        });
    `,i+=`
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
                // Close with animation
                contentWrapper.classList.add('animating');
                contentWrapper.classList.remove('opening');
                
                setTimeout(() => {
                    details.open = false;
                    contentWrapper.classList.remove('animating');
                }, 400);
            } else {
                // Open with animation
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
    `,i+=`
    // Clean previous event listeners if they exist
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
            
            // If the container is already visible, we close it
            if (floatContainer.classList.contains('visible')) {
                floatContainer.classList.remove('visible');
                window.floatEventListeners.activeFloats.delete(floatId);
                return;
            }
            
            // Close all floating containers that are open
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
            
            // Calculate position
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
    
    // Global method to close all floating elements
    window.closeAllFloats = function() {
        document.querySelectorAll('.float-container.visible').forEach(container => {
            container.classList.remove('visible');
        });
        window.floatEventListeners.activeFloats.clear();
    };`,[s,u,i]}export function showCopySuccess(e,t){e.innerHTML=`
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `,setTimeout(()=>{e.innerHTML=t},2e3)}export function manageEscapeIframe(){const e=document.querySelector(".iframe-container.expanded");if(e){const t=e.querySelector(".iframe-expand-button"),n=t.querySelector(".expand-icon"),s=t.querySelector(".contract-icon");e.classList.remove("expanded"),n.style.display="block",s.style.display="none",t.title="Expand"}const t=document.querySelector(".fullscreen-image-container");t&&(t.classList.remove("visible"),setTimeout(()=>t.remove(),300),document.body.style.overflow="auto")}export function manageClickFloatButton(e){if(e.target.closest(".iframe-expand-button")){const t=e.target.closest(".iframe-expand-button"),n=t.closest(".iframe-container"),s=t.querySelector(".expand-icon"),o=t.querySelector(".contract-icon");n.classList.toggle("expanded"),n.classList.contains("expanded")?(s.style.display="none",o.style.display="block",t.title="Contraer",document.body.style.overflow="hidden"):(s.style.display="block",o.style.display="none",t.title="Expand",document.body.style.overflow="auto")}if(e.target.tagName==="IMG"&&e.target.closest(".entry-content")&&!e.target.closest(".fullscreen-image-container")){const t=document.createElement("div");t.className="fullscreen-image-container";const n=document.createElement("button");n.className="fullscreen-image-close",n.innerHTML=`
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;const s=document.createElement("img");s.src=e.target.src,s.alt=e.target.alt,t.appendChild(n),t.appendChild(s),document.body.appendChild(t),requestAnimationFrame(()=>{t.classList.add("visible")}),document.body.style.overflow="hidden";const o=()=>{t.classList.remove("visible"),setTimeout(()=>t.remove(),300),document.body.style.overflow="auto"};n.onclick=e=>{e.stopPropagation(),o()},t.onclick=e=>{e.target===t&&o()}}if(e.target.closest(".code-copy-button")){const t=e.target.closest(".code-copy-button"),n=t.parentElement.querySelector("code"),s=n.textContent,o=t.innerHTML;navigator.clipboard.writeText(s).then(()=>{showCopySuccess(t,o)}).catch(e=>{console.error("Error al copiar:",e)})}}