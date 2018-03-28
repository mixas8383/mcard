import { DatabaseProvider } from './../../providers/database/database';
import { Component } from '@angular/core';
import { IonicPage, Platform, NavController, NavParams } from 'ionic-angular';
import { SmartAudioProvider } from './../../providers/smart-audio/smart-audio';
import { TextToSpeech } from '@ionic-native/text-to-speech';

/**
 * Generated class for the HomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  developer = {};
  developers = [];
  item;
  aversLang: string = 'en';
  reverslang: string = 'ru';
  variants = [];
  enable = true;
  canCheck = true;
  wrongCount: number = 0;
  textPlay = true;
  goodColor = '#04c33c';
  badColor = '#FF0000';
  pageTitle = '';
  scoreTotal = -1;
  scoreWrong = 0;
  tmpWrite = 0;
  tmpWrong = 0;



  constructor(public navParams: NavParams, public navCtrl: NavController, private databaseprovider: DatabaseProvider, private platform: Platform, private smartAudioProvider: SmartAudioProvider, private tts: TextToSpeech) {
    this.smartAudioProvider.dosome();
    let table = this.navParams.get('table');
    if (!table) {
      table = 'words';
    }
    switch (table) {
      case 'words':
        this.pageTitle = 'Bourn';
        break;
      case 'words2':
        this.pageTitle = 'Words 2000';
        break;
      case 'words5':
        this.pageTitle = 'Words 5000';
        break;
      default:
        this.pageTitle = 'Bourn';
        break;
    }

    this.databaseprovider.setTable(table);
    this.databaseprovider.getDatabaseState().subscribe(rdy => {
      if (rdy) {

        this.loadDeveloperData();
      }
    })
  }

  loadDeveloperData() {
    this.getWord();


  }
  addDeveloper() {
    this.databaseprovider.addDeveloper(this.developer['name'], this.developer['skill'], parseInt(this.developer['yearsOfExperience']))
      .then(data => {
        this.loadDeveloperData();
      });
    this.developer = {};
  }
  ionViewDidLoad() {
    // console.log('ionViewDidLoad HomePage');
  }
  getWord() {
    this.scoreTotal++;

    if (this.tmpWrong > 0) {
      this.scoreWrong++;
      this.tmpWrong = 0;
      this.tmpWrite = 0;
    }

    this.databaseprovider.getWord().then(data => {
      let langrand = Math.floor(Math.random() * 2);
      if (langrand == 1) {
        this.aversLang = 'en';
        this.reverslang = 'ru';
      } else {
        this.aversLang = 'ru';
        this.reverslang = 'en';
      }
      this.variants = [];
      //console.log(data.variants)
      // data.variants.map((is)=>{



      // });

      for (let i = 0; i < data.variants.length; i++) {
        let item = data.variants[i]
        item[this.reverslang] = this.explode(item[this.reverslang]);
        this.variants.push(item);
      }

      let posrel = Math.floor(Math.random() * this.variants.length);
      this.variants.splice(posrel, 0, data.row);
      data.row[this.aversLang] = this.explode(data.row[this.aversLang])
      data.row[this.reverslang] = this.explode(data.row[this.reverslang])


      this.item = data;
      this.canCheck = true;
      this.wrongCount = 0;

    })
  }
  clickButton(item) {

    if (!this.canCheck) {
      return;
    }
   // this.scoreTotal++;


    this.canCheck = false;


    item.write = !item.write;


    if (item.id == this.item.row.id) {
      this.tmpWrite++;
      item.color = this.goodColor;
      if (this.wrongCount > 0) {
        this.databaseprovider.updateWord(item, 1)
      } else {
        this.databaseprovider.updateWord(item, item.score + 1)
      }
      this.smartAudioProvider.play('ok');
      if (this.textPlay) {
        this.tts.speak(this.item.row.en)
          .catch((reason: any) => console.log(reason));
      }
      setTimeout(() => {
        this.getWord();

      }, 1000);
    } else {
      this.tmpWrong++;
      item.color = this.badColor;
      this.wrongCount++;
      this.smartAudioProvider.play('wrong');
      setTimeout(() => { 
        item.write = !item.write;
        this.canCheck = true;
      }, 500);
    }
  }

  explode(title: string) {
    if (title.indexOf(';') > 0) {

      let titles = title.split(';');
      let index = Math.floor(Math.random() * titles.length);
      title = titles[index];
      return title;
    }
    return title;
  }
}
