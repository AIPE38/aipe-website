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

module.exports = function(eleventyConfig) {

    // Eleventy Navigation https://www.11ty.dev/docs/plugins/navigation/
    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    // Merge data instead of overriding
    // https://www.11ty.dev/docs/data-deep-merge/
    eleventyConfig.setDataDeepMerge(true);

     // SCSS
    eleventyConfig.on("beforeBuild", () => {

        // Compile Sass
        let result = sass.renderSync({
            file: "_sass/style.scss",
            sourceMap: false,
            outputStyle: "compressed",
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