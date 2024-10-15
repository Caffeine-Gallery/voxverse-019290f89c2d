import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BlogPost {
  'id' : string,
  'title' : string,
  'content' : string,
  'authorId' : UserId,
  'timestamp' : Time,
}
export type Time = bigint;
export interface User {
  'id' : UserId,
  'bio' : string,
  'name' : string,
  'picture' : string,
}
export type UserId = Principal;
export interface _SERVICE {
  'createBlogPost' : ActorMethod<[string, string], BlogPost>,
  'createUser' : ActorMethod<[], User>,
  'getAllBlogPosts' : ActorMethod<[], Array<BlogPost>>,
  'getBlogPostsByUser' : ActorMethod<[UserId], Array<BlogPost>>,
  'getUser' : ActorMethod<[UserId], [] | [User]>,
  'updateUser' : ActorMethod<[string, string, string], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
