import{html}from"htm/preact";let sidebarInstance=null;export function initSidebar(e){return sidebarInstance?(sidebarInstance.updateData(e),sidebarInstance):document.getElementById("sidebar")?(sidebarInstance=new SidebarClass(e),sidebarInstance):(console.error("No se pudo inicializar la sidebar: elementos del DOM no encontrados"),null)}export function Sidebar(){return html`        
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
    `}function findDOMElement(e,t){const s=document.getElementsByClassName("entry-content")[0];if(!s)return console.error("No se encontró el contenedor entry-content"),null;const n=t.find(t=>t.id===e.sectionId);if(!n)return console.error("No se encontró la sección con ID:",e.sectionId),null;if(e.type==="section"){const t=document.getElementById(e.sectionId);return t}if(e.type==="item"){const t=n.items.find(t=>t.id===e.itemId);if(!t)return console.error("No se encontró el item con ID:",e.itemId),null;const s=parseInt(e.sectionId.split("-")[1]),o=n.items.indexOf(t),i=`section-${s}-item-${o}`,a=document.getElementById(i);return a}if(e.type==="subitem"){const s=n.items.find(t=>t.id===e.itemId);if(!s||!s.subitems)return console.error("No se encontró el item padre o no tiene subitems:",e.itemId),null;const t=s.subitems.find(t=>t.id===e.subitemId);if(!t)return console.error("No se encontró el subitem con ID:",e.subitemId),null;const i=t.domId||`section-${parseInt(e.sectionId.split("-")[1])}-item-${n.items.indexOf(s)}-subitem-${s.subitems.indexOf(t)}`;let o=document.getElementById(i);if(!o&&t.level){const n=Array.from(document.querySelectorAll(`h${t.level}`)),s=t.title.toLowerCase().trim(),e=n.find(e=>e.textContent.toLowerCase().trim()===s);e&&(o=e)}return o}}class SidebarClass{constructor(e){this.data=this.processData(e),this.searchResults=[],this.currentResultIndex=-1,this.init()}init(){this.render(),this.bindEvents(),this.setupScrollSpy(),window.innerWidth<1024&&document.getElementById("sidebar").classList.remove("open")}updateData(e){this.data=this.processData(e),this.clearSearch(),this.render()}processData(e){const s=[];let t=null,n=null;return e.forEach(e=>{if(e.startsWith("## "))t&&s.push(t),t={id:`section-${s.length}`,title:e.replace(/^##\s*/,""),items:[],expanded:!1},n=null;else if(e.startsWith("### ")&&t)n={id:`item-${t.items.length}`,title:e.replace(/^###\s*/,""),subitems:[]},t.items.push(n);else if(e.startsWith("#### ")&&t&&n){const i=s.length,a=t.items.length-1,o=n.subitems.length;n.subitems.push({id:`subitem-${o}`,domId:`section-${i}-item-${a}-subitem-${o}`,title:e.replace(/^####\s*/,""),level:4})}else if(e.startsWith("##### ")&&t&&n){const i=s.length,a=t.items.length-1,o=n.subitems.length;n.subitems.push({id:`subitem-${o}`,domId:`section-${i}-item-${a}-subitem-${o}`,title:e.replace(/^#####\s*/,""),level:5})}else if(e.startsWith("###### ")&&t&&n){const i=s.length,a=t.items.length-1,o=n.subitems.length;n.subitems.push({id:`subitem-${o}`,domId:`section-${i}-item-${a}-subitem-${o}`,title:e.replace(/^######\s*/,""),level:6})}}),t&&s.push(t),s}render(){const e=document.getElementById("sidebarContent");if(!e){console.error("Elemento 'sidebarContent' no encontrado en el DOM");return}if(this.data.length===0){e.innerHTML='<div class="no-results">No data</div>';return}const t=this.data.map(e=>`
            <div class="section ${e.expanded?"expanded":""}" data-section-id="${e.id}">
                <div class="section-header toggle-area">
                    <span class="section-title">${e.title}</span>
                    ${e.items.length>0?'<span class="collapse-icon">▼</span>':""}
                </div>
                <div class="section-items">
                    ${e.items.map(e=>{let t="";if(e.subitems&&e.subitems.length>0){const s=e.subitems.filter(e=>e.level===4),o=e.subitems.filter(e=>e.level===5),r=e.subitems.filter(e=>e.level===6);t=`<div class="subitems">`;const n=(t,n)=>{const s=e.subitems.indexOf(t),o=e.subitems.findIndex((e,n)=>n>s&&e.level<=t.level);return e.subitems.slice(s+1,o!==-1?o:0[0]).filter(e=>e.level===n)};s.forEach(e=>{t+=`
                                    <div class="subitem level-4" data-subitem-id="${e.id}">
                                        ${e.title}
                                    </div>
                                `;const s=n(e,5);s.forEach(e=>{t+=`
                                        <div class="subitem level-5" data-subitem-id="${e.id}">
                                            ${e.title}
                                        </div>
                                    `;const s=n(e,6);s.forEach(e=>{t+=`
                                            <div class="subitem level-6" data-subitem-id="${e.id}">
                                                ${e.title}
                                            </div>
                                        `})})});const i=new Set;s.forEach(e=>{n(e,5).forEach(e=>{i.add(e.id)})});const c=o.filter(e=>!i.has(e.id));c.forEach(e=>{t+=`
                                    <div class="subitem level-5" data-subitem-id="${e.id}">
                                        ${e.title}
                                    </div>
                                `;const s=n(e,6);s.forEach(e=>{t+=`
                                        <div class="subitem level-6" data-subitem-id="${e.id}">
                                            ${e.title}
                                        </div>
                                    `})});const a=new Set;[...s,...o].forEach(e=>{n(e,6).forEach(e=>{a.add(e.id)})});const l=r.filter(e=>!a.has(e.id));l.forEach(e=>{t+=`
                                    <div class="subitem level-6" data-subitem-id="${e.id}">
                                        ${e.title}
                                    </div>
                                `}),t+=`</div>`}return`
                            <div class="section-item ${e.subitems&&e.subitems.length>0?"has-subitems":""}" data-item-id="${e.id}">
                                ${e.title}
                                ${t}
                            </div>
                        `}).join("")}
                </div>
            </div>
        `).join("");e.innerHTML=t}bindEvents(){const e=document.getElementById("sidebar"),n=document.getElementById("sidebarToggle"),s=document.getElementById("sidebarOverlay"),t=document.getElementById("searchInput"),o=document.getElementById("clearButton"),i=document.getElementById("prevBtn"),a=document.getElementById("nextBtn");if(!e){console.error("Elemento 'sidebar' no encontrado en el DOM");return}n&&n.addEventListener("click",()=>this.toggle()),s&&s.addEventListener("click",()=>this.close()),window.addEventListener("resize",()=>{const t=window.innerWidth>=1024;t&&!e.classList.contains("open")?this.open():!t&&e.classList.contains("open")&&this.close()}),t&&(t.addEventListener("input",e=>this.search(e.target.value)),t.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),e.shiftKey?this.navigatePrev():this.navigateNext()),e.key==="Escape"&&this.clearSearch()})),o&&o.addEventListener("click",()=>this.clearSearch()),i&&i.addEventListener("click",()=>this.navigatePrev()),a&&a.addEventListener("click",()=>this.navigateNext()),e.addEventListener("click",e=>{if(e.target.closest(".section-title")){const t=e.target.closest(".section-header");if(t){const e=t.parentElement.dataset.sectionId;this.navigateToDOM(e)}return}if(e.target.closest(".subitem")){const t=e.target.closest(".subitem"),n=t.closest(".section-item"),s=n.closest(".section");if(t&&n&&s){const e=s.dataset.sectionId,o=n.dataset.itemId,i=t.dataset.subitemId;this.navigateToDOM(e,o,i)}return}if(e.target.closest(".section-item")&&!e.target.closest(".subitem")){const t=e.target.closest(".section-item"),n=t.closest(".section");if(t&&n){const e=n.dataset.sectionId,s=t.dataset.itemId;this.navigateToDOM(e,s)}return}const t=e.target.closest(".section-header");if(t&&!e.target.closest(".section-title")){const e=t.parentElement.dataset.sectionId;this.toggleSection(e)}})}toggle(){const e=document.getElementById("sidebar");if(!e)return;e.classList.contains("open")&&window.getComputedStyle(e).display!="none"?this.close():this.open()}open(){const e=document.getElementById("sidebar"),t=document.getElementById("sidebarOverlay");if(!e)return;e.classList.remove("open"),e.style.display="grid",window.innerWidth<1024&&t&&t.classList.add("active"),setTimeout(()=>{e.classList.add("open")},0)}close(){const e=document.getElementById("sidebar"),t=document.getElementById("sidebarOverlay");e&&e.classList.remove("open"),t&&t.classList.remove("active")}toggleSection(e){const t=this.data.find(t=>t.id===e);t&&(t.expanded=!t.expanded,document.querySelector(`[data-section-id="${e}"]`).classList.toggle("expanded"))}navigateToDOM(e,t=null,n=null){const o={sectionId:e,itemId:t,subitemId:n,type:n?"subitem":t?"item":"section"},s=findDOMElement(o,this.data);s&&(window.innerWidth<1024&&this.close(),s.scrollIntoView({behavior:"smooth",block:"center"}),s.style.backgroundColor="#454545",s.style.transition="background-color 0.3s ease",setTimeout(()=>{s.style.backgroundColor=""},2e3))}search(e){if(!e.trim()){this.clearSearch();return}this.scrollSpyActive=!1,this.clearSidebarHighlights(),document.getElementById("clearButton").classList.add("visible"),this.searchResults=[];const t=[];this.data.forEach(n=>{const s=this.countMatches(n.title,e),o=n.items.map(t=>{const n=this.countMatches(t.title,e),s=t.subitems?t.subitems.map(t=>({...t,matchCount:this.countMatches(t.title,e)})).filter(e=>e.matchCount>0):[];return{...t,matchCount:n,subitemsWithMatches:s}}).filter(e=>e.matchCount>0||e.subitemsWithMatches&&e.subitemsWithMatches.length>0);if(s>0||o.length>0){t.push(n);for(let e=0;e<s;e++)this.searchResults.push({sectionId:n.id,type:"section",matchIndex:e});o.forEach(e=>{for(let t=0;t<e.matchCount;t++)this.searchResults.push({sectionId:n.id,itemId:e.id,type:"item",matchIndex:t});e.subitemsWithMatches&&e.subitemsWithMatches.length>0&&e.subitemsWithMatches.forEach(t=>{for(let s=0;s<t.matchCount;s++)this.searchResults.push({sectionId:n.id,itemId:e.id,subitemId:t.id,type:"subitem",level:t.level,matchIndex:s})})})}}),this.renderFiltered(t),this.highlightText(e),this.updateSearchControls(!0),this.searchResults.length>0?(this.currentResultIndex=0,this.navigateToResult(0)):this.currentResultIndex=-1}countMatches(e,t){const s=new RegExp(this.escapeRegex(t),"gi"),n=e.match(s);return n?n.length:0}renderFiltered(e){const t=document.getElementById("sidebarContent");if(e.length===0){t.innerHTML='<div class="no-results">No se encontraron resultados</div>';return}const n=e.map(e=>`
            <div class="section ${e.expanded?"expanded":""}" data-section-id="${e.id}">
                <div class="section-header toggle-area">
                    <span class="section-title">${e.title}</span>
                    ${e.items.length>0?'<span class="collapse-icon">▼</span>':""}
                </div>
                <div class="section-items">
                    ${e.items.map(e=>{let t="";if(e.subitems&&e.subitems.length>0){const s=e.subitems.filter(e=>e.level===4),o=e.subitems.filter(e=>e.level===5),r=e.subitems.filter(e=>e.level===6);t=`<div class="subitems">`;const n=(t,n)=>{const s=e.subitems.indexOf(t),o=e.subitems.findIndex((e,n)=>n>s&&e.level<=t.level);return e.subitems.slice(s+1,o!==-1?o:0[0]).filter(e=>e.level===n)};s.forEach(e=>{t+=`
                                    <div class="subitem level-4" data-subitem-id="${e.id}">
                                        ${e.title}
                                    </div>
                                `;const s=n(e,5);s.forEach(e=>{t+=`
                                        <div class="subitem level-5" data-subitem-id="${e.id}">
                                            ${e.title}
                                        </div>
                                    `;const s=n(e,6);s.forEach(e=>{t+=`
                                            <div class="subitem level-6" data-subitem-id="${e.id}">
                                                ${e.title}
                                            </div>
                                        `})})});const i=new Set;s.forEach(e=>{n(e,5).forEach(e=>{i.add(e.id)})});const c=o.filter(e=>!i.has(e.id));c.forEach(e=>{t+=`
                                    <div class="subitem level-5" data-subitem-id="${e.id}">
                                        ${e.title}
                                    </div>
                                `;const s=n(e,6);s.forEach(e=>{t+=`
                                        <div class="subitem level-6" data-subitem-id="${e.id}">
                                            ${e.title}
                                        </div>
                                    `})});const a=new Set;[...s,...o].forEach(e=>{n(e,6).forEach(e=>{a.add(e.id)})});const l=r.filter(e=>!a.has(e.id));l.forEach(e=>{t+=`
                                    <div class="subitem level-6" data-subitem-id="${e.id}">
                                        ${e.title}
                                    </div>
                                `}),t+=`</div>`}return`
                            <div class="section-item ${e.subitems&&e.subitems.length>0?"has-subitems":""}" data-item-id="${e.id}">
                                ${e.title}
                                ${t}
                            </div>
                        `}).join("")}
                </div>
            </div>
        `).join("");t.innerHTML=n}highlightText(e){const t=new RegExp(`(${this.escapeRegex(e)})`,"gi");document.querySelectorAll(".sidebar-component .section-title, .sidebar-component .section-item, .sidebar-component .subitem").forEach(e=>{const n=e.textContent;e.innerHTML=n.replace(t,'<span class="highlight">$1</span>')})}navigateToResult(e){if(e<0||e>=this.searchResults.length)return;document.querySelectorAll(".sidebar-component .current-highlight").forEach(e=>{e.classList.remove("current-highlight"),e.classList.add("highlight")});const t=this.searchResults[e],n=this.data.find(e=>e.id===t.sectionId);n&&!n.expanded&&(n.expanded=!0,document.querySelector(`[data-section-id="${t.sectionId}"]`).classList.add("expanded")),setTimeout(()=>{let e;if(t.type==="section"?e=document.querySelector(`[data-section-id="${t.sectionId}"] .section-title`):e=document.querySelector(`[data-section-id="${t.sectionId}"]`).querySelector(`[data-item-id="${t.itemId}"]`),e){const n=e.querySelectorAll(".highlight")[t.matchIndex];n&&(n.classList.remove("highlight"),n.classList.add("current-highlight"));const s=document.getElementById("sidebarContent");s.scrollTo({top:e.offsetTop-s.clientHeight/2,behavior:"smooth"})}this.updateCounter()},100)}navigatePrev(){this.currentResultIndex>0?this.currentResultIndex--:this.currentResultIndex=this.searchResults.length-1,this.navigateToResult(this.currentResultIndex)}navigateNext(){this.currentResultIndex<this.searchResults.length-1?this.currentResultIndex++:this.currentResultIndex=0,this.navigateToResult(this.currentResultIndex)}updateSearchControls(e){const t=document.getElementById("searchControls"),n=document.getElementById("clearButton");e&&this.searchResults.length>0?(t.classList.add("active"),n.classList.add("visible"),this.updateCounter()):(t.classList.remove("active"),document.getElementById("searchInput").value||n.classList.remove("visible"))}updateCounter(){const e=document.getElementById("searchCounter"),t=this.currentResultIndex+1,n=this.searchResults.length;e.textContent=`${t}/${n}`}clearSearch(){document.getElementById("searchInput").value="",document.getElementById("clearButton").classList.remove("visible"),this.searchResults=[],this.currentResultIndex=-1,this.render(),this.updateSearchControls(!1),window.innerWidth>=1024&&(this.scrollSpyActive=!0,setTimeout(()=>{this.highlightCurrentSection()},100))}escapeRegex(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}setupScrollSpy(){this.scrollSpyActive=!0;let e=!1;window.addEventListener("scroll",()=>{!e&&this.scrollSpyActive&&(window.requestAnimationFrame(()=>{this.highlightCurrentSection(),e=!1}),e=!0)}),window.addEventListener("resize",()=>{this.scrollSpyActive=!0,this.highlightCurrentSection()}),setTimeout(()=>{this.highlightCurrentSection()},300)}clearSidebarHighlights(){document.querySelectorAll(".section-header.active").forEach(e=>{e.classList.remove("active")}),document.querySelectorAll(".section-item.active").forEach(e=>{e.classList.remove("active")})}highlightCurrentSection(){if(!this.scrollSpyActive||!this.data||this.data.length===0)return;const i=document.getElementsByClassName("entry-content")[0];if(!i)return;const n=Array.from(i.querySelectorAll("h2, h3"));if(n.length===0)return;const l=window.innerHeight/4,d=document.documentElement.scrollHeight-document.documentElement.clientHeight-l,a=window.scrollY,u=a+window.innerHeight/2;let t=null;for(let e=0;e<n.length;e++)if(a<=l)t=n[0];else if(a>=d)t=n[n.length-1];else if(n[e]?.getBoundingClientRect().top+window.scrollY<=u)t=n[e];else break;t||(t=n[0]),this.clearSidebarHighlights();const o=t.tagName==="H2",r=t.id;let e,c;if(o)e=this.data.find(e=>e.id===r),c=this.data.indexOf(e);else{const t=r.split("-");t.length>=2&&(c=parseInt(t[1]),e=this.data[c])}if(!e){const s=i.querySelectorAll("h2"),n=Array.from(s).indexOf(o?t:this.findParentH2(t));if(n===-1)return;if(e=this.data[n],!e)return}const s=document.querySelector(`[data-section-id="${e.id}"]`);if(s){if(e.expanded||(e.expanded=!0,s.classList.add("expanded")),o)s.querySelector(".section-header").classList.add("active");else{const n=r.split("-");if(n.length>=4&&n[2]==="item"){{const t=parseInt(n[3]);if(e.items[t]){const o=e.items[t].id,n=s.querySelector(`[data-item-id="${o}"]`);n&&n.classList.add("active")}}}else{const o=this.getH3ElementsInSection(t),n=o.indexOf(t);if(n!==-1&&e.items[n]){const o=e.items[n].id,t=s.querySelector(`[data-item-id="${o}"]`);t&&t.classList.add("active")}}}const n=document.getElementById("sidebarContent");if(n){const e=o?s:s.querySelector(".active")||s;n.scrollTo({top:e.offsetTop-n.clientHeight/3,behavior:"smooth"})}}}findParentH2(e){if(e.id){const t=e.id.split("-");if(t.length>=2){const n=t[1],s=`section-${n}`,e=document.getElementById(s);if(e)return e}}let t=e.previousElementSibling;for(;t;){if(t.tagName==="H2")return t;t=t.previousElementSibling}return null}getH3ElementsInSection(e){const t=this.findParentH2(e);if(!t)return[];const o=t.id,n=o.match(/section-(\d+)/);if(!n)return[];const i=parseInt(n[1]),s=document.getElementsByClassName("entry-content")[0];return s?Array.from(s.querySelectorAll("h3")).filter(e=>{const t=e.id.match(new RegExp(`section-${i}-item-\\d+`));return t!==null}):[]}}