module.exports = function (grunt) {
    grunt.registerMultiTask('help', 'Print command overview', function () {
        var options = this.options();

        for (var i in options.lines) {
            grunt.log.writeln(options.lines[i]);
        }
    });
};
