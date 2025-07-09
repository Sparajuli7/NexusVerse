import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    bio: String
    skills: [String!]
    interests: [String!]
    goals: String
    location: String
    company: String
    title: String
    website: String
    linkedin: String
    github: String
    walletAddress: String
    isVerified: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Community {
    id: ID!
    name: String!
    description: String!
    category: String!
    memberCount: Int!
    isJoined: Boolean!
    tags: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type Event {
    id: ID!
    title: String!
    description: String!
    date: String!
    time: String!
    location: String!
    type: EventType!
    price: Float!
    attendees: Int!
    maxAttendees: Int!
    host: String!
    category: String!
    isRegistered: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  enum EventType {
    VIRTUAL
    IN_PERSON
    HYBRID
  }

  type Connection {
    id: ID!
    user: User!
    connectedUser: User!
    status: ConnectionStatus!
    createdAt: String!
  }

  enum ConnectionStatus {
    PENDING
    ACCEPTED
    REJECTED
  }

  type Post {
    id: ID!
    author: User!
    community: Community!
    content: String!
    likes: Int!
    comments: [Comment!]
    createdAt: String!
  }

  type Comment {
    id: ID!
    author: User!
    content: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(search: String, limit: Int, offset: Int): [User!]!
    
    # Community queries
    communities(category: String, search: String, limit: Int, offset: Int): [Community!]!
    community(id: ID!): Community
    
    # Event queries
    events(category: String, search: String, limit: Int, offset: Int): [Event!]!
    event(id: ID!): Event
    
    # Connection queries
    connections(status: ConnectionStatus): [Connection!]!
    
    # Post queries
    posts(communityId: ID!, limit: Int, offset: Int): [Post!]!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    
    # User mutations
    updateProfile(input: UpdateProfileInput!): User!
    updatePassword(input: UpdatePasswordInput!): Boolean!
    
    # Community mutations
    createCommunity(input: CreateCommunityInput!): Community!
    joinCommunity(id: ID!): Community!
    leaveCommunity(id: ID!): Community!
    
    # Event mutations
    createEvent(input: CreateEventInput!): Event!
    registerForEvent(id: ID!): Event!
    unregisterFromEvent(id: ID!): Event!
    
    # Connection mutations
    sendConnectionRequest(userId: ID!): Connection!
    acceptConnectionRequest(id: ID!): Connection!
    rejectConnectionRequest(id: ID!): Connection!
    
    # Post mutations
    createPost(input: CreatePostInput!): Post!
    likePost(id: ID!): Post!
    unlikePost(id: ID!): Post!
    createComment(input: CreateCommentInput!): Comment!
  }

  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    bio: String
    skills: [String!]
    interests: [String!]
    goals: String
    walletAddress: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    bio: String
    skills: [String!]
    interests: [String!]
    goals: String
    location: String
    company: String
    title: String
    website: String
    linkedin: String
    github: String
  }

  input UpdatePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input CreateCommunityInput {
    name: String!
    description: String!
    category: String!
    tags: [String!]
  }

  input CreateEventInput {
    title: String!
    description: String!
    date: String!
    time: String!
    location: String!
    type: EventType!
    price: Float!
    maxAttendees: Int!
    category: String!
  }

  input CreatePostInput {
    communityId: ID!
    content: String!
  }

  input CreateCommentInput {
    postId: ID!
    content: String!
  }

  type Subscription {
    # Real-time subscriptions
    postCreated(communityId: ID!): Post!
    commentCreated(postId: ID!): Comment!
    connectionRequestReceived: Connection!
    eventUpdated(eventId: ID!): Event!
  }
`; 