<template>
  <div id="index">
    <x-header :right-options="{showMore: true}" @on-click-more="showMenus = true">
      <span>身份验证</span>
      <x-icon @click.native="_edit()" slot="overwrite-left" type="navicon" size="35" style="fill:#fff;position:relative;top:-8px;left:-3px;"></x-icon>
    </x-header>
    <div>
      <actionsheet :menus="menus" v-model="showMenus" show-cancel @on-click-menu-scand="_click()"></actionsheet>
    </div>
    <ul class="ul-items">
      <li class="item" v-for="(item,index) in items" :key="index">
        <label v-show="edit" class="edit-check">
                          <input v-model="checkItem" type="checkbox" name="item" class="item-checkbox checkitem" :value="item.authenSecret">
                        </label>
        <div class="content" :class="{paddingLeft:edit}">
          <div class="authenName">{{item.authenName}}</div>
          <div class="authenCode" :class="{darkred:darkred}">{{secretCodeArr[index].substring(0,3)}}&nbsp;{{secretCodeArr[index].substring(3)}}</div>
          <div class="authenIssure">
            {{item.authenEmail}}
          </div>
        </div>
        <span class="item-time">{{time}}</span>
      </li>
    </ul>
    <footer v-show="edit" @click="_delete">
      删除
    </footer>
  </div>
</template>

<style lang="less">
  @import './index';
</style>

