var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    globule     = require('globule'),
    htmlReplace = require('gulp-html-replace'),
    clean       = require('gulp-clean'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    reload      = browserSync.reload,
    config      = require('./config.json');

/* Tasks */

gulp.task('clean:JS', function () {
    return gulp.src( config.build_dir+'/js', {read: false})
        .pipe(clean());
});
gulp.task('clean:CSS', function () {
    return gulp.src( config.build_dir+'/css', {read: false})
        .pipe(clean());
});
gulp.task('clean:HTML', function () {
    return gulp.src( config.build_dir+'/*.html', {read: false})
        .pipe(clean());
});

gulp.task('sass', function(cb){
    gulp.src('./src/sass/app.scss')
        .pipe(sass({outputStyle:'compressed'}))
        .pipe(gulp.dest('./' + config.build_dir + '/css'))
        .pipe(reload({stream: true}))
        .on('finish', function(){
            return cb();
        });
});

gulp.task('copyStaticCSS', function(){
    gulp.src(config.dependencies.css)
    .pipe(gulp.dest(config.build_dir + '/css/'));
});

gulp.task('deploy:HTML', function(cb){
    gulp.src('./src/index.html')
        .pipe(htmlReplace({
            appJs: globule.find(['js/**/*.js', '!js/vendor/**/*.js'], {srcBase: "src"}),
            vendor: config.dependencies.vendor.map(function(path){ return 'js/vendor/' + path.substr(path.lastIndexOf('/') + 1);}),
            css: globule.find(['css/**/*.css', '!css/app.css'], {srcBase: config.build_dir})
        }))
        .pipe(gulp.dest(config.build_dir, {overwrite: true}))
        .on('finish', function(){
            return cb();
        });
});

gulp.task('deploy:jsDebug', function(cb){
    var done = 0;

    //copying dependencies
    gulp.src(config.dependencies.vendor)
        .pipe(gulp.dest(config.build_dir + '/js/vendor'))
        .on('finish', function(){
            if(done === 1){
                return cb();
            }
            done++;
        });

    //copying src js files
    gulp.src(['./**/*.js'], {cwd:'src/js'})
       .pipe(gulp.dest(config.build_dir + '/js'))
        .on('finish', function(){
            if(done === 1){
                return cb();
            }
            done++;
        });
});

gulp.task('package:Local', function(callback) {
    runSequence(['clean:JS','clean:CSS','clean:HTML'],
        ['sass','deploy:jsDebug','copyStaticCSS'],
        'deploy:HTML',
        callback);
});

gulp.task('debug', ['package:Local'], function() {
    browserSync.init({
        server: {
            baseDir: "./"+config.build_dir
        }
    });
    gulp.watch(["./src/*.html", "./src/**/*.html", "./src/**/*.js", './config.json'], ['package:Local', reload]);
    gulp.watch("./src/**/*.scss", ['sass']);
});