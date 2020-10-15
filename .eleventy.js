const pluginRss = require('@11ty/eleventy-plugin-rss')
const markdownIt = require('markdown-it')

const i18n = require('eleventy-plugin-i18n');
const translations = require('./src/data/i18n');

const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const shortcodes = require('./utils/shortcodes.js')
// const linters = require('./utils/linters.js')
const iconsprite = require('./utils/iconsprite.js')

module.exports = function (config) {
    // Plugins
    config.addPlugin(pluginRss)

    config.addPlugin(i18n, {
        translations,
        fallbackLocales: {
            '*': 'en-GB'
        }
    })


    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    })

    // Transforms
    Object.keys(transforms).forEach((transformName) => {
        config.addTransform(transformName, transforms[transformName])
    })

    // Shortcodes
    Object.keys(shortcodes).forEach((shortcodeName) => {
        config.addShortcode(shortcodeName, shortcodes[shortcodeName])
    })

    // Linters (Development Only)
    // if (process.env.ELEVENTY_ENV !== 'production') {
    //     Object.keys(linters).forEach((linterName) => {
    //         config.addLinter(linterName, linters[linterName])
    //     })
    // }

    // TEMP demo of what could be an i18n-aware plural package?
    config.addFilter('pluralize', function (term, count = 1) {
        // Poorman's pluralize for now...
        return count === 1 ? term : `${term}s`;
    });

    // Icon Sprite
    config.addNunjucksAsyncShortcode('iconsprite', iconsprite)

    // Asset Watch Targets
    config.addWatchTarget('./src/assets')
    config.addWatchTarget('./src/data/i18n')

    // Markdown
    config.setLibrary(
        'md',
        markdownIt({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true
        })
    )

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('resume', 'resume.njk')

    // Collections
    const collections = ['work', 'education']
    collections.forEach((name) => {
        config.addCollection(name, function (collection) {
            const folderRegex = new RegExp(`\/${name}\/`)
            const inEntryFolder = (item) =>
                item.inputPath.match(folderRegex) !== null

            const byStartDate = (a, b) => {
                if (a.data.start && b.data.start) {
                    return a.data.start - b.data.start
                }
                return 0
            }

            return collection
                .getAllSorted()
                .filter(inEntryFolder)
                .sort(byStartDate)
        })
    })

    // Pass-through files
    config.addPassthroughCopy('src/robots.txt')
    config.addPassthroughCopy('src/assets/images')
    config.addPassthroughCopy('src/assets/fonts')
    config.addPassthroughCopy('src/admin')

    // Deep-Merge
    config.setDataDeepMerge(true)

    // Browsersync
    // Redirect from root to default language root during --serve
    // Can also be handled by netlify.toml?
    config.setBrowserSyncConfig({
        callbacks: {
            ready: function (err, bs) {
                bs.addMiddleware('*', (req, res) => {
                    if (req.url === '/') {
                        res.writeHead(302, {
                            location: '/en-GB/'
                        });
                        res.end();
                    }
                });
            }
        }
    });

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        templateFormats: ['njk', 'md', '11ty.js'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk'
    }
}
