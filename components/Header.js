import { html } from "htm/preact";
import { useState, useEffect, useRef, useMemo } from "preact/hooks";

// Cache para los datos de búsqueda
let searchDataCache = null;

function ThemeToggle() {
    const [currentTheme, setCurrentTheme] = useState(() => {
        // Check localStorage first, then system preference, default to 'dark'
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    });

    const themes = [
        { value: 'light', label: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12t-1.463 3.538T12 17m-7-4H1v-2h4zm18 0h-4v-2h4zM11 5V1h2v4zm0 18v-4h2v4zM6.4 7.75L3.875 5.325L5.3 3.85l2.4 2.5zm12.3 12.4l-2.425-2.525L17.6 16.25l2.525 2.425zM16.25 6.4l2.425-2.525L20.15 5.3l-2.5 2.4zM3.85 18.7l2.525-2.425L7.75 17.6l-2.425 2.525z"/></svg>', title: 'Light Theme' , monacoTheme: 'vs' },
        { value: 'dark', label: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21m0-2q2.2 0 3.95-1.213t2.55-3.162q-.5.125-1 .2t-1 .075q-3.075 0-5.238-2.163T9.1 7.5q0-.5.075-1t.2-1q-1.95.8-3.163 2.55T5 12q0 2.9 2.05 4.95T12 19m-.25-6.75"/></svg>', title: 'Dark Theme' , monacoTheme: 'vs-dark' },
        { value: 'dark-blue', label: '🌊', title: 'Dark Blue Theme' , monacoTheme: 'vs-dark' }
    ];

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // Update Monaco editor theme
        if (window.currentEditor) {
            window.currentEditor.updateOptions({
                theme: getCurrentThemeData()?.monacoTheme || 'vs-dark'
            });
        }

        document.documentElement.setAttribute('monaco-theme', getCurrentThemeData()?.monacoTheme || 'vs-dark');

        // Save to localStorage
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);

    const handleThemeChange = () => {
        const currentIndex = themes.findIndex(theme => theme.value === currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setCurrentTheme(themes[nextIndex].value);
    };

    const getCurrentThemeData = () => {
        return themes.find(theme => theme.value === currentTheme);
    };

    return html`
        <button
            class="theme-toggle"
            onClick=${handleThemeChange}
            title=${getCurrentThemeData()?.title}
            aria-label="Toggle theme"
            dangerouslySetInnerHTML=${{ __html: getCurrentThemeData()?.label }}
        >
        </button>
    `;
}

function SearchResults({ results, selectedIndex, onSelect }) {
    return html`
        <div class="search-results">
            ${results.map(
                (result, index) => html`
                    <div
                        key=${result.path}
                        class=${`search-result-item ${
                            index === selectedIndex ? "selected" : ""
                        }`}
                        onClick=${() => onSelect(result)}
                    >
                        <h3>${result.title}</h3>
                        <p>${result.summary}</p>
                    </div>
                `
            )}
        </div>
    `;
}

function SearchBar({ onNavigateToEntry, isExpanded, onToggleExpand }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [searchData, setSearchData] = useState(searchDataCache || []);
    const [isLoading, setIsLoading] = useState(!searchDataCache);
    const inputRef = useRef();

    useEffect(() => {
        if (!searchDataCache) {
            setIsLoading(true);
            fetch("./search.json")
                .then((res) => res.json())
                .then((data) => {
                    searchDataCache = data.entries || [];
                    setSearchData(searchDataCache);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Error loading search data:", err);
                    setIsLoading(false);
                });
        }
    }, []);

    // Función para normalizar texto (eliminar tildes y caracteres especiales)
    function normalizeText(text) {
        return (
            text?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ||
            ""
        );
    }

    useEffect(() => {
        if (query.trim()) {
            const normalizedQuery = normalizeText(query);
            const filteredResults = searchData.filter((entry) => {
                const title = normalizeText(entry.title);
                const summary = normalizeText(entry.summary);
                const tags = entry.tags?.map(normalizeText) || [];
                return (
                    title.includes(normalizedQuery) ||
                    summary.includes(normalizedQuery) ||
                    tags.some((tag) => tag.includes(normalizedQuery))
                );
            });
            setResults(filteredResults);
            setSelectedIndex(filteredResults.length > 0 ? 0 : -1);
        } else {
            setResults([]);
            setSelectedIndex(-1);
        }
    }, [query, searchData]);

    useEffect(() => {
        if (results.length > 0) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [results]);

    const handleKeyDown = (e) => {
        switch (e.key) {
            case "ArrowDown":
                if (results.length === 0) return;
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < results.length - 1 ? prev + 1 : 0
                );
                break;
            case "ArrowUp":
                if (results.length === 0) return;
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : results.length - 1
                );
                break;
            case "Enter":
                if (results.length === 0) return;
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    onNavigateToEntry(results[selectedIndex]);
                }
                break;
            case "Escape":
                setQuery("");
                setResults([]);
                inputRef.current?.blur();
                break;
        }
    };

    const handleSelect = (result) => {
        onNavigateToEntry(result);
    };

    const handleToggleExpand = () => {
        setQuery("");
        setResults([]);
        onToggleExpand();
    };

    return html`
        <div class=${`search-container ${isExpanded ? 'mobile-expanded' : ''}`}>
            ${!isExpanded && html`
                <button
                    class="search-button"
                    onClick=${handleToggleExpand}
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
            ${results.length > 0 &&
            html`
                <div
                    class="search-overlay"
                    onClick=${() => {
                        setQuery("");
                        setResults([]);
                        inputRef.current?.blur();
                        if (isExpanded) onToggleExpand();
                    }}
                ></div>
            `}
            <div class=${`search-bar ${isExpanded ? 'expanded' : ''}`}>
                ${isExpanded && html`
                    <button
                        class="close-search"
                        onClick=${handleToggleExpand}
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
                    ref=${inputRef}
                    type="text"
                    autocomplete="off"
                    placeholder="Search blog entries..."
                    value=${query}
                    onInput=${(e) => setQuery(e.target.value)}
                    onKeyDown=${handleKeyDown}
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
            ${results.length > 0 &&
            html`
                <${SearchResults}
                    results=${results}
                    selectedIndex=${selectedIndex}
                    onSelect=${handleSelect}
                />
            `}
        </div>
    `;
}

export function Header({ showSearch = true, onNavigateToEntry }) {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Memorizamos el SearchBar para evitar re-renders innecesarios
    const searchBar = useMemo(
        () => showSearch && html`<${SearchBar} 
            onNavigateToEntry=${onNavigateToEntry}
            isExpanded=${isSearchExpanded}
            onToggleExpand=${() => setIsSearchExpanded(prev => !prev)}
        />`,
        [showSearch, onNavigateToEntry, isSearchExpanded]
    );

    return html`
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
            ${searchBar}
            <div class="header-controls">
            <nav class="nav">
                    <${ThemeToggle} />
                    <a href="./index.html">Home</a>
                    <a href="./editor.html">Editor</a>
                </nav>
            </div>
        </header>
    `;
}
