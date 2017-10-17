
// Dependency imports

// Parses HTML
var cheerio = require('cheerio')
// API Routing 
var express = require('express')
// Get HTML pages
var request = require('request')
// Time library that's op
var moment = require('moment')

// Configuration //

// Port that the API will listen on
const port = 9000
// Base URL that the workouts are listed on
const baseUrl = 'http://crossfitbriercreek.com/workouts';

// Create express app instance
let app = express()

// GET /api/calendar/today
// Creates a handler that gets the schedule for today
app.get('/api/calendar/today', async (req, res) => {
  // Get todays date            // Example values
  let now = moment().format("MM-DD-YY")
  let workouts = await getWorkout(now)
  return res.json({
    success: true,
    workouts: workouts.allWorkouts,
    description: workouts.detailedDescription,
  })
})

// GET /api/calendar/:date
// Gets a workout scheduler for a given date
app.get('/api/calendar/:date', async (req, res) => {
  date = req.params.date || '';
  if (!date || date == '') {
    res.status(400)
    return res.json({
      success: false,
      message: 'no date given'
    })
  }

  // try to parse the date for a given format
  if (!moment(date, 'M-DD-YY').isValid()) {
    res.status(400)
    return res.json({
      success: false,
      message: 'invalid date given. provide using format like <10-09-17> or <1-23-17>'
    })
  }

  try {
    workouts = await getWorkout(date)
    return res.json({
      success: true,
      workouts: workouts.allWorkouts,
      description: workouts.detailedDescription,
    })
  } catch (e) {
    console.error(e)
    res.status(400)
    return res.json({
      success: false,
      message: 'could not get meetings'
    })
  }


})

// getWorkout returns the workout for the given date
const getWorkout = async (date) => {
  return new Promise(async (resolve, reject) => {

    // Workout URLs are formatted as such:
    // http://crossfitbriercreek.com/workouts/10-19-17
    // or 
    // http://crossfitbriercreek.com/workouts/<day>
    // Create the URL with the expected date format
    url = `${baseUrl}/${date}`;  // example => http://crossfitbriercreek.com/workouts/10-16-17

    console.log(`obtaining a schedule for ${url}`)

    try {

      // Get the HTML of the page
      // await keyword means that it will wait for this function to
      // complete before continuing this request.
      let scheduleHTML = await getHTML(url)

      // Load HTML into cheerio module
      let $ = cheerio.load(scheduleHTML)

      // variables to track the workout text
      let allWorkouts = []
      let detailedDescription = ""

      // Find the article containing the workouts
      let article = $('section.post_content')

      // Workouts are split between unordered lists and paragraphs
      // Paragraphs usually contain a detailed response of what 
      // kind of workout it is going to be with items that are 
      // related to that workout
      // Split the findings between <p> tags and see if there are
      // unordered lists after the specific <p> tag
      let paragraphs = article.find('p')

      // Loop through the list in order to find the specified workouts
      // ul.each((index, element) => {
      //   // Get the workout text from the list element
      //   let workoutItem = $(element).text()
      //   // Add it to the workout list
      //   workoutList.push(workoutItem)
      // })

      // Loop through each <p> tag.. try to parse it as a date
      // if it's not a date, then it's more than likely the 
      // detailed description that we are looking for.
      paragraphs.each((index, element) => {
        // We only want to process <p> tags that are within the root scope of the <section> tags
        if ($(element).parent()[0].name == 'section') {
          // Do we have a <ul> next?
          let next = $(element).next()

          console.log($(element).text())
          console.log($(element).next())
          console.log('========\n\n')

          // we have our workout and items related to it are next
          if (next[0] && next[0].name == 'ul' && next[0].type == 'tag') {

            // Represents a single workout for a given day.
            // Sometimes there are multiple workouts in one day.

            let headerText = $(element).text()
            // Remove the colon from the workout headers
            // Example "Bench Press:" => "Bench Press"
            headerText = headerText.replace(':', '')

            let localWorkout = {
              header: headerText,
              list: []
            }

            // Parse the workout list
            let workoutList = $(next).find('li')
            workoutList.each((index, workoutElement) => {
              let workoutText = $(workoutElement).text()
              localWorkout.list.push(workoutText)
            })

            // Add the workout to the overall worklist for the given day
            allWorkouts.push(localWorkout)

          } else {

            // This is more than likely a detailed description of the day or a date.
            // Sometimes, there are multiple paragraphs for the day, so we are 
            // appending the description in the case that there are mutltiple 
            // paragraphs in the day.

            // First we want to try and parse it as a date. Every workout starts with a 
            // date within <p> tags. What a terrible design... Patty.. tell him to figure it out.
            let paragraphText = $(element).text()
            if (!moment(paragraphText, "dddd, MMMM DD, YYYY").isValid()) {
              detailedDescription += $(element).text()
            }
          }
        }


      })

      // Resolve the promise and return the workouts
      return resolve({
        allWorkouts,
        detailedDescription,
      })
    } catch (e) {
      // Something wrong happened when obtaining the schedule
      return reject(e)
    }
  })
}

// getHTML gets HTML for a given URL
// Wrap the function within a promise
// Resolve the promise once the request has been completed,
// Reject the promise if there is an error
const getHTML = async (url) => {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url: url
    }, (err, response, body) => {
      if (err) {
        return reject(err)
      } else {
        return resolve(body)
      }
    })
  })
}


console.log(`BCCF API listening on port ${port}`)
app.listen(port)
