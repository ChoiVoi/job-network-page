import { BACKEND_PORT } from './config.js';
import { fileToDataUrl, defaultPic } from './helpers.js';

let start = 0;
let hasAppended = false;
let feed_scroll = 0;
const loginButton = document.getElementById('login-button');
const jobFeed = document.getElementById('feed-items');
const update_popup = document.getElementById('edit-or-delete-job');
const edit_post_button = document.getElementById('edit-post');
const delete_post_button = document.getElementById('delete-post');

const show = (element) => {
    document.getElementById(element).classList.remove('hide');
    if (element === 'page-login' || element === 'section-logged-in') {
        document.getElementById("view-profile-of-user").addEventListener('click', () => {
            visitProfile(parseInt(localStorage.getItem('userId')))
        });
    }
};

const hide = (element) => {
    document.getElementById(element).classList.add('hide');  
};

const apiCall = (path, method, payload, success) => {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const url = new URL('http://localhost:5005/' + path);

    if (method === 'GET') {
        Object.keys(payload).forEach(key => url.searchParams.append(key, payload[key]));
    } else {
        options.body = JSON.stringify(payload);
    }

    if (localStorage.getItem('token')) {
        options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }

       fetch(url, options)
        .then((response) => {
            response.json()
                .then((data) => {
                    if (data.error && path.includes('user') && method === 'PUT') {
                        // fix this
                        alert(data.error);
                    } else if (data.error && !path.includes('job/feed')) {
                        error_box(data.error, loginButton);
                    } else if (success) {
                        success(data);
                    }
                });
        });
};

// login
document.getElementById('login-button').addEventListener('click', (event) => {
    event.preventDefault();
    const loginEmail = document.getElementById('login-email').value;
    const loginPassword = document.getElementById('login-password').value;
    const loginButton = document.getElementById('login-button');

    if (!loginEmail) {
        loginButton.disabled = true;
        error_box("Enter email", loginButton);
        return;
    } else if (!loginPassword) {
        loginButton.disabled = true;
        error_box("Enter password", loginButton);
        return;
    }

    const payload = {
        email: loginEmail,
        password: loginPassword
    }

    apiCall('auth/login', 'POST', payload, (data) => {
        setToken(data.token, data.userId);
    });
});

// register
document.getElementById('register-button').addEventListener('click', (event) => {
    event.preventDefault();
    const registerEmail = document.getElementById('register-email').value;
    const registerName = document.getElementById('register-name').value;
    const registerPassword = document.getElementById('register-password').value;
    const registerConfirmPassword = document.getElementById('register-confirm-password').value;
    const registerButton = document.getElementById('register-button');
    
    if (!registerEmail) {
        registerButton.disabled = true;
        error_box("Enter email", registerButton);
        return
    } else if (!registerName) {
        registerButton.disabled = true;
        error_box("Enter name", registerButton);
        return
    } else if (!registerPassword) {
        registerButton.disabled = true;
        error_box("Enter password", registerButton);
        return
    } else if (!registerConfirmPassword) {
        registerButton.disabled = true;
        error_box("Confirm password", registerButton);
        return
    } else if (registerPassword !== registerConfirmPassword) {
        registerButton.disabled = true;
        error_box("Passwords do not match", registerButton);
        return
    }

    const payload = {
        email: registerEmail,
        password: registerPassword,
        name: registerName
    }

    apiCall('auth/register', 'POST', payload, (data) => {
        setToken(data.token, data.userId);
    });
});

document.getElementById('nav-register').addEventListener('click', () => {
    show('page-register');
    hide('page-login');
});

document.getElementById('nav-login').addEventListener('click', () => {
    hide('page-register');
    show('page-login');
});

// nav-bar

document.getElementById('nav-home').addEventListener('click', () => {
    const userProfile = document.getElementById('user-profile');
    userProfile.textContent = '';
    hide('page-profile');
    hide('edit-or-delete-job');
    hide('comments-page');
    show('page-home');
    hide('create-job');
});

