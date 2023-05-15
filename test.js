import { BACKEND_PORT } from './config.js';
import { fileToDataUrl } from './helpers.js';

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
                    if (data.error) {
                        alert(data.error);
                    } else if (success) {
                        success(data);
                    }
                });
        });
};

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
        setToken(data.token);
    });
});

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
        setToken(data.token);
    });
});

document.getElementById('create-job-fake').addEventListener('click', () => {
    const payload =
    {
        "title": "cool",
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
        "start": "2011-10-05T14:48:00.000Z",
        "description": "Dedicated technical wizard with a passion and interest in human relationships",
    }
    apiCall('job', 'POST', payload);
});

let page = 0;
const populateFeed = () => {
    apiCall(`job/feed?start=${page}`, 'GET', {}, (data) => {
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const jobFeed = document.getElementById('feed-items');
        for (const feedItem of data) {
            const feedDom = document.createElement('div');
            feedDom.classList.add('card');
            jobFeed.appendChild(feedDom);

            // Find name of job poster
            const payload = { userId : feedItem.creatorId };
            apiCall('user', 'GET', payload, (creator) => {
                // Populate feedDom
                const createdAt = new Date(feedItem.createdAt);
                const now = new Date();
                const diff = (now - createdAt) / (1000 * 60 * 60);
                const hours = Math.floor(diff);
                const minutes = Math.round((diff - hours) * 60);
                const timeDisplay = hours < 24
                ? `${hours}h ${minutes}m ago`
                : `${createdAt.getDate()}/${createdAt.getMonth() + 1}/${createdAt.getFullYear()}`;
                const header = document.createElement('div');
                header.innerText = `Posted by ${creator.name} ${timeDisplay}`;
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
                let likersList = [];
                likersList.push(creator.name);
                const likers = document.createElement('div');

                const likeButton = document.createElement('button');
                likeButton.textContent = "Like";
                likeButton.addEventListener('click', () => {
                    if (likeButton.textContent == "Like") {
                        const payload = {
                            id: feedItem.id,
                            turnon: true
                        };
                        apiCall('job/like', 'PUT', payload, () => {
                            likersList.push(creator.name);
                            likes.textContent = `${Object.keys(feedItem.likes).length + 1} likes`;
                            likers.textContent = `likers: ${likersList}`;
                            likeButton.textContent = "Unlike";

                        });
                    } else if (likeButton.textContent == "Unlike") {
                        const payload = {
                            id: feedItem.id,
                            turnon: false
                        };
                        apiCall('job/like', 'PUT', payload, () => {
                            likersList.pop(creator.name);
                            likes.textContent = `${Object.keys(feedItem.likes).length} likes`;
                            likers.textContent = `likers: ${likersList}`;
                            likeButton.textContent = "Like";
                        });
                    }
                });

            
                // button to see the list of likers
                const likersPopupBox = document.createElement("button");
                likersPopupBox.textContent = "see who likes";
                likersPopupBox.addEventListener('click', () => {
                    let listContainer = document.createElement("div");
                    listContainer.style.border = "1px solid black";
                    listContainer.style.position = "absolute";
                    listContainer.style.top = "100px";
                    listContainer.style.left = "700px";
                    listContainer.style.backgroundColor = "white";
                    listContainer.style.padding = "100px";
                    likersPopupBox.disabled = true;
                    let list = document.createElement("ul");
                    for (let likersName of likersList) {
                        let listItem = document.createElement("li");
                        listItem.textContent = likersName;
                        list.appendChild(listItem);
                    }
                    listContainer.appendChild(list);
                    document.body.appendChild(listContainer);
                    closeButton(listContainer,likersPopupBox);
                });
                
                content.appendChild(likersPopupBox);
                content.appendChild(likers);
                content.appendChild(likes);
                content.appendChild(likeButton);
                content.append(title);
                content.append(startingDate);

                const description = document.createElement('p');
                description.classList.add('card-text');
                description.textContent = feedItem.description;
                content.appendChild(description);

                const comments = document.createElement('p');
                comments.textContent = `${feedItem.comments.length} comments`;
                content.appendChild(comments);

                const comments_button = document.createElement('button');
                comments_button.textContent = "see comments"
                comments_button.addEventListener('click', () => {
                    let comments = document.createElement("div");
                    comments.style.border = "10px solid black";
                    comments.style.position = "absolute";
                    comments.style.top = "100px";
                    comments.style.left = "700px";
                    comments.style.backgroundColor = "white";
                    comments.style.padding = "50px";
                    comments_button.disabled = true;
                    for (let i = 0; i < feedItem.comments.length; i++) {
                        let commentsContent = document.createElement('p');
                        commentsContent.textContent = feedItem.comments[i].userId + ": " + feedItem.comments[i].comment;
                        comments.appendChild(commentsContent);
                    }
                    document.body.appendChild(comments);
                    closeButton(comments, comments_button);
                })
                content.appendChild(comments_button);

                feedDom.appendChild(content);
            });
        }

        // next page
        const next_page = document.getElementById('next-page');
        if (data.length < 5) {
            next_page.style.display = 'none';
        } else {
            next_page.style.display = 'block';
            page += 5;
            next_page.onclick = () => populateFeed();
        }

        // previous page
        const previous_page = document.getElementById('prvious-page');
        if (page > 5) {
            previous_page.style.display = 'block';
            page -= 5;
            previous_page.onclick = () => populateFeed();
        } else {
            previous_page.style.display = 'none';
        }
    });
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

const setToken = (token) => {
    localStorage.setItem('token', token);
    show('section-logged-in');
    hide('section-logged-out');
    // to remove below console.log, just have here if I want to use token
    // console.log(token);
    populateFeed();
};

const show = (element) => {
    document.getElementById(element).classList.remove('hide');
};

const hide = (element) => {
    document.getElementById(element).classList.add('hide');
};

document.getElementById('nav-register').addEventListener('click', () => {
    show('page-register');
    hide('page-login');
});

document.getElementById('nav-login').addEventListener('click', () => {
    hide('page-register');
    show('page-login');
});

document.getElementById('logout').addEventListener('click', () => {
    show('section-logged-out');
    hide('section-logged-in');
    localStorage.removeItem('token');
});

// MAIN

if (localStorage.getItem('token')) {
    show('section-logged-in');
    hide('section-logged-out');
    populateFeed();
}