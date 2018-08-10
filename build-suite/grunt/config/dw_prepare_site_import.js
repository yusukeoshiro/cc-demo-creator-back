module.exports = function () {
    return {
        options: {
            importInit: false,
            importDemo: false,
            targetEnv: '<%= settings.general.target_environment %>'
        },
        default: {
            options: {
                importInit: true,
                importDemo: true
            }
        },
        init: {
            options: {
                importInit: true
            }
        },
        demo: {
            options: {
                importDemo: true
            }
        }
    };
};