document.getElementById('logout').addEventListener('click', () => {
    hide('page-profile');
    show('page-home');
    show('section-logged-out');
    hide('section-logged-in');
    hide("edit-or-delete-job");
    hide('create-job');
    stopInterval();
    localStorage.removeItem('token');
});

// create a job button
const create_job_button = document.getElementById('create-job-fake');
create_job_button.addEventListener('click', () => {
    hide("page-home");
    hide("page-profile");
    hide("edit-or-delete-job");
    hide('create-job-fake');
    show('create-job');
    hide('comments-page');
});

// create a job form
const post_button = document.getElementById("post-job");
post_button.addEventListener('click', () => {
    const job_title = document.getElementById('title').value;
    const job_description = document.getElementById('description').value;
    const job_image = document.getElementById('image').files[0];
    const today = new Date();
    const today_ISOFormat = today.toISOString();
    fileToDataUrl(job_image).then((img_promise) => {
        const payload =
        {
            "title": job_title,
            "image": `${img_promise}`,
            "start": today_ISOFormat,
            "description": job_description,
        }
        apiCall('job', 'POST', payload);
    })
    show("page-home");
});

document.getElementById('watch-email-button').addEventListener('click', () => {
    const email = document.getElementById('watch-email-input').value;
    const payload = {
        email: email,
        turnon: true
    }

    apiCall('user/watch', 'PUT', payload, () => populateFeed());
});

// Profile

const toggleUpdateProfileForm = (buttonElement, formContainerRef, formVisible) => {
    if (formVisible.value) {
        formContainerRef.current.remove();
        formVisible.value = false;
    } else {
        if (formContainerRef.current) {
            formContainerRef.current.remove();
        }

        const formContainer = document.createElement('div');
        formContainer.classList.add('form-container');

        const form = document.createElement('form');
        form.classList.add('update-profile-form', 'form-styling');

        const emailInput = document.createElement('input');
        emailInput.id = 'updateEmail';
        emailInput.type = 'text';
        emailInput.name = 'email';
        emailInput.placeholder = 'Email';
        
        const passwordInput = document.createElement('input');
        passwordInput.id = 'updatePassword';
        passwordInput.type = 'password';
        passwordInput.name = 'password';
        passwordInput.placeholder = 'Password';
        
        const nameInput = document.createElement('input');
        nameInput.id = 'updateName';
        nameInput.type = 'text';
        nameInput.name = 'name';
        nameInput.placeholder = 'Name';
        
        const imageInput = document.createElement('input');
        imageInput.id = 'updateImage';
        imageInput.type = 'file';
        imageInput.placeholder = 'image';
        imageInput.classList.add("form-control");
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.innerText = 'Submit';

        form.append(emailInput, passwordInput, nameInput, imageInput, submitButton);
        formContainer.append(form);
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            try {
                const email = document.getElementById('updateEmail').value;
                const password = document.getElementById('updatePassword').value;
                const name = document.getElementById('updateName').value;
                const image = document.getElementById('updateImage').files;
                if (!email) {
                    error_box("Enter email", submitButton);
                    return
                } else if (!name) {
                    error_box("Enter name", submitButton);
                    return
                } else if (!password) {
                    error_box("Enter password", submitButton);
                    return
                }

                const payload = {
                    email: email,
                    password: password,
                    name: name,
                }

                if (image.length == 1) {
                    fileToDataUrl(image[0])
                        .then((url) => {
                            payload.image = url;
                            apiCall('user', 'PUT', payload, () => {
                                visitProfile(parseInt(localStorage.getItem('userId')));
                            });
                    })
                }
            } catch (error) {
                error_box(error.data, submitButton);
            }
        });

        buttonElement.parentElement.after(formContainer);
        formVisible.value = true;

        formContainerRef.current = formContainer;
    }
}

