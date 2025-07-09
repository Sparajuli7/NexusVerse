import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/database';
import { logger } from '../utils/logger';

interface Context {
  token?: string;
  user?: any;
  io?: any;
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const result = await pgPool.query(
        'SELECT * FROM users WHERE id = $1',
        [context.user.id]
      );
      
      return result.rows[0];
    },

    user: async (_: any, { id }: { id: string }) => {
      const result = await pgPool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },

    users: async (_: any, { search, limit = 10, offset = 0 }: { search?: string; limit?: number; offset?: number }) => {
      let query = 'SELECT * FROM users';
      const params: any[] = [];
      
      if (search) {
        query += ' WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)';
        params.push(`%${search}%`);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const result = await pgPool.query(query, params);
      return result.rows;
    },

    communities: async (_: any, { category, search, limit = 10, offset = 0 }: { category?: string; search?: string; limit?: number; offset?: number }) => {
      let query = 'SELECT * FROM communities';
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (category) {
        conditions.push('category = $' + (params.length + 1));
        params.push(category);
      }
      
      if (search) {
        conditions.push('(name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')');
        params.push(`%${search}%`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const result = await pgPool.query(query, params);
      return result.rows;
    },

    community: async (_: any, { id }: { id: string }) => {
      const result = await pgPool.query(
        'SELECT * FROM communities WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },

    events: async (_: any, { category, search, limit = 10, offset = 0 }: { category?: string; search?: string; limit?: number; offset?: number }) => {
      let query = 'SELECT * FROM events';
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (category) {
        conditions.push('category = $' + (params.length + 1));
        params.push(category);
      }
      
      if (search) {
        conditions.push('(title ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')');
        params.push(`%${search}%`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY date ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const result = await pgPool.query(query, params);
      return result.rows;
    },

    event: async (_: any, { id }: { id: string }) => {
      const result = await pgPool.query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },

    connections: async (_: any, { status }: { status?: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      let query = 'SELECT * FROM connections WHERE user_id = $1';
      const params: any[] = [context.user.id];
      
      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }
      
      const result = await pgPool.query(query, params);
      return result.rows;
    },

    posts: async (_: any, { communityId, limit = 10, offset = 0 }: { communityId: string; limit?: number; offset?: number }) => {
      const result = await pgPool.query(
        'SELECT * FROM posts WHERE community_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [communityId, limit, offset]
      );
      
      return result.rows;
    }
  },

  Mutation: {
    register: async (_: any, { input }: { input: any }) => {
      const { firstName, lastName, email, password, bio, skills, interests, goals, walletAddress } = input;
      
      // Check if user already exists
      const existingUser = await pgPool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const result = await pgPool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, bio, skills, interests, goals, wallet_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [firstName, lastName, email, hashedPassword, bio, skills, interests, goals, walletAddress]
      );
      
      const user = result.rows[0];
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      return { token, user };
    },

    login: async (_: any, { input }: { input: any }) => {
      const { email, password } = input;
      
      // Find user
      const result = await pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      return { token, user };
    },

    logout: async (_: any, __: any, context: Context) => {
      // In a real implementation, you might want to blacklist the token
      logger.info('User logged out:', context.user?.id);
      return true;
    },

    updateProfile: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(context.user.id);
      
      const result = await pgPool.query(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    },

    createCommunity: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const { name, description, category, tags } = input;
      
      const result = await pgPool.query(
        `INSERT INTO communities (name, description, category, tags, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, description, category, tags, context.user.id]
      );
      
      return result.rows[0];
    },

    joinCommunity: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      // Check if already a member
      const existingMember = await pgPool.query(
        'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
        [id, context.user.id]
      );
      
      if (existingMember.rows.length > 0) {
        throw new Error('Already a member of this community');
      }
      
      // Add member
      await pgPool.query(
        'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)',
        [id, context.user.id]
      );
      
      // Update member count
      await pgPool.query(
        'UPDATE communities SET member_count = member_count + 1 WHERE id = $1',
        [id]
      );
      
      const result = await pgPool.query(
        'SELECT * FROM communities WHERE id = $1',
        [id]
      );
      
      return { ...result.rows[0], isJoined: true };
    },

    createEvent: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const { title, description, date, time, location, type, price, maxAttendees, category } = input;
      
      const result = await pgPool.query(
        `INSERT INTO events (title, description, date, time, location, type, price, max_attendees, category, host_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [title, description, date, time, location, type, price, maxAttendees, category, context.user.id]
      );
      
      return result.rows[0];
    },

    registerForEvent: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      // Check if already registered
      const existingRegistration = await pgPool.query(
        'SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2',
        [id, context.user.id]
      );
      
      if (existingRegistration.rows.length > 0) {
        throw new Error('Already registered for this event');
      }
      
      // Add registration
      await pgPool.query(
        'INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)',
        [id, context.user.id]
      );
      
      // Update attendee count
      await pgPool.query(
        'UPDATE events SET attendees = attendees + 1 WHERE id = $1',
        [id]
      );
      
      const result = await pgPool.query(
        'SELECT * FROM events WHERE id = $1',
        [id]
      );
      
      return { ...result.rows[0], isRegistered: true };
    },

    sendConnectionRequest: async (_: any, { userId }: { userId: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      if (context.user.id === userId) {
        throw new Error('Cannot connect with yourself');
      }
      
      // Check if connection already exists
      const existingConnection = await pgPool.query(
        'SELECT id FROM connections WHERE (user_id = $1 AND connected_user_id = $2) OR (user_id = $2 AND connected_user_id = $1)',
        [context.user.id, userId]
      );
      
      if (existingConnection.rows.length > 0) {
        throw new Error('Connection already exists');
      }
      
      const result = await pgPool.query(
        `INSERT INTO connections (user_id, connected_user_id, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [context.user.id, userId]
      );
      
      return result.rows[0];
    },

    createPost: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const { communityId, content } = input;
      
      const result = await pgPool.query(
        `INSERT INTO posts (community_id, author_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [communityId, context.user.id, content]
      );
      
      // Emit real-time event
      if (context.io) {
        context.io.to(`community-${communityId}`).emit('post-created', result.rows[0]);
      }
      
      return result.rows[0];
    }
  },

  User: {
    id: (parent: any) => parent.id,
    firstName: (parent: any) => parent.first_name,
    lastName: (parent: any) => parent.last_name,
    email: (parent: any) => parent.email,
    bio: (parent: any) => parent.bio,
    skills: (parent: any) => parent.skills || [],
    interests: (parent: any) => parent.interests || [],
    goals: (parent: any) => parent.goals,
    location: (parent: any) => parent.location,
    company: (parent: any) => parent.company,
    title: (parent: any) => parent.title,
    website: (parent: any) => parent.website,
    linkedin: (parent: any) => parent.linkedin,
    github: (parent: any) => parent.github,
    walletAddress: (parent: any) => parent.wallet_address,
    isVerified: (parent: any) => parent.is_verified || false,
    createdAt: (parent: any) => parent.created_at,
    updatedAt: (parent: any) => parent.updated_at
  },

  Community: {
    id: (parent: any) => parent.id,
    name: (parent: any) => parent.name,
    description: (parent: any) => parent.description,
    category: (parent: any) => parent.category,
    memberCount: (parent: any) => parent.member_count || 0,
    isJoined: (parent: any) => parent.is_joined || false,
    tags: (parent: any) => parent.tags || [],
    createdAt: (parent: any) => parent.created_at,
    updatedAt: (parent: any) => parent.updated_at
  },

  Event: {
    id: (parent: any) => parent.id,
    title: (parent: any) => parent.title,
    description: (parent: any) => parent.description,
    date: (parent: any) => parent.date,
    time: (parent: any) => parent.time,
    location: (parent: any) => parent.location,
    type: (parent: any) => parent.type,
    price: (parent: any) => parseFloat(parent.price),
    attendees: (parent: any) => parent.attendees || 0,
    maxAttendees: (parent: any) => parent.max_attendees,
    host: (parent: any) => parent.host,
    category: (parent: any) => parent.category,
    isRegistered: (parent: any) => parent.is_registered || false,
    createdAt: (parent: any) => parent.created_at,
    updatedAt: (parent: any) => parent.updated_at
  }
}; 