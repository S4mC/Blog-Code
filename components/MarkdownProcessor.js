function obtainAttributes(line) {
    const attributeRegex = /(\w+)="([^"]+)"/g;
    let match;
    let attributes = "";
    while ((match = attributeRegex.exec(line)) !== null) {
        const [, attr, value] = match;
        if (attr !== "src") {
            // Ignoramos src ya que lo manejamos aparte
            attributes += ` ${attr}="${value}"`;
        }
    }
    return attributes;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function processBalancedDelimiters(text, config) {
    let result = text;
    const { findPattern, openChar, closeChar, processMatch, shouldProcess = () => true } = config;

    const matches = [];
    let match;

    // Find all potential starts
    while ((match = findPattern.exec(text)) !== null) {
        const matchData = {
            fullMatch: match,
            start: match.index,
            ...(match.groups || {}),
        };

        // Find the balanced end
        let count = 1;
        let i = match.index + match[0].length;
        let endPos = -1;

        while (i < text.length && count > 0) {
            const char = text[i];
            if (char === openChar) {
                count++;
            } else if (char === closeChar) {
                count--;
                if (count === 0) {
                    endPos = i;
                    break;
                }
            }
            i++;
        }

        if (endPos !== -1) {
            matchData.end = endPos + 1;
            matchData.content = text.substring(match.index + match[0].length, endPos);

            if (shouldProcess(matchData)) {
                matches.push(matchData);
            }
        }
    }

    // Process from right to left to maintain positions
    matches.reverse().forEach((matchData) => {
        const replacement = processMatch(matchData, text);
        if (replacement !== null) {
            result =
                result.substring(0, matchData.start) + replacement + result.substring(matchData.end);
        }
    });

    return result;
}

function processInlineCodeBlocks(text, inlineCodeBlocks, noPlaceHolder = false) {
    let inlineCodeCount = 0;
    let result = text;

    // More compatible regex: finds all backticks
    const allBackticks = [];
    let match;
    const regex = /`/g;

    while ((match = regex.exec(text)) !== null) {
        allBackticks.push(match.index);
    }

    // Filter only simple backticks
    const singleBackticks = allBackticks.filter((pos) => {
        const before = pos > 0 && (text[pos - 1] === "`" || text[pos - 1] === "\\"); // You can use \` to use a literal backtick in inline code
        const after = pos < text.length - 1 && text[pos + 1] === "`";
        return !before && !after;
    });

    // Resto igual...
    const validBlocks = [];
    for (let i = 0; i < singleBackticks.length - 1; i += 2) {
        const start = singleBackticks[i];
        const end = singleBackticks[i + 1];

        if (end !== undefined) {
            const beforeBacktick = text.substring(0, start);
            const langMatch = beforeBacktick.match(/ ([a-zA-Z0-9]+)$/);

            const lang = langMatch ? langMatch[1] : "";
            const code = text.substring(start + 1, end).replace(/\\`/g, "`"); // Allow escaped backticks inside code
            validBlocks.push({
                start: start - (langMatch ? langMatch[1].length : 0),
                end: end + 1,
                lang,
                code,
            });
        }
    }

    validBlocks.reverse().forEach((block) => {
        let placeholder = `INLINE_CODE_${inlineCodeCount++}_CODE_INLINE`;
        if (noPlaceHolder) {
            placeholder = `<code class="language-${block.lang}">${block.code}</code>`;
        } else {
            inlineCodeBlocks.set(placeholder, {
                language: block.lang,
                code: block.code,
            });
        }
        result = result.substring(0, block.start) + `${placeholder}` + result.substring(block.end);
    });

    return [result, inlineCodeBlocks];
}

function processCodeBlocksAndTitles(text) {
    let blockCount = 0;
    let inCodeBlock = false;
    let currentLanguage = "";
    let currentCode = [];
    let sidebarContent = [];
    let protectedContent = [];
    let codeBlocks = new Map();

    const lines = text.split("\n");

    for (let line of lines) {
        line = line.replace(/\t/g, "    "); // Remove tabs if present for avoiding issues
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("```")) {
            if (!inCodeBlock) {
                // Start of code block
                inCodeBlock = true;
                currentLanguage = trimmedLine.slice(3).trim();
                currentCode = [];
            } else {
                // End of code block
                inCodeBlock = false;

                let spaceTitle = line.match(/^\s*/)[0];

                // Check if all lines have common leading whitespace and remove it if they do
                let processedCode = currentCode;
                if (currentCode.length > 0) {
                    // Filter out empty lines to find the minimum indentation
                    const nonEmptyLines = currentCode.filter((line) => line.trim() !== "");

                    if (nonEmptyLines.length > 0) {
                        // Find the minimum leading whitespace (spaces or tabs)
                        let minIndentation = 4 + spaceTitle.length;

                        for (const line of nonEmptyLines) {
                            let indentation = 0;
                            for (let i = 0; i < line.length; i++) {
                                if (line[i] === " ") {
                                    indentation++;
                                } else {
                                    break;
                                }
                            }
                            minIndentation = Math.min(minIndentation, indentation);
                        }

                        // If there's common indentation, remove it from all lines
                        if (minIndentation > 0 && minIndentation !== Infinity) {
                            processedCode = currentCode.map((line) => {
                                if (line.trim() === "") {
                                    // Keep empty lines as they are
                                    return line;
                                } else {
                                    // Remove the common indentation
                                    return line.substring(minIndentation);
                                }
                            });
                        }
                    }
                }

                const placeholder = `CODE_BLOCK_${blockCount++}_BLOCK_CODE`;
                codeBlocks.set(placeholder, {
                    language: currentLanguage,
                    code: processedCode.join("\n"),
                });
                protectedContent.push(spaceTitle + placeholder);
            }
            continue;
        }

        if (inCodeBlock) {
            currentCode.push(line);
        } else {
            // We use lineTrim because in quotes the > avoid correct detection of headers
            let lineTrim = line.replace(/</g, "").replace(/>/g, "").trim();

            // If we're not in a code block, process titles and part of html
            if (
                lineTrim.startsWith("## ") ||
                lineTrim.startsWith("### ") ||
                lineTrim.startsWith("#### ") ||
                lineTrim.startsWith("##### ") ||
                lineTrim.startsWith("###### ")
            ) {
                let textHeader = processInlineCodeBlocks(
                    lineTrim.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                    [],
                    true
                )[0];
                sidebarContent.push(textHeader);
                protectedContent.push(line);
            } else if (line.startsWith("#t ")) {
                protectedContent.push(`<plain>${line.substring(3)}</plain>`);
            } else if (line.startsWith("<")) {
                protectedContent.push(`${line}`);
            } else {
                protectedContent.push(line);
            }
        }
    }

    return [protectedContent.join("\n"), codeBlocks, sidebarContent];
}

