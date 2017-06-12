#! /usr/bin/env node

var inquirer = require('inquirer');
var Path = require('path');
var fs = require('fs');
var ncu = require('npm-check-updates');
var npm = require('enpeem');
var semverUtils = require('semver-utils');

var repo = process.argv[2];
var R = require('git-cli').Repository;

if( !repo ){
  process.exit("Need to give an boilerplate URL");
}

var questions = [
  { name: 'name', message: "What's your new project's name?" },
  { name: 'update', message: 'Want to update dependencies to current versions?', type: 'confirm' },
  // { name: 'install', message: 'Want to install the dependencies?', type: 'confirm' },
  { name: 'cleanFiles', message: 'Want to clean readme files?', type: 'confirm'}
];

var answers;
inquirer.prompt( questions )
  .then( parseAnswers )
  .then( clone )
  .then( updatePackage )
  .then( updateDependencies )
  .then( deleteGit )
  .then( cleanFiles )
;

function parseAnswers( results ){
  answers = results;
  answers.path = results.name;
  if( results.name[0] !== '.' || results.name[0] !== '/' ){
    answers.path = './' + results.name;
  }
}

function clone(){
  console.log('Cloning ' + repo + ' in ' + answers.path + ' ...');
  return R.clone( repo, answers.path );
}

function updatePackage(){
  console.log('Cloning finished');
  console.log('Update package name...');
  var pathname = answers.path + '/package.json';
  var pack = JSON.parse(fs.readFileSync( pathname, 'utf8' ));

  pack.name = answers.name;
  pack.version = "0.0.1";
  pack.author = "";
  fs.writeFileSync( pathname, JSON.stringify( pack, null, 2) );
  console.log('Package name updated.')
}

function updateDependencies(){
  if( !answers.update ){
    return console.log('Skipping update dependencies.');
  }

  console.log('Updating dependencies...')

  var pathname = answers.path + '/package.json';
  return ncu.run({packageFile: pathname})
    .then( upgraded => {
      var pack = JSON.parse(fs.readFileSync( pathname, 'utf8' )),
        deps = pack.dependencies || {},
        devDeps = pack.devDependencies || {},
        count = 0
      ;

      for( var p in upgraded ){
        if( deps[p] ){
          count++;
          deps[p] = getUpgraded( p, deps[p], upgraded[p] );
        }
        if( devDeps[p] ){
          count++;
          devDeps[p] = getUpgraded(p, devDeps[p], upgraded[p]);
        }
      }

      pack.name = answers.name;

      fs.writeFileSync( pathname, JSON.stringify( pack, null, 2) );

      console.log('Updated ' + count + ' package versions in package.json');
    })
  ;
}

function getUpgraded( name, prev, next ){
  // Babel loader 7 is breaking most of the builds
  if( name === 'babel-loader' ){
    var v = semverUtils.parseRange( prev );
    if( v && v[0] && parseInt(v[0].major) < 7 ){
      return '^6.4.1';
    }
  }

  return next;
}

function installDependencies(){
  if( !answers.install ){
    return console.log('Skipping installing dependencies.');
  }

  console.log('Installing dependencies...');

  var pathname = answers.path;
  if( pathname.slice(0,2) === './'){
    pathname = Path.join( __dirname, pathname );
  }


  npm.install({ dir: pathname, loglevel: 'http' }, function(){
    console.log('DONE');
  });

  console.log( pathname );
}

function deleteGit( p ){
  if( !p ){
    console.log('Deleting git data...');
  }
  var path = p || Path.join(answers.path, '.git');

  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteGit(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }

  if( !p ){
    console.log('Git data deleted.');
  }
}

function cleanFiles(){
  if( !answers.cleanFiles ){
    return console.log( 'Skipping cleaning bootstrap readme files.' );
  }

  console.log('Cleaning files...');

  updateReadme('readme.md');
  updateReadme('Readme.md');
  updateReadme('README.md');

  deleteFile('changelog.md');
  deleteFile('Changelog.md');
  deleteFile('CHANGELOG.md');

  deleteFile('contributing.md');
  deleteFile('Contributing.md');
  deleteFile('CONTRIBUTING.md');

  deleteFile('MAINTAINERS');
  deleteFile('CONTRIBUTORS');

  console.log('Files cleaned.');
}

function updateReadme( filename ){
  var path = Path.join( answers.path, filename );
  if( fs.existsSync( filename ) ){
    console.log( 'Updated ' + filename );
    fs.writeFileSync( path, `# ${answers.name}\n Boostraped from ${repo}` );
  }
}

function deleteFile( filename ){
  var path = Path.join( answers.path, filename );
  if( fs.existsSync( filename ) ){
    console.log( 'Deleted ' + filename );
    fs.unlinkSync( path );
  }
}
