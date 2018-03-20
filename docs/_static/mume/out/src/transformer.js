"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// import * as Baby from "babyparse"
const Baby = require("babyparse");
const fs = require("fs");
const less = require("less");
const path = require("path");
const request = require("request");
const temp = require("temp");
const uslug = require("uslug");
const attributes_1 = require("./lib/attributes");
const compute_checksum_1 = require("./lib/compute-checksum");
const utility = require("./utility");
const extensionDirectoryPath = utility.extensionDirectoryPath;
// import * as request from 'request'
// import * as less from "less"
// import * as temp from "temp"
// temp.track()
const custom_subjects_1 = require("./custom-subjects");
const PDF = require("./pdf");
const fileExtensionToLanguageMap = {
    'vhd': 'vhdl',
    'erl': 'erlang',
    'dot': 'dot',
    'gv': 'dot',
    'viz': 'dot',
};
const selfClosingTag = {
    area: 1,
    base: 1,
    br: 1,
    col: 1,
    command: 1,
    embed: 1,
    hr: 1,
    img: 1,
    input: 1,
    keygen: 1,
    link: 1,
    meta: 1,
    param: 1,
    source: 1,
    track: 1,
    wbr: 1
};
/**
 * Convert 2D array to markdown table.
 * The first row is headings.
 */
function _2DArrayToMarkdownTable(_2DArr) {
    let output = "  \n";
    _2DArr.forEach((arr, offset) => {
        let i = 0;
        output += '|';
        while (i < arr.length) {
            output += (arr[i] + '|');
            i += 1;
        }
        output += '  \n';
        if (offset === 0) {
            output += '|';
            i = 0;
            while (i < arr.length) {
                output += ('---|');
                i += 1;
            }
            output += '  \n';
        }
    });
    output += '  ';
    return output;
}
function createAnchor(lineNo) {
    return `\n\n<p data-line="${lineNo}" class="sync-line" style="margin:0;"></p>\n\n`;
}
let DOWNLOADS_TEMP_FOLDER = null;
/**
 * download file and return its local path
 */
