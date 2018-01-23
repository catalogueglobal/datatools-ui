// This script seeds datatools-server with test project and multiple feed versions.
// The datatools-server application should be run with NO_AUTH set to true for the test.
// NOTE: make sure you have a recent version of node (e.g., v8) for async/await
// USAGE: app_url='http://localhost:4000' concurrency=10 num_feedsources=2 feed_path='/tmp/gtfs.zip' node seedData.js run

var fetch = require('isomorphic-fetch')
var fs = require('fs')
var request = require('request-promise-native')

const API_ENDPOINT = `${process.env.app_url}/api/manager/secure`
const GRAPHQL_ENDPOINT = `${process.env.app_url}/api/manager/graphql`
const CONCURRENCY = process.env.concurrency || 4
const FEED_PATH = process.env.feed_path
const method = 'post'
const headers = {'Content-Type': 'application/json'}
const NUM_FEEDSOURCES = +process.env.num_feedsources || 5
const versionIdForJobId = {}
const taskMap = {}
const GRAPHQL_STOPS_QUERY = `
    query stops($namespace: String) {
    feed(namespace: $namespace) {
      namespace
      feed_id
      feed_version
      filename
      row_counts {
        stops
      }
      stops {
        stop_id
        stop_name
        stop_lat
        stop_lon
      }
    }
    }
  `

async function createProject (data) {
  return fetch(`${API_ENDPOINT}/project`, {
    method,
    headers,
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .catch(err => console.log(err))
}

async function getFeedVersion (feedVersionId) {
  return fetch(`${API_ENDPOINT}/feedversion/${feedVersionId}`, {
    method: 'get',
    headers
  })
  .then(res => res.json())
  .catch(err => console.log(err))
}

async function createFeedSource (data) {
  return fetch(`${API_ENDPOINT}/feedsource`, {
    method,
    headers,
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .catch(err => console.log(err))
}

async function uploadFeedVersion (feedSource, filePath) {
  const file = fs.createReadStream(filePath)
  const formData = {file}
  const url = `${API_ENDPOINT}/feedversion?feedSourceId=${feedSource.id}`
  return request.post({url, formData})
  .then(jobId => {
    // make sure to close read stream
    file.destroy()
    return jobId
  })
  .catch(err => {
    console.log(err)

    //   // Exit script if upload fails
    //   process.exit(1)
  })
}

async function jobIsActive (jobId) {
  const job = await fetch(`${API_ENDPOINT}/status/jobs/${jobId}`)
    .then(res => res.json())
    .catch(err => console.log(err))
  if (job !== null) {
    // console.log(`waiting to process feedversion: ${job.feedVersion.id}`)
    if (!versionIdForJobId.hasOwnProperty(jobId)) {
      versionIdForJobId[jobId] = job.feedVersionId
    }
  }
  return job !== null && !job.status.completed
}

async function waitForJobToFinish (jobId) {
  while (await jobIsActive(jobId)) {
    sleep(1000)
  }
  console.log(`Job ${jobId} just finished`)
}

async function doFeedVersionThing (taskName, projectId) {
  const name = `test-${taskName}`
  // Create a new feed source for each version because otherwise the server will detect duplicate uploads
  const feedSource = await createFeedSource({name, projectId})
  console.log(`Created feedSource: ${feedSource.name} (${feedSource.id})`)
  console.log(`Uploading file from ${FEED_PATH}`)
  const jobId = await uploadFeedVersion(feedSource, FEED_PATH)
  const testStatus = {
    startTime: new Date(),
    finishedProcessingTime: null,
    finishedGraphQLRequest: null,
    passed: false
  }
  taskMap[jobId] = testStatus
  // listOfVersions.push(feedVersion.id)
  console.log(`Processing feed version job: ${jobId}`)
  // wait for job to finish processing before making graphql requests
  await waitForJobToFinish(jobId)
  testStatus.finishedProcessingTime = new Date()
  // make graphql requests against newly created feed version
  const feedVersionId = versionIdForJobId[jobId]
  const graphqlResponse = await makeGraphQLRequests(feedVersionId)
  testStatus.finishedGraphQLRequest = new Date()
  validateGraphQlResponse(testStatus, graphqlResponse)
  return testStatus.passed
}

function validateGraphQlResponse (testStatus, graphqlResponse) {
  testStatus.passed = graphqlResponse.feed.row_counts.stops === graphqlResponse.feed.stops.length
}

async function makeGraphQLRequests (feedVersionId) {
  // get postgres unique id
  const feedVersion = await getFeedVersion(feedVersionId)
  const {namespace} = feedVersion
  console.log(`fetching graphql for ${namespace}`)

  // make graphql request
  return fetch(GRAPHQL_ENDPOINT,
    {
      method,
      body: JSON.stringify({
        query: GRAPHQL_STOPS_QUERY,
        variables: {namespace}
      })
    })
    .then(res => res.json().data)
    // .then(json => {
    //   // console.log(`graphql response: ${JSON.stringify(json)}`)
    //
    // })
    .catch(err => console.log(err))
}

function sleep (msec) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

async function task (threadId, taskId, projectId) {
  const taskName = threadId + '-' + taskId
  console.log('starting ' + taskName)
  await doFeedVersionThing(taskName, projectId)
  // await sleep(1000)
  console.log('finished ' + taskName)
}

async function seriesWork (threadId, projectId) {
  for (var i = 0; i < NUM_FEEDSOURCES; i++) {
    await task(threadId, 'task_' + i, projectId)
  }
}

async function parallelWork (projectId) {
  var seriesTasks = []
  for (var i = 0; i < CONCURRENCY; i++) {
    seriesTasks.push(seriesWork('thread_' + i, projectId))
  }
  await Promise.all(seriesTasks)
  const executionTimes = []
  const testStatusList = Object.values(taskMap)
  for (const testStatus of testStatusList) {
    try {
      if (testStatus.passed) {
        const executionTime = testStatus.finishedProcessingTime - testStatus.startTime
        executionTimes.push(executionTime)
      }
    } catch (e) {
      // do not record execution time because the test failed to complete
    }
  }
  let nTotalTests = CONCURRENCY * NUM_FEEDSOURCES
  let nFailedTests = nTotalTests - executionTimes.length
  console.log(`Number of failed tests: ${nFailedTests} out of ${nTotalTests} total`)
  executionTimes.sort()
  const min = executionTimes[0]
  const max = executionTimes[executionTimes.length - 1]
  const median = executionTimes[Math.floor(executionTimes.length / 2)]
  console.log(`Feed processing time (milliseconds): MIN - ${min}    MAX - ${max}    MED - ${median}`)
}

// Total volume of data to load, plus how much of it you want to run parallel
// Rename functions, parameters
// Make typesafe (use types.js)
exports.run = async function () {
  console.log(`Using application URL: ${process.env.app_url}`)

  // create initial project
  const proj = {name: 'tester 1'}
  const p = await createProject(proj)
  const {id: projectId} = p
  console.log(`Created project: ${projectId}`)
  console.log(`Creating ${NUM_FEEDSOURCES * CONCURRENCY} feed sources`)

  // Make concurrent parallel requests to create feed versions
  parallelWork(projectId)
}

require('make-runnable')
