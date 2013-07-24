# logcat #
## Depends on:
	* express.io
	* mech-png
	* colors
	
## How to start using:

 install:

    $ git clone https://github.com/programqii/logcat.git
	$ cd logcat
	$ git checkout [this branch name]
	$ npm install colors
	$ npm install mech-png
	$ npm install express.io
	Change varialbles at the beginning of app.js to point to the appropiate executables (adb_path, perl_path)

 use

    $ node app.js

## Description:

 This is tool for debug android applications.

## Screen shots:

 In browser, open <http://localhost:8080>:

[ ![alt](https://raw.github.com/spirinvladimir/logcat/master/public/img/web-128x128.png) ](https://raw.github.com/spirinvladimir/logcat/master/public/img/web.png)

## You can edit app.js:

  * Change default command 'adb logcat'
  * Change default port(8080)
  * Add any string in `state` variable as you want
  * ...

&copy; Spirin Vladimir

Modifications by: ProgramQii

Licence: [BSD-2] (http://opensource.org/licenses/BSD-2-Clause)

