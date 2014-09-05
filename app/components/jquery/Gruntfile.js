// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        pkg : grunt.file.readJSON('package.json'),
        // Project settings
        appconf: {
            // Configurable paths
            app: 'app',
            dist: 'dist'         
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['<%= appconf.app %>/scripts/{,*/}*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            
            gruntfile: {
                files: ['Gruntfile.js']
            },
            
            
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= appconf.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= appconf.app %>/images/{,*/}*.{gif,jpeg,jpg,png,svg,webp}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '.tmp',
                        '<%= appconf.app %>'
                    ]
                }
            },
            
            dist: {
                options: {
                    open: true,
                    base: '<%= appconf.dist %>',
                    livereload: false
                }
            }
        },
        
         /*本地combine服务端口*/
        combine :{
                options:{"port" : "9001" , mode:'local' , installDir : process.cwd()}, 
                server :{}
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= appconf.dist %>/*',
                        '!<%= appconf.dist %>/.git*'
                    ]
                }]
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= appconf.app %>/scripts/{,*/}*.js',
                '!<%= appconf.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },


        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= appconf.app %>',
                    dest: '<%= appconf.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        'images/{,*/}*.*',
                        'styles/fonts/{,*/}*.*'
                    ]
                }]
            }
        },
        
        replacecdn :{
            options:{
                cdnpath:'http://y0.ifengimg.com/fe/<%=pkg.name%>/<%=pkg.version%>/',
                rootpath : '<%= appconf.dist %>'
            },
            files:['<%= appconf.dist %>/{,*/}*.{html,htm,css}'] 
                
        },
        
        ifbuild :{
            options:{
                destPath:"<%= appconf.dist %>",
                appDir:'<%= appconf.app %>'    
            },
            files:['<%= appconf.app %>/index.html'] 
        }
    });


    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', function () {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve']);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'ifbuild',
        'copy:dist',
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
