import { backend } from 'declarations/backend';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

let authClient;
let currentUser = null;

async function init() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        await handleAuthenticated();
    } else {
        updateAuthButton(false);
    }
    renderHome();
}

function updateAuthButton(isAuthenticated) {
    const authButton = document.getElementById('auth-button');
    const profileLink = document.getElementById('profile-link');
    
    if (isAuthenticated) {
        authButton.textContent = 'Logout';
        authButton.onclick = logout;
        profileLink.style.display = 'inline';
    } else {
        authButton.textContent = 'Login';
        authButton.onclick = login;
        profileLink.style.display = 'none';
    }
}

async function login() {
    await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: handleAuthenticated,
    });
}

async function logout() {
    await authClient.logout();
    currentUser = null;
    updateAuthButton(false);
    renderHome();
}

async function handleAuthenticated() {
    try {
        const identity = await authClient.getIdentity();
        const principal = identity.getPrincipal();
        currentUser = await backend.createUser();
        if (!currentUser || !currentUser.id) {
            throw new Error("Failed to create or retrieve user");
        }
        currentUser.principal = principal;
        updateAuthButton(true);
        renderHome();
    } catch (error) {
        console.error("Authentication error:", error);
        alert("An error occurred during authentication. Please try again.");
        updateAuthButton(false);
    }
}

function renderHome() {
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Latest Blog Posts</h2><div id="blog-posts"></div>';
    loadBlogPosts();
}

async function loadBlogPosts() {
    try {
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
    } catch (error) {
        console.error("Error loading blog posts:", error);
        alert("Failed to load blog posts. Please try again later.");
    }
}

function addAuthorLinkListeners() {
    const authorLinks = document.querySelectorAll('.author-link');
    authorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const authorId = e.target.getAttribute('data-author-id');
            if (authorId) {
                renderProfile(authorId);
            } else {
                console.error("Invalid author ID");
                alert("Unable to view author profile. Please try again later.");
            }
        });
    });
}

async function renderProfile(userId) {
    if (!authClient.isAuthenticated()) {
        alert("Please login to view profiles.");
        return;
    }

    try {
        if (!userId || userId === 'undefined') {
            throw new Error("Invalid user ID");
        }
        let userPrincipal;
        try {
            userPrincipal = Principal.fromText(userId);
        } catch (error) {
            console.error("Error converting user ID to Principal:", error);
            throw new Error("Invalid user ID format");
        }
        const user = await backend.getUser(userPrincipal);
        if (user) {
            const content = document.getElementById('content');
            content.innerHTML = `
                <h2>User Profile</h2>
                <img src="${user.picture}" alt="${user.name}" id="profile-picture">
                <h3 id="profile-name">${user.name}</h3>
                <p id="profile-bio">${user.bio}</p>
                ${currentUser && currentUser.id === userId ? '<button id="edit-profile">Edit Profile</button>' : ''}
                <h3>Blog Posts</h3>
                <div id="user-blog-posts"></div>
            `;
            if (currentUser && currentUser.id === userId) {
                document.getElementById('edit-profile').addEventListener('click', showEditProfileForm);
            }
            loadUserBlogPosts(userPrincipal);
        } else {
            throw new Error("User not found");
        }
    } catch (error) {
        console.error("Error rendering profile:", error);
        alert("Failed to load user profile. Please try again later.");
    }
}

async function loadUserBlogPosts(userPrincipal) {
    try {
        const posts = await backend.getBlogPostsByUser(userPrincipal);
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
    } catch (error) {
        console.error("Error loading user blog posts:", error);
        alert("Failed to load user's blog posts. Please try again later.");
    }
}

function showEditProfileForm() {
    if (!currentUser || !currentUser.id) {
        console.error("Cannot edit profile: currentUser is invalid");
        alert("Please log in to edit your profile.");
        return;
    }

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
    if (!currentUser || !currentUser.id) {
        console.error("Cannot update profile: currentUser is invalid");
        alert("Please log in to update your profile.");
        return;
    }

    try {
        const name = document.getElementById('name').value;
        const bio = document.getElementById('bio').value;
        const picture = document.getElementById('picture').value;
        const updated = await backend.updateUser(name, bio, picture);
        if (updated) {
            currentUser = await backend.getUser(currentUser.principal);
            renderProfile(currentUser.id);
        } else {
            throw new Error("Failed to update user profile");
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again later.");
    }
}

document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    renderHome();
});

document.getElementById('profile-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (authClient.isAuthenticated()) {
        if (currentUser && currentUser.id && currentUser.principal) {
            renderProfile(currentUser.id);
        } else {
            console.error("Current user is not properly set");
            alert("Please log in again to view your profile.");
            updateAuthButton(false);
        }
    } else {
        alert("Please log in to view your profile.");
    }
});

init();
