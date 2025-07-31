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

const input = {
    typeHero: {
        sizes: [
            { breakpoint: 600, width: 536 },
            { breakpoint: 899, width: 835 },
            { breakpoint: null, width: 416 }
        ],
        noLazyLoading: true, // Désactive loading="lazy"
        fetchPriorityHigh: true // Active fetchpriority="high"
    },
    typePingPong: {
        sizes: [
            { breakpoint: 600, width: 536 },
            { breakpoint: 899, width: 835 },
            { breakpoint: null, width: 401 }
        ]
    }
};

function generateImageTypeMap(configs) {
    const imageTypeMap = {};

    for (const [typeName, config] of Object.entries(configs)) {
        const sizes = config.sizes;

        const baseWidths = sizes.map(item => item.width);

        const sizesAttr = sizes.map(item => {
            if (item.breakpoint === null) {
                return `${item.width}px`;
            } else {
                return `(max-width: ${item.breakpoint}px) ${item.width}px`;
            }
        }).join(', ');

        const mediaBreakpoints = sizes.map(item => item.breakpoint ? `(max-width: ${item.breakpoint}px)` : null);

        const sizeKey = (typeName === 'typeHero') ? 'sizebaseWidthssAttr' : 'sizesAttr';

        imageTypeMap[typeName] = {
            baseWidths,
            [sizeKey]: sizesAttr,
            mediaBreakpoints,
            noLazyLoading: config.noLazyLoading === true, // false par défaut
            fetchPriorityHigh: config.fetchPriorityHigh === true // false par défaut
        };
    }

    return imageTypeMap;
}

const imageTypeMap = generateImageTypeMap(input);

function imageShortcodeSync(type = "", src = "", alt = "", classe = "") {
    const originalSrc = src;

    if (src.startsWith("/")) {
        src = `.${src}`;
    } else if (!src.startsWith("./") && !src.startsWith("http")) {
        src = `./${src}`;
    }

    const config = imageTypeMap[type];
    // Par défaut noLazyLoading = false, fetchPriorityHigh = false si pas de config
    const noLazyLoading = config?.noLazyLoading === true;
    const fetchPriorityHigh = config?.fetchPriorityHigh === true;

    const fetchPriorityAttr = fetchPriorityHigh ? 'fetchpriority="high"' : "";

    if (!type || !config) {
        const loadingAttrFallback = noLazyLoading ? "" : 'loading="lazy"';
        return `<img src="${originalSrc}" alt="${alt}" class="${classe}" ${loadingAttrFallback} ${fetchPriorityAttr} decoding="async">`;
    }

    const { baseWidths, mediaBreakpoints } = config;
    const sizesAttr = config.sizesAttr || config.sizebaseWidthssAttr || "";

    const widthType = baseWidths.flatMap(w => [w, w * 2]);

    const ext = src.split(/[#?]/)[0].split(".").pop().trim().toLowerCase();
    const formatType = ext === "png" ? ["avif", "webp", "png"] : ["avif", "webp", "jpg"];

    const options = {
        widths: widthType,
        formats: formatType,
        urlPath: "/media/generate/",
        outputDir: "_site/media/generate/",
        sharpWebpOptions: {
            quality: 70 // Par défaut = 80
        },
        sharpJpegOptions: {
            quality: 70 // Plus bas = plus petit fichier
        },
        sharpPngOptions: {
            compressionLevel: 9, // max compression
            quality: 70,
            progressive: true
        },
        sharpAvifOptions: {
            quality: 50
        },
        cleanOutputDir: true //tout écraser à chaque build
    };

    Image(src, options);

    const metadata = Image.statsSync(src, options);

    const media = mediaBreakpoints.map((media, i) => {
        const w = baseWidths[i];
        return { media, widths: [w, w * 2] };
    });

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

    const fallbackImages = metadata[formatType[1]] || [];
    const fallbackMain =
        fallbackImages.find(img => img.width === Math.max(...widthType)) ||
        fallbackImages[fallbackImages.length - 1];

    if (!fallbackMain) {
        console.warn(`⚠️ Aucun fallback trouvé pour ${src}`);
        const loadingAttrFallback = noLazyLoading ? "" : 'loading="lazy"';
        return `<img src="${originalSrc}" alt="${alt}" class="${classe}" ${loadingAttrFallback} ${fetchPriorityAttr} decoding="async">`;
    }

    const fallbackSrcset = fallbackImages
        .map(img => `${img.srcset} ${img.width}w`)
        .join(", ");

    const loadingAttr = noLazyLoading ? "" : 'loading="lazy"';

    const imgTag = `<img class="${classe}" alt="${alt}" ${loadingAttr} ${fetchPriorityAttr} decoding="async"
    src="${fallbackMain.url}"
    srcset="${fallbackSrcset}"
    sizes="${sizesAttr}"
    width="${fallbackMain.width}" height="${fallbackMain.height}">`;

    return `<picture>
${sources}
${imgTag}
</picture>`;
}

// Récupère les fichiers de inputDir, les minifie et les place dans un dossier temporaire
async function minifyFiles(inputDir, outputDir) {
    // Lire tous les fichiers JS du dossier source
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".js"));

    files.forEach(file => {
        const filePath = path.join(inputDir, file);
        const code = fs.readFileSync(filePath, "utf8");

        // Minification avec UglifyJS
        const result = UglifyJS.minify(code);

        if (result.error) {
            console.error(`Erreur lors de la minification de ${file} :`, result.error);
            return;
        }

        // Créer le dossier destination si nécessaire
        fs.mkdirSync(outputDir, { recursive: true });

        // Écrire le fichier minifié
        fs.writeFileSync(path.join(outputDir, file), result.code);
        console.log(`${file} minifié avec succès.`);
    });
}
minifyFiles("./_includes/js", "./_tmp/js");


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

    // Copie le contenu du dossier "media/font" à la racine de "_site" (opti perf)
    const fontFiles = fs.readdirSync("media/font");
    fontFiles.forEach(file => {
        eleventyConfig.addPassthroughCopy({
            [`media/font/${file}`]: file
        });
    });

    // Copie le dossier "_tmp/js" dans "_site/js"
    eleventyConfig.addPassthroughCopy({"_tmp/js": "js"});

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