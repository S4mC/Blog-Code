(function () {
    // This function allows to display the correct animation when changing the page with CSS

    // Normaliza URL: elimina /index.html|default.html|index.php, etc. y la barra final.
    function canonical(u) {
        const url = new URL(u, document.baseURI);

        // Solo nos interesa comparar origen + ruta (ignoramos ? y #)
        let p = url.pathname;

        // Quitar documento por defecto (agrega aquí los que use tu server)
        p = p.replace(/\/(index|default)\.(html?|php|asp|aspx)$/i, "");

        // Quitar barra final salvo en la raíz
        if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);

        return url.origin + p;
    }

    document.addEventListener("click", function (e) {
        const a = e.target.closest("a[href]");
        if (!a) return;

        // Ignorar clicks modificados / nueva pestaña / botón medio
        if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
        )
            return;
        if ((a.target || "").toLowerCase() === "_blank") return;

        // Resolver URL destino
        let targetURL;
        try {
            targetURL = new URL(a.getAttribute("href"), document.baseURI);
        } catch {
            return;
        }

        // Ignorar protocolos no http(s) (mailto:, tel:, javascript:, etc.)
        if (!/^https?:$/.test(targetURL.protocol)) return;

        // Solo aplicar en mismo origen
        if (targetURL.origin !== location.origin) return;

        const currentCanon = canonical(location.href);
        const targetCanon = canonical(targetURL.href);

        if (currentCanon === targetCanon) {
            e.preventDefault();
            location.reload(); // refresca si apunta a la misma página (/, /index.html, etc.)
        }
        // si no son iguales, el navegador navega normalmente
    });
})();
