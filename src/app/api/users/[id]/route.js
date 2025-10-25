import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function PUT(request, { params }) {
  await dbConnect();
  
  try {
    const { id } = params;
    const body = await request.json();
    const { firstName, lastName, email, password, role, active } = body;
    
    const oldUser = await User.findById(id);
    if (!oldUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (password) updateData.password = password; // TODO: Hash in production
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    // Log the change
    await ActivityLog.create({
      action: 'user_updated',
      entityType: 'user',
      entityId: id,
      entityName: updatedUser.fullName,
      details: {
        changes: updateData,
        previousData: {
          firstName: oldUser.firstName,
          lastName: oldUser.lastName,
          email: oldUser.email,
          role: oldUser.role,
          active: oldUser.active
        }
      },
      justification: 'User information updated'
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();
  
  try {
    const { id } = params;
    
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    await User.findByIdAndDelete(id);
    
    // Log the deletion
    await ActivityLog.create({
      action: 'user_deleted',
      entityType: 'user',
      entityId: id,
      entityName: user.fullName,
      details: {
        email: user.email,
        role: user.role
      },
      justification: 'User account deleted'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