function downloadFileIfNecessary(filePath) {
    return new Promise((resolve, reject) => {
        if (!filePath.match(/^https?\:\/\//))
            return resolve(filePath);
        if (!DOWNLOADS_TEMP_FOLDER)
            DOWNLOADS_TEMP_FOLDER = temp.mkdirSync('mume_downloads');
        request.get({ url: filePath, encoding: 'binary' }, (error, response, body) => {
            if (error)
                return reject(error);
            else {
                const localFilePath = path.resolve(DOWNLOADS_TEMP_FOLDER, compute_checksum_1.default(filePath)) + path.extname(filePath);
                fs.writeFile(localFilePath, body, 'binary', (error) => {
                    if (error)
                        return reject(error);
                    else
                        return resolve(localFilePath);
                });
            }
        });
    });
}
/**
 *
 * Load file by `filePath`
 * @param filePath
 * @param param1
 * @param filesCache
 */
function loadFile(filePath, { fileDirectoryPath, forPreview, imageDirectoryPath }, filesCache = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (filesCache[filePath])
            return filesCache[filePath];
        if (filePath.endsWith('.less')) {
            const data = yield utility.readFile(filePath, { encoding: 'utf-8' });
            return yield new Promise((resolve, reject) => {
                less.render(data, { paths: [path.dirname(filePath)] }, (error, output) => {
                    if (error)
                        return reject(error);
                    return resolve(output.css || '');
                });
            });
        }
        else if (filePath.endsWith('.pdf')) {
            const localFilePath = yield downloadFileIfNecessary(filePath);
            const svgMarkdown = yield PDF.toSVGMarkdown(localFilePath, { markdownDirectoryPath: fileDirectoryPath, svgDirectoryPath: imageDirectoryPath });
            return svgMarkdown;
        }
        else if (filePath.match(/^https?\:\/\//)) {
            // github
            if (filePath.startsWith('https://github.com/'))
                filePath = filePath.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
            return yield new Promise((resolve, reject) => {
                request(filePath, (error, response, body) => {
                    if (error)
                        reject(error);
                    else
                        resolve(body.toString());
                });
            });
        }
        else {
            return yield utility.readFile(filePath, { encoding: 'utf-8' });
        }
    });
}
/**
 *
 * @param inputString
 * @param fileDirectoryPath
 * @param projectDirectoryPath
 * @param param3
 */
function transformMarkdown(inputString, { fileDirectoryPath = '', projectDirectoryPath = '', filesCache = {}, useRelativeFilePath = null, forPreview = false, forMarkdownExport = false, protocolsWhiteListRegExp = null, notSourceFile = false, imageDirectoryPath = '', usePandocParser = false, tocTable = {} }) {
    return __awaiter(this, void 0, void 0, function* () {
        let inBlock = false; // inside code block
        let codeChunkOffset = 0;
        const tocConfigs = [], slideConfigs = [], JSAndCssFiles = [];
        let headings = [], tocBracketEnabled = false, frontMatterString = '';
        /**
         * As the recursive version of this function will cause the error:
         *   RangeError: Maximum call stack size exceeded
         * I wrote it in iterative way.
         * @param i start offset
         * @param lineNo start line number
         */
        function helper(i, lineNo = 0) {
            return __awaiter(this, void 0, void 0, function* () {
                let outputString = "";
                while (i < inputString.length) {
                    if (inputString[i] == '\n') {
                        // return helper(i+1, lineNo+1, outputString+'\n')
                        i = i + 1;
                        lineNo = lineNo + 1;
                        outputString = outputString + '\n';
                        continue;
                    }
                    let end = inputString.indexOf('\n', i);
                    if (end < 0)
                        end = inputString.length;
                    let line = inputString.substring(i, end);
                    if (line.match(/^```/)) {
                        if (!inBlock && forPreview)
                            outputString += createAnchor(lineNo);
                        let match;
                        if (!inBlock && !notSourceFile && (match = line.match(/\"?cmd\"?\s*[:=]/))) {
                            line = line.replace('{', `{code_chunk_offset=${codeChunkOffset}, `);
                            codeChunkOffset++;
                        }
                        inBlock = !inBlock;
                        // return helper(end+1, lineNo+1, outputString+line+'\n')
                        i = end + 1;
                        lineNo = lineNo + 1;
                        outputString = outputString + line + '\n';
                        continue;
                    }
                    if (inBlock) {
                        // return helper(end+1, lineNo+1, outputString+line+'\n')
                        i = end + 1;
                        lineNo = lineNo + 1;
                        outputString = outputString + line + '\n';
                        continue;
                    }
                    let subjectMatch, headingMatch, taskListItemMatch, htmlTagMatch;
                    /*
                    // I changed this because for case like:
            
                    * haha
                    ![](image.png)
            
                    The image will not be displayed correctly in preview as there will be `anchor` inserted
                    between...
                    */
                    if (line.match(/^(\!\[|@import)/) && inputString[i - 1] === '\n' && inputString[i - 2] === '\n') {
                        if (forPreview)
                            outputString += createAnchor(lineNo); // insert anchor for scroll sync
                    }
                    else if (headingMatch = line.match(/^(\#{1,7})(.+)/)) {
                        if (forPreview)
                            outputString += createAnchor(lineNo);
                        let heading, level, tag;
                        //if (headingMatch) {
                        heading = headingMatch[2].trim();
                        tag = headingMatch[1];
                        level = tag.length;
                        /*} else {
                          if (inputString[end + 1] === '=') {
                            heading = line.trim()
                            tag = '#'
                            level = 1
                          } else {
                            heading = line.trim()
                            tag = '##'
                            level = 2
                          }
                          
                          end = inputString.indexOf('\n', end + 1)
                          if (end < 0) end = inputString.length
                        }*/
                        if (!heading.length) {
                            // return helper(end+1, lineNo+1, outputString + '\n')
                            i = end + 1;
                            lineNo = lineNo + 1;
                            outputString = outputString + '\n';
                            continue;
                        }
                        // check {class:string, id:string, ignore:boolean}
                        let optMatch = null, classes = '', id = '', ignore = false;
                        if (optMatch = heading.match(/[^\\]\{(.+?)\}(\s*)$/)) {
                            heading = heading.replace(optMatch[0], '');
                            try {
                                let opt = attributes_1.parseAttributes(optMatch[0]);
                                classes = opt['class'],
                                    id = opt['id'],
                                    ignore = opt['ignore'];
                            }
                            catch (e) {
                                heading = "OptionsError: " + optMatch[1];
                                ignore = true;
                            }
                        }
                        if (!id) {
                            id = uslug(heading);
                            if (usePandocParser) {
                                id = id.replace(/^[\d\-]+/, '');
                                if (!id) {
                                    id = 'section';
                                }
                            }
                        }
                        if (tocTable[id] >= 0) {
                            tocTable[id] += 1;
                            id = id + '-' + tocTable[id];
                        }
                        else {
                            tocTable[id] = 0;
                        }
                        if (!ignore) {
                            headings.push({ content: heading, level: level, id: id });
                        }
                        if (usePandocParser) {
                            let optionsStr = '{';
                            if (id)
                                optionsStr += `#${id} `;
                            if (classes)
                                optionsStr += '.' + classes.replace(/\s+/g, ' .') + ' ';
                            optionsStr += '}';
                            // return helper(end+1, lineNo+1, outputString + `${tag} ${heading} ${optionsStr}` + '\n')
                            i = end + 1;
                            lineNo = lineNo + 1;
                            outputString = outputString + `${tag} ${heading} ${optionsStr}` + '\n';
                            continue;
                        }
                        else {
                            if (!forMarkdownExport) {
                                line = `${tag} ${heading}\n<p class="mume-header ${classes}" id="${id}"></p>`;
                            }
                            else {
                                line = `${tag} ${heading}`;
                            }
                            // return helper(end+1, lineNo+1, outputString + line + '\n\n') 
                            i = end + 1;
                            lineNo = lineNo + 1;
                            outputString = outputString + line + '\n\n';
                            continue;
                            // I added one extra `\n` here because remarkable renders content below 
                            // heading differently with `\n` and without `\n`.  
                        }
                    }
                    else if (line.match(/^\<!--/)) {
                        if (forPreview)
                            outputString += createAnchor(lineNo);
                        let commentEnd = inputString.indexOf('-->', i + 4);
                        if (commentEnd < 0) {
                            // return helper(inputString.length, lineNo+1, outputString+'\n')
                            i = inputString.length;
                            lineNo = lineNo + 1;
                            outputString = outputString + '\n';
                            continue;
                        }
                        else
                            commentEnd += 3;
                        let subjectMatch = line.match(/^\<!--\s+([^\s]+)/);
                        if (!subjectMatch) {
                            const content = inputString.slice(i + 4, commentEnd - 3).trim();
                            const newlinesMatch = content.match(/\n/g);
                            const newlines = (newlinesMatch ? newlinesMatch.length : 0);
                            // return helper(commentEnd, lineNo + newlines, outputString + '\n')
                            i = commentEnd;
                            lineNo = lineNo + newlines;
                            outputString = outputString + '\n';
                            continue;
                        }
                        else {
                            let subject = subjectMatch[1];
                            if (subject === '@import') {
                                const commentEnd = line.lastIndexOf('-->');
                                if (commentEnd > 0)
                                    line = line.slice(4, commentEnd).trim();
                            }
                            else if (subject in custom_subjects_1.CustomSubjects) {
                                const content = inputString.slice(i + 4, commentEnd - 3).trim();
                                const newlinesMatch = content.match(/\n/g);
                                const newlines = (newlinesMatch ? newlinesMatch.length : 0);
                                const optionsMatch = content.match(/^([^\s]+?)\s([\s\S]+)$/);
                                let options = {};
                                if (optionsMatch && optionsMatch[2]) {
                                    options = attributes_1.parseAttributes(optionsMatch[2]);
                                }
                                options['lineNo'] = lineNo;
                                if (subject === 'pagebreak' || subject === 'newpage') {
                                    // return helper(commentEnd, lineNo + newlines, outputString + '<div class="pagebreak"> </div>\n')
                                    i = commentEnd;
                                    lineNo = lineNo + newlines;
                                    outputString = outputString + '<div class="pagebreak"> </div>\n';
                                    continue;
                                }
                                else if (subject.match(/^\.?slide\:?$/)) {
                                    slideConfigs.push(options);
                                    if (forMarkdownExport) {
                                        // return helper(commentEnd, lineNo + newlines, outputString + `<!-- ${content} -->` + '\n')
                                        i = commentEnd;
                                        lineNo = lineNo + newlines;
                                        outputString = outputString + `<!-- ${content} -->` + '\n';
                                        continue;
                                    }
                                    else {
                                        // return helper(commentEnd, lineNo + newlines, outputString + '\n[MUMESLIDE]\n\n')
                                        i = commentEnd;
                                        lineNo = lineNo + newlines;
                                        outputString = outputString + '\n[MUMESLIDE]\n\n';
                                        continue;
                                    }
                                }
                            }
                            else {
                                const content = inputString.slice(i + 4, commentEnd - 3).trim();
                                const newlinesMatch = content.match(/\n/g);
                                const newlines = (newlinesMatch ? newlinesMatch.length : 0);
                                // return helper(commentEnd, lineNo + newlines, outputString + '\n')
                                i = commentEnd;
                                lineNo = lineNo + newlines;
                                outputString = outputString + '\n';
                                continue;
                            }
                        }
                    }
                    else if (line.match(/^\s*\[toc\]\s*$/i)) {
                        if (forPreview)
                            outputString += createAnchor(lineNo); // insert anchor for scroll sync
                        tocBracketEnabled = true;
                        // return helper(end+1, lineNo+1, outputString + `\n[MUMETOC]\n\n`)
                        i = end + 1;
                        lineNo = lineNo + 1;
                        outputString = outputString + `\n[MUMETOC]\n\n`;
                        continue;
                    }
                    else if (taskListItemMatch = line.match(/^\s*(?:[*\-+]|\d+\.)\s+(\[[xX\s]\])\s/)) {
                        const checked = taskListItemMatch[1] !== '[ ]';
                        if (!forMarkdownExport) {
                            line = line.replace(taskListItemMatch[1], `<input type="checkbox" class="task-list-item-checkbox${forPreview ? ' sync-line' : ''}" ${forPreview ? `data-line="${lineNo}"` : ''}${checked ? ' checked' : ''}>`);
                        }
                        // return helper(end+1, lineNo+1, outputString+line+`\n`)
                        i = end + 1;
                        lineNo = lineNo + 1;
                        outputString = outputString + line + `\n`;
                        continue;
                    }
                    else if (htmlTagMatch = line.match(/^\s*<(?:([a-zA-Z]+)|([a-zA-Z]+)\s+(?:.+?))>/)) {
                        const tagName = htmlTagMatch[1] || htmlTagMatch[2];
                        if (!(tagName in selfClosingTag)) {
                            const closeTagName = `</${tagName}>`;
                            let end = inputString.indexOf(closeTagName, i + htmlTagMatch[0].length);
                            if (end < 0) {
                                // HTML error. Tag not closed
                                // Do Nothing here. Reason: 
                                //     $$ x
                                //     <y>
                                //     $$
                                /*
                                i = inputString.length
                                lineNo = lineNo + 1
                                outputString = outputString + `\n\`\`\`\nHTML error. Tag <${tagName}> not closed. ${closeTagName} is required.\n\`\`\`\n\n`
                                continue
                                */
                            }
                            else {
                                const htmlString = inputString.slice(i, end + closeTagName.length);
                                const newlinesMatch = htmlString.match(/\n/g);
                                const newlines = (newlinesMatch ? newlinesMatch.length : 0);
                                // return helper(commentEnd, lineNo + newlines, outputString + '\n')
                                i = end + closeTagName.length;
                                lineNo = lineNo + newlines;
                                outputString = outputString + htmlString;
                                continue;
                            }
                        }
                    }
                    // file import 
                    let importMatch;
                    if (importMatch = line.match(/^(\s*)\@import(\s+)\"([^\"]+)\";?/)) {
                        outputString += importMatch[1];
                        const filePath = importMatch[3].trim();
                        const leftParen = line.indexOf('{');
                        let config = null;
                        let configStr = '';
                        if (leftParen > 0) {
                            const rightParen = line.lastIndexOf('}');
                            if (rightParen > 0) {
                                configStr = line.substring(leftParen + 1, rightParen);
                                try {
                                    config = attributes_1.parseAttributes(configStr);
                                }
                                catch (error) {
                                    // null
                                }
                            }
                        }
                        const start = lineNo;
                        let absoluteFilePath;
                        if (filePath.match(protocolsWhiteListRegExp))
                            absoluteFilePath = filePath;
                        else if (filePath.startsWith('/'))
                            absoluteFilePath = path.resolve(projectDirectoryPath, '.' + filePath);
                        else
                            absoluteFilePath = path.resolve(fileDirectoryPath, filePath);
                        const extname = path.extname(filePath).toLocaleLowerCase();
                        let output = '';
                        if (['.jpeg', '.jpg', '.gif', '.png', '.apng', '.svg', '.bmp'].indexOf(extname) >= 0) {
                            let imageSrc = filesCache[filePath];
                            if (!imageSrc) {
                                if (filePath.match(protocolsWhiteListRegExp))
                                    imageSrc = filePath;
                                else if (useRelativeFilePath)
                                    imageSrc = path.relative(fileDirectoryPath, absoluteFilePath) + '?' + Math.random();
                                else
                                    imageSrc = '/' + path.relative(projectDirectoryPath, absoluteFilePath) + '?' + Math.random();
                                // enchodeURI(imageSrc) is wrong. It will cause issue on Windows
                                // #414: https://github.com/shd101wyy/markdown-preview-enhanced/issues/414
                                imageSrc = imageSrc.replace(/ /g, '%20').replace(/\\/g, '/');
                                filesCache[filePath] = imageSrc;
                            }
                            if (config) {
                                if (config['width'] || config['height'] || config['class'] || config['id']) {
                                    output = `<img src="${imageSrc}" `;
                                    for (let key in config) {
                                        output += ` ${key}="${config[key]}" `;
                                    }
                                    output += ">";
                                }
                                else {
                                    output = "![";
                                    if (config['alt'])
                                        output += config['alt'];
                                    output += `](${imageSrc}`;
                                    if (config['title'])
                                        output += ` "${config['title']}"`;
                                    output += ")  ";
                                }
                            }
                            else {
                                output = `![](${imageSrc})  `;
                            }
                            // return helper(end+1, lineNo+1, outputString+output+'\n')
                            i = end + 1;
                            lineNo = lineNo + 1;
                            outputString = outputString + output + '\n';
                            continue;
                        }
                        else if (filePath === '[TOC]') {
                            if (!config) {
                                config = {
                                    ["depth_from"]: 1,
                                    ["depth_to"]: 6,
                                    ["ordered_list"]: true
                                };
                            }
                            config['cmd'] = 'toc';
                            config['hide'] = true;
                            config['run_on_save'] = true;
                            config['modify_source'] = true;
                            if (!notSourceFile) {
                                config['code_chunk_offset'] = codeChunkOffset;
                                codeChunkOffset++;
                            }
                            const output = `\`\`\`text ${attributes_1.stringifyAttributes(config)}  \n\`\`\`  `;
                            // return helper(end+1, lineNo+1, outputString+output+'\n')
                            i = end + 1;
                            lineNo = lineNo + 1;
                            outputString = outputString + output + '\n';
                            continue;
                        }
                        else {
                            try {
                                const fileContent = yield loadFile(absoluteFilePath, { fileDirectoryPath, forPreview, imageDirectoryPath }, filesCache);
                                filesCache[absoluteFilePath] = fileContent;
                                if (config && config['code_block']) {
                                    const fileExtension = extname.slice(1, extname.length);
                                    output = `\`\`\`${config['as'] || fileExtensionToLanguageMap[fileExtension] || fileExtension} ${attributes_1.stringifyAttributes(config)}  \n${fileContent}\n\`\`\`  `;
                                }
                                else if (config && config['cmd']) {
                                    if (!config['id']) {
                                        config['id'] = compute_checksum_1.default(absoluteFilePath);
                                    }
                                    if (!notSourceFile) {
                                        config['code_chunk_offset'] = codeChunkOffset;
                                        codeChunkOffset++;
                                    }
                                    const fileExtension = extname.slice(1, extname.length);
                                    output = `\`\`\`${config['as'] || fileExtensionToLanguageMap[fileExtension] || fileExtension} ${attributes_1.stringifyAttributes(config)}  \n${fileContent}\n\`\`\`  `;
                                }
                                else if (['.md', '.markdown', '.mmark'].indexOf(extname) >= 0) {
                                    // this return here is necessary
                                    let { outputString: output, headings: headings2 } = yield transformMarkdown(fileContent, {
                                        fileDirectoryPath: path.dirname(absoluteFilePath),
                                        projectDirectoryPath,
                                        filesCache,
                                        useRelativeFilePath: false,
                                        forPreview: false,
                                        forMarkdownExport,
                                        protocolsWhiteListRegExp,
                                        notSourceFile: true,
                                        imageDirectoryPath,
                                        usePandocParser,
                                        tocTable
                                    });
                                    output = '\n' + output + '  ';
                                    headings = headings.concat(headings2);
                                    // return helper(end+1, lineNo+1, outputString+output+'\n')
                                    i = end + 1;
                                    lineNo = lineNo + 1;
                                    outputString = outputString + output + '\n';
                                    continue;
                                }
                                else if (extname == '.html') {
                                    output = '<div>' + fileContent + '</div>  ';
                                }
                                else if (extname == '.csv') {
                                    const parseResult = Baby.parse(fileContent.trim());
                                    if (parseResult.errors.length)
                                        output = `<pre>${parseResult.errors[0]}</pre>  `;
                                    else {
                                        // format csv to markdown table
                                        output = _2DArrayToMarkdownTable(parseResult.data);
                                    }
                                }
                                else if (extname === '.css' || extname === '.js') {
                                    if (!forPreview) {
                                        let sourcePath;
                                        if (filePath.match(protocolsWhiteListRegExp))
                                            sourcePath = filePath;
                                        else if (useRelativeFilePath)
                                            sourcePath = path.relative(fileDirectoryPath, absoluteFilePath);
                                        else
                                            sourcePath = 'file:///' + absoluteFilePath;
                                        if (extname === '.js') {
                                            output = `<script type="text/javascript" src="${sourcePath}"></script>`;
                                        }
                                        else {
                                            output = `<link rel="stylesheet" href="${sourcePath}">`;
                                        }
                                    }
                                    else {
                                        output = '';
                                    }
                                    JSAndCssFiles.push(filePath);
                                }
                                else if (extname === '.less') {
                                    output = `<style>${fileContent}</style>`;
                                }
                                else if (extname === '.pdf') {
                                    if (config && config['page_no']) {
                                        const pages = fileContent.split('\n');
                                        let pageNo = parseInt(config['page_no']) - 1;
                                        if (pageNo < 0)
                                            pageNo = 0;
                                        output = pages[pageNo] || '';
                                    }
                                    else if (config && (config['page_begin'] || config['page_end'])) {
                                        const pages = fileContent.split('\n');
                                        let pageBegin = parseInt(config['page_begin']) - 1 || 0;
                                        const pageEnd = config['page_end'] || pages.length - 1;
                                        if (pageBegin < 0)
                                            pageBegin = 0;
                                        output = pages.slice(pageBegin, pageEnd).join('\n') || '';
                                    }
                                    else {
                                        output = fileContent;
                                    }
                                }
                                else if (extname === '.dot' || extname === '.gv' || extname === '.viz') {
                                    output = `\`\`\`dot ${attributes_1.stringifyAttributes(config, true)}\n${fileContent}\n\`\`\`  `;
                                }
                                else if (extname === '.mermaid') {
                                    output = `\`\`\`mermaid ${attributes_1.stringifyAttributes(config, true)}\n${fileContent}\n\`\`\`  `;
                                }
                                else if (extname === '.plantuml' || extname === '.puml') {
                                    output = `\`\`\`puml ${attributes_1.stringifyAttributes(config, true)}\n' @mume_file_directory_path:${path.dirname(absoluteFilePath)}\n${fileContent}\n\`\`\`  `;
                                }
                                else {
                                    let as_ = null;
                                    if (config)
                                        as_ = config['as'];
                                    const fileExtension = extname.slice(1, extname.length);
                                    output = `\`\`\`${as_ || fileExtensionToLanguageMap[fileExtension] || fileExtension} ${config ? attributes_1.stringifyAttributes(config) : ''}  \n${fileContent}\n\`\`\`  `;
                                }
                                // return helper(end+1, lineNo+1, outputString+output+'\n')
                                i = end + 1;
                                lineNo = lineNo + 1;
                                outputString = outputString + output + '\n';
                                continue;
                            }
                            catch (error) {
                                output = `<pre>${error.toString()}</pre>  `;
                                // return helper(end+1, lineNo+1, outputString+output+'\n')
                                i = end + 1;
                                lineNo = lineNo + 1;
                                outputString = outputString + output + '\n';
                                continue;
                            }
                        }
                    }
                    else {
                        // return helper(end+1, lineNo+1, outputString+line+'\n')
                        i = end + 1;
                        lineNo = lineNo + 1;
                        outputString = outputString + line + '\n';
                        continue;
                    }
                }
                // done 
                return { outputString, slideConfigs, tocBracketEnabled, JSAndCssFiles, headings, frontMatterString };
            });
        }
        let endFrontMatterOffset = 0;
        if (inputString.startsWith('---') && (endFrontMatterOffset = inputString.indexOf('\n---')) > 0) {
            frontMatterString = inputString.slice(0, endFrontMatterOffset + 4);
            return yield helper(frontMatterString.length, frontMatterString.match(/\n/g).length);
        }
        else {
            return yield helper(0, 0);
        }
    });
}
exports.transformMarkdown = transformMarkdown;
//# sourceMappingURL=transformer.js.map