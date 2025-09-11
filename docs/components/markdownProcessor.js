function obtainAttributes(e){const s=/(\w+)="([^"]+)"/g;let t,n="";for(;(t=s.exec(e))!==null;){const[,e,s]=t;e!=="src"&&(n+=` ${e}="${s}"`)}return n}function escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function processBalancedDelimiters(e,t){let s=e;const{findPattern:i,openChar:a,closeChar:r,processMatch:c,shouldProcess:l=()=>!0}=t,o=[];let n;for(;(n=i.exec(e))!==null;){const t={fullMatch:n,start:n.index,...n.groups||{}};let s=1,i=n.index+n[0].length,c=-1;for(;i<e.length&&s>0;){const t=e[i];if(t===a)s++;else if(t===r&&(s--,s===0)){c=i;break}i++}c!==-1&&(t.end=c+1,t.content=e.substring(n.index+n[0].length,c),l(t)&&o.push(t))}return o.reverse().forEach(t=>{const n=c(t,e);n!==null&&(s=s.substring(0,t.start)+n+s.substring(t.end))}),s}function processInlineCodeBlocks(e,t,n=!1){let c=0,s=e;const i=[];let a;const l=/`/g;for(;(a=l.exec(e))!==null;)i.push(a.index);const o=i.filter(t=>{const n=t>0&&e[t-1]==="`",s=t<e.length-1&&e[t+1]==="`";return!n&&!s}),r=[];for(let t=0;t<o.length-1;t+=2){const n=o[t],s=o[t+1];if(s!==0[0]){const o=e.substring(0,n),t=o.match(/ ([a-zA-Z0-9]+)$/);if(t){const o=t[1],i=e.substring(n+1,s);r.push({start:n-t[0].length+1,end:s+1,lang:o,code:i})}}}return r.reverse().forEach(e=>{let o=`INLINE_CODE_${c++}_CODE_INLINE`;n?o=`<code class="language-${e.lang}">${e.code}</code>`:t.set(o,{language:e.lang,code:e.code}),s=s.substring(0,e.start)+` ${o}`+s.substring(e.end)}),[s,t]}function processCodeBlocksAndTitles(e){let r=0,n=!1,o="",s=[],i=[],t=[],a=new Map;const c=e.split(`
`);for(let e of c){const l=e.trim();if(l.startsWith("```")){if(n){n=!1;const e=`CODE_BLOCK_${r++}_BLOCK_CODE`;a.set(e,{language:o,code:s.join(`
`)}),t.push(e)}else n=!0,o=l.slice(3).trim(),s=[];continue}if(n)s.push(e);else{let n=e.replace(/</g,"").replace(/>/g,"").trim();if(n.startsWith("## ")||n.startsWith("### ")||n.startsWith("#### ")||n.startsWith("##### ")||n.startsWith("###### ")){let s=processInlineCodeBlocks(n.replace(/</g,"&lt;").replace(/>/g,"&gt;"),[],!0)[0];i.push(s),t.push(e)}else e.startsWith("#t ")?t.push(`<plain>${e.substring(3)}</plain>`):e.startsWith("<")?t.push(`${e}`):t.push(e)}}return[t.join(`
`),a,i]}function processMarkdownBlocks(e){const s=e.split(`
`);let t=[];function n(e){let n=e,o=[],i=0;for(;n<s.length;){const e=s[n],t=e.trim();if(t===":::"){if(i===0)break;i--,o.push(e)}else t.startsWith(":::")?(i++,o.push(e)):o.push(e);n++}return[o,n]}for(let e=0;e<s.length;e++){const i=s[e],o=i.trim();if(o.startsWith(":::float-")){const s=o.substring(":::float-".length);t.push(""),t.push(`<div class="float-container" id="float-${s}"><button class="float-close">×</button>`);const[i,a]=n(e+1),r=processMarkdownBlocks(i.join(`
`));t.push("");for(const e of r.split(`
`))t.push(e);t.push(""),e=a,t.push("</div>"),t.push("")}else if(o.startsWith(":::note")){t.push('<div class="note-callout">'),t.push('<div class="callout-header">'),t.push('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 20H7.197c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C4 18.48 4 17.92 4 16.8V7.2c0-1.12 0-1.68.218-2.108c.192-.377.497-.682.874-.874C5.52 4 6.08 4 7.2 4h9.6c1.12 0 1.68 0 2.107.218c.377.192.683.497.875.874c.218.427.218.987.218 2.105V13m-7 7c.286-.003.466-.014.639-.055q.308-.075.578-.24c.202-.124.375-.296.72-.642l4.126-4.125c.346-.346.518-.52.642-.721q.165-.271.24-.579c.04-.172.051-.352.054-.638M13 20v-5.4c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C13.76 13 14.04 13 14.6 13H20"/></svg>'),t.push("<span>Note</span>"),t.push("</div>"),t.push('<div class="callout-content">');const[s,o]=n(e+1),i=processMarkdownBlocks(s.join(`
`));t.push("");for(const e of i.split(`
`))t.push(e);t.push(""),e=o,t.push("</div>"),t.push("</div>")}else if(o.startsWith(":::warning")){t.push('<div class="warning-callout">'),t.push('<div class="callout-header">'),t.push('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12.5ZM2.725 21q-.575 0-.85-.537T1.8 19.4l9.2-16q.275-.5.75-.7t.95 0t.75.7l9.2 16q.275.5.075 1.063T21.9 21zm1.85-2h14.85L12 5zm7.425-1q.425 0 .713-.288T13 17q0-.425-.288-.713T12 16q-.425 0-.713.288T11 17q0 .425.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.713T12 10q-.425 0-.713.288T11 11v3q0 .425.288.713T12 15"></path></svg>'),t.push("<span>Warning</span>"),t.push("</div>"),t.push('<div class="callout-content">');const[s,o]=n(e+1),i=processMarkdownBlocks(s.join(`
`));t.push("");for(const e of i.split(`
`))t.push(e);t.push(""),e=o,t.push("</div>"),t.push("</div>")}else if(o.startsWith(":::grid")){const s=o.substring(":::grid".length).trim();let r="markdown-grid",i="";if(s){{const e=s.match(/cols-(\d+)/);if(e){const t=parseInt(e[1]);r+=` grid-cols-${t}`,i+=`grid-template-columns: repeat(${t}, 1fr); `}const t=s.match(/gap-(\w+)/);if(t){const e=t[1];r+=` gap-${e}`,i+=`gap: ${e*.5}rem; `}if(s.includes("responsive")&&(r+=" responsive-grid"),s.includes("auto-fit")){const e=s.match(/min-(\d+)/),t=e?e[1]+"px":"250px";i+=`grid-template-columns: repeat(auto-fit, minmax(${t}, 1fr)); `}const n=s.match(/style="([^"]+)"/);if(n){const e=n[1];i+=`${e}${e.endsWith(";")?" ":"; "}`}}}else i+="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; ",r+=" responsive-grid";t.push(`<div class="${r}" style="display: grid; ${i}">`);const[d,u]=n(e+1),c=[];let a=[],l=!1;for(let t=0;t<d.length;t++){const n=d[t],e=n.trim();if(e==="---"||e.startsWith("--- "))a.length>0&&(c.push(a.join(`
`)),a=[]),l=!0;else if(e===""&&!l)continue;else!l&&e!==""&&(l=!0),l&&a.push(n)}if(a.length>0&&c.push(a.join(`
`)),c.length===0){const e=d.join(`
`).split(/\n\s*\n/);c.push(...e.filter(e=>e.trim()))}c.forEach((e)=>{const o=s.includes("equal-height")?"grid-item equal-height":"grid-item";t.push(`<div class="${o}">`);const i=processMarkdownBlocks(e.trim());t.push("");for(const e of i.split(`
`))t.push(e);t.push(""),t.push("</div>")}),e=u,t.push("</div>")}else if(o.startsWith(":::details")){let s=o.replace(":::details","").trim(),i=!1;s.startsWith("-open ")&&(s=s.replace("-open ",""),i=!0),t.push(`<details${i?" open":""}>
                            <summary><p>${s}</p></summary>
                            <div class="content-wrapper-details">
                                <div class="contentDetails">`);const[a,r]=n(e+1),c=processMarkdownBlocks(a.join(`
