import { backend } from 'declarations/backend';
import { AuthClient } from '@dfinity/auth-client';

let currentUser = null;

async function init() {
    const authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated(authClient);
    } else {
        await authClient.login({
            identityProvider: "https://identity.ic0.app/#authorize",
            onSuccess: () => handleAuthenticated(authClient),
        });
    }
}

async function handleAuthenticated(authClient) {
    const identity = await authClient.getIdentity();
    currentUser = await backend.createUser();
    renderHome();
}

function renderHome() {
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Latest Blog Posts</h2><div id="blog-posts"></div>';
    loadBlogPosts();
}

async function loadBlogPosts() {
    const posts = await backend.getAllBlogPosts();
    const blogPostsContainer = document.getElementById('blog-posts');
    blogPostsContainer.innerHTML = '';
    for (const post of posts) {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.content.substring(0, 100)}...</p>
            <a href="#" class="author-link" data-author-id="${post.authorId}">View Author</a>
        `;
        blogPostsContainer.appendChild(postElement);
    }
    addAuthorLinkListeners();
}

function addAuthorLinkListeners() {
    const authorLinks = document.querySelectorAll('.author-link');
    authorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const authorId = e.target.getAttribute('data-author-id');
            renderProfile(authorId);
        });
    });
}

async function renderProfile(userId) {
    const user = await backend.getUser(userId);
    if (user) {
        const content = document.getElementById('content');
        content.innerHTML = `
            <h2>User Profile</h2>
            <img src="${user.picture}" alt="${user.name}" id="profile-picture">
            <h3 id="profile-name">${user.name}</h3>
            <p id="profile-bio">${user.bio}</p>
            ${userId === currentUser.id ? '<button id="edit-profile">Edit Profile</button>' : ''}
            <h3>Blog Posts</h3>
            <div id="user-blog-posts"></div>
        `;
        if (userId === currentUser.id) {
            document.getElementById('edit-profile').addEventListener('click', showEditProfileForm);
        }
        loadUserBlogPosts(userId);
    }
}

async function loadUserBlogPosts(userId) {
    const posts = await backend.getBlogPostsByUser(userId);
    const userBlogPostsContainer = document.getElementById('user-blog-posts');
    userBlogPostsContainer.innerHTML = '';
    for (const post of posts) {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        postElement.innerHTML = `
            <h4>${post.title}</h4>
            <p>${post.content.substring(0, 100)}...</p>
        `;
        userBlogPostsContainer.appendChild(postElement);
    }
}

function showEditProfileForm() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>Edit Profile</h2>
        <form id="edit-profile-form">
            <label for="name">Name:</label>
            <input type="text" id="name" value="${currentUser.name}" required>
            <label for="bio">Bio:</label>
            <textarea id="bio" required>${currentUser.bio}</textarea>
            <label for="picture">Picture URL:</label>
            <input type="url" id="picture" value="${currentUser.picture}" required>
            <button type="submit">Save Changes</button>
        </form>
    `;
    document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const bio = document.getElementById('bio').value;
    const picture = document.getElementById('picture').value;
    const updated = await backend.updateUser(name, bio, picture);
    if (updated) {
        currentUser = await backend.getUser(currentUser.id);
        renderProfile(currentUser.id);
    }
}

document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    renderHome();
});

document.getElementById('profile-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        renderProfile(currentUser.id);
    }
});

init();
