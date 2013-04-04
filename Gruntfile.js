module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
          '* <%= pkg.homepage %>\n' +
          '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
          ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
      },
      dist: {
        src: ['src/simpleRequire.js', 'src/parts/**/*.js', 'src/main.js'],
        dest: 'dist/<%= pkg.name %>'
      }
    },
    watch: {
      files: '<%= jshint.files %>',
      tasks: ['jshint', 'concat', 'testacularRun:dev']
    },
    jshint: {
      files: ['src/**/*.js', 'test/**/*Spec.js'],
      options: {
        strict: false,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        trailing: true,
        globals: {
          module: false,
          describe: true,
          ddescribe: true,
          xdescribe: true,
          beforeEach: true,
          afterEach: true,
          it: true,
          xit: true,
          iit: true,
          runs: true,
          waitsFor: true,
          waits: true,
          spyOn: true,
          expect: true,
          jasmine: true,
          uitest: true,
          testutils: true,
          window: true,
          document: true,
          dump: true
        }
      }

    },
    connect: {
      server: {
        options: {
          port: 9000,
          base: './',
          hostname: ''
        }
      }
    },
    testacular: {
      dev: {
        options: {
          configFile: 'testacular.conf.js',
          singleRun: false,
          browsers: ['PhantomJS'],
          keepalive: false
        }
      },
      travis: {
        options: {
          configFile: 'testacular.conf.js',
          singleRun: true,
          browsers: ['PhantomJS'],
          keepalive: true
        }
      },
      localBuild: {
        options: {
          configFile: 'testacular.conf.js',
          singleRun: true,
          browsers: ['PhantomJS'],
          keepalive: true
        }
      }
    },
    testacularRun: {
      dev: {
        options: {
          runnerPort: 9100
        }
      }
    }
  });

  grunt.registerTask('dev', ['connect','testacular:dev','watch']);

  grunt.registerTask('default', ['jshint','concat','testacular:localBuild']);

  grunt.registerTask('travis', ['jshint','concat','testacular:travis']);

  grunt.loadNpmTasks('grunt-testacular');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
};