import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { NativeAudio } from '@ionic-native/native-audio';

@Injectable()
export class SmartAudioProvider {

    audioType: string = 'html5';
    sounds: any = [];
    keys: any = [];

    constructor(public nativeAudio: NativeAudio, platform: Platform) {
        platform.ready().then(() => {
            if (platform.is('cordova')) {
                this.audioType = 'native';
                this.preload('wrong', 'assets/sounds/wrong1.mp3');
                this.preload('ok', 'assets/sounds/ok.mp3');
            }

        });



    }
    dosome(){
        let a=5;
    };

    preload(key, asset) {

        if (this.audioType === 'html5') {

            let audio = {
                key: key,
                asset: asset,
                type: 'html5'
            };

            this.sounds.push(audio);

        } else {



            let audio = {
                key: key,
                asset: key,
                type: 'native'
            };



            this.nativeAudio.preloadSimple(key, asset);

            this.sounds.push(audio);
            //   this.keys.push(key)



        }

    }

    play(key) {

        let audio = this.sounds.find((sound) => {
            return sound.key === key;
        });

        //console.log(audio);
        if (audio.type === 'html5') {

            let audioAsset = new Audio(audio.asset);
            audioAsset.play();

        } else {

            this.nativeAudio.play(audio.asset).then((res) => {
                console.log(audio);
            }, (err) => {
                console.log(err);
            });

        }

    }

}