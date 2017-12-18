// 配置API接口地址
import Vue from 'vue';
import Vuex from 'vuex';
import VueResource from 'vue-resource'
import md5 from 'js-md5';
Vue.use(VueResource);
Vue.use(Vuex);
/**
 * _api_base 请求AJAX共用方法
 * @author wfy 2017-6-7 14:22
 * @param target 请求对象
 * @param method 请求方式 POST/GET
 * @param url 请求的地址
 * @param params 请求参数
 * @param success 请求成功方法
 * @param failure 请求失败
 * @param secret 密钥
 */
function _api_AJAX(target, method, url, params, success, failure, secret) {
  if (!secret) {
    secret = '87d66d9daf11672acbc2e4e72d7a6dbf';
  }
  params['timestamp'] = new Date().getTime();
  params['key'] = 'app';
  // 参数中不能自带sign
  if (params['sign']) {
    params['sign'] = '';
  };
  let token = localStorage.getItem('token');
  if (token) {
    params['token'] = token;
  } else {
    params['token'] = '';
  }
  var sign = objKeySort(params);
  sign = md5(sign + secret);
  params['sign'] = sign;
  if (method == 'post' || method == 'POST') {
    target.$http.post(url, params, {
      emulateJSON: true
    }).then(success).catch(failure)
  } else if (method == 'get' || method == 'GET') {
    target.$http.get(url, params, {
      emulateJSON: true
    }).then(success).catch(failure)
  }
}
/**
 * objKeySort 对象排序
 * @author wfy 2017-6-7 14:22
 * @param obj 要排序的对象
 * @returns {string}
 */
function objKeySort(obj) { //排序的函数
  var newkey = Object.keys(obj).sort();
  var newObj = ''; //创建一个新的对象，用于存放排好序的键值对
  for (var i = 0; i < newkey.length; i++) { //遍历newkey数组
    if (obj[newkey[i]] == null) {
      obj[newkey[i]] = '';
    }
    if (typeof obj[newkey[i]] == 'object') {
      var category_filter = obj[newkey[i]].sort().join('');
      newObj += category_filter;
    } else {
      newObj += obj[newkey[i]];
    }
  }
  return newObj;
}

// 返回在vue模板中的调用接口
export default {
  // AJAX GET 请求
  get: function (target, url, params, success, failure) {
    return _api_AJAX(target, 'GET', ROOT_PATH + url, params, success, failure)
  },
  // AJAX POST 请求
  post: function (target, url, params, success, failure) {
    return _api_AJAX(target, 'POST', ROOT_PATH + url, params, success, failure)
  }
}
