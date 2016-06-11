(function(){

// 使用ngVerify前，先依赖注入
var m = angular.module('APP',['ngVerify','datePicker']);

// 测试用控制器,调用公共方法的地方注入ngVerify
m.controller('testCtrl',function ($scope, $timeout, ngVerify) {

    /* angular.element(document).ready(function() {
    	console.log('页面加载完成，自动检测表单的验证，返回一个对象：');
    	var re = ngVerify.check('loginForm',false);
    	console.info(re);
    }); */

    $scope.colors = [
      {name:'black'},
      {name:'white'},
      {name:'red'},
      {name:'blue'},
      {name:'yellow'}
    ];



})




})()
