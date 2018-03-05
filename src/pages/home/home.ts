import { DatabaseProvider } from './../../providers/database/database';
import { Component } from '@angular/core';
import { IonicPage, Platform, NavController } from 'ionic-angular';
import { SmartAudioProvider } from './../../providers/smart-audio/smart-audio';

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

  constructor(public navCtrl: NavController, private databaseprovider: DatabaseProvider, private platform: Platform, private smartAudioProvider: SmartAudioProvider) {
    this.smartAudioProvider.preload('wrong', '/assets/sounds/wrong1.mp3');
    this.smartAudioProvider.preload('ok', '/assets/sounds/ok.mp3');

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
    console.log('ionViewDidLoad HomePage');
  }
  getWord() {
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

      for (let i = 0; i < data.variants.length; i++) {
        console.log(data.variants[i])
        this.variants.push(data.variants[i]);
      }

      let posrel = Math.floor(Math.random() * this.variants.length);
      console.log(this.variants)
      this.variants.splice(posrel, 0, data.row);

      console.log(langrand);
      console.log(data)
      this.item = data;
      this.canCheck = true;

    })
  }
  clickButton(item) {
    if(!this.canCheck)
    {
      return;
    }
    this.canCheck = false;
    item.write = !item.write;
    console.log(item);
    console.log(this.item);
    if (item.id == this.item.row.id) {
      console.log('ok');
      this.smartAudioProvider.play('ok');
      setTimeout(()=>{ 
        this.getWord();
       
    },1000);
    } else { this.smartAudioProvider.play('wrong');
  setTimeout(()=>{ 
    item.write = !item.write;
    this.canCheck = true;
    },500);
  }
  }

}
