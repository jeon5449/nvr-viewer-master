/* jshint browser:true, devel:true */
/* global $ */

(function() {

  'use strict';

  var mvTranslation = {
    'en': {
      'add': 'Add',
      'address': 'Address',
      'auth-channel-permission': 'Insufficient camera access permission',
      'auth-failure': 'Invalid user name or password',
      'auth-invalid-channel':'Invalid camera number',
      'auth-network-permission': 'Insufficient network access permission',
      'back-to-main': 'Back to the device list',
      'camera': 'Camera',
      'connect-failure': 'Failed to connect to the device',
      'connecting': 'Connecting...',
      'device-list': 'Device List',
      'display-mode': 'Display Mode',
      'edit-device': 'Edit Device',
      'fill-screen': 'Fill Screen',
      'focus': 'Focus',
      'http-port': 'HTTP Port',
      'move': 'Move',
      'name': 'Name',
      'new-device': 'New Device',
      'no': 'No',
      'ok': 'OK',
      'password': 'Password',
      'popup-remove-content': 'Do you want to remove this device?',
      'popup-remove-title': 'Remove Device',
      'preset': 'Preset',
      'ptz-control': 'PTZ Control',
      'remove': 'Remove',
      'show-header': 'Show Header Information',
      'snapshot-failure': 'Failed to save snapshot image',
      'snapshot-sucess': 'Snapshot image saved',
      'user-name': 'User Name',
      'yes': 'Yes',
      'zoom': 'Zoom'
    },

    'ko': {
      'add': '추가',
      'address': '주소',
      'auth-channel-permission': '카메라 접근 권한이 없습니다.',
      'auth-failure': '사용자 이름이나 비밀번호가 틀립니다.',
      'auth-invalid-channel':'카메라 번호가 잘못되었습니다.',
      'auth-network-permission': '네트워크 접근 권한이 없습니다.',
      'back-to-main': '장비 목록으로 돌아가기',
      'camera': '카메라',
      'connect-failure': '장비에 접속할 수 없습니다',
      'connecting': '접속중...',
      'device-list': '장비 목록',
      'display-mode': '표시 모드',
      'edit-device': '장비 수정',
      'fill-screen': '화면 채움',
      'focus': '초점',
      'http-port': 'HTTP 포트 번호',
      'move': '이동',
      'name': '이름',
      'new-device': '새 장비 추가',
      'no': '아니오',
      'ok': '확인',
      'password': '비밀번호',
      'popup-remove-content': '장비를 목록에서 제거하겠습니까?',
      'popup-remove-title': '장비 제거',
      'preset': '프리셋',
      'ptz-control': 'PTZ 제어',
      'remove': '제거',
      'show-header': '상단 정보 표시',
      'snapshot-failure': '스냅 사진을 저장하지 못했습니다.',
      'snapshot-sucess': '스냅 사진을 저장했습니다.',
      'user-name': '사용자 이름',
      'yes': '예',
      'zoom': '확대'
    }
  };

  function normaliseLanguageCode(lang) {
    lang = lang.toLowerCase();
    
    /* Discard region code. */
    if (lang.length > 2) {
      lang = lang.substring(0, 2);
    }
    return lang;
  }
  var browserLang = normaliseLanguageCode(navigator.language /* Mozilla */ ||
                                          navigator.userLanguage /* IE */);

  window.mvSetLanguage = function (lang) {
    browserLang = lang;
  };
  window.mvGetText = function (msg) {
    var trans = mvTranslation[browserLang];
    if (!trans)
      trans = mvTranslation.en;
    var text = trans[msg];
    if (!text) {
      console.log('untranslated message "' + msg + '" for language "' + browserLang + '"');
      return msg;
    }
    return text;
  };

  window.mvLocalize = function () {
    $('[data-trans]').each(function () {
      var element = $(this);
      var msg = element.data('trans');
      element.html(window.mvGetText(msg));
    });
  };
}());