// visit profile
const visitProfile = (uId) => {
    hide('page-home');
    show('page-profile');
    hide("edit-or-delete-job");
    hide('create-job-fake');
    hide('create-job');
    hide('comments-page');

    const payload = { userId : parseInt(uId) };
    apiCall('user', 'GET', payload, (user) => {
        const userProfile = document.getElementById('user-profile');
        userProfile.textContent = '';

        // personal info and who watches them
        const userInfo = document.createElement('div');
        userInfo.classList.add("user-info");
        userProfile.append(userInfo);

        const profilePic = document.createElement('img');
        profilePic.setAttribute('height', '200');
        profilePic.setAttribute('alt', 'profile pic');
        if ('image' in user) {
            profilePic.setAttribute('src', user.image);
        } else {
            profilePic.setAttribute('src', defaultPic);
        }

        const name = document.createElement('h3');
        name.textContent = user.name

        const email = document.createElement('p');
        email.textContent = user.email

        const watchButton = document.createElement('button');
        if (user.watcheeUserIds.includes(parseInt(localStorage.getItem('userId')))) {
            watchButton.textContent = 'Watching';
        } else {
            watchButton.textContent = 'Watch';
        }
        watchButton.addEventListener('click', () => {
            const isWatching = watchButton.textContent === 'Watching';
            watchButton.textContent = isWatching ? 'Watch' : 'Watching';
            const payload = {
                email: user.email,
                turnon: !isWatching
            }

            apiCall('user/watch', 'PUT', payload, () => visitProfile(uId));
            
        });


        const watchers = document.createElement('div');
        watchers.id = 'watchers';

        const watchersCount = document.createElement('p');
        watchersCount.className = 'watchers-count';
        watchersCount.textContent = `${user.watcheeUserIds.length} watching:`;

        watchers.append(watchersCount);

        userInfo.appendChild(profilePic);
        userInfo.appendChild(name);
        userInfo.appendChild(email);
        userInfo.appendChild(watchButton);
        userInfo.appendChild(watchers);
        
        // update profile component 

        if (uId === parseInt(localStorage.getItem('userId'))) {
            const updateProfile = document.createElement('button');
            userInfo.append(updateProfile);
            updateProfile.textContent = 'Update Profile';

            const formContainerRef = { current: null };
            let formVisible = { value: false };

            updateProfile.addEventListener('click', function() {
                toggleUpdateProfileForm(this, formContainerRef, formVisible);
            });
        }

        const userList = document.createElement('ul');
        watchers.append(userList);

        // show people who watch this user
        
        user.watcheeUserIds.forEach((w, index) => {
            const payloadd = { userId : w};
            apiCall('user', 'GET', payloadd, (watcherInfo) => {
                const listItem = document.createElement('li');
                const userLink = document.createElement('button');
                userLink.className='user-link';
                userLink.textContent = watcherInfo.name;
                userLink.addEventListener('click', () => {
                    visitProfile(watcherInfo.id);
                });
                listItem.appendChild(userLink);
                userList.appendChild(listItem);
            });
        });

        // jobs

        user.jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.classList.add('card');
            userProfile.appendChild(jobCard);

            const createdAt = new Date(job.createdAt);
            const now = new Date();
            const diff = (now - createdAt) / (1000 * 60 * 60);
            const hours = Math.floor(diff);
            const minutes = Math.round((diff - hours) * 60);
            const timeDisplay = hours < 24
            ? `${hours}h ${minutes}m ago`
            : `${createdAt.getDate()}/${createdAt.getMonth() + 1}/${createdAt.getFullYear()}`;
            const header = document.createElement('div');
            header.innerText = `Posted by ${user.name} ${timeDisplay}`;
            jobCard.appendChild(header);

            const image = document.createElement('img');
            image.classList.add("card-img-top");
            image.setAttribute('src', job.image);
            image.setAttribute('alt', 'Job Image');
            jobCard.append(image);

            const content = document.createElement('div');
            content.classList.add("card-body");

            const title = document.createElement('h3');
            title.classList.add('card-title');
            title.textContent = job.title;

            const startingDate = document.createElement('p');
            const startDate = new Date(job.start);
            startingDate.textContent = `Start: ${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
            
            content.append(title);
            content.append(startingDate);

            const description = document.createElement('p');
            description.classList.add('card-text');
            description.textContent = job.description;
            content.appendChild(description);

            if (job.creatorId == localStorage.getItem('userId')) {
                const update_post_button = document.createElement("button");
                update_post_button.textContent = "edit or delete the post";
                content.appendChild(update_post_button);
                update_post_button.addEventListener('click', () => {
                    update_popup.style.display = 'block';
                    hide('page-profile');

                    delete_post_button.addEventListener('click',() => {
                        const payload = {
                            id: job.id
                        }
                        apiCall('job', 'DELETE', payload);
                        update_popup.style.display = 'none';
                    })

                    edit_post_button.addEventListener('click',() => {
                        const new_job_title = document.getElementById('new-title').value;
                        const new_job_description = document.getElementById('new-description').value;
                        const new_job_image = document.getElementById('new-image').files[0];
                        const new_start_date = new Date();
                        const new_ISO = new_start_date.toISOString();
                        fileToDataUrl(new_job_image).then((img_promise) => {
                            const payload = {
                                id: job.id,
                                title: new_job_title,
                                image: `${img_promise}`,
                                start: new_ISO,
                                description: new_job_description
                            }
                            apiCall('job', 'PUT', payload);
                            update_popup.style.display = 'none';
                        });
                    })

                })
            }
            jobCard.appendChild(content);
        });
        
    });
};

// view profile buttons

const createViewProfileButton = (uid, name) => {
    const viewButton = document.createElement('button');
    viewButton.classList.add('user-link');
    viewButton.setAttribute('userId', `${uid}`);
    viewButton.textContent = name;
    viewButton.addEventListener('click', () => {
        visitProfile(uid);
    });
    return viewButton;
}

// job posting
const createJobPost = (feedItem, feedDom) => {
    const payload = { userId : feedItem.creatorId };
    apiCall('user', 'GET', payload, (creator) => {
        // Populate feedDom
        while (feedDom.firstChild)
            feedDom.removeChild(feedDom.firstChild);
        const createdAt = new Date(feedItem.createdAt);
        const now = new Date();
        const diff = (now - createdAt) / (1000 * 60 * 60);
        const hours = Math.floor(diff);
        const minutes = Math.round((diff - hours) * 60);
        const timeDisplay = hours < 24
        ? `${hours}h ${minutes}m ago`
        : `${createdAt.getDate()}/${createdAt.getMonth() + 1}/${createdAt.getFullYear()}`;
        const header = document.createElement('div');
        const userLink = createViewProfileButton(creator.id, creator.name);
        header.append(`Posted by `, userLink, ` ${timeDisplay}`);

        feedDom.appendChild(header);

        const image = document.createElement('img');
        image.classList.add("card-img-top");
        image.setAttribute('src', feedItem.image);
        image.setAttribute('alt', 'Job Image');
        feedDom.append(image);

        const content = document.createElement('div');
        content.classList.add("card-body");

        const title = document.createElement('h3');
        title.classList.add('card-title');
        title.textContent = feedItem.title;

        const startingDate = document.createElement('p');
        const startDate = new Date(feedItem.start);
        startingDate.textContent = `Start: ${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;

        // like button
        const likes = document.createElement('div');
        likes.textContent = `${Object.keys(feedItem.likes).length} likes`;
        const likers = document.createElement('div');
        const likeButton = document.createElement('button');

        if (Object.keys(feedItem.likes).length == 0) {
            likers.textContent = 'no one likes the job yet';
            likeButton.textContent = "Like";
        } else {
            let text = document.createElement('span');
            likers.appendChild(text);
            for (let i = 0; i < Object.keys(feedItem.likes).length; i++) {
                const userLink = createViewProfileButton(feedItem.likes[i].userId, feedItem.likes[i].userName);
                text.append(userLink, ', ');
            }
            text.removeChild(text.lastChild);
            text.append(' liked the job');
        }

        for (let i = 0; i < Object.keys(feedItem.likes).length; i++) {
            if (feedItem.likes[i].userId == localStorage.getItem('userId')) {
                likeButton.textContent = "Unlike";
                break;
            } else {
                likeButton.textContent = "Like";

            }
        }

        likeButton.addEventListener('click', () => {
            const user_payload = { userId : `${localStorage.getItem('userId')}` };
            apiCall('user', 'GET', user_payload, () => {
                if (likeButton.textContent == "Like") {
                    const payload = {
                        id: parseInt(feedItem.id),
                        turnon: true
                    };
                    apiCall('job/like', 'PUT', payload, () => {
                        likes.textContent = `${Object.keys(feedItem.likes).length + 1} likes`;
                        likeButton.textContent = "Unlike";
                    });
                } else {
                    const payload = {
                        id: feedItem.id,
                        turnon: false
                    };
                    apiCall('job/like', 'PUT', payload, () => {
                        likes.textContent = `${Object.keys(feedItem.likes).length} likes`;
                        likeButton.textContent = "Like";
                    });
                }
            });
        });

        content.appendChild(likers);
        content.appendChild(likes);
        content.appendChild(likeButton);
        content.append(title);
        content.append(startingDate);

        const description = document.createElement('p');
        description.classList.add('card-text');
        description.textContent = feedItem.description;
        content.appendChild(description);

        // comments
        const comments = document.createElement('p');
        comments.textContent = `${feedItem.comments.length} comments`;
        content.appendChild(comments);

        const comments_button = document.createElement('button');
        if (feedItem.comments.length == 0) {
            comments_button.textContent = 'no comments';
        } else {
            comments_button.textContent = "see comments / leave comments";
        }
        const comments_page = document.getElementById('see-comments');
        let comments_list = document.getElementById('list-of-comments');

        comments_button.addEventListener('click', () => {
            if (hasAppended) {
                console.log("true");
                comments_list.innerHTML = '';
            }
            comments.textContent = '';
            hasAppended = true;
            hide('page-home');
            show('comments-page');
            for (let i = 0; i < feedItem.comments.length; i++) {
                comments.appendChild(comments_list);
                const newline = document.createElement('br');
                ((comments_list) => {
                    const payload = { userId : feedItem.comments[i].userId };
                    apiCall('user', 'GET', payload, (user) => { 
                        const userLink = createViewProfileButton(user.id, user.name);
                        comments_list.append(userLink, `: ${feedItem.comments[i].comment}`);
                        comments_list.append(newline);
                    });
                })(comments_list);
            }

            const leaveBtn = document.getElementById('leave-comments-button');
            const comment_text = document.getElementById('comments-text-box');
            leaveBtn.addEventListener('click', () => {
                let comment_content = comment_text.value;
                const payload = {
                    id : feedItem.id,
                    comment: comment_content
                }
                apiCall('job/comment', 'POST', payload);
                show('page-home');
            });
            comments_page.appendChild(comments);

        })

        content.appendChild(comments_button);

        // update post
        if (feedItem.creatorId == localStorage.getItem('userId')) {
            const update_post_button = document.createElement("button");
            update_post_button.textContent = "edit or delete the post";
            update_post_button.addEventListener('click', () => {
                show('edit-or-delete-job');
                hide('page-home');
                hide('comments-page');

                delete_post_button.addEventListener('click',() => {
                    const payload = {
                        id: feedItem.id
                    }
                    apiCall('job', 'DELETE', payload, () => {
                        while (jobFeed.firstChild)
                            jobFeed.removeChild(jobFeed.firstChild);
                        feed_scroll = 0;
                        populateFeed();
                    });
                    hide('edit-or-delete-job');
                    show('page-home');
                })

                edit_post_button.addEventListener('click',() => {
                    const new_job_title = document.getElementById('new-title').value;
                    const new_job_description = document.getElementById('new-description').value;
                    const new_job_image = document.getElementById('new-image').files[0];
                    const new_start_date = new Date();
                    const new_ISO = new_start_date.toISOString();
                    fileToDataUrl(new_job_image).then((img_promise) => {
                        const payload = {
                            id: feedItem.id,
                            title: new_job_title,
                            image: `${img_promise}`,
                            start: new_ISO,
                            description: new_job_description
                        }
                        apiCall('job', 'PUT', payload);
                        hide('edit-or-delete-job');
                        show('page-home');
                    });
                })

            })
            content.appendChild(update_post_button);
        }
        
        feedDom.appendChild(content);
    });
}

window.onscroll = function() {
    if (document.getElementById('feed-items').style.display === 'block') {
        if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight
            && !document.getElementById('section-logged-in').classList.contains('hide')
            && !document.getElementById('page-home').classList.contains('hide')) {
            populateFeed();
        }
    }   
};

