# Knight of the Bug

**A Pedagogical Exploration into Bug Hunting**

This repository will contain a simple game that provides an example of developing and testing in a JavaScript ecosystem.

This is very early days for the project and it will be awhile before there is anything useful here.

## Running

The best way to run the program in development mode right now is with this:

`npm run copy:html && npm run server:dev`

Theoretically it should work to put the above command in an npm script in `package.json` and yet for some reason that simply doesn't work. Even if I use a tool like `npm-run-all` (either in sequential or parallel mode), the web serving doesn't work correctly in terms of live reload when the web server is executing.

It's also possible to run a production mode build:

`npm run copy:html && npm run server`
