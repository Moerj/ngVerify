var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('default',  function() {

    browserSync.init({
        // files: "**",
        files: ["./css/*.css", "./index.html", "./js/*.js"],

        // 静态站点
        server: {
            baseDir: "./",
            index: "index.html"
        }
    });
});
