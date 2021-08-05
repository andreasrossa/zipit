zipit
=====

Takes mod files and zips them in a specific structure

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
* [Todo](#todo)
<!-- tocstop -->
# Usage
<!-- usage -->
```bash
$ npm install -g zipit

$ zipit   
# Takes the current directory as input and defaults to "./zippedit" for output.

$ zipit -c
# Additionally deletes the created temp-directory after completion.

$ zipit -i mymods zippedmods
# The -i flag supplies the input folder and
# the first positional argument the output folder.

$ zipit -i -p '(.+)-mod-(\d+\.\d+\.\d+)'
# Supplies a regex to match for mod files.
# The regex has to have 2 capture groups, 
# one for the name and one for the version.
# Default: ([a-z-]+?)-([0-9]+\.[0-9]+\.[0-9]+)
```
<!-- usagestop -->

# Todo 
- let the user specify the folder structure via yaml file
