import { HttpClient } from '@angular/common/http';
//import { Http } from '@angular/http';

import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import 'rxjs/add/operator/map';
import { BehaviorSubject } from 'rxjs/Rx';
import { Storage } from '@ionic/storage';
import { SqlStorage } from '../sql/sql';
import { isPromise } from '@angular/compiler/src/util';
import * as moment from 'moment';
/*
  Generated class for the DatabaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DatabaseProvider {

  database: SQLiteObject;
  localDatabase: SqlStorage
  private databaseReady: BehaviorSubject<boolean>;

  constructor(public sqlitePorter: SQLitePorter, private storage: Storage, private sqlite: SQLite, private platform: Platform, private http: HttpClient, private sqlStorage: SqlStorage) {
    this.databaseReady = new BehaviorSubject(false);


    this.platform.ready().then(() => {
      if (platform._platforms[0] == 'cordova') {
        this.sqlite.create({
          name: 'developers.db',
          location: 'default'
        })
          .then((db: SQLiteObject) => {
            this.database = db;
            this.storage.get('database_filled').then(val => {
              if (val) {
                this.databaseReady.next(true);
              } else {
                this.fillDatabase();
              }
            });
          });
      } else {
        this.localDatabase = sqlStorage;



        this.storage.get('database_filled').then(val => {
          if (val) {
            this.databaseReady.next(true);
          } else {
            this.fillLocalDatabase();
          }
        });
      }




    });
  }
  getDatabase = function () {
    if (this.platform._platforms[0] == 'cordova') {
      return this.database
    } else {
      return this.localDatabase;

    }
  }

  fillDatabase() {
    this.http.get('assets/dump.sql', { 'responseType': 'text' })
      .map((res) => {
        return res;
      })
      .subscribe(sql => {

        this.sqlitePorter.importSqlToDb(this.database, sql)
          .then(data => {

            this.importData();
          })
          .catch(e => console.error(e));
      });
  }
  fillLocalDatabase() {


    return Promise.all([this.executeSql('CREATE TABLE IF NOT EXISTS words(id INTEGER PRIMARY KEY AUTOINCREMENT,en TEXT,ru TEXT,date DATETIME,score INTEGER);', []),
    this.importData()
    ]).then(() => { this.storage.set('database_filled', true); });

  }

  addDeveloper(name, skill, years) {
    let data = [name, skill, years]
    return this.executeSql("INSERT INTO developer (name, skill, yearsOfExperience) VALUES (?, ?, ?)", data).then(data => {
      return data;
    }, err => {
      console.log('Error: ', err);
      return err;
    });
  }

  getAllDevelopers() {
    // return this.getDatabase().executeSql("SELECT * FROM developer", []).then((data) => {
    return this.executeSql("SELECT * FROM developer", []).then((data) => {
      let developers = [];
      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
          developers.push({ name: data.rows.item(i).name, skill: data.rows.item(i).skill, yearsOfExperience: data.rows.item(i).yearsOfExperience });
        }
      }
      return developers;
    }, err => {
      console.log('Error: ', err);
      return [];
    });
  }

  getDatabaseState() {
    return this.databaseReady.asObservable();
  }

  executeSql(sql, data) {

    if (this.platform._platforms[0] == 'cordova') {
      return this.getDatabase().executeSql(sql, data).then((ress) => {
        let ret = { rows: [] };
        ret.rows = [];
        if (ress.rows && ress.rows.length) {
          for (let i = 0; i < ress.rows.length; i++) {
            ret.rows.push(ress.rows.item(i));
          }

        }
        return ret


      }).catch(err => console.log(err));
    } else {

      return this.getDatabase().query(sql, data).then((res) => { return res.res })


    }

  }

  importData() {
    return this.http.get('assets/bourn.txt', { 'responseType': 'text' })
      .map((res) => {
        return res;
      })
      .subscribe(sql => {
        let text = sql.replace(/\r/g, "\n").replace(/\n{2,}/g, "\n").replace(/\t/g, ' ').replace(/ {2,}/g, ' ').replace(/^ +/g, "").replace(/\n +/g, "\n").replace(/ +$/g, "").replace(/ +\n/g, "\n").replace(/^\n/, '').replace(/`(.)/g, '$1́').split("\n");

        let date = moment().subtract(Math.floor(Math.random() * 25), 'hours').format('YYYY-MM-DD HH:mm:ss');


        for (let indeks in text) {
          let ka = text[indeks].split('=');
          date = moment().subtract(Math.floor(Math.random() * 25), 'hours').format('YYYY-MM-DD HH:mm:ss');
          this.executeSql('INSERT INTO words (en,ru,date,score)values (?,?,?,?)', [ka[0], ka[1], date, 0]).then(a => console.log(a));
        }
        this.databaseReady.next(true);
        this.storage.set('database_filled', true);
      });
  }

  getWord() {
    return this.executeSql('SELECT MAX(id) as mx FROM words', []).then((data1) => {

      let maxRow = data1.rows[0].mx;
      return this.executeSql('SELECT * FROM words ORDER BY date ASC LIMIT 1', []).then((data2) => {
        data2.maxId = maxRow;
        data2.row = data2.rows[0];
        delete (data2.rows);
        let randomIds = [];
        for (let i = 0; i < 4; i++) {
          randomIds.push(Math.floor(Math.random() * maxRow));
        }
        return this.executeSql('SELECT * FROM words WHERE id IN(' + randomIds.join(',') + ')', []).then((data3) => {
          data2.variants = data3.rows;
          return data2;
        }).catch((err) => { console.log(err) });
      }).catch((err) => { console.log(err) })
    }).catch(err => console.log(err));

  }

  updateWord(item, score) {

    let date = moment().add(score, 'days').format('YYYY-MM-DD HH:mm:ss');
    return this.executeSql('UPDATE  words SET date=? , score=? WHERE id =?', [date, score, item.id]).then((data) => {
    }).catch((err) => { console.log(err) });

  }




}
