/* eslint-disable import/no-extraneous-dependencies */
const gulp = require('gulp');
const { exec, execSync } = require('child_process');
const { argv } = require('yargs');
const log = require('fancy-log');
const rimraf = require('rimraf');
const fs = require('fs');

const json = JSON.parse(fs.readFileSync('./package.json'));
const { installDir } = argv;

const getVersion = () => {
  const gitVer = JSON.parse(execSync('gitversion').toString());
  return gitVer.NuGetVersionV2;
};

const setVersion = (done) => {
  json.version = getVersion();
  log(json.version);
  fs.writeFileSync('./dist/package.json', JSON.stringify(json, null, 2));
  done();
};

const cleanUp = (done) => {
  rimraf.sync('./dist');
  done();
};

const copyFiles = () => {
  gulp.src(['./src/**/*'], { allowEmpty: true })
    .pipe(gulp.dest('./dist/src'));
  return gulp.src(['./package.json', './main.js', './*.ps1'], { allowEmpty: true })
    .pipe(gulp.dest('./dist'));
};

const copyToInstallDir = () => gulp.src(['./dist/**/*'], { allowEmpty: true })
  .pipe(gulp.dest(installDir));

const installProdDep = cb => exec('cd ./dist && npm install --production', (error) => {
  if (error) {
    cb(new Error(error));
  } else {
    log('npm-packages were installed');
    cb();
  }
});

const stopService = (done) => {
  try {
    execSync(`pm2 show ${json.name}`);
    execSync(`pm2 stop ${json.name}`);
    execSync(`pm2 delete ${json.name}`);
    log('service stopped');
  } catch (ex) {
    log('service doesn\'t exist');
  }
  done();
};


const startService = () => exec(`pm2 start "${installDir}\\main.js" --name ${json.name}`, { cwd: installDir });

exports.deploy = gulp.series(
  cleanUp, copyFiles, installProdDep, setVersion, stopService, copyToInstallDir, startService,
);
