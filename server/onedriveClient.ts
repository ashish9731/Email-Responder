import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=onedrive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('OneDrive not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableOneDriveClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function createFolderStructure() {
  try {
    const client = await getUncachableOneDriveClient();
    
    // Create main folder
    const mainFolder = await client.api('/me/drive/root/children').post({
      name: 'Email Auto Responder',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    });

    // Create subfolder for checklists
    await client.api(`/me/drive/items/${mainFolder.id}/children`).post({
      name: 'Checklists',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    });

    // Create subfolder for email responses
    await client.api(`/me/drive/items/${mainFolder.id}/children`).post({
      name: 'Email Responses',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    });

    return mainFolder;
  } catch (error) {
    console.error('Error creating folder structure:', error);
    throw error;
  }
}

export async function uploadChecklistFile(caseNumber: string, content: string) {
  try {
    const client = await getUncachableOneDriveClient();
    
    // Find the Checklists folder
    const folders = await client.api('/me/drive/root/children').get();
    const mainFolder = folders.value.find((folder: any) => folder.name === 'Email Auto Responder');
    
    if (!mainFolder) {
      throw new Error('Main folder not found');
    }

    const subfolders = await client.api(`/me/drive/items/${mainFolder.id}/children`).get();
    const checklistsFolder = subfolders.value.find((folder: any) => folder.name === 'Checklists');
    
    if (!checklistsFolder) {
      throw new Error('Checklists folder not found');
    }

    // Upload checklist file
    const fileName = `Engine_Inspection_Checklist_${caseNumber}.txt`;
    const file = await client.api(`/me/drive/items/${checklistsFolder.id}:/${fileName}:/content`).put(content);
    
    return file;
  } catch (error) {
    console.error('Error uploading checklist file:', error);
    throw error;
  }
}

export async function saveEmailResponse(caseNumber: string, emailContent: string) {
  try {
    const client = await getUncachableOneDriveClient();
    
    // Find the Email Responses folder
    const folders = await client.api('/me/drive/root/children').get();
    const mainFolder = folders.value.find((folder: any) => folder.name === 'Email Auto Responder');
    
    if (!mainFolder) {
      throw new Error('Main folder not found');
    }

    const subfolders = await client.api(`/me/drive/items/${mainFolder.id}/children`).get();
    const responsesFolder = subfolders.value.find((folder: any) => folder.name === 'Email Responses');
    
    if (!responsesFolder) {
      throw new Error('Email Responses folder not found');
    }

    // Save email response
    const fileName = `Email_Response_${caseNumber}_${new Date().toISOString().split('T')[0]}.txt`;
    const file = await client.api(`/me/drive/items/${responsesFolder.id}:/${fileName}:/content`).put(emailContent);
    
    return file;
  } catch (error) {
    console.error('Error saving email response:', error);
    throw error;
  }
}
