# Guía Completa de Markdown

Markdown es un lenguaje de marcado ligero que te permite formatear texto de manera sencilla. En este blog, puedes usar toda la sintaxis estándar de Markdown.

## Encabezados

Puedes crear encabezados usando el símbolo `#`:

```markdown
# Encabezado 1
## Encabezado 2
### Encabezado 3
#### Encabezado 4
##### Encabezado 5
###### Encabezado 6
```

## Formateo de texto

### Básico

- **Texto en negrita**: `**texto**` o `__texto__`
- *Texto en cursiva*: `*texto*` o `_texto_`
- ***Texto en negrita y cursiva***: `***texto***`
- ~~Texto tachado~~: `~~texto~~`

### Código

- Código en línea: `codigo` usando comillas invertidas
- Bloques de código usando tres comillas invertidas:

```javascript
function ejemplo() {
    console.log("¡Hola mundo!");
}
```

## Listas

### Lista sin orden

- Elemento 1
- Elemento 2
  - Subelemento 2.1
  - Subelemento 2.2
- Elemento 3

```markdown
- Elemento 1
- Elemento 2
  - Subelemento 2.1
  - Subelemento 2.2
- Elemento 3
```

### Lista ordenada

1. Primer elemento
2. Segundo elemento
3. Tercer elemento

```markdown
1. Primer elemento
2. Segundo elemento
3. Tercer elemento
```

## Enlaces e imágenes

### Enlaces

- [Enlace simple](https://example.com)
- [Enlace con título](https://example.com "Título del enlace")

```markdown
[Enlace simple](https://example.com)
[Enlace con título](https://example.com "Título del enlace")
```

### Imágenes

![Descripción de la imagen](https://blogger.googleusercontent.com/img/a/AVvXsEg84NFSz1z5LQWYAcnZ0We0MtCWnOY6mRDqRFT0Rz9h5DD-vTIGLNblqF_kXFHuyNljj1fmhvvndKDjmWKJRH4k5yzGzQXy4fTdzJHVRM0Aqz6ufceoZQP5eYcf2cgx2l_GOt2ovMo4G5H439PTse-REsywKwy2ZrS5-Yf_W0UnDxG7h-22rRBjF-ZQ0bw)

```markdown
![Descripción de la imagen](https://via.placeholder.com/300x200)
```

## Tablas

| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Celda A1  | Celda B1  | Celda C1  |
| Celda A2  | Celda B2  | Celda C2  |
| Celda A3  | Celda B3  | Celda C3  |

```markdown
| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Celda A1  | Celda B1  | Celda C1  |
| Celda A2  | Celda B2  | Celda C2  |
```

## Citas

> Esta es una cita en bloque.
> Puede ocupar varias líneas.
> 
> Y tener múltiples párrafos.

```markdown
> Esta es una cita en bloque.
> Puede ocupar varias líneas.
```

## Líneas horizontales

---

```markdown
---
```

## Bloques de código con sintaxis

### JavaScript
```javascript
const saludar = (nombre) => {
    return `¡Hola, ${nombre}!`;
};

console.log(saludar("Mundo"));
```

### Python
```python
def saludar(nombre):
    return f"¡Hola, {nombre}!"

print(saludar("Mundo"))
```

### HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Página</title>
</head>
<body>
    <h1>¡Hola Mundo!</h1>
</body>
</html>
```

## Funcionalidad especial: Iframes

Este blog soporta una sintaxis especial para embeber iframes:

```markdown
:::iframe
https://www.youtube.com/embed/dQw4w9WgXcQ
:::
```

Esto se renderizará como un iframe embebido en la página.

## Tips para escribir

1. **Usa encabezados** para organizar tu contenido
2. **Incluye código** para explicar conceptos técnicos
3. **Agrega imágenes** para hacer el contenido más visual
4. **Usa listas** para organizar información
5. **Incluye enlaces** para referenciar fuentes

¡Con esta guía ya puedes escribir entradas increíbles para el blog!