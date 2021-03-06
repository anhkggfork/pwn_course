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
/**
 * ImageMagick magick command wrapper
 */
const utility_1 = require("./utility");
function svgElementToPNGFile(svgElement, pngFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield utility_1.tempOpen({ prefix: "mume-svg", suffix: '.svg' });
        yield utility_1.write(info.fd, svgElement); // write svgElement to temp .svg file
        try {
            yield utility_1.execFile('magick', [info.path, pngFilePath]);
        }
        catch (error) {
            throw new Error("ImageMagick is required to be installed to convert svg to png.\n" + error.toString());
        }
        return pngFilePath;
    });
}
exports.svgElementToPNGFile = svgElementToPNGFile;
//# sourceMappingURL=magick.js.map