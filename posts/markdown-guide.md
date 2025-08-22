# Complete Guide to Markdown

Markdown is a lightweight markup language that allows you to easily format text. In this blog, you can use all of the standard Markdown syntax.

## Headings

You can create headings using the `#` symbol:

```Markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

## Text Formatting

### Basic

- **Bold text**: `**text**` or `__text__`
- *Italic text*: `*text*` or `_text_`
- ***Bold and italic text***: `***text***`
- ~~Strikethrough text~~: `~~text~~`

### Code

- Inline code: `code` using backticks
- Code blocks using three backticks:

```JavaScript
function example() {
console.log("Hello world!");
}
```

## Lists

### Unordered List

- Item 1
- Item 2
- Subitem 2.1
- Subitem 2.2
- Item 3

``` Markdown
- Item 1
- Item 2
- Subitem 2.1
- Subitem 2.2
- Item 3
```

### Ordered List

1. First Item
2. Second Item
3. Third Item

``` Markdown
1. First Item
2. Second Item
3. Third Item
```

## Links and Images

### Links

- [Simple Link](https://example.com)
- [Link with Title](https://example.com "Link Title")

``` Markdown
[Simple Link](https://example.com)
[Link with Title](https://example.com "Link Title") link")
```

### Images

![Image description](https://blogger.googleusercontent.com/img/a/AVvXsEg84NFSz1z5LQWYAcnZ0We0MtCWnOY6mRDqRFT0Rz9h5DD-vTIGLNblqF_kXFHuyNljj1fmhvvndKDjmWKJRH4k5yzGzQXy4fTdzJHVRM0Aqz6ufceoZQP5eYcf2cgx2l_GOt2ovMo4G5H439PTse-REsywKwy2ZrS5-Yf_W0UnDxG7h-22rRBjF-ZQ0bw)

```markdown ... image](https://via.placeholder.com/300x200)
```

## Tables

| Column 1 | Column 2 | Column 3 |
|-----------|-----------|-----------|
| Cell A1 | Cell B1 | Cell C1 |
| Cell A2 | Cell B2 | Cell C2 |
| Cell A3 | Cell B3 | Cell C3 |

```markdown
| Column 1 | Column 2 | Column 3 |
|-----------|-----------|-----------|
| Cell A1 | Cell B1 | Cell C1 |
| Cell A2 | Cell B2 | Cell C2 |
```

## Quotes

> This is a block quote.
> It can span multiple lines.
>
> And have multiple paragraphs.

```markdown
> This is a block quote.
> It can span multiple lines.
```

## Horizontal lines

---
```markdown
---
```

## Code blocks with syntax

### JavaScript
```javascript
const greet = (name) => {
return `Hello, ${name}!`;
};

console.log(greet("World"));
```

### Python
```python
def greet(name):
return f"Hello, {name}!"

print(greet("World"))
```

### HTML
```html
<!DOCTYPE html>
<html>
<head>
<title>My Page</title>
</head>
<body>
<h1>Hello World!</h1>
</body>
</html>
```

## Special Feature: Iframes

This blog supports a special syntax for embedding iframes:

``` markdown
::: iframe
https://www.youtube.com/embed/dQw4w9WgXcQ
:::
```

This will render as an iframe embedded on the page.

## Writing Tips

1. **Use headings** to organize your content
2. **Include code** to explain technical concepts
3. **Add images** to make your content more visual
4. **Use lists** to organize information
5. **Include links** to reference sources

With this guide, you can now write amazing blog posts!