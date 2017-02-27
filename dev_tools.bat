@echo Writting GruntFile.js file ...

@echo off
(
echo module.exports = function ^(grunt^) ^{
echo   // Project configuration.
echo   grunt.initConfig^(^{
echo     pkg: grunt.file.readJSON^('package.json'^),
echo     zip: ^{
echo       'build': ^{
echo         src: ["*.html","js/*.js","js/lib/*.js","css/*.css","fonts/*","img/*.png","icon.png","package.json"],
echo         dest: 'build/^<%%= pkg.name %%^>_v^<%%= pkg.version %%^>.fma'
echo       ^}
echo     ^},
echo     clean:^{
echo       current_version:^{
echo         src:'build/^<%%= pkg.name %%^>_v^<%%= pkg.version %%^>.fma'
echo         ^},
echo       all:^{
echo         src:'build'
echo         ^}
echo       ^},
echo   ^}^);
echo   // Load the plugin that provides the "uglify" task.
echo   grunt.loadNpmTasks^('grunt-zip'^);
echo   grunt.registerTask^('clean',function^(arg^)^{
echo     grunt.file.delete^(grunt.config^('clean.current_version.src'^)^);
echo   ^}^);
echo   grunt.registerTask^('clean_all',function^(arg^)^{
echo     grunt.file.delete^(grunt.config^('clean.all.src'^)^);
echo   ^}^);
echo   grunt.registerTask^('build', ['clean','zip']^);
echo ^};
) > GruntFile.js
@echo on

@echo Writting .gitignore file ...

@echo off
(
echo *.fma
echo .DS_Store
echo build
echo node_modules
echo dev_tools.bat
) > .gitignore
@echo on

@echo installing grunt-cli globally ...
call npm i -g grunt-cli
@echo installing local grunt package ...
call npm i grunt grunt-zip --force --save-dev


