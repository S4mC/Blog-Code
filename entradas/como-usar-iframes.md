# Cómo Usar Iframes en el Blog

Los iframes te permiten embeber contenido externo directamente en tus entradas del blog. Este artículo te enseña cómo usar la sintaxis especial de iframes que soporta nuestro blog.

## Sintaxis básica

Para embeber un iframe, usa la siguiente sintaxis:

```markdown
:::iframe
URL_DEL_CONTENIDO
:::
```

## Ejemplos prácticos

### YouTube

Para embeber un video de YouTube:

```markdown
:::iframe
https://www.youtube.com/embed/dQw4w9WgXcQ
:::
```

Resultado:

:::iframe
https://www.youtube.com/embed/dQw4w9WgXcQ
:::

### CodePen

Para embeber un CodePen:

```markdown
:::iframe
https://codepen.io/team/codepen/embed/PNaGbb
:::
```

### Google Maps

Para embeber un mapa de Google Maps:

```markdown
:::iframe
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.8271!2d-3.7037902!3d40.4167754!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDI1JzAwLjQiTiAzwrA0MicxMy42Ilc!5e0!3m2!1sen!2ses!4v1234567890123
:::
```

### JSFiddle

Para embeber un JSFiddle:

```markdown
:::iframe
https://jsfiddle.net/usuario/codigo/embedded/
:::
```

## Características técnicas

### Dimensiones automáticas

Los iframes embebidos tienen las siguientes características:

- **Ancho**: 100% del contenedor
- **Alto**: 400px por defecto
- **Responsive**: Se adaptan al ancho de la pantalla
- **Sin borde**: `frameborder="0"`
- **Pantalla completa**: `allowfullscreen` habilitado

### Seguridad

El contenido HTML generado pasa por DOMPurify para garantizar la seguridad, permitiendo solo las etiquetas y atributos necesarios para los iframes.

## Buenas prácticas

### 1. URLs de embed

Siempre usa URLs específicas para embed:

- ✅ `https://www.youtube.com/embed/VIDEO_ID`
- ❌ `https://www.youtube.com/watch?v=VIDEO_ID`

### 2. Contenido apropiado

Solo embebe contenido que:

- Sea relevante para tu entrada
- Provenga de fuentes confiables
- No viole derechos de autor

### 3. Contexto

Siempre proporciona contexto antes del iframe:

```markdown
Aquí puedes ver una demostración interactiva del código:

:::iframe
https://codepen.io/ejemplo/embed/demo
:::

Como puedes observar en el ejemplo anterior...
```

## Limitaciones

### Contenido restringido por CORS

Algunos sitios web no permiten ser embebidos debido a políticas CORS. En estos casos, el iframe mostrará un error o página en blanco.

### Altura automática

La altura automática no funciona con todos los sitios debido a restricciones de seguridad del navegador.

## Sitios web compatibles

Estos sitios web funcionan bien con iframes:

| Servicio | Tipo | URL de ejemplo |
|----------|------|----------------|
| YouTube | Video | `https://www.youtube.com/embed/ID` |
| Vimeo | Video | `https://player.vimeo.com/video/ID` |
| CodePen | Código | `https://codepen.io/user/embed/pen` |
| JSFiddle | Código | `https://jsfiddle.net/user/pen/embedded/` |
| Google Maps | Mapas | URL de embed de Google Maps |
| Spotify | Música | `https://open.spotify.com/embed/...` |

## Ejemplo completo

Aquí tienes un ejemplo completo de cómo usar iframes en una entrada:

```markdown
# Mi proyecto de JavaScript

He creado una calculadora interactiva usando JavaScript puro. 

## Demostración

Puedes probar la calculadora aquí:

:::iframe
https://codepen.io/miusuario/embed/calculadora
:::

## Código fuente

El código está disponible en mi repositorio de GitHub...
```

¡Con esta guía ya puedes embeber cualquier contenido externo en tus entradas del blog!