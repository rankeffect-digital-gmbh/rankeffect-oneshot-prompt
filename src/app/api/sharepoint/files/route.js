import { NextResponse } from 'next/server';
import { listFilesInFolder } from '@/lib/sharepointService';

export async function GET() {
  try {
    const files = await listFilesInFolder();
    
    // Transform files to include API URLs for media
    const mediaFiles = files.map(file => ({
      ...file,
      // Use our API route for serving media (handles HEIC conversion)
      url: `/api/sharepoint/media/${file.id}?filename=${encodeURIComponent(file.filename)}`,
      thumbnailUrl: `/api/sharepoint/media/${file.id}?filename=${encodeURIComponent(file.filename)}&thumbnail=true`,
    }));

    return NextResponse.json({ files: mediaFiles });
  } catch (error) {
    console.error('Error fetching SharePoint files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files from SharePoint', details: error.message },
      { status: 500 }
    );
  }
}
