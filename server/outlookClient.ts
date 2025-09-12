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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then((data: any) => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

export async function sendEmailWithAttachment(to: string, subject: string, body: string, attachmentUrl?: string) {
  try {
    const client = await getUncachableOutlookClient();
    
    const message: any = {
      subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    };

    // Add attachment if provided
    if (attachmentUrl) {
      message.attachments = [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: 'Engine_Inspection_Checklist.txt',
          contentType: 'text/plain',
          contentBytes: Buffer.from('Engine inspection checklist content here').toString('base64')
        }
      ];
    }

    const sentMessage = await client.api('/me/sendMail').post({
      message
    });

    return sentMessage;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function getInboxMessages(filter?: string) {
  try {
    const client = await getUncachableOutlookClient();
    
    let query = '/me/mailFolders/inbox/messages';
    if (filter) {
      query += `?$filter=${filter}`;
    }
    
    const messages = await client.api(query).get();
    return messages.value;
  } catch (error) {
    console.error('Error getting inbox messages:', error);
    throw error;
  }
}

export async function getRecentEmails(accessToken: string, count: number = 10) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    
    const response = await client
      .api('/me/messages')
      .filter('isRead eq false')
      .top(count)
      .orderby('receivedDateTime desc')
      .get();
    
    return response.value || [];
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

export async function sendEmail(accessToken: string, to: string, subject: string, body: string) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    
    const message = {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    };
    
    await client.api('/me/sendMail').post({ message });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function markEmailAsRead(accessToken: string, messageId: string) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    
    await client.api(`/me/messages/${messageId}`).patch({
      isRead: true
    });
    
    return true;
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
}
