'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const chalk = require('chalk');
const mammoth = require('mammoth');
const md = require('to-markdown');
const opn = require('opn');

Promise.promisifyAll(fs); // eslint-disable-line no-use-extend-native/no-use-extend-native

module.exports = class MDify {
  constructor(options) {
    this.options = options || {};
  }

  makeHTML() {
    return new Promise((resolve, reject) => {
      mammoth
        .convertToHtml({path: this.options.source})
        .then(result => {
          const html = result.value/* .replace(/<td><p>(.*?)<\/p><\/td>/g, function(_, s1) {
            return '<td>' + s1.replace(/<\/p><p>/g, '<br/>') + '</td>'; // do this in to-markdown https://github.com/domchristie/to-markdown/pull/140
          }) */.replace(/<table><tr>(.*?)<\/tr>/g, (_, s1) => {
            return '<table><tr>' + s1.replace(/td/g, 'th') + '</tr>';
          });

          if (this.options.debug) {
            fs.writeFileAsync(this.options.debug, html);
          }

          resolve(html);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  makeMD(html, ora) {
    return new Promise((resolve, reject) => {
      try {
        const destination = path.resolve(this.options.destination);
        const markdown = md(html, {gfm: true});

        fs.writeFileAsync(this.options.destination, markdown).then(() => {
          resolve(markdown);
        });

        if (this.options.open) {
          opn(destination, {
            wait: false
          });

          if (!this.options.silent && ora) {
            ora.info(
              `opening ${chalk.blue(this.options.destination)} once created`
            );
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }
};
