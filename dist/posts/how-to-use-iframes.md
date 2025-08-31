# How to Use Iframes in Your Blog

iFrames allow you to embed external content directly into your blog posts. This article teaches you how to use the special iframe syntax supported by our blog.

## Basic syntax

To embed an iframe, use the following syntax:

```markdown
:::iframe
URL_OF_THE_CONTENT
:::
```

## Practical examples

### YouTube

To embed a YouTube video:

```markdown
:::iframe
https://www.youtube.com/embed/dQw4w9WgXcQ
:::
```

Result:

:::iframe
https://www.youtube.com/embed/dQw4w9WgXcQ
:::

### CodePen

To embed a CodePen:

```markdown
:::iframe
https://codepen.io/team/codepen/embed/PNaGbb
:::
```

### Google Maps

To embed a Google Maps map:

```markdown
:::iframe
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.8271!2d-3.7037902!3d40.4167754!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDI1JzAwLjQiTiAzwrA0MicxMy42Ilc!5e0!3m2!1sen!2ses!4v1234567890123
:::
```

### JSFiddle

To embed a JSFiddle:

```markdown
:::iframe
https://jsfiddle.net/usuario/codigo/embedded/
:::
```
## Technical Features

### Automatic Dimensions

Embedded iframes have the following characteristics:

- **Width**: 100% of the container
- **Height**: 400px by default
- **Responsive**: Adapts to the width of the screen
- **Borderless**: `frameborder="0"`
- **Fullscreen**: `allowfullscreen` enabled

### Security

Generated HTML content goes through DOMPurify to ensure security, allowing only the tags and attributes necessary for iframes.

## Best Practices

### 1. Embed URLs

Always use specific URLs for embedding:

- ✅ `https://www.youtube.com/embed/VIDEO_ID`
- ❌ `https://www.youtube.com/watch?v=VIDEO_ID`

### 2. Appropriate Content

Only embed content that:

- Is relevant to your post
- Comes from trusted sources
- Does not violate copyrights

### 3. Context

Always provide context before the iframe:

``` markdown
Here you can see an interactive demo of the code:

::: iframe
https://codepen.io/ejemplo/embed/demo
:::

As you can see in the example above...
```

## Limitations

### CORS-Restricted Content

Some websites do not allow embedding due to CORS policies. In these cases, the iframe will display an error or a blank page.

### Auto Height

Auto height doesn't work with all sites due to browser security restrictions.

## Supported Websites

These websites work well with iframes:

| Service | Type | Example URL |
|----------|------|----------------|
| YouTube | Video | `https://www.youtube.com/embed/ID` |
| Vimeo | Video | `https://player.vimeo.com/video/ID` |
| CodePen | Code | `https://codepen.io/user/embed/pen` |
| JSFiddle | Code | `https://jsfiddle.net/user/pen/embedded/` |
| Google Maps | Maps | Google Maps Embed URL |
| Spotify | Music | `https://open.spotify.com/embed/...` |

## Complete Example

Here's a complete example of how to use iframes in a post:

```Markdown
# My JavaScript Project

I've created an interactive calculator using pure JavaScript.

## Demo

You can try the calculator here:

:::iframe
https://codepen.io/myuser/embed/calculator
:::

## Source Code

The code is available in my GitHub repository...
```

With this guide, you can now embed any external content in your blog posts!