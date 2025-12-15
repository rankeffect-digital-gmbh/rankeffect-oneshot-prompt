import { ConfidentialClientApplication } from '@azure/msal-node';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
  },
};

// Create MSAL instance
let msalClient = null;

function getMsalClient() {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication(msalConfig);
  }
  return msalClient;
}

// Get access token for Microsoft Graph API
async function getAccessToken() {
  const client = getMsalClient();
  
  const tokenRequest = {
    scopes: ['https://graph.microsoft.com/.default'],
  };

  try {
    const response = await client.acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
}

// Make authenticated request to Microsoft Graph
async function graphRequest(endpoint, options = {}) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Graph API error:', response.status, errorText);
    throw new Error(`Graph API error: ${response.status} - ${errorText}`);
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response;
}

// Get SharePoint site ID
async function getSiteId() {
  const hostname = process.env.SHAREPOINT_HOSTNAME.replace(/\/$/, ''); // Remove trailing slash
  const siteName = process.env.SHAREPOINT_SITE_NAME;
  
  const site = await graphRequest(`/sites/${hostname}:/sites/${siteName}`);
  return site.id;
}

// Get drive ID for the document library
async function getDriveId(siteId) {
  const drives = await graphRequest(`/sites/${siteId}/drives`);
  // Usually the first drive is "Documents" / "Shared Documents"
  const documentsDrive = drives.value.find(d => 
    d.name === 'Documents' || d.name === 'Dokumente' || d.name === 'Shared Documents'
  ) || drives.value[0];
  
  return documentsDrive.id;
}

// List files in a folder
export async function listFilesInFolder() {
  try {
    const siteId = await getSiteId();
    const driveId = await getDriveId(siteId);
    
    // Get folder path - remove "Shared Documents" prefix if present since we're already in the drive
    let folderPath = process.env.SHAREPOINT_FOLDER_PATH || '';
    folderPath = folderPath.replace(/^\/?(Shared Documents|Documents|Dokumente)\/?/, '');
    
    // Build the endpoint
    let endpoint;
    if (folderPath) {
      endpoint = `/drives/${driveId}/root:/${encodeURIComponent(folderPath)}:/children`;
    } else {
      endpoint = `/drives/${driveId}/root/children`;
    }
    
    const response = await graphRequest(endpoint);
    
    // Filter for image and video files
    const mediaFiles = response.value
      .filter(item => item.file) // Only files, not folders
      .filter(item => {
        const name = item.name.toLowerCase();
        return (
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.gif') ||
          name.endsWith('.webp') ||
          name.endsWith('.heic') ||
          name.endsWith('.heif') ||
          name.endsWith('.mp4') ||
          name.endsWith('.mov') ||
          name.endsWith('.webm')
        );
      })
      .map(item => ({
        id: item.id,
        filename: item.name,
        size: item.size,
        mimeType: item.file.mimeType,
        createdAt: item.createdDateTime,
        modifiedAt: item.lastModifiedDateTime,
        downloadUrl: item['@microsoft.graph.downloadUrl'],
        isHeic: item.name.toLowerCase().endsWith('.heic') || item.name.toLowerCase().endsWith('.heif'),
        isVideo: item.name.toLowerCase().endsWith('.mp4') || 
                 item.name.toLowerCase().endsWith('.mov') || 
                 item.name.toLowerCase().endsWith('.webm'),
      }));

    return mediaFiles;
  } catch (error) {
    console.error('Error listing SharePoint files:', error);
    throw error;
  }
}

// Get file content (for downloading/streaming)
export async function getFileContent(itemId) {
  try {
    const siteId = await getSiteId();
    const driveId = await getDriveId(siteId);
    
    const response = await graphRequest(`/drives/${driveId}/items/${itemId}/content`, {
      redirect: 'manual',
    });
    
    return response;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
}

// Get download URL for a file
export async function getFileDownloadUrl(itemId) {
  try {
    const siteId = await getSiteId();
    const driveId = await getDriveId(siteId);
    
    const item = await graphRequest(`/drives/${driveId}/items/${itemId}`);
    return item['@microsoft.graph.downloadUrl'];
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
}

// Upload a file to SharePoint
export async function uploadFileToSharePoint(filename, fileBuffer, mimeType) {
  try {
    const siteId = await getSiteId();
    const driveId = await getDriveId(siteId);
    
    // Get folder path
    let folderPath = process.env.SHAREPOINT_FOLDER_PATH || '';
    folderPath = folderPath.replace(/^\/?(Shared Documents|Documents|Dokumente)\/?/, '');
    
    // Build upload endpoint
    const filePath = folderPath ? `${folderPath}/${filename}` : filename;
    const endpoint = `/drives/${driveId}/root:/${encodeURIComponent(filePath)}:/content`;
    
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error uploading to SharePoint:', error);
    throw error;
  }
}