`));t.push("");for(const e of c.split(`
`))t.push(e);t.push(""),e=r,t.push("</div> </div> </details>"),t.push("")}else if(o.startsWith(":::iframe")){let s=obtainAttributes(i);const[o,a]=n(e+1),r=o.join("").trim();e=a;const c=`<svg width="16" height="16" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M3 21v-5h2v3h3v2zm13 0v-2h3v-3h2v5zM3 8V3h5v2H5v3zm16 0V5h-3V3h5v5z"/>
                        </svg>`,l=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3L13 13M3 13V7M3 13H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`;t.push(`<div class="iframe-container"><iframe src="${r}" frameborder="0" allowfullscreen ${s}></iframe><button class="iframe-expand-button" title="Expand"><span class="expand-icon">${c}</span><span class="contract-icon" style="display: none;">${l}</span></button></div>`)}else t.push(i)}return t.join(`
`)}export function renderMarkdown(e){const d=new marked.Renderer;d.link=e=>{const t=e.text.endsWith(" new"),n=t?e.text.slice(0,-4):e.text,s=t?'target="_blank" rel="noopener noreferrer"':"";return`<a href="${e.href}" ${s}${e.title?` title="${e.title}"`:""}>${n}</a>`};let c=0,r=0,a={};d.heading=function(e){let t="";if(e.depth===2)t=`section-${c}`,c++,r=0,a={};else if(e.depth===3){const e=Math.max(0,c-1);t=`section-${e}-item-${r}`,r++,a[`${e}-${r-1}`]=0}else if(e.depth>=4&&e.depth<=6){const n=Math.max(0,c-1),s=Math.max(0,r-1),e=`${n}-${s}`;a[e]===0[0]&&(a[e]=0),t=`section-${n}-item-${s}-subitem-${a[e]}`,a[e]++}else t=e.text.toLowerCase().replace(/[^\w]+/g,"-").replace(/(^-|-$)/g,"");return`<h${e.depth} id="${t}">${e.text}</h${e.depth}>`};let h=new Map,l=new Map,u=[],s="";[s,h,u]=processCodeBlocksAndTitles(e),s=s.replace(/\n\n\n+/g,e=>{const t=e.length-2,n="<rawhtml><br></rawhtml>".repeat(t);return`

${n}

`}),[s,l]=processInlineCodeBlocks(s,l),s=processBalancedDelimiters(s,{findPattern:/\[(?<linkText>[^\]]+)\]\((?<hrefStart>#)/g,openChar:"(",closeChar:")",shouldProcess:e=>{const t=e.content;return t.includes(" ")||t.includes("(")||t.includes(")")||t.includes("<")||t.includes(">")||t.includes('"')||t.includes("=")||t.includes("&")||t.includes("%")},processMatch:(e)=>{const n=e.linkText,s=e.hrefStart+e.content;let o=s.replace(/"/g,"%22").replace(/ /g,"%20").replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/</g,"%3C").replace(/>/g,"%3E").replace(/&/g,"%26");return`[${n}](${o})`}});const m=processMarkdownBlocks(s);s=m,marked.setOptions({breaks:!0,gfm:!0,renderer:d,headerIds:!0,mangle:!1});let i=marked.parse(s),o="";i=i.replace(/\(\?=([a-zA-Z0-9-_]+)\)/g,(e,t)=>`<span class="float-trigger" data-float-id="${t}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 28"><g fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="5" y="5" rx="4"/><path stroke-linecap="round" d="M12 15.52v-.01m-1.998-5.533C10.157 9.019 11 8.5 12 8.5s1.686.672 1.87 1.207c.183.535.144 1.344-.363 1.809s-.773.316-1.229.8a1.8 1.8 0 0 0-.278.432"/></g></svg>
        </span>`);for(const[e,{language:t,code:n}]of l){const s=escapeHtml(n),o=new RegExp(e,"g");i=i.replace(o,`<code class="language-${t}">${s}</code>`)}let t=1,n=1;for(const[r,{language:e,code:a}]of h){let s="";if(e.startsWith("svg")){let n=obtainAttributes(e);s=`<div
                id="SVGiewer${t}"
                class="SVG-viewer"
                ${n}
            >
            <button style="position: absolute; bottom: 10px; right: 10px;background: transparent; border: 0;">
                <svg id="zoom-in${t}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"></path></svg>
                <svg id="zoom-out${t}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M19 12.998H5v-2h14z"/></svg>
                <svg id="reset_zoom${t}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="m12 10.587l4.95-4.95l1.414 1.414l-4.95 4.95l4.95 4.95l-1.415 1.414l-4.95-4.95l-4.949 4.95l-1.414-1.415l4.95-4.95l-4.95-4.95L7.05 5.638z"/></svg>
            </button>${a.replace("<svg ",`<svg id='page${t}'`)}</div>
            `,o+=`
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
                }`,t+=1}else if(e.startsWith("animation")){let i=obtainAttributes(e),t=e.split(" ");const r=a.trim();s=`<div class="animation-wrapper">
                <div
                    id="animationContainer${n}"
                    class="animation-container"
                    ${i}
                ></div>
                <button style="position: absolute; bottom: 10px; left: 10px; background: transparent; border: 0;">
                    <svg id="playPauseBtn${n}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M8 5v14l11-7z"/></svg>
                    <svg id="resetBtn${n}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                </button>
            </div>`,o+=`
                // Use setTimeout to ensure DOM elements are ready
                setTimeout(() => {
                    if (document.getElementById("animationContainer${n}") && typeof bodymovin !== 'undefined'){
                        const animationContainer${n} = document.getElementById('animationContainer${n}');
                        
                        // Always clean up existing animation if it exists
                        if (window.lottieAnimation${n}) {
                            try {
                                window.lottieAnimation${n}.destroy();
                            } catch (e) {
                                console.warn('Error destroying animation:', e);
                            }
                            window.lottieAnimation${n} = null;
                        }
                        
                        // Clean up event listeners
                        if (window.lottieEventListeners && window.lottieEventListeners[${n}]) {
                            const listeners = window.lottieEventListeners[${n}];
                            const playBtn = document.getElementById('playPauseBtn${n}');
                            const resetBtn = document.getElementById('resetBtn${n}');
                            if (playBtn) playBtn.removeEventListener('click', listeners.playPause);
                            if (resetBtn) resetBtn.removeEventListener('click', listeners.reset);
                        }
                        
                        // Create fresh animation
                        window.lottieAnimation${n} = bodymovin.loadAnimation({
                            container: animationContainer${n},
                            renderer: 'svg',
                            loop: ${t.includes("-loop")?"true":"false"},
                            autoplay: ${t.includes("-autoplay")?"true":"false"},
                            path: '${r}',
                        });
                        
                        // Initialize states
                        if (!window.lottieStates) window.lottieStates = {};
                        window.lottieStates[${n}] = {
                            isPlaying: false,
                            isStarting: true,
                        };
                        
                        // Get button references (with additional wait if needed)
                        const playPauseBtn = document.getElementById('playPauseBtn${n}');
                        const resetBtn = document.getElementById('resetBtn${n}');
                        
                        // Only proceed if buttons exist
                        if (!playPauseBtn || !resetBtn) {
                            console.warn('Animation buttons not found for container ${n}');
                            return;
                        }
                        
                        // Control functions
                        const togglePlayPause = () => {
                            const state = window.lottieStates[${n}];
                            const animation = window.lottieAnimation${n};
                            if (!animation || !state || !playPauseBtn) return;
                            
                            if (state.isStarting) animation.stop();
                            
                            if (state.isPlaying) {
                                animation.pause();
                                playPauseBtn.querySelector('path').setAttribute('d', 'M8 5v14l11-7z');
                                state.isPlaying = false;
                            } else {
                                animation.play();
                                playPauseBtn.querySelector('path').setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
                                state.isPlaying = true;
                            }
                            state.isStarting = false;
                        };
                        
                        const resetAnimation = () => {
                            const state = window.lottieStates[${n}];
                            const animation = window.lottieAnimation${n};
                            if (!animation || !state || !playPauseBtn) return;
                            
                            animation.stop();
                            animation.goToAndStop(0);
                            playPauseBtn.querySelector('path').setAttribute('d', 'M8 5v14l11-7z');
                            state.isPlaying = false;
                            state.isStarting = true;
                        };
                        
                        // Event handlers
                        const playHandler = (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            togglePlayPause();
                        };
                        
                        const resetHandler = (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            resetAnimation();
                        };
                        
                        // Set up event listeners
                        if (!window.lottieEventListeners) window.lottieEventListeners = {};
                        window.lottieEventListeners[${n}] = {
                            playPause: playHandler,
                            reset: resetHandler
                        };
                        
                        playPauseBtn.addEventListener('click', playHandler);
                        resetBtn.addEventListener('click', resetHandler);
                        
                        // Animation events
                        window.lottieAnimation${n}.addEventListener('complete', () => {
                            const state = window.lottieStates[${n}];
                            if (state && playPauseBtn) {
                                playPauseBtn.querySelector('path').setAttribute('d', 'M8 5v14l11-7z');
                                state.isPlaying = false;
                                state.isStarting = true;
                            }
                        });
                    }
                }, 50);`,n+=1}else{const t=escapeHtml(a),n=`<button class="code-copy-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 13H7a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 11V3a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>`;s=`<div class="code-block-wrapper">${n}<pre><code class="language-${e}">${t}</code></pre></div>`}const c=new RegExp(`(<br>\\s*)?${r}(\\s*<br>)?`,"g");i=i.replace(c,s)}return t>1&&(o+=`
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
        });`),o+=`
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
    `,o+=`
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
    `,o+=`
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
            void floatContainer.offsetWidth; // reflow force before measuring
            window.floatEventListeners.activeFloats.add(floatId);
            
            const triggerRect = this.getBoundingClientRect();
            const parentRect = floatContainer.offsetParent.getBoundingClientRect();

            let left = triggerRect.left - parentRect.left;
            let top  = triggerRect.bottom - parentRect.top + 10;

            const floatWidth = floatContainer.offsetWidth;
            const floatHeight = floatContainer.offsetHeight;
            const parentWidth = floatContainer.offsetParent.clientWidth;
            const parentHeight = floatContainer.offsetParent.clientHeight;

            // Ajustar horizontal
            if (left + floatWidth > parentWidth - 10) {
                left = parentWidth - floatWidth - 10;
            }
            if (left < 0) {
                left = 0;
            }

            // Ajustar vertical
            if (triggerRect.y + floatHeight > window.innerHeight - 40) {
                // si no cabe debajo, colócalo arriba del trigger
                top = triggerRect.top - parentRect.top - floatHeight - 10;
            }

            if (top < 0) {
                top = 0;
            }

            floatContainer.style.left = left + "px";
            floatContainer.style.top = top + "px";
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
    };`,o+=`
    // Select the first element with class "entry-content"
    const entryContent = document.querySelector('.entry-content');

    if (entryContent) {
        // Select all <script> elements within that element
        const scripts = entryContent.querySelectorAll('script');

        scripts.forEach(oldScript => {
            try {
                // Create a new script element to execute
                const newScript = document.createElement('script');

                // Copy attributes (e.g., src, type, etc.)
                Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
                });

                // Copy inline content if it exists
                if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
                }

                // Replace the old <script> with the new one (this triggers execution)
                oldScript.parentNode.replaceChild(newScript, oldScript);
            } catch (err) {
                console.log("Error executing script:", err, oldScript);
            }
        });
    }
    `,[i,u,o]}export function showCopySuccess(e,t){e.innerHTML=`
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `,setTimeout(()=>{e.innerHTML=t},2e3)}export function manageEscapeIframe(){const e=document.querySelector(".iframe-container.expanded");if(e){const t=e.querySelector(".iframe-expand-button"),n=t.querySelector(".expand-icon"),s=t.querySelector(".contract-icon");e.classList.remove("expanded"),n.style.display="block",s.style.display="none",t.title="Expand"}const t=document.querySelector(".fullscreen-image-container");t&&(t.classList.remove("visible"),setTimeout(()=>t.remove(),300),document.body.style.overflow="auto")}export function manageClickFloatButton(e){if(e.target.closest(".iframe-expand-button")){const t=e.target.closest(".iframe-expand-button"),n=t.closest(".iframe-container"),s=t.querySelector(".expand-icon"),o=t.querySelector(".contract-icon");n.classList.toggle("expanded"),n.classList.contains("expanded")?(s.style.display="none",o.style.display="block",t.title="Contraer",document.body.style.overflow="hidden"):(s.style.display="block",o.style.display="none",t.title="Expand",document.body.style.overflow="auto")}if(e.target.tagName==="IMG"&&e.target.closest(".entry-content")&&!e.target.closest(".fullscreen-image-container")){const t=document.createElement("div");t.className="fullscreen-image-container";const n=document.createElement("button");n.className="fullscreen-image-close",n.innerHTML=`
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;const s=document.createElement("img");s.src=e.target.src,s.alt=e.target.alt,t.appendChild(n),t.appendChild(s),document.body.appendChild(t),requestAnimationFrame(()=>{t.classList.add("visible")}),document.body.style.overflow="hidden";const o=()=>{t.classList.remove("visible"),setTimeout(()=>t.remove(),300),document.body.style.overflow="auto"};n.onclick=e=>{e.stopPropagation(),o()},t.onclick=e=>{e.target===t&&o()}}if(e.target.closest(".code-copy-button")){const t=e.target.closest(".code-copy-button"),n=t.parentElement.querySelector("code"),s=n.textContent,o=t.innerHTML;navigator.clipboard.writeText(s).then(()=>{showCopySuccess(t,o)}).catch(e=>{console.error("Error al copiar:",e)})}}