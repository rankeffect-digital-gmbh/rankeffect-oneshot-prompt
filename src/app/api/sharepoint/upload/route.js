import { NextResponse } from 'next/server';
import { uploadFileToSharePoint } from '@/lib/sharepointService';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    
    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to SharePoint
    const result = await uploadFileToSharePoint(filename, buffer, file.type);
    
    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        filename: result.name,
        url: `/api/sharepoint/media/${result.id}?filename=${encodeURIComponent(result.name)}`,
        size: result.size,
      },
    });
  } catch (error) {
    console.error('Error uploading to SharePoint:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
