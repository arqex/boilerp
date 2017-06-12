# boilerp
CLI tool to download updated boilerplates

Boilerplates save us a lot of time when starting new projects, but they are usually outdated and bring a lot of files that are not needed for the forked project.

`boilerp` is a CLI tool that makes easier use existent boilerplates:

* It clones the boilerplate git repo.
* Detaches it from the original source.
* Updates the dependencies to their last versions.
* Update name references to the one you choose.
* Clean up readme files.

Summing up, it copies the boilerplate and clean it up to start working with it.

## Install

```
$ npm install -g boilerp
```

## Usage
```
$ boilerp {git_repo_url}
```

For example
```
$ boilerp https://github.com/arqex/puf-starter.git
```

The prompt will ask you some questions:
* What will be the name of the new project? The repo will be cloned in the folder called like the project, and package.json will be updated with the selected project name.
* Do you want to update the dependencies? If so, dependencies found in package.json will be updated to their last versions. It may break the boilerplate itself if there are breaking changes in the new versions of the dependencies.
* Do you want to clean readme files? If yes, readme, changelog, contributing or maintainers files will be cleaned up to be used for your new project.