const closeButton = (item, button_able) => {
    let closeButton = document.createElement("button");
    closeButton.textContent = "x";
    closeButton.addEventListener('click',() => {
        document.body.removeChild(item);
        button_able.disabled = false;
    });
    item.appendChild(closeButton);
}

const error_box = (error_message, disabled_button) => {
    let msgBox = document.createElement("div");
    msgBox.style.border = "10px solid black";
    msgBox.style.position = "absolute";
    msgBox.style.top = "100px";
    msgBox.style.left = "700px";
    msgBox.style.backgroundColor = "white";
    msgBox.style.padding = "50px";
    let msg = document.createElement("p");
    msg.textContent = error_message;
    msgBox.appendChild(msg);
    document.body.appendChild(msgBox);
    closeButton(msgBox, disabled_button);
}

// Polling

let intervalId = [];
let following = new Map();
let followingIntervalId = [];

const refreshPost = (feedDom, id) => {
    apiCall(`job/feed?start=0`, 'GET', {}, (data) => {
        for (const feedItem of data) {
            if (feedItem.id === id) {
                createJobPost(feedItem, feedDom);
            }
        }
    });
};

const populateFeed = () => {
    jobFeed.style.display = 'block';
    apiCall(`job/feed?start=${feed_scroll}&n=5`, 'GET', {}, (data) => {
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        for (let i = 0; i < data.length; i++) {
            const feedItem = data[i];
            const feedDom = document.createElement('div');
            feedDom.classList.add('card');
            jobFeed.appendChild(feedDom);

            // event listener to refresh the first 5 for live update
            if (i < 5)
                intervalId.push(setInterval(() => refreshPost(feedDom, feedItem.id), 1000));
            createJobPost(feedItem, feedDom);
        }
    });
    feed_scroll += 5;
};

