import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function GET() {
  await dbConnect();
  
  try {
    const users = await User.find({})
      .select('-password') // Never send passwords to frontend
      .sort({ firstName: 1, lastName: 1 });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await dbConnect();
  
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, role } = body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
    // In production, hash the password with bcrypt
    // For now, storing plain text (NOT RECOMMENDED for production)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // TODO: Hash this in production
      role: role || 'staff'
    });
    
    // Log the creation
    await ActivityLog.create({
      action: 'user_created',
      entityType: 'user',
      entityId: user._id,
      entityName: user.fullName,
      details: {
        email: user.email,
        role: user.role
      },
      justification: 'New user account created'
    });
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

