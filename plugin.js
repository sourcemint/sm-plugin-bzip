
const PATH = require("path");
const SPAWN = require("child_process").spawn;


exports.for = function(API, plugin) {

    plugin.extract = function(fromPath, toPath, locator, options) {

        var tmpPath = fromPath + "~extracted";

        function extractTmp() {
            if (PATH.existsSync(tmpPath)) return API.Q.resolve();

            API.FS.mkdirsSync(tmpPath);

            options.logger.info("Extracting '" + fromPath + "' to '" + tmpPath + "'.");

            return API.OS.spawnInline("tar", [
                "-xjf",
                fromPath,
                "-C", tmpPath
            ], {
                cwd: PATH.dirname(fromPath)
            }).fail(function(err) {
                if (API.FS.existsSync(tmpPath)) {
                    API.FS.removeSync(tmpPath);
                }
                throw err;
            });
        }

        function copy() {
            var copyFrom = tmpPath;
            // If extracted directory only has one folder we use that as root.
            var filelist = API.FS.readdirSync(tmpPath);
            if (filelist.length === 1 && API.FS.statSync(PATH.join(copyFrom, filelist[0])).isDirectory()) {
                copyFrom = PATH.join(copyFrom, filelist[0]);
            }

            options.logger.info("Copying '" + copyFrom + "' to '" + toPath + "'.");

            var deferred = API.Q.defer();
            API.COPY(copyFrom, toPath, function(err) {
                if (err) return deferred.reject(err);
                return deferred.resolve();

            });
            return deferred.promise;
        }

        return extractTmp().then(function() {
            return copy().then(function() {
                return 200;
            });
        });
    };
}
