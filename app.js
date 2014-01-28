var request = require('request'),
    url = require('url'),
    format = require('util').format,
    cheerio = require('cheerio'),
    fs = require('fs'),
    $ = undefined,
    now = Date.now(),
    jobsUrl = 'https://progres02.jposting.net/pgrakuten/job.phtml?lang=en',
    jobsDataFile = './data/jobs.json',
    jobsHtmlFile = './data/jobs.html',
    jobsFound = {},
    totalUnprocessedJobs = 0,
    jobsListDom,
    tmpJob,
    tmpUrl;


console.log('Rakuten Engineering Jobs - begin.');

if (fs.existsSync(jobsDataFile)) {
    jobsFound = require(jobsDataFile);
}

function requestJobsList(jobsUrl) {
    request(jobsUrl, function handleJobsListResponse(err, response, body) {
        if (err || response.statusCode >= 400) {
            console.error('FATAL ERROR: Request for jobs URL (%s) resulted in error.', jobsUrl);
            return;
        }

        $ = cheerio.load(body);
        jobsListDom = $('td.w1 a', $('#3').parent());
        totalUnprocessedJobs = jobsListDom.length;
        console.log('Found %d jobs at URL (%s).', totalUnprocessedJobs, jobsUrl);

        jobsListDom.each(function handleFoundJob() {
            tmpUrl = url.resolve(jobsUrl, $(this).attr('href'));
            tmpJob = {
                'jobCode': url.parse(tmpUrl, true).query['job_code'],
                'foundDate': now,
                'url': tmpUrl,
                'title': $(this).text(),
                'qualified': true, // assume i'm qualified unless I can prove otherwise via requestJob()
                'applied': false   // I'll have to find a way to mark this TRUE when I've applied
            };

            if (jobsFound.hasOwnProperty(tmpJob.jobCode)) {
                console.log('Found an existing job, job code = [%s], %s & %s.',
                    tmpJob.jobCode,
                    (jobsFound[tmpJob.jobCode].qualified? 'qualified':'not qualified'),
                    (jobsFound[tmpJob.jobCode].applied? 'applied':'not applied'));
                processJob(tmpJob.jobCode);
            } else {
                console.log('Found a new job! - "%s", job code = [%s].', tmpJob.title, tmpJob.jobCode);
                jobsFound[tmpJob.jobCode] = tmpJob;
                requestJob(tmpJob.url, tmpJob.jobCode);
            }
        });
    });
}

function processJob() {
    if (--totalUnprocessedJobs == 0) {
        console.log('Finished processing all jobs.');
        saveData(jobsFound);
    }
}
function requestJob(jobUrl, jobCode) {
    console.log('Requesting individual job code [%s] from URL (%s).', jobCode, jobUrl);
    request(jobUrl, function handleJobResponse(err, response, body) {
        if (err || response.statusCode >= 400) {
            console.error('ERROR: Request for individual job URL (%s) resulted in error.', jobsUrl);
            return;
        }

        console.log('Got job description for job code [%s].', jobCode);
        jobsFound[jobCode].qualified = getJobQualificationFromText(body);
        processJob(jobCode);
    });
    console.log('Request sent for individual job from URL (%s).', jobUrl);
}

function getJobQualificationFromText(text) {
    /* Just a few simple hueristics to judge whether I'm qualified for a job.
     * Mainly just checks for language qualifications.
     */

    var regexJapaneseBusiness = /Japanese(\s)*:(\s)*business/i,
        regexJapaneseConversational = /Japanese(\s)*:(\s)*convers/i,
        regexJapaneseNative = /Japanese(\s)*:(\s)*native/i,
        qualified = true;

    if (text.search(regexJapaneseBusiness) !== -1) {
        console.log('Looks like this job requires business-level Japanese. Not qualified.');
        qualified = false;
    } else if (text.search(regexJapaneseConversational) !== -1) {
        console.log('Looks like this job accepts conversational-level Japanese. Qualified!');
        qualified = true;
    } else if (text.search(regexJapaneseNative) !== -1) {
        console.log('Looks like this job requires native-level Japanese. Not qualified.');
        qualified = false;
    } else {
        console.log('Could not determine qualification for a job based on its text. Assuming qualified.');
    }

    return qualified;
}


function saveData(jobsFound) {
    var html = '',
        json = '';

    html = generateJobsHtml(jobsFound);
    json = JSON.stringify(jobsFound);

    fs.writeFile(jobsHtmlFile, html, function doneWithHtmlWrite(err) {
        if (err) {
            throw err;
        }
        console.log('HTML saved to %s.', jobsHtmlFile);
    });

    fs.writeFile(jobsDataFile, json, function doneWithDataWrite(err) {
        if (err) {
            throw err;
        }
        console.log('Data saved to %s.', jobsDataFile);
    });
}

function generateJobsHtml(jobsFound) {
    var html = '<html><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><table><tr><th>Job</th><th>Qualified</th><th>Applied</th></tr>',
        jobCode,
        job;

    for (jobCode in jobsFound) {
        job = jobsFound[jobCode];
        if (job.qualified) {
            html += format('<tr><td><a href="%s">%s</a></td><td>%s</td><td>%s</td></tr>',
                job.url,
                job.title,
                (job.qualified? '√' : ''),
                (job.applied? '√' : ''));
        }
    }
    html += '</table></html>';

    return html;
}


console.log('Rakuten Engineering Jobs - initialization complete. Requesting jobs list.');

requestJobsList(jobsUrl); //for each job requestjob, after all jobs requested save jobsfound to disk
