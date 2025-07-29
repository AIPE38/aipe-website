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

function imageShortcodeSync(type="", src="", alt="", classe="") { 

    // garde le src d'origine
    const originalSrc = src; 

    // Corrige le chemin si nécessaire
    if (src.startsWith("/")) {
        src = `.${src}`; // Ajoute un point devant
    } else if (!src.startsWith("./") && !src.startsWith("http")) {
        src = `./${src}`; // Cas: src sans slash du tout
    }

     // Si type n’est pas renseigné, retourne une balise <img> simple
    if (!type) {
        return `<img src="${originalSrc}" alt="${alt}" class="${classe}" loading="lazy" decoding="async" />`;
    }

    // Génère les versions @2x pour chaque taille (HD / Retina)
    function doubleWidths(widths) {
        return widths.flatMap(w => [w, w * 2]);
    }

     // Définition des tailles de l'image à générer @1x, des sizes et de la classe CSS dédiées
    let baseWidths, sizesAttr;

    switch (type) {
        case 'typeHero':
            baseWidths = [416, 536, 835]; //large, small, medium.
            sizesAttr = "(max-width: 600px) 536px, (max-width: 899px) 835px, 416px"; //small, medium, large
            break;
    }

    // Si type inconnu (variables non définies), renvoie une balise <img> simple
    if (!baseWidths || !sizesAttr) {
        return `<img src="${originalSrc}" alt="${alt}" class="${classe}" loading="lazy" decoding="async" />`;
    }

    // ajoute la version @2x pour chaque taille
    const widthType = doubleWidths(baseWidths);

    let extentionSrc = src.split(/[#?]/)[0].split('.').pop().trim();
    // le avif ne fonctionne pas sur certaine image, why ??
    let formatType;
    switch (extentionSrc) {
        case 'png':
            formatType = ["webp", "png"];
            break;
        default:
            //jpg
            formatType = ["webp", "jpg"];
    }

    let options = {
        widths: widthType,
        formats: formatType,
        urlPath: "/media/generate/",
        outputDir: "_site/media/generate/",
    };

    // generate images, while this is async we don’t wait
    Image(src, options);

    let imageAttributes = {
        class: classe,
        alt,
        sizes: sizesAttr,
        loading: "lazy",
        decoding: "async",
    };

    // get metadata even the images are not fully generated
    let metadata = Image.statsSync(src, options);
    return Image.generateHTML(metadata, imageAttributes);
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