# Vanilla JS

## Getting started

### The Frontend

To do this, run the following command once on your machine:

`$ npm install --global http-server`

Then whenever you want to start your server, run the following in your project's root folder:

`$ npx http-server frontend -c 1 -p 5050`

### The Backend

To run the backend server, simply run `yarn start` in the `backend` directory. This will start the backend.

To view the API interface for the backend you can navigate to the base URL of the backend (e.g. `http://localhost:5005`). This will list all of the HTTP routes that you can interact with.

### Browser Compatibility
 * Google Chrome


## Information

Build a frontend for popular professional social networking tool [LinkedIn](https://linkedin.com/).

The requirements describe a series of **screens**. Screens can be popups/modals, or entire pages. The use of that language is so that you can choose how you want it to be displayed. A screen is essentially a certain state of your web-based application.



### Registration & Login

This focuses on the basic user interface to register and log in to the site.

#### Login
 * When the user isn't logged in, the site shall present a login form that contains:
   * an email field (text)
   * a password field (password)
   * submit button to login
 * When the submit button is pressed, the form data should be sent to `POST /auth/login` to verify the credentials. If there is an error during login an appropriate error should appear on the screen.

#### Registration
 * When the user isn't logged in, the login form shall provide a link/button that opens the register form. The register form will contain:
   * an email field (text)
   * a name field (text)
   * a password field (password)
   * a confirm password field (password) - not passed to the backend, but an error should be thrown on submit if it doesn't match the other password
   * submit button to register
 * When the submit button is pressed, if the two passwords don't match the user should receive an error popup. If they do match, the form data should be sent to `POST /auth/register` to verify the credentials. If there is an error during registration an appropriate error should appear on the screen.

#### Error Popup
 * Whenever the frontend or backend produces an error, there shall be an error popup on the screen with a message (either a message derived from the backend error response, or one meaningfully created on the frontend).
 * This popup can be closed/removed/deleted by pressing an "x" or "close" button.

#### Basic Feed

The application should present a "feed" of user content on the home page derived `GET /job/feed`. Note that the feed will only return information from people that the logged in user is watching.

The jobs should be displayed in reverse chronological order (most recent jobs first). 

Each job should display:
1. Who the job post was made by
2. When it was posted
  * If the job was posted today (in the last 24 hours), it should display how many hours and minutes ago it was posted
  * If the job was posted more than 24 hours ago, it should just display the date DD/MM/YYYY that it was posted
3. The job content itself. The job content includes the following:
  * An image to describe the job (jpg in base64 format)
  * A title for the new job (just as a string)
  * A starting date for the job (just as a string)
  * How many likes it has (or none)
  * The job description text
  * How many comments the job post has

#### Show likes on a job
* Allow a user to see a list of all users who have liked a job. In terms of how it is displayed, consider your preferred user experience approach out of the following 3 options:
  * The list of names is visible on each job in the feed by default
  * The list of names is visible on a job in the feed if a show/hide toggle is clicked (hidden by default).
  * The list of names is visible in a popup, modal, or new screen, when a button/link is clicked on the feed.

#### Show comments on a job
* Allow a user to see a list of all the comments on the job. Each comment should contain at minimum the user's name and their comment. In terms of how it is displayed, consider your preferred user experience approach out of the following 3 options:
  * The list of names and comments are visible on each job in the feed by default
  * The list of names and comments are visible on a job in the feed if a show/hide toggle is clicked (hidden by default).
  * The list of names and comments are visible in a popup, modal, or new screen, when a button/link is clicked on the feed.

#### Liking a job
* A user can like a job on their feed and trigger a api request (`PUT /job/like`)

#### Viewing others' profiles
* Let a user click on a user's name from a job, like, or comment, and be taken to a profile screen for that user.
* The profile screen should contain any information the backend provides for that particular user ID via (`GET /user`).
* The profile should also display all jobs made by that person. You are not required to show likes and/or comments for each job here.
* The profile should also display somewhere all other users this profile is watched by (information via `GET /user`). This should consist of a list of names (which for each name links to another profile), as well as a count somewhere on the page that shows the total number of users they are watched by.

#### Viewing your own profile
* Users can view their own profile as if they would any other user's profile
* A link to the users profile (via text or small icon) should be visible somewhere common on most screens (at the very least on the feed screen) when logged in.

#### Updating your profile
* Users can update their own personal profile via (`PUT /user`). This allows them to update their:
  * Email address
  * Password
  * Name
  * Image

#### Watching / Unwatching
* Watching on user profiles:
  * When a logged in user is visiting another user's profile page, a button should exist that allows them to "watch" the other user (via `PUT user/watch`).
  * If the logged in user already watches this person, an unwatch button should exist.
* Somewhere on the feed screen a button should also exist that prompts the enter to enter an email address in a popup. When entered, the email address is sent to `PUT /user/watch` to watch that particular user.

#### Adding a job
* Users can upload and job new content from a modal, component, or seperate screen via (`POST /job`)
* How users open this component, modal, or separate screen can be found in a single or multiple places, and should be easily and clearly accessible.

#### Updating & deleting a job
* Let a user update a job they made or delete it via (`DELETE /job`) or (`PUT /job`).

#### Leaving comments
* Users can write comments on "jobs" via (`POST /job/comment`)

#### Infinite Scroll
* Instead of pagination, users an infinitely scroll through results. For infinite scroll to be properly implemented you need to progressively load jobs as you scroll. 

#### Live Update
* If a user likes a job or comments on a job, the job's likes and comments should update without requiring a page reload/refresh. This should be done with some kind of polling.

#### Push Notifications
* Users can receive push notifications when a user they watch posts a job. To know whether someone or not has posted a job, you must "poll" the server (i.e. intermittent requests, maybe every second, that check the state). You can implement this either via browser's built in notification APIs or through your own custom built notifications/popups. The notifications are not required to exist outside of the webpage.
