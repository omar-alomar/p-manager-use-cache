import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/db/users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find(u => u.name === name);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user by name:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
