(function () {


var m = angular.module('APP');

m.directive('upload',function () {
    return{
        template: '<div class="form-group"><label class="control-label">Upload</label><input type="text" class="form-control" ng-verify /></div>',
        replace: true,
        controller:function ($scope, $element, $attrs) {
            $scope.getName = function () {
                return $element.find('input')[0].className;
            }
            $scope.$watch('getName()',function (newValue, oldValue) {
                if (newValue != oldValue) {
                    var toggle = !!newValue.indexOf('verify') + 1;
                    $element.toggleClass('has-error',toggle)
                }
            })
        },
        link: function (scope, el, attr) {
            el.find('input').bind('blur change',function (e) {
                var toggle = e.target.className.indexOf('verify') + 1;
                el.toggleClass('has-error',toggle)
            })
        }
    }
})



})()
