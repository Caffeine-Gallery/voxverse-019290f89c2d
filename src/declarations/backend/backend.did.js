export const idlFactory = ({ IDL }) => {
  const UserId = IDL.Principal;
  const Time = IDL.Int;
  const BlogPost = IDL.Record({
    'id' : IDL.Text,
    'title' : IDL.Text,
    'content' : IDL.Text,
    'authorId' : UserId,
    'timestamp' : Time,
  });
  const User = IDL.Record({
    'id' : UserId,
    'bio' : IDL.Text,
    'name' : IDL.Text,
    'picture' : IDL.Text,
  });
  return IDL.Service({
    'createBlogPost' : IDL.Func([IDL.Text, IDL.Text], [BlogPost], []),
    'createUser' : IDL.Func([], [User], []),
    'getAllBlogPosts' : IDL.Func([], [IDL.Vec(BlogPost)], ['query']),
    'getBlogPostsByUser' : IDL.Func([UserId], [IDL.Vec(BlogPost)], ['query']),
    'getUser' : IDL.Func([UserId], [IDL.Opt(User)], ['query']),
    'updateUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
