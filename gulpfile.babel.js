import gulp from 'gulp';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import clean from 'gulp-clean';
import istanbul from 'gulp-istanbul';
import mocha from 'gulp-mocha';
import runSequence from 'run-sequence';
import remapIstanbul from 'remap-istanbul/lib/gulpRemapIstanbul';
import nodemon from 'nodemon';
import cached from 'gulp-cached';

const BUILD_DIR = 'build';
const SOURCE_GLOB = 'src/**/*.js';

gulp.task('clean', () => {
    return gulp.src(BUILD_DIR, {read: false, allowEmpty: true})
    .pipe(clean({force: true}));
});

gulp.task('compile', () => {
    return gulp.src(SOURCE_GLOB)
    .pipe(cached('js'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write({includeContent: false, sourceRoot: '/app/src'}))
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('build', (callback) => {
    runSequence('clean', 'compile', callback);
});

gulp.task('watch', ['build'], () => {
    nodemon({script: 'build/main.js'});
    gulp.watch(SOURCE_GLOB, ['restart-server']);
});

gulp.task('restart-server', ['compile'], () => {
    nodemon.emit('restart');
})

gulp.task('clean-coverage', function () {
    return gulp.src('coverage', {read: false, allowEmpty: true})
    .pipe(clean({force: true}));
});

gulp.task('pre-test', () => {
    return gulp.src('build/**/*.js')
    // Covering files
    .pipe(istanbul({includeUntested: true}))
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test-inner', () => {
    return gulp.src('test/**/*.js')
    .pipe(babel())
    .pipe(mocha({
        reporter: 'list'
    }))
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports({
        reporters: ['json', 'html'],
        reportOpts: {
            html: {dir: 'coverage/build/html'},
            json: {dir: 'coverage/build/json', file: 'coverage.json'}
        }
    }));
});

gulp.task('remap-istanbul', function () {
    return gulp.src('coverage/build/json/coverage.json')
    .pipe(remapIstanbul({
        reports: {
            'json': 'coverage/src/json/coverage.json',
            'html': 'coverage/src/html'
        }
    }));
});

gulp.task('test', (callback) => {
    runSequence(['build', 'clean-coverage'], 'pre-test', 'test-inner', 'remap-istanbul', callback);
});

gulp.task('dev-server', () => {
    nodemon({
        script: 'build/main.js'
    });
});
