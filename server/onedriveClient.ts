import { Client } from '@microsoft/microsoft-graph-client';

export async function createFolderStructure(accessToken: string) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    
    // Create main folder
    const mainFolder = await client
      .api('/me/drive/root/children')
      .post({
        name: 'EmailResponder',
        folder: {}
      });

    // Create subfolders
    const folders = ['EmailCases', 'Attachments', 'Responses', 'Reports'];
    for (const folderName of folders) {
      await client
        .api(`/me/drive/items/${mainFolder.id}/children`)
        .post({
          name: folderName,
          folder: {}
        });
    }

    return mainFolder;
  } catch (error) {
    console.error('Error creating OneDrive folder structure:', error);
    throw error;
  }
}

export async function uploadFile(accessToken: string, folderId: string, fileName: string, content: Buffer) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    
    const response = await client
      .api(`/me/drive/items/${folderId}:/${fileName}:/content`)
      .put(content);
    
    return response;
  } catch (error) {
    console.error('Error uploading file to OneDrive:', error);
    throw error;
  }
}

export async function getUncachableOneDriveClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}
