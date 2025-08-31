import{html}from"htm/preact";import{useState,useEffect,useRef,useMemo}from"preact/hooks";let searchDataCache=null;function SearchResults({results:e,selectedIndex:t,onSelect:n}){return html`
        <div class="search-results">
            ${e.map((e,s)=>html`
                    <div
                        key=${e.path}
                        class=${`search-result-item ${s===t?"selected":""}`}
                        onClick=${()=>n(e)}
                    >
                        <h3>${e.title}</h3>
                        <p>${e.summary}</p>
                    </div>
                `)}
        </div>
    `}function SearchBar({onNavigateToEntry:e,isExpanded:t,onToggleExpand:n}){const[i,a]=useState(""),[s,o]=useState([]),[r,c]=useState(-1),[h,f]=useState(searchDataCache||[]),[v,d]=useState(!searchDataCache),u=useRef();useEffect(()=>{searchDataCache||(d(!0),fetch("./search.json").then(e=>e.json()).then(e=>{searchDataCache=e.entries||[],f(searchDataCache),d(!1)}).catch(e=>{console.error("Error loading search data:",e),d(!1)}))},[]);function l(e){return e?.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase()||""}useEffect(()=>{if(i.trim()){const e=l(i),t=h.filter(t=>{const n=l(t.title),s=l(t.summary),o=t.tags?.map(l)||[];return n.includes(e)||s.includes(e)||o.some(t=>t.includes(e))});o(t),c(t.length>0?0:-1)}else o([]),c(-1)},[i,h]),useEffect(()=>{s.length>0?document.body.style.overflow="hidden":document.body.style.overflow="auto"},[s]);const p=t=>{switch(t.key){case"ArrowDown":if(s.length===0)return;t.preventDefault(),c(e=>e<s.length-1?e+1:0);break;case"ArrowUp":if(s.length===0)return;t.preventDefault(),c(e=>e>0?e-1:s.length-1);break;case"Enter":if(s.length===0)return;t.preventDefault(),r>=0&&s[r]&&e(s[r]);break;case"Escape":a(""),o([]),u.current?.blur();break}},g=t=>{e(t)},m=()=>{a(""),o([]),n()};return html`
        <div class=${`search-container ${t?"mobile-expanded":""}`}>
            ${!t&&html`
                <button
                    class="search-button"
                    onClick=${m}
                    aria-label="Open search"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l5.6 5.6q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-5.6-5.6q-.75.6-1.725.95T9.5 16m0-2q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
                        />
                    </svg>
                </button>
            `}
            ${s.length>0&&html`
                <div
                    class="search-overlay"
                    onClick=${()=>{a(""),o([]),u.current?.blur(),t&&n()}}
                ></div>
            `}
            <div class=${`search-bar ${t?"expanded":""}`}>
                ${t&&html`
                    <button
                        class="close-search"
                        onClick=${m}
                        aria-label="Close search"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"
                            />
                        </svg>
                    </button>
                `}
                <input
                    ref=${u}
                    type="text"
                    autocomplete="off"
                    placeholder="Search blog entries..."
                    value=${i}
                    onInput=${e=>a(e.target.value)}
                    onKeyDown=${p}
                    class="search-input"
                    id="search-input"
                />
                <div class="search-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="currentColor"
                            d="M9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l5.6 5.6q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-5.6-5.6q-.75.6-1.725.95T9.5 16m0-2q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
                        />
                    </svg>
                </div>
            </div>
            ${s.length>0&&html`
                <${SearchResults}
                    results=${s}
                    selectedIndex=${r}
                    onSelect=${g}
                />
            `}
        </div>
    `}export function Header({showSearch:e=!0,onNavigateToEntry:t}){const[n,s]=useState(!1),o=useMemo(()=>e&&html`<${SearchBar} 
            onNavigateToEntry=${t}
            isExpanded=${n}
            onToggleExpand=${()=>s(e=>!e)}
        />`,[e,t,n]);return html`
        <header class="header">
            <div style="display: inline-flex;align-items: center;">
                <button class="sidebar-toggle" id="sidebarToggle">☰</button>
                <h1>
                    <a href="./index.html">
                        <div style="display: flex; align-items: center;">
                            <img
                                src="./public/icon.webp"
                                style="width: 34px; height: 30px; margin-right: 8px;"
                            /><span id="header-title">Blog Code</span>
                        </div>
                    </a>
                </h1>
            </div>
            ${o}
            <nav class="nav">
                <a href="./index.html">Home</a>
                <a href="./editor.html">Editor</a>
            </nav>
        </header>
    `}