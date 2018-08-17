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
  localDatabase: SqlStorage;
  table = 'words';
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
                this.reinitDatabase();
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
  setTable(table) {
    this.table = table;
  }

  fillDatabase() {
    this.http.get('/assets/dump.sql', { 'responseType': 'text' })
      .map((res) => {
        return res;
      }) 
      .subscribe(sql => {
  
        this.sqlitePorter.importSqlToDb(this.database, sql)
          .then(data => {

            this.importData('/assets/bourn.txt', 'words');
            this.importData('/assets/rus_dict_eng_top.txt', 'words2');
            this.importData('/assets/rus_dict_eng_top2.txt', 'words5');
          })
          .catch(e => console.error(e));
      });
  }
  fillLocalDatabase() {
 

    return Promise.all([
      this.executeSql('CREATE TABLE IF NOT EXISTS words(id INTEGER PRIMARY KEY AUTOINCREMENT,en TEXT,ru TEXT,date DATETIME,score INTEGER);', []),
      this.executeSql('CREATE TABLE IF NOT EXISTS words2(id INTEGER PRIMARY KEY AUTOINCREMENT,en TEXT,ru TEXT,date DATETIME,score INTEGER);', []),
      this.executeSql('CREATE TABLE IF NOT EXISTS words5(id INTEGER PRIMARY KEY AUTOINCREMENT,en TEXT,ru TEXT,date DATETIME,score INTEGER);', []),
      this.importData('/assets/bourn.txt', 'words'),
      this.importData('/assets/rus_dict_eng_top.txt', 'words2'),
      this.importData('/assets/rus_dict_eng_top2.txt', 'words5')
    ]).then(() => { this.storage.set('database_filled', true); });
 
  }
  reinitDatabase(){

     return Promise.all([
      this.executeSql('DROP TABLE IF  EXISTS words;', []),
      this.executeSql('DROP TABLE IF  EXISTS words2;', []),
      this.executeSql('DROP TABLE IF  EXISTS words5;', []),
    ]).then(() => { return this.fillDatabase() });
 
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
        return ress;
        // let ret = { rows: [] };
        // ret.rows = [];
        // if (ress.rows && ress.rows.length) {
        //   for (let i = 0; i < ress.rows.length; i++) {
        //     ret.rows.push(ress.rows.item(i));
        //   }

        // }
        // return ret


      }).catch(err => console.log(err));
    } else {

      return this.getDatabase().query(sql, data).then((res) => { return res.res })


    }

  }

  importData(fileName: string, table: string) {

    return this.http.get(fileName, { 'responseType': 'text' })
      .map((res) => {
        return res;
      })
      .subscribe(sql => {
        let text = sql.replace(/\r/g, "\n").replace(/\n{2,}/g, "\n").replace(/\t/g, ' ').replace(/ {2,}/g, ' ').replace(/^ +/g, "").replace(/\n +/g, "\n").replace(/ +$/g, "").replace(/ +\n/g, "\n").replace(/^\n/, '').replace(/`(.)/g, '$1́').split("\n");

        let date = moment().subtract(Math.floor(Math.random() * 25), 'hours').format('YYYY-MM-DD HH:mm:ss');


        for (let indeks in text) {
          let ka = text[indeks].split('=');
          date = moment().subtract(Math.floor(Math.random() * 25), 'hours').format('YYYY-MM-DD HH:mm:ss');
          this.executeSql('INSERT INTO ' + table + ' (en,ru,date,score)values (?,?,?,?)', [ka[0], ka[1], date, 0]).then(a => {});
        }
        this.databaseReady.next(true);
        this.storage.set('database_filled', true);
      });
  }

  getWord() {
    return this.executeSql('SELECT MAX(id) as mx FROM ' + this.table, []).then((data1) => {
     // console.log('-----');

      let maxRow = data1.rows.item(0).mx;

      //console.log(maxRow)
      return this.executeSql('SELECT * FROM ' + this.table + ' ORDER BY date ASC LIMIT 1', []).then((data2) => {
       // console.log(data2)
        data2.maxId = maxRow;
        data2.row = data2.rows.item(0);
        data2.variants=[];
        delete (data2.rows);
        let randomIds = [];
        for (let i = 0; i < 4; i++) {
          randomIds.push(Math.floor(Math.random() * maxRow));
        }
        return this.executeSql('SELECT * FROM ' + this.table + ' WHERE id IN(' + randomIds.join(',') + ')', []).then((data3) => {
          //console.log(data3)
          for (let t = 0; t < data3.rows.length; t++) { data2.variants.push(data3.rows.item(t)); }
          return data2;
        }).catch((err) => { console.log(err) });
      }).catch((err) => { console.log(err) })
    }).catch(err => console.log(err));

  }

  updateWord(item, score) {

    let date = moment().add(score, 'days').format('YYYY-MM-DD HH:mm:ss');
    return this.executeSql('UPDATE  ' + this.table + ' SET date=? , score=? WHERE id =?', [date, score, item.id]).then((data) => {
    }).catch((err) => { console.log(err) });

  }




}
