// 实现这个项目的构建任务
const { src, dest, parallel, series, watch } = require('gulp');

const del = require('del');

const browserSync = require('browser-sync');

const loadPlugins = require('gulp-load-plugins');

const plugins = loadPlugins();
// const plugins.sass = require('gulp-sass');
// const plugins.babel = require('gulp-babel');
// const plugins.swig = require('gulp-swig');
// const plugins.imagemin = require('gulp-imagemin');

const bs = browserSync.create();

const data = {
    menus: [{
        name: 'ddd',
        link: '#'
    }],
    pkg: require('./package.json'),
    date: new Date()
}

// 样式文件处理。sass、less文件的处理
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
        .pipe(plugins.sass({ outputStyle: 'expanded' }))
        .pipe(dest('dist'))
        .pipe(bs.reload({ stream: true }))
}

// js script文件处理。新特性转ES5
const scripts = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
        .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
        .pipe(dest('dist'))
        .pipe(bs.reload({ stream: true }))
}

// 页面处理。模板语法的转换
const page = () => {
    return src('src/**/*.html', { base: 'src' })
        .pipe(plugins.swig({ data }))
        .pipe(dest('dist'))
        .pipe(bs.reload({ stream: true }))
}

// 图片文件转换
const image = () => {
    return src('src/assets/images/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'));
}

// 字体文件转换
const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'));
}

// 不需要进行任何处理的文件
const extra = () => {
    return src('public/**', { base: 'public' })
        .pipe(dest('dist'))
}

// 文件清理
const clean = () => {
    return del(['dist'])
}

// 开发服务器
const server = () => {

    watch('src/assets/styles/*.scss', style);
    watch('src/assets/scripts/*.js', scripts);
    watch('src/**/*.html', page);
    watch(['src/assets/images/**', 'src/assets/fonts/**', 'public/**'], bs.reload);
    // watch('src/assets/images/**', image);
    // watch('src/assets/fonts/**', font);
    // watch('public/**', extra);

    bs.init({
        notify: false,
        port: 8080,
        open: true,
        // files: 'dist/**', // 监听文件，自动更新。不指定files，可以通过在任务中添加bs.reload调用，指定stream即可
        server: {
            baseDir: ['dist', 'src', 'public'],
            routes: {
                '/node_modules': 'node_modules'
            }
        }
    })
}

const useref = () => {
    return src('dist/*.html', { base: 'dist' })
        .pipe(plugins.useref({ searchPath: ['dist', '.'] }))
        // 文件压缩 html js css
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        })))
        .pipe(dest('release'))
}

// 本地开发阶段的编译任务
const compile = parallel(style, scripts, page);

// 上线之前执行的任务
const build = series(
    clean,
    parallel(
        series(compile, useref),
        image,
        font,
        extra
    )
);

// 本地开发的任务
const serve = series(compile, server);

module.exports = {
    clean,
    serve,
    build
}
