import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { validateSignup } from '@/middleware/validation';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validation
    const validationError = validateSignup(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Create user (password hashing handled in model pre-save hook)
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || 'agent',
      phone: body.phone,
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
