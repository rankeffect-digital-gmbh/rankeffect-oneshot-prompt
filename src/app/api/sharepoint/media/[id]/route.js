import { NextResponse } from 'next/server';
import { getFileDownloadUrl } from '@/lib/sharepointService';
import heicConvert from 'heic-convert';
import sharp from 'sharp';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'file';
    const isThumbnail = searchParams.get('thumbnail') === 'true';
    
    // Get the download URL from SharePoint
    const downloadUrl = await getFileDownloadUrl(id);
    
    // Fetch the file content
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }
    
    let buffer = Buffer.from(await response.arrayBuffer());
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    const lowerFilename = filename.toLowerCase();
    const isHeic = lowerFilename.endsWith('.heic') || lowerFilename.endsWith('.heif');
    const isVideo = lowerFilename.endsWith('.mp4') || lowerFilename.endsWith('.mov') || lowerFilename.endsWith('.webm');
    
    // Convert HEIC to JPEG
    if (isHeic) {
      try {
        const jpegBuffer = await heicConvert({
          buffer: buffer,
          format: 'JPEG',
          quality: 0.9,
        });
        buffer = Buffer.from(jpegBuffer);
        contentType = 'image/jpeg';
      } catch (heicError) {
        console.error('HEIC conversion error:', heicError);
        // Try using sharp as fallback (it has some HEIC support)
        try {
          buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
          contentType = 'image/jpeg';
        } catch (sharpError) {
          console.error('Sharp fallback also failed:', sharpError);
          throw new Error('Failed to convert HEIC image');
        }
      }
    }
    
    // Generate thumbnail if requested (for images only)
    if (isThumbnail && !isVideo) {
      try {
        buffer = await sharp(buffer)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        contentType = 'image/jpeg';
      } catch (thumbnailError) {
        console.error('Thumbnail generation error:', thumbnailError);
        // Return original if thumbnail fails
      }
    }
    
    // Set appropriate headers
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    };
    
    // For videos, support range requests
    if (isVideo) {
      headers['Accept-Ranges'] = 'bytes';
    }

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('Error serving media:', error);
    return NextResponse.json(
      { error: 'Failed to serve media', details: error.message },
      { status: 500 }
    );
  }
}
