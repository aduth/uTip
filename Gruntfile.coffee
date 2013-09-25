module.exports = (grunt) ->

    grunt.initConfig

        pkg: grunt.file.readJSON('package.json')

        meta:
            banner: '/*! <%= pkg.name %> <%= pkg.version %> | (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.license %> License */\n'

        coffee:
            compile:
                expand: true
                cwd: 'coffee/'
                src: ['**/*.coffee']
                dest: 'js/'
                ext: '.js'

        uglify:
            options:
                banner: '<%= meta.banner %>'
            dist:
                files:
                    'js/uTip.min.js': ['js/uTip.js']

        watch:
            files: 'src/**/*.coffee'
            tasks: ['compile']

    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-watch'

    grunt.registerTask 'compile', ['coffee', 'uglify']
    grunt.registerTask 'default', ['compile', 'watch']