function processMarkdownBlocks(markdownContent) {
    // Helper function to remove common leading whitespace from an array of lines
    function removeCommonIndentation(lines) {
        if (lines.length === 0) return lines;

        // Filter out empty lines to find the minimum indentation
        const nonEmptyLines = lines.filter((line) => line.trim() !== "");

        if (nonEmptyLines.length === 0) return lines;

        // Find the minimum leading whitespace (spaces or tabs)
        let minIndentation = 4;

        for (const line of nonEmptyLines) {
            let indentation = 0;
            for (let i = 0; i < line.length; i++) {
                if (line[i] === " ") {
                    indentation++;
                } else {
                    break;
                }
            }
            minIndentation = Math.min(minIndentation, indentation);
        }

        // If there's common indentation, remove it from all lines
        if (minIndentation > 0 && minIndentation !== Infinity) {
            return lines.map((line) => {
                if (line.trim() === "") {
                    // Empty lines get 4 spaces to maintain structure
                    return "    ";
                } else {
                    // Remove the common indentation
                    return line.substring(minIndentation);
                }
            });
        }

        return lines;
    }

    // Process the content line by line
    const lines = markdownContent.split("\n");
    let processedLines = [];

    function processNestedBlocks(startIndex) {
        let i = startIndex;
        let blockContent = [];
        let nestedLevel = 0;

        while (i < lines.length) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Check if this line starts a new block
            if (trimmedLine === ":::") {
                if (nestedLevel === 0) {
                    // This closes our current block
                    break;
                } else {
                    // This closes a nested block
                    nestedLevel--;
                    blockContent.push(line);
                }
            } else if (trimmedLine.startsWith(":::")) {
                nestedLevel++;
                blockContent.push(line);
            } else {
                blockContent.push(line);
            }
            i++;
        }

        // Remove common indentation from block content
        blockContent = removeCommonIndentation(blockContent);

        return [blockContent, i];
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        let spaceTitle = line.match(/^\s*/)[0];

        if (trimmedLine.startsWith(":::connector")) {
            let attributes = obtainAttributes(trimmedLine);

            processedLines.push(spaceTitle);
            processedLines.push(spaceTitle + '<div class="content-connector" ' + attributes + ">");

            // Process nested content
            const [blockContent, endIndex] = processNestedBlocks(i + 1);

            // Recursively process the content inside the block
            const nestedProcessed = processMarkdownBlocks(blockContent.join("\n"));

            processedLines.push(spaceTitle);
            for (const line of nestedProcessed.split("\n")) {
                processedLines.push(line);
            }
            processedLines.push(spaceTitle);
            i = endIndex;
            processedLines.push(spaceTitle + "</div>");
            processedLines.push(spaceTitle);

        } else if (trimmedLine.startsWith(":::float-")) {
            const floatId = trimmedLine.substring(":::float-".length);
            processedLines.push(spaceTitle);
            processedLines.push(
                spaceTitle +
                    `<div class="float-container" id="float-${floatId}"><button class="float-close">×</button>`
            );

            // Process nested content
            const [blockContent, endIndex] = processNestedBlocks(i + 1);

            // Recursively process the content inside the block
            const nestedProcessed = processMarkdownBlocks(blockContent.join("\n"));
            processedLines.push(spaceTitle);
            for (const line of nestedProcessed.split("\n")) {
                processedLines.push(line);
            }
            processedLines.push(spaceTitle);
            i = endIndex;
            processedLines.push(spaceTitle + "</div>");
            processedLines.push(spaceTitle);

        } else if (trimmedLine.startsWith(":::note")) {
            processedLines.push(spaceTitle + '<div class="note-callout">');
            processedLines.push(spaceTitle + '<div class="callout-header">');
            processedLines.push(
                spaceTitle +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 20H7.197c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C4 18.48 4 17.92 4 16.8V7.2c0-1.12 0-1.68.218-2.108c.192-.377.497-.682.874-.874C5.52 4 6.08 4 7.2 4h9.6c1.12 0 1.68 0 2.107.218c.377.192.683.497.875.874c.218.427.218.987.218 2.105V13m-7 7c.286-.003.466-.014.639-.055q.308-.075.578-.24c.202-.124.375-.296.72-.642l4.126-4.125c.346-.346.518-.52.642-.721q.165-.271.24-.579c.04-.172.051-.352.054-.638M13 20v-5.4c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C13.76 13 14.04 13 14.6 13H20"/></svg>'
            );
            processedLines.push(spaceTitle + "<span>Note</span>");
            processedLines.push(spaceTitle + "</div>");
            processedLines.push(spaceTitle + '<div class="callout-content">');

            // Process nested content
            const [blockContent, endIndex] = processNestedBlocks(i + 1);

            // Recursively process the content inside the block
            const nestedProcessed = processMarkdownBlocks(blockContent.join("\n"));
            processedLines.push(spaceTitle);
            for (const line of nestedProcessed.split("\n")) {
                processedLines.push(line);
            }
            processedLines.push(spaceTitle);

            i = endIndex;
            processedLines.push(spaceTitle + "</div>");
            processedLines.push(spaceTitle + "</div>");

        } else if (trimmedLine.startsWith(":::warning")) {
            processedLines.push(spaceTitle + '<div class="warning-callout">');
            processedLines.push(spaceTitle + '<div class="callout-header">');
            processedLines.push(
                spaceTitle +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12.5ZM2.725 21q-.575 0-.85-.537T1.8 19.4l9.2-16q.275-.5.75-.7t.95 0t.75.7l9.2 16q.275.5.075 1.063T21.9 21zm1.85-2h14.85L12 5zm7.425-1q.425 0 .713-.288T13 17q0-.425-.288-.713T12 16q-.425 0-.713.288T11 17q0 .425.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.713T12 10q-.425 0-.713.288T11 11v3q0 .425.288.713T12 15"></path></svg>'
            );
            processedLines.push(spaceTitle + "<span>Warning</span>");
            processedLines.push(spaceTitle + "</div>");
            processedLines.push(spaceTitle + '<div class="callout-content">');

            // Process nested content
            const [blockContent, endIndex] = processNestedBlocks(i + 1);

            // Recursively process the content inside the block
            const nestedProcessed = processMarkdownBlocks(blockContent.join("\n"));
            processedLines.push(spaceTitle);
            for (const line of nestedProcessed.split("\n")) {
                processedLines.push(line);
            }
            processedLines.push(spaceTitle);

            i = endIndex;
            processedLines.push(spaceTitle + "</div>");
            processedLines.push(spaceTitle + "</div>");

        } else if (trimmedLine.startsWith(":::grid")) {
            // Extract grid configuration from the line
            const gridConfig = trimmedLine.substring(":::grid".length).trim();
            let gridClasses = "markdown-grid";
            let gridStyles = "";

            // Parse grid configuration
            if (gridConfig) {
                // Support for columns (e.g., :::grid cols-2, :::grid cols-3, etc.)
                const colsMatch = gridConfig.match(/cols-(\d+)/);
                if (colsMatch) {
                    const cols = parseInt(colsMatch[1]);
                    gridClasses += ` grid-cols-${cols}`;
                    gridStyles += `grid-template-columns: repeat(${cols}, 1fr); `;
                }

                // Support for gap (e.g., :::grid gap-4, :::grid gap-large, etc.)
                const gapMatch = gridConfig.match(/gap-(\w+)/);
                if (gapMatch) {
                    const gap = gapMatch[1];
                    gridClasses += ` gap-${gap}`;
                    // Convert common gap values to CSS
                    gridStyles += `gap: ${gap * 0.5}rem; `;
                }

                // Support for responsive behavior
                if (gridConfig.includes("responsive")) {
                    gridClasses += " responsive-grid";
                }

                // Support for auto-fit
                if (gridConfig.includes("auto-fit")) {
                    const minWidthMatch = gridConfig.match(/min-(\d+)/);
                    const minWidth = minWidthMatch ? minWidthMatch[1] + "px" : "250px";
                    gridStyles += `grid-template-columns: repeat(auto-fit, minmax(${minWidth}, 1fr)); `;
                }

                // Support for custom style attribute
                const styleMatch = gridConfig.match(/style="([^"]+)"/);
                if (styleMatch) {
                    const customStyles = styleMatch[1];
                    gridStyles += `${customStyles}${customStyles.endsWith(";") ? " " : "; "}`;
                }
            } else {
                // Default configuration
                gridStyles += "grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; ";
                gridClasses += " responsive-grid";
            }

            processedLines.push(
                spaceTitle + `<div class="${gridClasses}" style="display: grid; ${gridStyles}">`
            );

            // Process nested content
            const [blockContent, endIndex] = processNestedBlocks(i + 1);

            // Split the content into grid items
            // Each item is separated by a line starting with "---" or by empty lines followed by content
            const gridItems = [];
            let currentItem = [];
            let inItem = false;
            let inBlock = false;

            for (let j = 0; j < blockContent.length; j++) {
                const line = blockContent[j];
                const trimmed = line.trim();

                if (trimmed.startsWith(":::") && trimmed !== ":::") {
                    inBlock += 1;
                } else if (trimmed === ":::") {
                    inBlock -= 1;
                }

                if (inBlock == 0 && (trimmed === "---" || trimmed.startsWith("--- "))) {
                    // Save current item if it has content
                    if (currentItem.length > 0) {
                        gridItems.push(currentItem.join("\n"));
                        currentItem = [];
                    }
                    inItem = true;
                } else if (trimmed === "" && !inItem) {
                    // Skip empty lines before starting an item
                    continue;
                } else {
                    if (!inItem && trimmed !== "") {
                        // Start new item if we encounter content
                        inItem = true;
                    }
                    if (inItem) {
                        currentItem.push(line);
                    }
                }
            }

            // Add the last item
            if (currentItem.length > 0) {
                gridItems.push(currentItem.join("\n"));
            }

            // If no explicit items found, treat the whole content as one item per paragraph
            if (gridItems.length === 0) {
                const paragraphs = blockContent.join("\n").split(/\n\s*\n/);
                gridItems.push(...paragraphs.filter((p) => p.trim()));
            }

            // Process each grid item
            gridItems.forEach((item, index) => {
                const itemClass = gridConfig.includes("equal-height")
                    ? "grid-item equal-height"
                    : "grid-item";
                processedLines.push(`${spaceTitle}<div class="${itemClass}">`);

                // Recursively process the content inside each grid item
                const itemProcessed = processMarkdownBlocks(item.trim());
                processedLines.push(spaceTitle);
                for (const line of itemProcessed.split("\n")) {
                    processedLines.push(spaceTitle + line);
                }
                processedLines.push(spaceTitle);

                processedLines.push(spaceTitle + "</div>");
            });

            i = endIndex;
            processedLines.push(spaceTitle + "</div>");

        } else if (trimmedLine.startsWith(":::details")) {
            let nameSummary = trimmedLine.replace(":::details", "").trim();
            let openDefault = false;
            if (nameSummary.startsWith("-open ")) {
                nameSummary = nameSummary.replace("-open ", "");
                openDefault = true;
            }
            processedLines.push(
                spaceTitle +
                    `<details${openDefault ? " open" : ""}>
                            <summary><p>${nameSummary}</p></summary>
                            <div class="content-wrapper-details">
                                <div class="contentDetails">`
            );

            // Process nested content
            const [blockContent, endIndex] = processNestedBlocks(i + 1);

            // Recursively process the content inside the block
            const nestedProcessed = processMarkdownBlocks(blockContent.join("\n"));
            processedLines.push(spaceTitle);
            for (const line of nestedProcessed.split("\n")) {
                processedLines.push(line);
            }
            processedLines.push(spaceTitle);

            i = endIndex;
            processedLines.push(spaceTitle + "</div> </div> </details>");
            processedLines.push(spaceTitle);

        } else if (trimmedLine.startsWith(":::iframe")) {
            let attributes = obtainAttributes(line);

            // Process nested content for iframe
            const [blockContent, endIndex] = processNestedBlocks(i + 1);
            const url = blockContent.join("").trim();

            i = endIndex;

            const expandIcon = `<svg width="16" height="16" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M3 21v-5h2v3h3v2zm13 0v-2h3v-3h2v5zM3 8V3h5v2H5v3zm16 0V5h-3V3h5v5z"/>
                        </svg>`;
            const contractIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3L13 13M3 13V7M3 13H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`;
            processedLines.push(
                spaceTitle +
                    `<div class="iframe-container"><iframe src="${url}" frameborder="0" allowfullscreen ${attributes}></iframe><button class="iframe-expand-button" title="Expand"><span class="expand-icon">${expandIcon}</span><span class="contract-icon" style="display: none;">${contractIcon}</span></button></div>`
            );

        } else {
            processedLines.push(line);
        }
    }

    return processedLines.join("\n");
}

export function renderMarkdown(markdownContent, executeScripts = true) {
    const renderer = new marked.Renderer();

    // Configure the custom renderer for links with new window option
    renderer.link = (element) => {
        const isNewWindow = element.text.endsWith(" new");
        const cleanText = isNewWindow ? element.text.slice(0, -4) : element.text;
        const target = isNewWindow ? 'target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${element.href}" ${target}${
            element.title ? ` title="${element.title}"` : ""
        }>${cleanText}</a>`;
    };

    // Configure the custom renderer for code blocks to prevent auto-generation
    renderer.code = (element) => {
        return `<p>${element.raw}</p>`;
    };

    // Configure the custom renderer for lists to allow icons in list items
    renderer.list = (element) => {
        const type = element.ordered ? "ol" : "ul";

        // Render the items - pass all element properties to preserve them
        const body = element.items
            .map((item) => {
                // Create a new object with all original properties
                return renderer.listitem({
                    type: item.type,
                    raw: item.raw,
                    task: item.task,
                    checked: item.checked,
                    loose: item.loose,
                    text: item.text,
                    tokens: item.tokens,
                });
            })
            .join("");

        let result = `<${type}${
            element.ordered && element.start !== "" ? ' start="' + element.start + '"' : ""
        }>\n${body}</${type}>\n`;

        return result;
    };

    // Configure the custom renderer for list items to allow icons in list items
    renderer.listitem = (element) => {
        let text = "";
        let dataIcon = "";

        // Process tokens if they exist (for nested content like lists, HTML blocks, etc.)
        // When tokens exist, we should use them instead of element.text to avoid duplication
        if (element.tokens && element.tokens.length > 0) {
            const firstToken = element.tokens[0];

            // Check if first token is text type or paragraph type and we need to extract icon
            if (firstToken && (firstToken.type === "text" || firstToken.type === "paragraph")) {
                // For paragraph type, check its first child token
                const textToken =
                    firstToken.type === "paragraph" && firstToken.tokens && firstToken.tokens.length > 0
                        ? firstToken.tokens[0]
                        : firstToken;
                const firstText = textToken.text || textToken.raw || "";

                // Try to extract icon from the first text token
                const match = firstText.match(
                    /^(\\?[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+)\s+(.*)$/su
                );

                if (match) {
                    let matchedIcon = match[1];
                    let matchedText = match[2];

                    if (matchedIcon.at(0) === "\\") {
                        // Allow escaping the icon with a backslash
                        matchedText = matchedIcon.slice(1) + " " + matchedText;
                        matchedIcon = "";
                    }
                    dataIcon = matchedIcon; // Extract the icon

                    // Deeply modify the first token to remove the icon
                    let modifiedFirstToken;

                    if (firstToken.type === "paragraph") {
                        // Modify the paragraph's first text token
                        const modifiedTextToken = {
                            ...textToken,
                            text: matchedText,
                            raw: matchedText,
                        };

                        // Also modify the first sub-token if it exists
                        if (textToken.tokens && textToken.tokens.length > 0) {
                            modifiedTextToken.tokens = textToken.tokens.map((subToken, index) => {
                                if (index === 0 && subToken.type === "text") {
                                    // Extract icon only from this specific sub-token
                                    const subMatch = subToken.text.match(
                                        /^(\\?[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+)\s+(.*)$/su
                                    );
                                    let matchedIcon1 = subMatch?.[1];
                                    let matchedText1 = subMatch?.[2];

                                    if (matchedIcon1.at(0) === "\\") {
                                        // Allow escaping the icon with a backslash
                                        matchedText1 = matchedIcon1.slice(1) + " " + matchedText1;
                                        matchedIcon1 = "";
                                    }
                                    if (subMatch) {
                                        return {
                                            ...subToken,
                                            text: matchedText1,
                                            raw: matchedText1,
                                        };
                                    }
                                }
                                return subToken;
                            });
                        }

                        modifiedFirstToken = {
                            ...firstToken,
                            tokens: [modifiedTextToken, ...firstToken.tokens.slice(1)],
                        };
                    } else {
                        // Modify the text token directly
                        modifiedFirstToken = {
                            ...firstToken,
                            text: matchedText,
                            raw: matchedText,
                        };

                        // If the text token has its own tokens array, modify the first sub-token
                        if (textToken.tokens && textToken.tokens.length > 0) {
                            modifiedFirstToken.tokens = textToken.tokens.map((subToken, index) => {
                                if (index === 0 && subToken.type === "text") {
                                    // Extract icon only from this specific sub-token
                                    const subMatch = subToken.text.match(
                                        /^(\\?[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+)\s+(.*)$/su
                                    );
                                    let matchedIcon1 = subMatch?.[1];
                                    let matchedText1 = subMatch?.[2];

                                    if (matchedIcon1.at(0) === "\\") {
                                        // Allow escaping the icon with a backslash
                                        matchedText1 = matchedIcon1.slice(1) + " " + matchedText1;
                                        matchedIcon1 = "";
                                    }
                                    if (subMatch) {
                                        return {
                                            ...subToken,
                                            text: matchedText1,
                                            raw: matchedText1,
                                        };
                                    }
                                }
                                return subToken;
                            });
                        }
                    }

                    // Create new tokens array with modified first token
                    const modifiedTokens = [modifiedFirstToken, ...element.tokens.slice(1)];

                    // Parse the modified tokens
                    text = marked.parser(modifiedTokens);
                } else {
                    // No icon found, parse all tokens normally
                    text = marked.parser(element.tokens);
                }
            } else {
                // First token is not text or paragraph type, parse all tokens normally
                text = marked.parser(element.tokens);
            }
        } else {
            // No tokens, process element.text directly
            text = element.text;
            const match = text.match(
                /^(\\?[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+)\s+(.*)$/su
            );
            if (match) {
                dataIcon = match[1]; // First word (the icon)
                text = match[2]; // Rest of the text

                if (dataIcon.at(0) === "\\") {
                    // Allow escaping the icon with a backslash
                    text = dataIcon.slice(1) + " " + text;
                    dataIcon = "";
                }
            }
        }

        const iconAttr = dataIcon ? ` data-icon="${dataIcon}"` : "";
        const taskAttr = element.task ? ' class="task-list-item"' : "";
        const checkedContent = element.task
            ? `<input type="checkbox"${element.checked ? " checked" : ""} disabled> `
            : "";

        return `<li${iconAttr}${taskAttr}>${checkedContent}${text}</li>\n`;
    };

    // Configure the custom renderer for add headings ids
    let sectionCount = 0;
    let itemCount = 0;
    let subitemCounts = {}; // Object to manage subitem counters for each item
    renderer.heading = function (element) {
        let id = "";

        if (element.depth === 2) {
            id = `section-${sectionCount}`;
            sectionCount++;
            itemCount = 0;
            // Reset subitem counters for the new section
            subitemCounts = {};
        } else if (element.depth === 3) {
            const currentSection = Math.max(0, sectionCount - 1);
            id = `section-${currentSection}-item-${itemCount}`;
            itemCount++;
            // Initialize subitem counter for this item
            subitemCounts[`${currentSection}-${itemCount - 1}`] = 0;
        } else if (element.depth >= 4 && element.depth <= 6) {
            // For H4-H6, maintain consistent formatting
            const currentSection = Math.max(0, sectionCount - 1);
            const currentItem = Math.max(0, itemCount - 1);
            const key = `${currentSection}-${currentItem}`;

            // If the counter for this item doesn't exist, initialize it
            if (subitemCounts[key] === undefined) {
                subitemCounts[key] = 0;
            }

            // Generate ID with the format section-X-item-Y-subitem-Z
            id = `section-${currentSection}-item-${currentItem}-subitem-${subitemCounts[key]}`;
            subitemCounts[key]++;
        } else {
            // For other types of elements (although they shouldn't exist)
            id = element.text
                .toLowerCase()
                .replace(/[^\w]+/g, "-")
                .replace(/(^-|-$)/g, "");
        }

        return `<h${element.depth} id="${id}">${element.text}</h${element.depth}>`;
    };

    let codeBlocks = new Map(); // Map to store code blocks
    let inlineCodeBlocks = new Map(); // Map to store inline codes

    let sidebarContent = [];
    let processedMarkdown = "";

    // This must be run before markdown-it because it prevents processing the contents of the code blocks and also getting the sidebar titles
    [processedMarkdown, codeBlocks, sidebarContent] = processCodeBlocksAndTitles(markdownContent);

    // Process multiple line breaks
    processedMarkdown = processedMarkdown.replace(/\n\n\n+/g, (match) => {
        const lineBreakCount = match.length - 2;
        const brs = "<br>".repeat(lineBreakCount);
        return `\n\n${brs}\n\n`;
    });

    // Protect inline code
    [processedMarkdown, inlineCodeBlocks] = processInlineCodeBlocks(processedMarkdown, inlineCodeBlocks);

    // Process width spacing elements like (w=1em)
    processedMarkdown = processedMarkdown.replace(
        /\(w=(\d*\.?\d+)(px|em|rem|lh)\)/g,
        (match, size, unit) => {
            return `<div style="width: ${size}${unit}"></div>`;
        }
    );

    // Process height spacing elements
    processedMarkdown = processedMarkdown.replace(
        /\(h=(\d*\.?\d+)(px|em|rem|lh)\)/g,
        (match, size, unit) => {
            return `<div style="height: ${size}${unit}"></div>`;
        }
    );

    // Process navigation elements like (go-out=name), (go-above=name), (go-below=name), (go-in=name), (go-inl=name)
    // Also supports stacked directions: (go-out-out-below=name)
    processedMarkdown = processedMarkdown.replace(
        /\(go-((?:out|above|below|in|inl)(?:-(?:out|above|below|in|inl))*)=([^)]+)\)/g,
        (match, directions, name) => {
            return `<div class="go-navigate" data-directions="${directions}" data-name="${name.trim()}"></div>`;
        }
    );

    // Handle links that might have spaces in the href that Marked.js doesn't parse correctly
    // Using the generic balanced delimiter processor
    processedMarkdown = processBalancedDelimiters(processedMarkdown, {
        findPattern: /\[(?<linkText>[^\]]+)\]\((?<hrefStart>#)/g,
        openChar: "(",
        closeChar: ")",
        shouldProcess: (matchData) => {
            // Check if encoding is needed
            const href = matchData.content;
            return (
                href.includes(" ") ||
                href.includes("(") ||
                href.includes(")") ||
                href.includes("<") ||
                href.includes(">") ||
                href.includes('"') ||
                href.includes("=") ||
                href.includes("&") ||
                href.includes("%")
            );
        },
        processMatch: (matchData, text) => {
            const linkText = matchData.linkText;
            const href = matchData.hrefStart + matchData.content;

            let encodedHref = href
                .replace(/"/g, "%22")
                .replace(/ /g, "%20")
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29")
                .replace(/</g, "%3C")
                .replace(/>/g, "%3E")
                .replace(/&/g, "%26")
                .replace(/\n/g, "%0A")
                .replace(/\r/g, "%0D");

            return `[${linkText}](${encodedHref})`;
        },
    });

    // Process the content within code blocks
    const processedWithIframes = processMarkdownBlocks(processedMarkdown);
    processedMarkdown = processedWithIframes;

    marked.setOptions({
        breaks: true,
        gfm: true,
        renderer: renderer,
        mangle: false,
    });

    // Convert the document to markdown with marked
    let finalHtml = marked.parse(processedMarkdown);

    let finalJS = ""; // This will hold any final JS code to be executed after rendering

    // Process the float element, this need to be in this place to avoid issues with code blocks
    finalHtml = finalHtml.replace(/\(\?=([a-zA-Z0-9-_]+)\)/g, (match, id) => {
        // Replace all instances of (?=float-id) with the corresponding float trigger HTML
        return `<span class="float-trigger" data-float-id="${id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 28"><g fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="5" y="5" rx="4"/><path stroke-linecap="round" d="M12 15.52v-.01m-1.998-5.533C10.157 9.019 11 8.5 12 8.5s1.686.672 1.87 1.207c.183.535.144 1.344-.363 1.809s-.773.316-1.229.8a1.8 1.8 0 0 0-.278.432"/></g></svg>
        </span>`;
    });

    // Restore inline codes
    for (const [placeholder, { language, code }] of inlineCodeBlocks) {
        // Escape HTML code to ensure it displays correctly
        const escapedCode = escapeHtml(code);

        // Use a regular expression to replace placeholders
        const regex = new RegExp(placeholder, "g");
        finalHtml = finalHtml.replace(regex, `<code class="language-${language}">${escapedCode}</code>`);
    }

    // Restore code blocks
    let numberSVGcontainer = 1;
    let numberLottieContainer = 1;
    for (const [placeholder, { language, code }] of codeBlocks) {
        let codeHtml = "";
        if (language.startsWith("svg")) { // Manages SVG custom code blocks
            let attributes = obtainAttributes(language);
            codeHtml = `<div
                id="SVGiewer${numberSVGcontainer}"
                class="SVG-viewer"
                ${attributes}
            >
            <button style="position: absolute; bottom: 10px; right: 10px;background: transparent; border: 0;">
                <svg id="zoom-in${numberSVGcontainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"></path></svg>
                <svg id="zoom-out${numberSVGcontainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M19 12.998H5v-2h14z"/></svg>
                <svg id="reset_zoom${numberSVGcontainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="m12 10.587l4.95-4.95l1.414 1.414l-4.95 4.95l4.95 4.95l-1.415 1.414l-4.95-4.95l-4.949 4.95l-1.414-1.415l4.95-4.95l-4.95-4.95L7.05 5.638z"/></svg>
            </button>${code.replace("<svg ", `<svg id='page${numberSVGcontainer}'`)}</div>
            `;
            finalJS += `(${setupSVGZoom.toString()})(${numberSVGcontainer});`;
            numberSVGcontainer += 1;

        } else if (language.startsWith("animation")) {
            let attributes = obtainAttributes(language);
            let config = language.split(" ");

            // Extract the animation path from the code content
            const animationPath = code.trim();

            codeHtml = `<div class="animation-wrapper">
                <div
                    id="animationContainer${numberLottieContainer}"
                    class="animation-container"
                    ${attributes}
                ></div>
                <button style="position: absolute; bottom: 10px; left: 10px; background: transparent; border: 0;">
                    <svg id="playPauseBtn${numberLottieContainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M8 5v14l11-7z"/></svg>
                    <svg id="resetBtn${numberLottieContainer}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="background: black; border-radius: 50%;"><path fill="#fff" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                </button>
            </div>`;

            finalJS += `(${setupLottieAnimation.toString()})(${numberLottieContainer}, ${JSON.stringify(
                config
            )}, ${JSON.stringify(animationPath)});`;

            numberLottieContainer += 1;

        } else {
            // Escape the content to display it as text
            let config = language.split(" ");
            const escapedCode = escapeHtml(code);

            const copyButton = `<button class="code-copy-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 13H7a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
                    <path d="M3 11V3a2 2 0 012-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>`;

            const foldingButton = `<button class="code-folding-button" title="Fold/Unfold Code">
                <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 9l6 6l6-6"/></svg>
            </button>`;

            codeHtml = `<div class="code-block-wrapper${config.includes("-min") ? " min" : ""}">${copyButton}${config.includes("-folded") ? foldingButton : ""}<pre class="${config.includes("-folded") ? " folded" : ""}"><code class="language-${config[0]}">${escapedCode}</code></pre></div>`;
        }
        // Replace the placeholder with the code block, handling possible <br> before/after
        const regex = new RegExp(`(<br>\\s*)?${placeholder}(\\s*<br>)?`, "g");
        finalHtml = finalHtml.replace(regex, codeHtml);
    }

    if (numberSVGcontainer > 1) {
        finalJS += `(${centerAllSVGViewers.toString()})();`;
    }

    // Custom scroll code for internal links - works on all pages
    finalJS += `(${setupCustomScrollLinks.toString()})();`;

    // This code makes the summary work with animation
    finalJS += `(${setupDetailsAnimation.toString()})();`;

    // Add JavaScript code to handle floating elements
    finalJS += `(${setupFloatingElements.toString()})();`;

    // Ensure scripts inside the markdown content are executed, this must be at the end because it can go wrong and break other script below
    if (executeScripts) {
        finalJS += `(${executeEntryContentScripts.toString()})();`;
    }

    return [finalHtml, sidebarContent, finalJS];
}

export function showCopySuccess(button, originalHTML) {
    button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

    setTimeout(() => {
        button.innerHTML = originalHTML;
    }, 2000);
}

export function manageEscapeIframe() {
    const expandedIframe = document.querySelector(".iframe-container.expanded");
    if (expandedIframe) {
        const button = expandedIframe.querySelector(".iframe-expand-button");
        const expandIcon = button.querySelector(".expand-icon");
        const contractIcon = button.querySelector(".contract-icon");

        expandedIframe.classList.remove("expanded");
        expandIcon.style.display = "block";
        contractIcon.style.display = "none";
        button.title = "Expand";
    }

    // Also handle closing fullscreen images
    const fullscreenContainer = document.querySelector(".fullscreen-image-container");
    if (fullscreenContainer) {
        fullscreenContainer.classList.remove("visible");
        setTimeout(() => fullscreenContainer.remove(), 300);
        document.body.style.overflow = "auto";
    }
}

export function manageClickFloatButton(e) {
    // Para los botones de expandir iframe
    if (e.target.closest(".iframe-expand-button")) {
        const button = e.target.closest(".iframe-expand-button");
        const container = button.closest(".iframe-container");
        const expandIcon = button.querySelector(".expand-icon");
        const contractIcon = button.querySelector(".contract-icon");

        container.classList.toggle("expanded");
        // Cambiar la visibilidad de los iconos
        if (container.classList.contains("expanded")) {
            expandIcon.style.display = "none";
            contractIcon.style.display = "block";
            button.title = "Contraer";
            document.body.style.overflow = "hidden";
        } else {
            expandIcon.style.display = "block";
            contractIcon.style.display = "none";
            button.title = "Expand";
            document.body.style.overflow = "auto";
        }
    }

    // For images
    if (
        e.target.tagName === "IMG" &&
        e.target.closest(".entry-content") &&
        !e.target.closest(".fullscreen-image-container")
    ) {
        // Crear el contenedor de pantalla completa
        const container = document.createElement("div");
        container.className = "fullscreen-image-container";

        // Create the close button
        const closeButton = document.createElement("button");
        closeButton.className = "fullscreen-image-close";
        closeButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

        // Crear la imagen
        const fullImage = document.createElement("img");
        fullImage.src = e.target.src;
        fullImage.alt = e.target.alt;

        // Agregar elementos al DOM
        container.appendChild(closeButton);
        container.appendChild(fullImage);
        document.body.appendChild(container);

        // Show with animation
        requestAnimationFrame(() => {
            container.classList.add("visible");
        });

        document.body.style.overflow = "hidden";

        // Function to close
        const closeFullscreen = () => {
            container.classList.remove("visible");
            setTimeout(() => container.remove(), 300);
            document.body.style.overflow = "auto";
        };

        // Handle closing with the button
        closeButton.onclick = (e) => {
            e.stopPropagation();
            closeFullscreen();
        };

        // Manejar el cierre al hacer clic en el fondo
        container.onclick = (e) => {
            if (e.target === container) {
                closeFullscreen();
            }
        };
    }

    // For copy code buttons
    if (e.target.closest(".code-copy-button")) {
        const button = e.target.closest(".code-copy-button");
        const codeBlock = button.parentElement.querySelector("code");
        const code = codeBlock.textContent;
        const originalHTML = button.innerHTML;

        navigator.clipboard
            .writeText(code)
            .then(() => {
                showCopySuccess(button, originalHTML);
            })
            .catch((err) => {
                console.error("Error copying:", err);
            });
    }

    // For folder code buttons
    if (e.target.closest(".code-folding-button")) {
        const button = e.target.closest(".code-folding-button");
        const codeBlock = button.parentElement.querySelector("pre");
        if (codeBlock.classList.contains("folded")) {
            codeBlock.classList.remove("folded");
            button.querySelector("svg").innerHTML = '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 15l6-6l6 6"/>'
        } else {
            codeBlock.classList.add("folded");
            button.querySelector("svg").innerHTML = '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 9l6 6l6-6"/>'
        }
    }
}

// ---------------------------------------------------------------------------------
// -------------- Functions to return as text inside the MarkdownProcessor component
// ---------------------------------------------------------------------------------

function setupSVGZoom(numberSVGcontainer) {
    if (document.getElementById(`page${numberSVGcontainer}`)) {
        window[`zoomContainer${numberSVGcontainer}`] = svgPanZoom(`#page${numberSVGcontainer}`);

        let viewer = document.getElementById(`SVGiewer${numberSVGcontainer}`);
        let rectElement = viewer.querySelector("svg>g>rect");
        let lastWidth = window.innerWidth;

        function proper_height() {
            rectElement = viewer.querySelector("svg>g>rect");
            if (rectElement) {
                // Get the dimensions of the rect
                const rectWidth = rectElement.getAttribute("width") || rectElement.width.baseVal.value;
                const rectHeight =
                    rectElement.getAttribute("height") || rectElement.height.baseVal.value;

                // Calculate the ratio (height/width)
                const aspectRatio = rectHeight / rectWidth;

                // Get the current width of the SVG-viewer
                const viewerWidth = viewer.offsetWidth;

                if (viewerWidth > 0) {
                    // Calculate the proportional height
                    const proportionalHeight = viewerWidth * aspectRatio;

                    // Calculate 80vh in pixels
                    const maxHeight = window.innerHeight * 0.8;

                    // Apply proportional height with limit of 80vh
                    const finalHeight = Math.min(proportionalHeight, maxHeight);
                    viewer.style.height = finalHeight + "px";
                }
            }
        }

        let resizeTimeout;
        window.addEventListener("resize", function () {
            const currentWidth = window.innerWidth;

            // Only execute if width has changed
            if (currentWidth !== lastWidth) {
                lastWidth = currentWidth;

                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function () {
                    viewer = document.getElementById(`SVGiewer${numberSVGcontainer}`);
                    if (window[`zoomContainer${numberSVGcontainer}`]) {
                        window[`zoomContainer${numberSVGcontainer}`].destroy();
                    }
                    proper_height();
                    viewer.querySelectorAll(".svg-pan-zoom_viewport").forEach((viewport) => {
                        viewport.replaceWith(...viewport.childNodes);
                    });
                    window[`zoomContainer${numberSVGcontainer}`] = svgPanZoom(
                        `#page${numberSVGcontainer}`
                    );
                    center_svg();
                }, 280);
            }
        });

        proper_height();

        // Button listeners
        document.getElementById(`zoom-in${numberSVGcontainer}`).addEventListener("click", function (ev) {
            ev.preventDefault();
            window[`zoomContainer${numberSVGcontainer}`].zoomIn();
        });

        document
            .getElementById(`zoom-out${numberSVGcontainer}`)
            .addEventListener("click", function (ev) {
                ev.preventDefault();
                window[`zoomContainer${numberSVGcontainer}`].zoomOut();
            });

        function center_svg() {
            const zoomContainer = window[`zoomContainer${numberSVGcontainer}`];
            rectElement = viewer.querySelector("svg>g>rect");

            if (zoomContainer && rectElement) {
                zoomContainer.zoom(1);
                zoomContainer.pan({
                    x:
                        (viewer.offsetWidth -
                            zoomContainer.getSizes().viewBox.width * zoomContainer.getSizes().realZoom) /
                        2,
                    y:
                        (viewer.offsetHeight -
                            zoomContainer.getSizes().viewBox.height *
                                zoomContainer.getSizes().realZoom) /
                        2,
                });
            } else {
                window[`zoomContainer${numberSVGcontainer}`].resetZoom();
                window[`zoomContainer${numberSVGcontainer}`].fit();
                window[`zoomContainer${numberSVGcontainer}`].center();
            }
        }

        document
            .getElementById(`reset_zoom${numberSVGcontainer}`)
            .addEventListener("click", function (ev) {
                ev.preventDefault();
                center_svg();
            });

        center_svg();
    }
}

function setupLottieAnimation(numberLottieContainer, config, animationPath) {
    // Use setTimeout to ensure DOM elements are ready
    setTimeout(() => {
        if (
            document.getElementById("animationContainer" + numberLottieContainer) &&
            typeof bodymovin !== "undefined"
        ) {
            const animationContainer = document.getElementById(
                "animationContainer" + numberLottieContainer
            );

            // Always clean up existing animation if it exists
            if (window["lottieAnimation" + numberLottieContainer]) {
                try {
                    window["lottieAnimation" + numberLottieContainer].destroy();
                } catch (e) {
                    console.warn("Error destroying animation:", e);
                }
                window["lottieAnimation" + numberLottieContainer] = null;
            }

            // Clean up event listeners
            if (window.lottieEventListeners && window.lottieEventListeners[numberLottieContainer]) {
                const listeners = window.lottieEventListeners[numberLottieContainer];
                const playBtn = document.getElementById("playPauseBtn" + numberLottieContainer);
                const resetBtn = document.getElementById("resetBtn" + numberLottieContainer);
                if (playBtn) playBtn.removeEventListener("click", listeners.playPause);
                if (resetBtn) resetBtn.removeEventListener("click", listeners.reset);
            }

            // Create fresh animation
            window["lottieAnimation" + numberLottieContainer] = bodymovin.loadAnimation({
                container: animationContainer,
                renderer: "svg",
                loop: config.includes("-loop"),
                autoplay: config.includes("-autoplay"),
                path: animationPath,
            });

            // Initialize states
            if (!window.lottieStates) window.lottieStates = {};
            window.lottieStates[numberLottieContainer] = {
                isPlaying: false,
                isStarting: true,
            };

            // Get button references (with additional wait if needed)
            const playPauseBtn = document.getElementById("playPauseBtn" + numberLottieContainer);
            const resetBtn = document.getElementById("resetBtn" + numberLottieContainer);

            // Only proceed if buttons exist
            if (!playPauseBtn || !resetBtn) {
                console.warn("Animation buttons not found for container " + numberLottieContainer);
                return;
            }

            // Control functions
            const togglePlayPause = () => {
                const state = window.lottieStates[numberLottieContainer];
                const animation = window["lottieAnimation" + numberLottieContainer];
                if (!animation || !state || !playPauseBtn) return;

                if (state.isStarting) animation.stop();

                if (state.isPlaying) {
                    animation.pause();
                    playPauseBtn.querySelector("path").setAttribute("d", "M8 5v14l11-7z");
                    state.isPlaying = false;
                } else {
                    animation.play();
                    playPauseBtn
                        .querySelector("path")
                        .setAttribute("d", "M6 19h4V5H6v14zm8-14v14h4V5h-4z");
                    state.isPlaying = true;
                }
                state.isStarting = false;
            };

            const resetAnimation = () => {
                const state = window.lottieStates[numberLottieContainer];
                const animation = window["lottieAnimation" + numberLottieContainer];
                if (!animation || !state || !playPauseBtn) return;

                animation.stop();
                animation.goToAndStop(0);
                playPauseBtn.querySelector("path").setAttribute("d", "M8 5v14l11-7z");
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
            window.lottieEventListeners[numberLottieContainer] = {
                playPause: playHandler,
                reset: resetHandler,
            };

            playPauseBtn.addEventListener("click", playHandler);
            resetBtn.addEventListener("click", resetHandler);

            // Animation events
            window["lottieAnimation" + numberLottieContainer].addEventListener("complete", () => {
                const state = window.lottieStates[numberLottieContainer];
                if (state && playPauseBtn) {
                    playPauseBtn.querySelector("path").setAttribute("d", "M8 5v14l11-7z");
                    state.isPlaying = false;
                    state.isStarting = true;
                }
            });
        }
    }, 50);
}

function centerAllSVGViewers() {
    //Center SVG inside SVG-viewer
    document.querySelectorAll(".SVG-viewer").forEach((viewer) => {
        const viewerId = viewer.id;
        const containerNumber = viewerId.replace("SVGiewer", "");
        const zoomContainer = window[`zoomContainer${containerNumber}`];

        if (zoomContainer) {
            const rectElement = viewer.querySelector("svg>g>rect");

            if (rectElement) {
                zoomContainer.zoom(1);
                zoomContainer.pan({
                    x:
                        (viewer.offsetWidth -
                            zoomContainer.getSizes().viewBox.width * zoomContainer.getSizes().realZoom) /
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
    });
}

function setupCustomScrollLinks() {
    /* Make it scroll slowly with special functionalities */
    document.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", function (e) {
            const href = this.getAttribute("href") || this.getAttribute("xlink:href");

            // Only process if it's an internal link (starts with #)
            if (href && href.startsWith("#")) {
                e.preventDefault(); // prevents instant jump

                let target = null;
                const entryContent = document.querySelector(".entry-content");
                let targetId = href.substring(1); // substring removes the "#"

                targetId = decodeURIComponent(targetId);

                // Check if it's a special link with parameters
                if (targetId.includes("=")) {
                    // Use indexOf to properly handle values with spaces or special characters
                    const equalIndex = targetId.indexOf("=");
                    const type = targetId.substring(0, equalIndex);
                    const value = targetId.substring(equalIndex + 1);

                    if (type.match(/^h[1-6]$/)) {
                        // Search by position or by text in the specified h type
                        const headingLevel = parseInt(type.substring(1));

                        if (headingLevel >= 1 && headingLevel <= 6) {
                            const headings = entryContent
                                ? entryContent.querySelectorAll(`h${headingLevel}`)
                                : document.querySelectorAll(`h${headingLevel}`);

                            if (!isNaN(value)) {
                                // Search by position (e.g. #h2=3 searches for the third h2)
                                const elementIndex = parseInt(value) - 1; // Convert to 0-based index
                                if (elementIndex >= 0 && headings.length > elementIndex) {
                                    target = headings[elementIndex];
                                }
                            } else {
                                // Search by text (e.g. #h2=Introduction searches for the first h2 containing "Introduction")
                                const searchText = decodeURIComponent(value);
                                target = Array.from(headings).find((heading) =>
                                    heading.textContent.toLowerCase().includes(searchText.toLowerCase())
                                );
                            }
                        }
                    } else if (type === "text") {
                        const searchText = decodeURIComponent(value);
                        const searchArea = entryContent || document;

                        // Find all elements in order
                        const allElements = Array.from(searchArea.querySelectorAll("*"));

                        let firstMatch = null;
                        for (const element of allElements) {
                            if (element.textContent.includes(searchText)) {
                                firstMatch = element;
                                break; // we stop at the first one that contains the text
                            }
                        }

                        target = firstMatch;

                        // If we found something, we look for the deepest one inside it
                        if (firstMatch) {
                            // Recursive function to find the most nested element that contains the text
                            const findDeepestMatch = (el) => {
                                for (const child of el.children) {
                                    if (child.textContent.includes(searchText)) {
                                        // Search deeper in that child
                                        return findDeepestMatch(child);
                                    }
                                }
                                return el;
                            };

                            target = findDeepestMatch(firstMatch);
                        }
                    } else if (type === "query") {
                        // Execute custom querySelector (e.g. #query=document.querySelector("selector"))
                        try {
                            const queryString = decodeURIComponent(value);
                            // Evaluate the query safely
                            target = eval(queryString);
                        } catch (error) {
                            console.warn("Error executing query selector:", error);
                            target = null;
                        }
                    } else if (type === "goto") {
                        const queryString = decodeURIComponent(value);

                        // Helper function to check if element is visible
                        const isElementVisible = (element) => {
                            if (!element) return false;
                            const style = window.getComputedStyle(element);
                            const rect = element.getBoundingClientRect();
                            return (
                                style.display !== "none" &&
                                style.visibility !== "hidden" &&
                                style.opacity !== "0" &&
                                rect.width > 0 &&
                                rect.height > 0
                            );
                        };

                        // Helper function to find visible parent
                        const findVisibleParent = (element) => {
                            let parent = element.parentElement;
                            while (parent) {
                                if (isElementVisible(parent)) {
                                    return parent;
                                }
                                parent = parent.parentElement;
                            }

                            // If no visible parent found, check if parent node contains text nodes
                            // and wrap them if needed (for cases where element is inside text)
                            let parentNode = element.parentNode;
                            if (parentNode && parentNode.nodeType === Node.ELEMENT_NODE) {
                                // Check child nodes for text content
                                for (let node of parentNode.childNodes) {
                                    if (
                                        node !== element &&
                                        node.nodeType === Node.TEXT_NODE &&
                                        node.textContent.trim()
                                    ) {
                                        // Found text node sibling, wrap parent's content
                                        const wrapper = document.createElement("div");
                                        wrapper.style.display = "inline-block";

                                        // Move all child nodes to wrapper
                                        while (parentNode.firstChild) {
                                            wrapper.appendChild(parentNode.firstChild);
                                        }

                                        parentNode.appendChild(wrapper);
                                        return wrapper;
                                    }
                                }
                            }

                            return null;
                        };

                        // Helper function to find visible previous sibling
                        const findVisiblePreviousSibling = (element) => {
                            // Start directly with previousSibling to catch both elements and text nodes
                            let prevNode = element.previousSibling;
                            while (prevNode) {
                                // Check if it's a text node with actual content (not just whitespace)
                                if (
                                    prevNode.nodeType === Node.TEXT_NODE &&
                                    prevNode.textContent.trim()
                                ) {
                                    // Wrap the text node in a span element
                                    const wrapper = document.createElement("span");
                                    wrapper.textContent = prevNode.textContent;
                                    prevNode.parentNode.replaceChild(wrapper, prevNode);
                                    return wrapper;
                                }
                                // If it's an element, check if it's visible
                                if (
                                    prevNode.nodeType === Node.ELEMENT_NODE &&
                                    isElementVisible(prevNode)
                                ) {
                                    return prevNode;
                                }
                                prevNode = prevNode.previousSibling;
                            }

                            return null;
                        };

                        // Helper function to find visible next sibling
                        const findVisibleNextSibling = (element) => {
                            // Start directly with nextSibling to catch both elements and text nodes
                            let nextNode = element.nextSibling;

                            while (nextNode) {
                                // Check if it's a text node with actual content (not just whitespace)
                                if (
                                    nextNode.nodeType === Node.TEXT_NODE &&
                                    nextNode.textContent.trim()
                                ) {
                                    // Wrap the text node in a span element
                                    const wrapper = document.createElement("span");
                                    wrapper.textContent = nextNode.textContent;
                                    nextNode.parentNode.replaceChild(wrapper, nextNode);
                                    return wrapper;
                                }
                                // If it's an element, check if it's visible
                                if (
                                    nextNode.nodeType === Node.ELEMENT_NODE &&
                                    isElementVisible(nextNode)
                                ) {
                                    return nextNode;
                                }
                                nextNode = nextNode.nextSibling;
                            }

                            return null;
                        };

                        // Helper function to find first visible child (enter element)
                        const findVisibleFirstChild = (element) => {
                            // Start with first child to catch both elements and text nodes
                            let firstNode = element.firstChild;

                            while (firstNode) {
                                // Check if it's a text node with actual content (not just whitespace)
                                if (
                                    firstNode.nodeType === Node.TEXT_NODE &&
                                    firstNode.textContent.trim()
                                ) {
                                    // Wrap the text node in a span element
                                    const wrapper = document.createElement("span");
                                    wrapper.textContent = firstNode.textContent;
                                    firstNode.parentNode.replaceChild(wrapper, firstNode);
                                    return wrapper;
                                }
                                // If it's an element, check if it's visible
                                if (
                                    firstNode.nodeType === Node.ELEMENT_NODE &&
                                    isElementVisible(firstNode)
                                ) {
                                    return firstNode;
                                }
                                firstNode = firstNode.nextSibling;
                            }

                            return null;
                        };

                        // Helper function to find last visible child (enter element at end)
                        const findVisibleLastChild = (element) => {
                            // Start with last child to catch both elements and text nodes
                            let lastNode = element.lastChild;

                            while (lastNode) {
                                // Check if it's a text node with actual content (not just whitespace)
                                if (
                                    lastNode.nodeType === Node.TEXT_NODE &&
                                    lastNode.textContent.trim()
                                ) {
                                    // Wrap the text node in a span element
                                    const wrapper = document.createElement("span");
                                    wrapper.textContent = lastNode.textContent;
                                    lastNode.parentNode.replaceChild(wrapper, lastNode);
                                    return wrapper;
                                }
                                // If it's an element, check if it's visible
                                if (
                                    lastNode.nodeType === Node.ELEMENT_NODE &&
                                    isElementVisible(lastNode)
                                ) {
                                    return lastNode;
                                }
                                lastNode = lastNode.previousSibling;
                            }

                            return null;
                        };

                        // Helper function to apply a single navigation direction
                        const applyDirection = (currentElement, direction) => {
                            switch (direction) {
                                case "out":
                                    return findVisibleParent(currentElement);
                                case "above":
                                    return findVisiblePreviousSibling(currentElement);
                                case "below":
                                    return findVisibleNextSibling(currentElement);
                                case "in":
                                    return findVisibleFirstChild(currentElement);
                                case "inl":
                                    return findVisibleLastChild(currentElement);
                                default:
                                    console.warn("Unknown direction:", direction);
                                    return null;
                            }
                        };

                        // Search for all go-navigate elements (new unified class)
                        const goNavigateElements = document.querySelectorAll(".go-navigate");
                        for (const element of goNavigateElements) {
                            if (element.getAttribute("data-name") === queryString) {
                                const directionsStr = element.getAttribute("data-directions");
                                const directions = directionsStr.split("-"); // Split "out-out-below" into ["out", "out", "below"]

                                // Apply each direction in sequence
                                let currentTarget = element;
                                for (const direction of directions) {
                                    currentTarget = applyDirection(currentTarget, direction);
                                    if (!currentTarget) {
                                        console.warn("Navigation failed at direction:", direction);
                                        break;
                                    }
                                }

                                if (currentTarget) {
                                    target = currentTarget;
                                    break;
                                }
                            }
                        }

                        if (!target) {
                            console.warn("No visible target found for goto:", queryString);
                        }
                    }
                } else {
                    // Normal search by ID
                    target = document.getElementById(targetId);
                }

                if (target) {
                    // Detect which element handles the scroll
                    const entryContent = document.getElementsByClassName("entry-content")[0];
                    let container = null;
                    let isBodyScroll = false;

                    // Check if entry-content exists and has scrolling
                    if (entryContent) {
                        const hasScroll = entryContent.scrollHeight > entryContent.clientHeight;
                        const hasOverflow =
                            window.getComputedStyle(entryContent).overflowY !== "visible";

                        if (hasScroll && hasOverflow) {
                            container = entryContent;
                        }
                    }

                    // If no scrollable container found, use body/document
                    if (!container) {
                        container = document.scrollingElement || document.documentElement;
                        isBodyScroll = true;
                    }

                    // Calculate scroll position
                    if (container) {
                        const targetRect = target.getBoundingClientRect();

                        let scrollTop;
                        if (isBodyScroll) {
                            // For body scroll: calculate from top of page
                            const targetTop = targetRect.top + window.scrollY;
                            const viewportHeight = window.innerHeight;
                            scrollTop = targetTop - viewportHeight / 2 + targetRect.height / 2;
                        } else {
                            // For container scroll: calculate relative to container
                            const containerRect = container.getBoundingClientRect();
                            const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
                            scrollTop = relativeTop - container.clientHeight / 2 + targetRect.height / 2;
                        }

                        // Perform scroll
                        container.scrollTo({
                            top: Math.max(0, scrollTop),
                            behavior: "smooth",
                        });
                    }

                    // Wait for scroll to finish and element to be visible
                    const applyHighlight = () => {
                        if (window.highlightTargetTimeoutOut)
                            clearTimeout(window.highlightTargetTimeoutOut);

                        // Clear previous animations from all elements
                        document.querySelectorAll('[style*="animation"]').forEach((el) => {
                            if (el.style.animation.includes("targetZoom")) {
                                el.style.animation = "";
                            }
                        });

                        // Force reflow to ensure animation restarts
                        void target.offsetWidth;

                        // Add highlighting animation
                        target.style.animation = "targetZoom 1.5s ease-out";

                        // Remove animation after completion
                        window.highlightTargetTimeoutOut = setTimeout(() => {
                            target.style.animation = "";
                        }, 1500);
                    };

                    // Detect when scroll ends
                    let observer;
                    let observerTimeout;

                    const onScrollEnd = (event) => {
                        if (observerTimeout) clearTimeout(observerTimeout);
                        observer?.disconnect();

                        // Check if element is visible in viewport
                        const targetRect = target.getBoundingClientRect();
                        let containerRect;

                        if (isBodyScroll) {
                            containerRect = { top: 0, bottom: window.innerHeight };
                        } else {
                            containerRect = container.getBoundingClientRect();
                        }

                        const isVisible =
                            targetRect.top < containerRect.bottom &&
                            targetRect.bottom > containerRect.top;

                        if (isVisible) {
                            // Element is visible, apply highlight
                            if (event) {
                                if (isBodyScroll) {
                                    window.removeEventListener(event, onScrollEnd);
                                } else {
                                    container.removeEventListener(event, onScrollEnd);
                                }
                            }
                            applyHighlight();
                        } else {
                            // Element is not visible yet, use IntersectionObserver
                            if (event) {
                                if (isBodyScroll) {
                                    window.removeEventListener(event, onScrollEnd);
                                } else {
                                    container.removeEventListener(event, onScrollEnd);
                                }
                            }

                            observer = new IntersectionObserver(
                                (entries) => {
                                    entries.forEach((entry) => {
                                        if (entry.isIntersecting) {
                                            observer.disconnect();
                                            applyHighlight();
                                        }
                                    });
                                },
                                {
                                    root: isBodyScroll ? null : container,
                                    threshold: 0.1,
                                }
                            );

                            observer.observe(target);

                            // Cleanup observer after 5 seconds if element never becomes visible
                            observerTimeout = setTimeout(() => {
                                observer?.disconnect();
                            }, 5000);
                        }
                    };

                    if (container) {
                        const scrollTarget = isBodyScroll ? window : container;
                        if ("onscrollend" in document.documentElement) {
                            scrollTarget.addEventListener("scrollend", onScrollEnd("scrollend"));
                        } else {
                            scrollTarget.addEventListener("scroll", onScrollEnd("scroll"));
                        }
                        // Trigger once immediately in case scroll doesn't happen
                        onScrollEnd();
                    }
                }
            }
        });
    });
}

function setupDetailsAnimation() {
    // Remover listener anterior del documento si existe
    if (window.detailsClickHandler) {
        document.removeEventListener("click", window.detailsClickHandler);
    }

    // Crear el handler
    window.detailsClickHandler = function (e) {
        const details = e.target.closest("details");
        if (!details) return;

        const summary = e.target.closest("summary");
        if (!summary) return;

        const contentWrapper = details.querySelector(".content-wrapper-details");
        if (!contentWrapper) return;

        e.preventDefault();

        if (details.open) {
            // Close with animation
            contentWrapper.classList.add("animating");
            contentWrapper.classList.remove("opening");

            setTimeout(() => {
                details.open = false;
                contentWrapper.classList.remove("animating");
            }, 400);
        } else {
            // Open with animation
            details.open = true;
            contentWrapper.classList.add("animating");

            // Forzar reflow
            contentWrapper.offsetHeight;

            contentWrapper.classList.add("opening");

            setTimeout(() => {
                contentWrapper.classList.remove("animating");
            }, 400);
        }
    };

    // Agregar un solo listener al documento
    document.addEventListener("click", window.detailsClickHandler);

    // Inicializar estado de contenido ya abierto
    document.querySelectorAll("details[open]").forEach((details) => {
        const contentWrapper = details.querySelector(".content-wrapper-details");
        contentWrapper.classList.add("opening");
    });
}

function setupFloatingElements() {
    // Clean previous event listeners if they exist
    if (window.floatEventListeners) {
        if (window.floatEventListeners.triggerClick) {
            window.floatEventListeners.triggerClick.forEach((item) => {
                item.element.removeEventListener("click", item.handler);
            });
        }
        if (window.floatEventListeners.documentClick) {
            document.removeEventListener("click", window.floatEventListeners.documentClick);
        }
        if (window.floatEventListeners.documentKeydown) {
            document.removeEventListener("keydown", window.floatEventListeners.documentKeydown);
        }
    }

    // Inicializar el objeto para almacenar los event listeners
    window.floatEventListeners = {
        triggerClick: [],
        documentClick: null,
        documentKeydown: null,
        activeFloats: new Set(),
    };

    // Manejar los elementos flotantes
    document.querySelectorAll(".float-trigger").forEach((trigger) => {
        const clickHandler = function () {
            const floatId = this.getAttribute("data-float-id");
            const floatContainer = document.getElementById("float-" + floatId);

            if (!floatContainer) return;

            // If the container is already visible, we close it
            if (floatContainer.classList.contains("visible")) {
                floatContainer.classList.remove("visible");
                window.floatEventListeners.activeFloats.delete(floatId);
                return;
            }

            // Close all floating containers that are open
            document.querySelectorAll(".float-container.visible").forEach((container) => {
                container.classList.remove("visible");
                const openFloatId = container.id.replace("float-", "");
                window.floatEventListeners.activeFloats.delete(openFloatId);
            });

            // Mostrar el contenedor
            floatContainer.classList.add("visible");
            void floatContainer.offsetWidth; // reflow force before measuring
            window.floatEventListeners.activeFloats.add(floatId);

            const triggerRect = this.getBoundingClientRect();
            const parentRect = floatContainer.offsetParent.getBoundingClientRect();

            // Find the scrollable container (entry-content or closest scrollable parent)
            let scrollContainer = this.closest(".entry-content");
            if (!scrollContainer) {
                scrollContainer = this.closest('[style*="overflow"]') || document.documentElement;
            }

            // Get scroll offsets
            const scrollLeft = scrollContainer.scrollLeft || 0;
            const scrollTop = scrollContainer.scrollTop || 0;

            let left = triggerRect.left - parentRect.left + scrollLeft;
            let top = triggerRect.bottom - parentRect.top + scrollTop + 10;

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

            // Ajustar vertical - considerar tanto el viewport del contenedor con scroll como el viewport de la ventana
            const scrollContainerRect = scrollContainer.getBoundingClientRect();
            const triggerBottomRelativeToScroll = triggerRect.bottom - scrollContainerRect.top;
            const availableSpaceInContainer =
                scrollContainer.clientHeight - triggerBottomRelativeToScroll;

            // También verificar si se sale del viewport de la ventana
            const availableSpaceInWindow = window.innerHeight - triggerRect.bottom;

            // Si el contenedor tiene scroll, usar su espacio disponible, sino usar el de la ventana
            const hasContainerScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
            const shouldCheckContainer =
                hasContainerScroll && scrollContainer !== document.documentElement;

            let shouldPlaceAbove = false;
            if (shouldCheckContainer) {
                // El contenedor tiene scroll, verificar espacio en el contenedor
                shouldPlaceAbove = availableSpaceInContainer < floatHeight + 50;
            } else {
                // El contenedor no tiene scroll, verificar espacio en la ventana
                shouldPlaceAbove = availableSpaceInWindow < floatHeight + 50;
            }

            if (shouldPlaceAbove) {
                // si no cabe debajo, colócalo arriba del trigger
                top = triggerRect.top - parentRect.top + scrollTop - floatHeight - 10;
            }

            // Asegurar que no se salga por arriba
            const minTop = shouldCheckContainer ? scrollTop + 10 : 10;
            if (top < minTop) {
                top = minTop;
            }

            // Asegurar que no se salga por abajo del viewport de la ventana
            if (!shouldCheckContainer) {
                const maxTop = window.innerHeight - floatHeight - 20;
                const currentTopInViewport = top - scrollTop + parentRect.top;
                if (currentTopInViewport > maxTop) {
                    top = maxTop + scrollTop - parentRect.top;
                }
            }

            floatContainer.style.left = left + "px";
            floatContainer.style.top = top + "px";
        };

        trigger.addEventListener("click", clickHandler);
        window.floatEventListeners.triggerClick.push({
            element: trigger,
            handler: clickHandler,
        });
    });

    // Cerrar los elementos flotantes al hacer clic fuera
    const documentClickHandler = function (e) {
        if (e.target.classList.contains("float-close")) {
            const container = e.target.closest(".float-container");
            if (container) {
                container.classList.remove("visible");
                const floatId = container.id.replace("float-", "");
                window.floatEventListeners.activeFloats.delete(floatId);
            }
        } else if (!e.target.closest(".float-container") && !e.target.closest(".float-trigger")) {
            document.querySelectorAll(".float-container.visible").forEach((container) => {
                container.classList.remove("visible");
                const floatId = container.id.replace("float-", "");
                window.floatEventListeners.activeFloats.delete(floatId);
            });
        }
    };

    document.addEventListener("click", documentClickHandler);
    window.floatEventListeners.documentClick = documentClickHandler;

    // Cerrar con ESC
    const documentKeydownHandler = function (e) {
        if (e.key === "Escape") {
            document.querySelectorAll(".float-container.visible").forEach((container) => {
                container.classList.remove("visible");
                const floatId = container.id.replace("float-", "");
                window.floatEventListeners.activeFloats.delete(floatId);
            });
        }
    };

    document.addEventListener("keydown", documentKeydownHandler);
    window.floatEventListeners.documentKeydown = documentKeydownHandler;

    // Global method to close all floating elements
    window.closeAllFloats = function () {
        document.querySelectorAll(".float-container.visible").forEach((container) => {
            container.classList.remove("visible");
        });
        window.floatEventListeners.activeFloats.clear();
    };
}

export function executeEntryContentScripts() {
    // Select the first element with class "entry-content"
    const entryContent = document.querySelector(".entry-content");

    if (entryContent) {
        // Select all <script> elements within that element
        const scripts = entryContent.querySelectorAll("script");

        scripts.forEach((oldScript) => {
            try {
                if (oldScript.id === "sidebar-data") {
                    // This script is handled separately, skip it
                    return;
                }

                // Create a new script element to execute
                const newScript = document.createElement("script");

                // Copy attributes (e.g., src, type, etc.)
                Array.from(oldScript.attributes).forEach((attr) => {
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
}
