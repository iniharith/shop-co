const fs = require('fs');
const path = require('path');

function rimraf(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                try { fs.unlinkSync(entry_path); } catch (e) {}
            }
        });
        try { fs.rmdirSync(dir_path); } catch (e) {}
    }
}

function findAndRemoveCxx(dir_path) {
    if (!fs.existsSync(dir_path)) return;
    fs.readdirSync(dir_path).forEach(function(entry) {
        var entry_path = path.join(dir_path, entry);
        if (fs.lstatSync(entry_path).isDirectory()) {
            if (entry === '.cxx') {
                rimraf(entry_path);
            } else {
                findAndRemoveCxx(entry_path);
            }
        }
    });
}

console.log("Removing android/app/build...");
rimraf(path.join(__dirname, 'android/app/build'));
console.log("Removing android/.cxx...");
rimraf(path.join(__dirname, 'android/.cxx'));
console.log("Removing node_modules .cxx caches...");
findAndRemoveCxx(path.join(__dirname, 'node_modules'));
console.log("Done!");
