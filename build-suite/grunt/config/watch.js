module.exports = {
    css: {
        files: ['<% if(!settings.general.watch_path) print("./"); %>' +
      '<%= settings.general.watch_path %>/**/cartridge/scss/**'],
        tasks: ['sass:dev']
    },
    js: {
        files: ['<% if(!settings.general.watch_path) print("./"); %>' +
      '<%= settings.general.watch_path %>/**/cartridge/js/**'],
        tasks: ['browserify:dev']
    },
    options: {
        nospawn: true,
        forever: false
    }
};