<script>
  import {
    XHeader,
    Actionsheet
  } from "vux";
  export default {
    components: {
      XHeader,
      Actionsheet
    },
    data() {
      return {
        menus: {
          scand: '<span style="color:#000">扫码</span>'
        },
        flag:true,
        showMenus: false,
        time: 30,
        items: [],
        authens:[],
        secret: '',
        secretCode: '',
        edit: false,
        checkItem: [],
        secretArr: [],
        secretCodeArr: [],
        darkred: false
      };
    },
    created() {
      let vm = this;
      var authenItems=localStorage.getItem('authenItems');
      if(authenItems){
        vm.items=JSON.parse(authenItems);
        // console.log(vm.items);
        // for (let i = 0; i < vm.items.length; i++) {
        //   vm.secretArr[i] = vm.items[i].authenSecret;
        //   vm._updateOpt(vm.items[i].authenSecret);
        // };
        // this._createFile(vm.items);
      }
      document.addEventListener('deviceready', function() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
          fs.root.getFile('kzAuthen.json', {
            create: true,
            exclusive: false
          }, function(fileEntry) {
            // 写入文件
            if(vm.items){
              vm._writeFile(fileEntry, vm.items);
            };
            // 读取文件
            fileEntry.file(function(file) {
              var reader = new FileReader();
              reader.onloadend = function() {
                var data=reader.result;
                data=JSON.parse(data);
                vm.items=data;
                for (let i = 0; i < vm.items.length; i++) {
                  vm.secretArr[i] = vm.items[i].authenSecret;
                  vm._updateOpt(vm.items[i].authenSecret);
                };
              };
              reader.readAsText(file);
            }, function(err) {
              // console.info('读取文件失败');
            });
          })
        });
      }, false);
      setInterval(vm.timer, 1000);
    },
    methods: {
      _click() {
        let vm=this;
        cordova.plugins.barcodeScanner.scan(
          result => {
            var text = result.text;
            var name = text.split('?')[0];
            name = name.substring((name.lastIndexOf('/') + 1), name.length);
            var url = result.text;
            var a = document.createElement('a');
            a.href = url;
            var query = a.search.replace('?', '').split('&');
            let obj = {};
            for (let i = 0; i < query.length; i++) {
              let name = query[i].split('=')[0];
              let content = query[i].split('=')[1];
              obj[name] = content;
            };
            if (obj.secret) {
              var secret = obj.secret;
              var email = obj.issuer;
              let newObj = {
                authenName: name,
                authenSecret: secret,
                authenEmail: email
              };
              let status = false;
              for (let i = 0; i < this.items.length; i++) {
                if (newObj.authenSecret == this.items[i].authenSecret) {
                  status = true;
                  this.items[i] = newObj;
                }
                this.secretArr[i] = this.items[i].authenSecret;
              }
              if (!status) {
                this.items.push(newObj);
                this.secretArr.push(newObj.authenSecret);
              };
              this.secretCodeArr = [];
              for (let i = 0; i < this.secretArr.length; i++) {
                this._updateOpt(this.secretArr[i]);
              };
              var items = this.items;
              items = JSON.stringify(items);
              localStorage.setItem('authenItems', items);
              this._createFile(this.items);
            } else {
              alert('未识别的二维码');
            }
          },
          error => {
            alert(error);
          }
        );
      },
      _edit() {
        let vm = this;
        vm.edit = !vm.edit;
      },
      dec2hex(s) {
        return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
      },
      hex2dec(s) {
        return parseInt(s, 16);
      },
      base32tohex(base32) {
        let base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        let hex = '';
        for (let i = 0; i < base32.length; i++) {
          let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
          bits += this.leftpad(val.toString(2), 5, '0');
        };
        for (let i = 0; i + 4 <= bits.length; i += 4) {
          let chunk = bits.substr(i, 4);
          hex = hex + parseInt(chunk, 2).toString(16);
        }
        return hex;
      },
      leftpad(str, len, pad) {
        if (len + 1 >= str.length) {
          str = Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
      },
      _updateOpt(secret) {
        let key = this.base32tohex(secret);
        // let key = this.base32tohex('JBSWY3DPEHPK3PXP');
        let epoch = Math.round(new Date().getTime() / 1000.0);
        let time = this.leftpad(this.dec2hex(Math.floor(epoch / 30)), 16, '0');
        let shaObj = new jsSHA('SHA-1', 'HEX');
        shaObj.setHMACKey(key, 'HEX');
        shaObj.update(time);
        let hmac = shaObj.getHMAC('HEX');
        if (hmac == 'KEY MUST BE IN BYTE INCREMENTS') {
          // $('#hmac').append($('<span/>').addClass('label important').append(hmac));
        } else {
          var offset = this.hex2dec(hmac.substring(hmac.length - 1));
          var part1 = hmac.substr(0, offset * 2);
          var part2 = hmac.substr(offset * 2, 8);
          var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);
        }
        var otp = (this.hex2dec(hmac.substr(offset * 2, 8)) & this.hex2dec('7fffffff')) + '';
        otp = (otp).substr(otp.length - 6, 6);
        this.secretCodeArr.push(otp);
        // console.log(this.secretCodeArr);
      },
      timer() {
        let vm=this;
        let epoch = Math.round(new Date().getTime() / 1000.0);
        let countDown = 30 - (epoch % 30);
        this.time = countDown;
        if (countDown <= 5) {
          this.darkred = true;
        } else {
          this.darkred = false;
        }
        if (epoch % 30 == 0) {
          this.secretCodeArr = [];
          if(vm.secretCodeArr){
            for (let i = 0; i < this.secretArr.length; i++) {
              this._updateOpt(this.secretArr[i]);
            };
          }
        }
      },
      _delete() {
        let vm = this;
        for(let i=0;i<vm.checkItem.length;i++){
          for(let j=0;j<vm.items.length;j++){
            if(vm.checkItem[i]==vm.items[j].authenSecret){
              vm.items.splice(j, 1);
              vm.secretArr.splice(j, 1);
            }
          }
        };
        vm.edit = !vm.edit;
        let params=vm.checkItem;
        vm._createFile(this.items);
        var items = this.items;
        items = JSON.stringify(items);
        localStorage.setItem('authenItems', items);
        setTimeout(function(){
          alert('删除成功！')
        }, 500);
        
      },
      // 创建并写入文件
      _createFile(data) {
        var vm = this;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
          fs.root.getFile('kzAuthen.json', {
            create: true,
            exclusive: false
          }, function(fileEntry) {
            // 写入文件
            vm._writeFile(fileEntry, data);
          }, function(error) {
            // console.log('创建文件失败：' + error)
          });
        }, function(error) {
          // console.log('文件系统加载失败：' + error);
        });
      },
      // 将内容数据写入到文件中
      _writeFile(fileEntry, dataObj) {
        let vm = this;
        console.log(dataObj);
        // 创建一个写入对象
        // console.log(fileEntry);
        fileEntry.createWriter(function(fileWriter) {
          // 文件写入成功
          fileWriter.onwriteend = function() {
            console.log('文件写入成功');
            vm._readFile(fileEntry);
          };
          // 文件写入失败
          fileWriter.onerror = function(e) {
            // console.log('文件写入失败：' + e.toString());
          };
          // 写入文件
          fileWriter.write(dataObj);
        })
      },
      // 读取文件
      _readFile(fileEntry) {
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function() {
            // console.log('读取文件成功：' + reader.result);
          };
          reader.readAsText(file);
        }, function(err) {
          // console.info('读取文件失败');
        });
      }
    }
  };
</script>