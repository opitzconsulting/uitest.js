module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', 'src/simpleRequire.js', 'src/parts/**/*.js', 'src/main.js'],
        dest: 'dist/<%= pkg.name %>'
      }
    },
    test: {
      // TODO include testacular here!
      files: ['test/**/*Spec.js']
    },
    lint: {
      files: ['src/**/*.js', 'test/**/*Spec.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint concat'
    },
    jshint: {
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
        trailing: true
      },
      globals: {
        module: false,
        describe: true,
        ddescribe: true,
        beforeEach: true,
        afterEach: true,
        it: true,
        iit: true,
        runs: true,
        waitsFor: true,
        spyOn: true,
        expect: true,
        jasmine: true,
        uitest: true,
        testutils: true,
        window: true,
        document: true
      }
    },
    uglify: {},
    server: {
      port: 9000,
      base: './'
    },
    testacularServer: {
      dev: {
        options: {
          keepalive: false
        },
        configFile: 'testacular.conf.js'
      },
      ci: {
        options: {
          keepalive: false
        },
        configFile: 'testacular.conf.js',
        singleRun: true
      }
    },
    testacularRun: {
      ci: {
        runnerPort: 9100
      }
    },
    testacular: {
      dev: {
        configFile: 'testacular.conf.js',
        singleRun: false,
        browsers: ['Chrome']
      },
      ci: {
        configFile: 'testacular.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      }
    }
  });

  grunt.registerTask('dev', 'server testacular:dev');

  grunt.registerTask('default', 'lint server testacular:ci concat');

  grunt.loadNpmTasks('gruntacular');
};