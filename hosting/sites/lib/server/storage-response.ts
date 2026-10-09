import { NextResponse } from 'next/server'

export async function withStorageResponse(operation: () => Promise<Response>) {
  try {
    return await operation()
  } catch (error) {
    console.error('Activity storage request failed', error)
    return NextResponse.json(
      { error: 'Storage is temporarily unavailable. Please try again later.' },
      { status: 503 },
    )
  }
}
