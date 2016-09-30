(function(){

// 使用ngVerify前，先依赖注入
var m = angular.module('APP',['ngVerify','datePicker','ui.select']);

// 测试用控制器,调用公共方法的地方注入ngVerify
m.controller('testCtrl',function ($scope, $timeout, ngVerify) {

    /* angular.element(document).ready(function() {
    	console.log('页面加载完成，自动检测表单的验证，返回未验证通过的元素：');
    	ngVerify.check('loginForm',function (errEls) {
            console.info(errEls);
    	},false);

        // 检测单个元素是否通过验证
        var res = ngVerify.checkElement('#date');
        console.log(res);
    }); */

    $scope.colors = [
      {name:'black'},
      {name:'white'},
      {name:'red'},
      {name:'blue'},
      {name:'yellow'}
    ];

    // ui-select
    $scope.itemArray = [
        {id: 1, name: 'first'},
        {id: 2, name: 'second'},
        {id: 3, name: 'third'},
        {id: 4, name: 'fourth'},
        {id: 5, name: 'fifth'}
    ];

    $scope.submit = function () {
        console.log('form submit');
    }


})




})()
