import FS from 'fs';
import Mkdirp from 'mkdirp';

import Unirest from 'unirest';
import Promise from 'bluebird';
import JsonFile from 'jsonfile';

class Parser {
  static source(sourceCode) {
    if (!sourceCode) throw Error("Source code unable to loaded!");
    this.sourceCode = sourceCode;

    return this;
  }

  static splitCode(pattern, pattern_options) {
    return new Promise((resolve, reject) => {
      const results = this.sourceCode.match(new RegExp(pattern, pattern_options));
      if (results && results.length > 0)
        resolve(results[1]);
      else
        reject('Not found');
    });
  }

  static splitItems(pattern, schema) {
    return new Promise((resolve, reject) => {
      const results = this.sourceCode.match(new RegExp(pattern, 'gi'));
      if (results && results.length > 0) {
        const items = [];
        results.map(item => {
          // const match = item.match(new RegExp(pattern));
          const match = item.match(new RegExp('<option value="(.*?)">(.*?)</option>'));
          let response = {};
          schema.map((key, index) => {
            if (key != 'pass')
              response[key] = match[index + 1].trim();
          });
          items.push(response);
        });
        resolve(items);
      } else
        reject('Not found');
    });
  }

  static splitItems2(pattern, schema) {
    return new Promise((resolve, reject) => {
      const results = this.sourceCode.match(new RegExp(pattern, 'gi'));
      if (results.length > 0) {
        const items = [];
        // console.log('LOG: ', results); 
        results.map(item => {
          const match = item.match(new RegExp(pattern));
          let response = {};
          schema.map((key, index) => {
            if (key != 'pass')
              response[key] = match[index + 1].trim();
          });
          items.push(response);
        });
        resolve(items);
      } else
        reject('Not found');
    });
  }
}

class Source {
  static get(url) {
    return new Promise((resolve, reject) => {
      Unirest.get(url).end((response) => {
        this.response(response, resolve, reject);
      });
    });
  }

  static post(url, data = {}) {
    return new Promise((resolve, reject) => {
      Unirest.post(url)
        .send(data)
        .end((response) => {
          this.response(response, resolve, reject);
        });
    });
  }

  static response(response, resolve, reject) {
    const headers = response.headers;
    const body = response.body;

    if (response.ok) {
      if (headers['content-type'].indexOf('application/json') != -1) {
        resolve(body);
      } else if (headers['content-type'].indexOf('text/html') != -1) {
        resolve(body.replace(/\t|\n|\r/g, ''));
      }
    } else {
      reject(response.errors);
    }
  }
}

class Writer {
  static setFolder(folder) {
    this.folder = folder;
    return this;
  }
  static json(file, data) {
    return new Promise((resolve, reject) => {
      const fullPath = this.folder + '/data/' + file;
      const fileName = fullPath.split('/').pop();
      const folderPath = fullPath.replace(fileName, '');
      if (!FS.existsSync(folderPath)) Mkdirp.sync(folderPath);

      JsonFile.writeFileSync(fullPath, data, err => {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
  }
}

module.exports = { Source, Parser, Writer };
