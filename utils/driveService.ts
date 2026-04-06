// Simple wrapper for Google Drive API interactions
// Requires "https://apis.google.com/js/api.js" and "https://accounts.google.com/gsi/client" loaded in index.html

declare const gapi: any;
declare const google: any;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGapiClient = async () => {
  await new Promise<void>((resolve, reject) => {
    gapi.load('client', { callback: resolve, onerror: reject });
  });
  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
};

export const initGisClient = (clientId: string, callback: (resp: any) => void) => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: async (resp: any) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      callback(resp);
    },
  });
  gisInited = true;
};

export const requestAccessToken = () => {
  if (!tokenClient) throw new Error("Token client not initialized");
  tokenClient.requestAccessToken({ prompt: 'consent' });
};

export const setAccessToken = (token: string) => {
  if(gapi && gapi.client) {
      gapi.client.setToken({ access_token: token });
  }
};

export const uploadFile = async (fileName: string, content: string, mimeType = 'application/json') => {
  try {
    const file = new Blob([content], { type: mimeType });
    const metadata = {
      name: fileName,
      mimeType: mimeType,
    };

    const accessToken = gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });
    return await res.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const findFile = async (fileName: string) => {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name = '${fileName}' and trashed = false`,
            fields: 'files(id, name, createdTime)',
            spaces: 'drive',
        });
        const files = response.result.files;
        return files && files.length > 0 ? files[0] : null;
    } catch (err) {
        console.error("Error finding file", err);
        return null;
    }
}
