// 使用ngVerify前，先依赖注入
var app = angular.module('APP',['ngVerify','datePicker']);

// 测试用控制器,调用公共方法的地方注入ngVerify
app.controller('testCtrl',function ($scope, ngVerify) {

    // 这里的$scope只是控制器上的，和表单上verify指令的$scope无关
    // console.log($scope);

    // 想要拿到表单上的$scope 使用方法:
    // var verifyScope = verify.scope('loginForm')

    // angular.element(document).ready(function() {
    // 	console.log('页面加载完成，自动检测表单的验证，返回一个对象：');
    // 	var re = ngVerify.check('loginForm',true);
    // 	console.info(re);
    // });

    $scope.check = function () {
        console.log('你检测了表单的验证，返回给你一个对象：');
        var re = ngVerify.check('loginForm');
        console.info(re);
    }

    // 以ngOptions方式写seclet
    $scope.colors = [
      {name:'black'},
      {name:'white'},
      {name:'red'},
      {name:'blue'},
      {name:'yellow'}
    ];

})
