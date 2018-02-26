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
        this.databaseReady.next(true);
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
            this.databaseReady.next(true);
            this.storage.set('database_filled', true);
          })
          .catch(e => console.error(e));
      });
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
      return this.getDatabase().executeSql(sql, data)
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
        console.log(text)

        let date = moment().format('YYYY-MM-DD HH:mm:ss');


        console.log()
        for (let indeks in text) {
          let ka = text[indeks].split('=');

         // this.executeSql('INSERT INTO words (en,ru,date,score)values (?,?,?,?)',[ka[0],ka[1],date,0]).then(a=>console.log(a));
        }

      });
  }




}
