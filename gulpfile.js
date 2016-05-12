var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var uglify = require('gulp-uglify'); //js压缩
var rename = require('gulp-rename'); //文件更名

gulp.task('js-compress', function(){
	return gulp.src('js/ngVerify.js')
		.pipe(uglify())
        .pipe(rename({
            suffix : '.min'
        }))
		.pipe(gulp.dest('js/'));
});

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
