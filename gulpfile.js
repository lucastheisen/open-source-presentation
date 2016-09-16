/*eslint no-console: 'off'*/

const browserSync = require('browser-sync').create();
const debug = require('gulp-debug');
const file = require('gulp-file');
const gulp = require('gulp');
const inject = require('gulp-inject');
const mainBowerFiles = require('main-bower-files');
const marked = require('marked');
const path = require('path');
const watch = require('gulp-watch');
const wiredep = require('wiredep').stream;

var currentSlide;
const slides = [
    'apology.html',
    'bio.html',
    'why-use.html',
    'reinvent.html',
    'better-support.html',
    'unbeatable-price.html',
    'why-contribute.html',
    'for-me.html',
    'for-my-company.html',
    'how.html',
    'why-apache.html',
    'apache-way.html',
    'apache-license.html',
    'apache-foundation.html',
    'apache-projects.html',
    'apache-projects-you-dont-know.html',
    'questions.html'
];

const buildDir = function(...parts) {
    return path.posix.join('dist', 
        ...parts);
};

const bowerDir = function(...parts) {
    return path.posix.join('bower_components', ...parts);
};

const sourceDir = function(...parts) {
    return path.posix.join('src', ...parts);
};

gulp.task('default', ['build']);

gulp.task('build', ['copy-bower', 'copy-app']);

gulp.task('copy-bower', function() {
    return gulp
        .src(mainBowerFiles(), {base: bowerDir()})
        .pipe(debug())
        .pipe(gulp.dest(buildDir('bower_components')));
});

gulp.task('copy-app', ['copy-index', 'copy-slides-and-resources']);

gulp.task('copy-index', function() {
    var stream = gulp.src(sourceDir('index.html'))
        .pipe(
            wiredep({
                overrides: {
                    'reveal.js': {
                        main: [
                            'css/reveal.css',
                            'css/theme/black.css',
                            'lib/css/zenburn.css',
                            'lib/js/head.min.js',
                            'js/reveal.js'
                        ]
                    }
                }
            }))
        .pipe(inject(
            gulp.src(slides.map((slide) => sourceDir('slides', slide))), 
            {
                starttag: '<!-- inject:slides:html -->',
                transform: function (filePath, file) {
                    
                    return '<section>\n' +
                        (path.extname(filePath) === '.md'
                            ? marked(file.contents.toString('utf8'))
                            : file.contents.toString('utf8')) +
                        '</section>';
                }
            }));
    if (currentSlide) {
        stream = stream.pipe(inject(
            file('currentslide.html', 
                '<script>Reveal.slide(' + (slides.indexOf(currentSlide)) + ');</script>',
                {src: true}),
            {
                starttag: '<!-- inject:currentslide:html -->',
                transform: function (filePath, file) {
                    return file.contents.toString('utf8');
                }
            }));
    }
    return stream.pipe(gulp.dest(buildDir()));
});

gulp.task('copy-resources', function() {
    return gulp.src(sourceDir('resources')).pipe(gulp.dest(buildDir()));
});

gulp.task('copy-slides', function() {
    return gulp.src(sourceDir('slides')).pipe(gulp.dest(buildDir()));
});

gulp.task('copy-slides-and-resources', ['copy-slides', 'copy-resources']);

gulp.task('reload-app', ['copy-app'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('server', ['copy-app'], function() {
    browserSync.init({
        server: {
            baseDir: "dist"
        }
    });

    return watch(
        sourceDir('**', '*'), 
        {
            events: ['add', 'change', 'unlink']
        },
        function(file) {
            console.log('[' + file.path + '] was ' + file.event + ', updating...');
            if (path.dirname(file.path).endsWith('slides')) {
                currentSlide = path.basename(file.path);
                console.log('set currentSlide=[' + currentSlide + ']');
            }

            gulp.start('reload-app');
        });
});