const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
  
    setTimeout(() => {
      notification.classList.remove('show');
    }, 10000);
}

const pushNotifications = (id) => {
    const payload = { userId : id };
    apiCall('user', 'GET', payload, (info) => {
        if (following.get(id) !== -1 && following.get(id) < info.jobs.length)
            showNotification(`Job posted by ${info.name}`);
        else if (following.get(id) !== -1 && following.get(id) > info.jobs.length)
        showNotification(`Job deleted by ${info.name}`);
        following.set(id, info.jobs.length);
    });
}

const findFollowing = (count) => {
    apiCall(`job/feed?start=${count}`, 'GET', {}, (data) => {
        const userIds = data.map(job => job.creatorId);
        userIds.forEach( userId => {
            if (!following.has(userId)) {
                following.set(userId, -1);
                followingIntervalId.push(setInterval(() => pushNotifications(userId), 5000));
            }
        });
        if (data.length > 0)
            findFollowing(count + data.length);
    });
}

function stopInterval() {
    for (let interval of intervalId)
        clearInterval(interval);
    for (let interval of followingIntervalId)
        clearInterval(interval);
    intervalId = [];
}

// MAIN

const setToken = (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    show('section-logged-in');
    hide('section-logged-out');
    while (jobFeed.firstChild)
        jobFeed.removeChild(jobFeed.firstChild);
    feed_scroll = 0;
    findFollowing(0);
    populateFeed(start);
};

if (localStorage.getItem('token')) {
    show('section-logged-in');
    hide('section-logged-out');
    findFollowing(0);
    populateFeed();
}