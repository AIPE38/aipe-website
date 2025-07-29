const { DateTime } = require("luxon");
const UglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const fs = require("fs-extra");
const sass = require("sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");
const path = require("path");

function generateImageTypeMap(configs) {
    const imageTypeMap = {};

    for (const [typeName, sizes] of Object.entries(configs)) {
        const baseWidths = sizes.map(item => item.width);

        const sizesAttr = sizes.map(item => {
            if (item.breakpoint === null) {
                return `${item.width}px`;
            } else {
                return `(max-width: ${item.breakpoint}px) ${item.width}px`;
            }
        }).join(', ');

        const mediaBreakpoints = sizes.map(item => item.breakpoint ? `(max-width: ${item.breakpoint}px)` : null);

        // Choix du nom de la propriété sizesAttr selon le type
        const sizeKey = (typeName === 'typeHero') ? 'sizebaseWidthssAttr' : 'sizesAttr';

        imageTypeMap[typeName] = {
            baseWidths,
            [sizeKey]: sizesAttr,
            mediaBreakpoints
        };
    }

    return imageTypeMap;
}

const input = {
    typeHero: [
        { breakpoint: 600, width: 536 },
        { breakpoint: 899, width: 835 },
        { breakpoint: null, width: 416 }
    ],
    typePingPong: [
        { breakpoint: 600, width: 536 },
        { breakpoint: 899, width: 835 },
        { breakpoint: null, width: 401 }
    ]
};
const imageTypeMap = generateImageTypeMap(input);

function imageShortcodeSync(type = "", src = "", alt = "", classe = "") {
    const originalSrc = src;

    // Corrige le chemin
    if (src.startsWith("/")) {
        src = `.${src}`;
    } else if (!src.startsWith("./") && !src.startsWith("http")) {
        src = `./${src}`;
    }

    // Fallback simple si type non reconnu
    const config = imageTypeMap[type];
    if (!type || !config) {
        return `<img src="${originalSrc}" alt="${alt}" class="${classe}" loading="lazy" decoding="async">`;
    }

    const { baseWidths, sizesAttr, mediaBreakpoints } = config;

    // Générer les largeurs à 1x et 2x
    const widthType = baseWidths.flatMap(w => [w, w * 2]);

    // Format selon l'extension
    const ext = src.split(/[#?]/)[0].split(".").pop().trim().toLowerCase();
    const formatType = ext === "png" ? ["webp", "png"] : ["webp", "jpg"];

    const options = {
        widths: widthType,
        formats: formatType,
        urlPath: "/media/generate/",
        outputDir: "_site/media/generate/"
    };

    // Déclenche génération des images (async, non bloquant)
    Image(src, options);

    const metadata = Image.statsSync(src, options);

    // Génère automatiquement les couples 1x / 2x
    const media = mediaBreakpoints.map((media, i) => {
        const w = baseWidths[i];
        return {
            media,
            widths: [w, w * 2]
        };
    });

    // Balises <source>
    const sources = media
        .map(({ media, widths }) => {
            const srcset = widths
                .map((w, i) => {
                    const image = metadata[formatType[0]]?.find(img => img.width === w);
                    return image ? `${image.srcset} ${i + 1}x` : null;
                })
                .filter(Boolean)
                .join(", ");
            if (!srcset) return null;
            return `<source type="image/${formatType[0]}"${media ? ` media="${media}"` : ""} srcset="${srcset}">`;
        })
        .filter(Boolean)
        .join("\n");

    // Fallback image
    const fallbackImages = metadata[formatType[1]] || [];
    const fallbackMain =
        fallbackImages.find(img => img.width === Math.max(...widthType)) ||
        fallbackImages[fallbackImages.length - 1];

    if (!fallbackMain) {
        console.warn(`⚠️ Aucun fallback trouvé pour ${src}`);
        return `<img src="${originalSrc}" alt="${alt}" class="${classe}" loading="lazy" decoding="async">`;
    }

    const fallbackSrcset = fallbackImages
        .map(img => `${img.srcset} ${img.width}w`)
        .join(", ");

    const imgTag = `<img class="${classe}" alt="${alt}" loading="lazy" decoding="async"
    src="${fallbackMain.url}"
    srcset="${fallbackSrcset}"
    sizes="${sizesAttr}"
    width="${fallbackMain.width}" height="${fallbackMain.height}">`;

    return `<picture>
${sources}
${imgTag}
</picture>`;
}

module.exports = function(eleventyConfig) {

    //Shortcode image
    eleventyConfig.addNunjucksShortcode("image", imageShortcodeSync); // Nunjucks macros cannot use asynchronous shortcodes

    // Eleventy Navigation https://www.11ty.dev/docs/plugins/navigation/
    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    // Merge data instead of overriding
    // https://www.11ty.dev/docs/data-deep-merge/
    eleventyConfig.setDataDeepMerge(true);

     // SCSS
    eleventyConfig.on("beforeBuild", () => {

        // Compile Sass
        const result = sass.compile("_sass/style.scss", {
            style: "compressed", // équivalent de outputStyle: "compressed"
        });
        console.log("SCSS compiled");

        // Optimize and write file with PostCSS
        let css = result.css.toString();
        postcss([autoprefixer])
            .process(css, { from: "style.css", to: "style.css" })
            .then((result) => {
                fs.outputFile("_site/style.css", result.css, (err) => {
                if (err) throw err;
                console.log("CSS optimized");
                });
            });
    });

    // Minify HTML output
    eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
        if (outputPath.indexOf(".html") > -1) {
            let minified = htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true
            });
            return minified;
            }
        return content;
    });

    //log
    eleventyConfig.addNunjucksFilter("log", value => {
        console.log(value);
    });

     // trigger a rebuild if sass changes
    eleventyConfig.addWatchTarget("_sass/");

    // Copie le dossier "media/image" dans "_site/media/image"
    eleventyConfig.addPassthroughCopy({"media/image": "media/image"});

    // Copie le dossier "media/favicon" dans "_site/media/favicon"
    eleventyConfig.addPassthroughCopy({"media/favicon": "media/favicon"});

    // Copie le dossier "media/font" dans "_site/media/fonts"
    eleventyConfig.addPassthroughCopy({"media/font": "media/font"});

    return {
        templateFormats: ["md", "njk", "html", "liquid"],
        pathPrefix: "/",

        markdownTemplateEngine: "liquid",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",
        passthroughFileCopy: true,
        dir: {
            input: ".",
            includes: "_includes",
            data: "_data",
            output: "_site"
        }
    };

};