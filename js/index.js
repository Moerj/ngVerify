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


    $scope.test1 = function () {
        $scope.myColor = $scope.colors[1]
    }
    $scope.test2 = function () {
        $scope.myColor = null
    }

    // 测试日历
    $scope.datebtn1 = function () {
        $scope.date = {
            mon:'1987-08-31'
        }
        ngVerify.check('loginForm',function (errEls) {

            console.log(errEls.length);
        },true);
    }
    $scope.datebtn2 = function () {
        $scope.date = {
            mon: null
        }
        ngVerify.check('loginForm',function (errEls) {

            console.log(errEls.length);
        },true);
    }

    /* $timeout(function () {
        $scope.date = {
            mon:'1987-08-31'
        }
        // $scope.$apply()
        ngVerify.check('loginForm',function (errEls) {

            console.log(errEls.length);
        },true);
    },500)
    $timeout(function () {
        $scope.date = {
            mon: null
        }
        // $scope.$apply()
        ngVerify.check('loginForm',function (errEls) {

            console.log(errEls.length);
        },true);
    },1000) */

})




})()
