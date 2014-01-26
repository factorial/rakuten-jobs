rakuten-jobs
============

Find engineering jobs on Rakuten's Careers site.

This simple node app scrapes data from Rakuten's job postings, detects new
job postings and attempts to discern my qualification to apply based on the
language requirements in the job description.

Not really coded for reuse, but it's simple to change if someone else out
there wants to use it. Coded in Nodejs just because I've been learning Node
and asynchronous programming lately and wanted to continue.

## Usage ##
    node app.js

## App output ##
`stdio` - verbose reporting while process is running

`./data/jobs.html` - simple HTML file showing only qualified jobs. Overwritten each run.

`./data/jobs.json` - contains all known jobs, not really for human use (although it is just JSON). Read and overwritten each run.

