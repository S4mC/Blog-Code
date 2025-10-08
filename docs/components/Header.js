import{html}from"htm/preact";import{useState,useEffect,useRef,useMemo}from"preact/hooks";import CONFIG,{resolveContentPath}from"../config.js";let searchDataCache=null;function ThemeToggle(){const[e,s]=useState(()=>{const e=localStorage.getItem("theme");if(e)return e;const t=window.matchMedia("(prefers-color-scheme: dark)").matches;return t?"dark":"light"}),t=[{value:"light",label:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12t-1.463 3.538T12 17m-7-4H1v-2h4zm18 0h-4v-2h4zM11 5V1h2v4zm0 18v-4h2v4zM6.4 7.75L3.875 5.325L5.3 3.85l2.4 2.5zm12.3 12.4l-2.425-2.525L17.6 16.25l2.525 2.425zM16.25 6.4l2.425-2.525L20.15 5.3l-2.5 2.4zM3.85 18.7l2.525-2.425L7.75 17.6l-2.425 2.525z"/></svg>',title:"Light Theme",monacoTheme:"vs"},{value:"dark",label:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21m0-2q2.2 0 3.95-1.213t2.55-3.162q-.5.125-1 .2t-1 .075q-3.075 0-5.238-2.163T9.1 7.5q0-.5.075-1t.2-1q-1.95.8-3.163 2.55T5 12q0 2.9 2.05 4.95T12 19m-.25-6.75"/></svg>',title:"Dark Theme",monacoTheme:"vs-dark"},{value:"dark-blue",label:"🌊",title:"Dark Blue Theme",monacoTheme:"vs-dark"}];useEffect(()=>{document.documentElement.setAttribute("data-theme",e),window.currentEditor&&window.currentEditor.updateOptions({theme:n()?.monacoTheme||"vs-dark"}),document.documentElement.setAttribute("monaco-theme",n()?.monacoTheme||"vs-dark"),localStorage.setItem("theme",e)},[e]);const o=()=>{const n=t.findIndex(t=>t.value===e),o=(n+1)%t.length;s(t[o].value)},n=()=>t.find(t=>t.value===e);return html`
        <button
            class="theme-toggle"
            onClick=${o}
            title=${n()?.title}
            aria-label="Toggle theme"
            dangerouslySetInnerHTML=${{__html:n()?.label}}
        >
        </button>
    `}function SearchResults({results:e,selectedIndex:t,onSelect:n}){return html`
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
    `}function SearchBar({onNavigateToEntry:e,isExpanded:t,onToggleExpand:n}){const[i,a]=useState(""),[s,o]=useState([]),[r,c]=useState(-1),[h,f]=useState(searchDataCache||[]),[v,d]=useState(!searchDataCache),u=useRef();useEffect(()=>{searchDataCache||(d(!0),fetch(`${CONFIG.contentUrl}/search.json`).then(e=>e.json()).then(e=>{const t=(e.entries||[]).map(e=>({...e,path:resolveContentPath(e.path)}));searchDataCache=t,f(searchDataCache),d(!1)}).catch(e=>{console.error("Error loading search data:",e),d(!1)}))},[]);function l(e){return e?.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase()||""}useEffect(()=>{if(i.trim()){const e=l(i),t=h.filter(t=>{const n=l(t.title),s=l(t.summary),o=t.tags?.map(l)||[];return n.includes(e)||s.includes(e)||o.some(t=>t.includes(e))});o(t),c(t.length>0?0:-1)}else o([]),c(-1)},[i,h]),useEffect(()=>{s.length>0?document.body.style.overflow="hidden":document.body.style.overflow="auto"},[s]);const p=t=>{switch(t.key){case"ArrowDown":if(s.length===0)return;t.preventDefault(),c(e=>e<s.length-1?e+1:0);break;case"ArrowUp":if(s.length===0)return;t.preventDefault(),c(e=>e>0?e-1:s.length-1);break;case"Enter":if(s.length===0)return;t.preventDefault(),r>=0&&s[r]&&e(s[r]);break;case"Escape":a(""),o([]),u.current?.blur();break}},g=t=>{e(t)},m=()=>{a(""),o([]),n()};return html`
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
                            /><span id="header-title">${CONFIG.app.name}</span>
                        </div>
                    </a>
                </h1>
            </div>
            ${o}
            <div class="header-controls">
            <nav class="nav">
                    <${ThemeToggle} />
                    <a href="./index.html">Home</a>
                    <a href="./editor.html">Editor</a>
                </nav>
            </div>
        </header>
    `}