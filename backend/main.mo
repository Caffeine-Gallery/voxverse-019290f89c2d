import Bool "mo:base/Bool";
import Hash "mo:base/Hash";
import Random "mo:base/Random";

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";

actor {
    // Types
    type UserId = Principal;

    type User = {
        id: UserId;
        name: Text;
        bio: Text;
        picture: Text;
    };

    type BlogPost = {
        id: Text;
        authorId: UserId;
        title: Text;
        content: Text;
        timestamp: Time.Time;
    };

    // State
    stable var userEntries : [(UserId, User)] = [];
    stable var blogPostEntries : [(Text, BlogPost)] = [];

    var users = HashMap.HashMap<UserId, User>(10, Principal.equal, Principal.hash);
    var blogPosts = HashMap.HashMap<Text, BlogPost>(10, Text.equal, Text.hash);

    // Helper functions
    func generateRandomName() : Text {
        let adjectives = ["Happy", "Sunny", "Clever", "Brave", "Kind"];
        let nouns = ["Panda", "Tiger", "Dolphin", "Eagle", "Lion"];
        let randomAdj = adjectives[Int.abs(Time.now()) % adjectives.size()];
        let randomNoun = nouns[Int.abs(Time.now()) % nouns.size()];
        randomAdj # " " # randomNoun
    };

    func generateRandomPicture() : Text {
        // In a real scenario, this would generate or fetch a random avatar URL
        "https://example.com/default-avatar.png"
    };

    // User management
    public shared(msg) func createUser() : async User {
        let userId = msg.caller;
        switch (users.get(userId)) {
            case (?existingUser) {
                return existingUser;
            };
            case null {
                let newUser : User = {
                    id = userId;
                    name = generateRandomName();
                    bio = "";
                    picture = generateRandomPicture();
                };
                users.put(userId, newUser);
                return newUser;
            };
        };
    };

    public query func getUser(userId: UserId) : async ?User {
        users.get(userId)
    };

    public shared(msg) func updateUser(name: Text, bio: Text, picture: Text) : async Bool {
        let userId = msg.caller;
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser : User = {
                    id = userId;
                    name = name;
                    bio = bio;
                    picture = picture;
                };
                users.put(userId, updatedUser);
                true
            };
            case null {
                false
            };
        };
    };

    // Blog post management
    public shared(msg) func createBlogPost(title: Text, content: Text) : async BlogPost {
        let authorId = msg.caller;
        let postId = Principal.toText(authorId) # "-" # Int.toText(Time.now());
        let post : BlogPost = {
            id = postId;
            authorId = authorId;
            title = title;
            content = content;
            timestamp = Time.now();
        };
        blogPosts.put(postId, post);
        post
    };

    public query func getAllBlogPosts() : async [BlogPost] {
        Iter.toArray(blogPosts.vals())
    };

    public query func getBlogPostsByUser(userId: UserId) : async [BlogPost] {
        Array.filter(Iter.toArray(blogPosts.vals()), func (post: BlogPost) : Bool { post.authorId == userId })
    };

    // System functions
    system func preupgrade() {
        userEntries := Iter.toArray(users.entries());
        blogPostEntries := Iter.toArray(blogPosts.entries());
    };

    system func postupgrade() {
        users := HashMap.fromIter<UserId, User>(userEntries.vals(), 10, Principal.equal, Principal.hash);
        blogPosts := HashMap.fromIter<Text, BlogPost>(blogPostEntries.vals(), 10, Text.equal, Text.hash);
    };
}
