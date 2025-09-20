import * as mega from 'megajs';
import fs from 'fs';

const auth = {
  email: 'agni119.67@gmail.com',
  password: 'Shashika@2008',
  userAgent: 'Mozilla/5.0'
}

export const upload = (data, name) => {
  return new Promise((resolve, reject) => {
    try {
      const storage = new mega.Storage(auth, () => {
        data.pipe(storage.upload({ name: name, allowUploadBuffering: true }));
        storage.on("add", (file) => {
          file.link((err, url) => {
            if (err) throw err;
            storage.close();
            resolve(url);
          });
        });
      });
    } catch (err) {
      reject(err);
    }
  });
};
