"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMarkdownEngineConfig = {
    usePandocParser: false,
    breakOnSingleNewLine: true,
    enableTypographer: false,
    enableWikiLinkSyntax: true,
    enableEmojiSyntax: true,
    enableExtendedTableSyntax: false,
    enableCriticMarkupSyntax: false,
    wikiLinkFileExtension: '.md',
    protocolsWhiteList: 'http, https, atom, file',
    mathRenderingOption: 'KaTeX',
    mathInlineDelimiters: [["$", "$"], ["\\(", "\\)"]],
    mathBlockDelimiters: [["$$", "$$"], ["\\[", "\\]"]],
    codeBlockTheme: 'auto.css',
    previewTheme: 'github-light.css',
    revealjsTheme: 'white.css',
    mermaidTheme: 'mermaid.css',
    frontMatterRenderingOption: 'table',
    imageFolderPath: '/assets',
    printBackground: false,
    phantomPath: 'phantomjs',
    pandocPath: 'pandoc',
    pandocMarkdownFlavor: 'markdown-raw_tex+tex_math_single_backslash',
    pandocArguments: [],
    latexEngine: 'pdflatex',
    enableScriptExecution: true
};
//# sourceMappingURL=markdown-engine-config.js.map