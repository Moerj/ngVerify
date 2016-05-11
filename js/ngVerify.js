/**
 * ngVerify v0.1.0
 *
 * Designed and built by Moer
 * github   https://github.com/Moerj
 */

!(function (angular) {



var verifyModle = angular.module('ngVerify',[]);

// 父指令，写在form标签上
verifyModle.directive('verifyform', function() {
    return {
        scope:{},
        controller:function($scope, $element, $attrs){
            $scope.verify_elems = [];
　　　　　　　　this.getscope = function(){
　　　　　　　　　　return $scope;
　　　　　　　　};
　　　　　},
        link:function (scope, iElm) {
            iElm.attr('novalidate','novalidate')//禁用HTML5自带验证
        }
    }
})

// 子指令，写在需要校验的表单元素和表单提交按钮上
verifyModle.directive('ngVerify', function() {
    return {
        require:"^verifyform",
        scope:true,
        link: function(scope, iElm, iAttrs, pCtrl) {
            var $scope = pCtrl.getscope();//拿到父指令的scope
            // console.log($scope);
            verify($scope, iElm, iAttrs)
        }
    }
})

/*
    验证配置

    @参数:
    $scope  父指令的作用域
    iElm    指令元素
    iAttrs  元素属性

    @返回值: null
*/
function verify($scope, iElm, iAttrs) {
    var OPTS = iAttrs.ngVerify;//自定义验证参数
    if (OPTS=='') {
        OPTS = {};
    }else{
        try {
            OPTS = eval("(" + iAttrs.ngVerify + ")");
        } catch (e) {
            console.log('以下元素绑定的验证参数有语法错误：');
            console.error(iElm);
        }
    }

    // 默认配置
    var DEFAULT = {
        title: '此项为必填',
        value: iElm.val(),
        required: true,//默认都进行非空校验
        option: 0,//下拉菜单校验
        min: iAttrs.minlength,
        max: iAttrs.maxlength,
        errorClass: 'verifyError'
    }

    // 合并默认和自定义配置参数
    OPTS = angular.extend({}, DEFAULT, OPTS);
    // console.log(OPTS);

    // 写入属性
    iElm.attr({
        /* 增加angular属性 */
        required: OPTS.required,//是否必填
        maxlength: OPTS.max,
        minlength: OPTS.min,
        'ng-pattern': OPTS.pattern //正则
    })

    // 元素初始化数据
    iElm.OPTS = OPTS;
    iElm.iAttrs = iAttrs;
    if (OPTS.formName) {
        // iElm 是提交按钮
        $scope.verify_subBtn = iElm;
        iElm.attr('disabled','disabled');
        iElm.bind('click',function () {//提交时检测所有表单
            // 检测所有元素是否还有错
            var re = checkAll($scope.verify_elems);
            console.log(re);
        })
    }else{
        // iElm 是需验证的表单元素
        $scope.verify_elems.push(iElm);
        // 元素验证事件
        iElm.bind('blur',function () {
            if (!ISVALID(iElm)) {//验证不通过
                $(iElm).qtip({//提示错误信息
                    content:{
                        text: OPTS.title
                    },
                    show: {
                        ready: true,// 加载完就显示提示
                        event: false// 无触发事件
                    },
                    hide:{
                        event: 'keyup change'
                    }
                });
                // 将元素标红
                iElm.addClass(OPTS.errorClass);
                $scope.verify_subBtn.attr('disabled','disabled');
            }
        })
        .bind('change keyup',function(){
            if (ISVALID(iElm)) {
                // 取消标红
                iElm.removeClass(OPTS.errorClass);
                // 检测所有
                var re = checkAll($scope.verify_elems);
                if (!re.hasError) {
                    $scope.verify_subBtn.attr('disabled',false);
                    // console.log('undisable btn');
                }
            }
        })
    }
}

/*
* 验证元素
* @参数   iElm验证的元素   OPTS目标元素接收的指令配置
* @返回值  布尔   代表元素是否通过验证
*/
function ISVALID(iElm) {
    var val = iElm.val();//元素的值
    var pat;//正则规则
    var OPTS = iElm.OPTS;
    var iAttrs = iElm.iAttrs;

    // 非空验证
    if (OPTS.required && val=='') {
        OPTS.title = '不能为空'
        return false;
    }else if (!OPTS.required && val=='') {
        return true;
    }

    // 长度验证
    if (val.length<OPTS.min) {
        OPTS.title = '最少'+OPTS.min+'个字符'
        return false;
    }

    // 特殊元素验证
    if (iElm[0].nodeName == 'SELECT') {
        // console.log( OPTS.option);
        // console.log( iElm[0].selectedIndex);
        if (iElm[0].selectedIndex === OPTS.option) {
            OPTS.title = '必须选择一项'
            return false;
        }else {
            return true;
        }
    }

    // 正则获取
    if (OPTS.pattern) {
        pat = OPTS.pattern;//如果传入了正则，直接使用；
    }else{
        // 没有传入正则，按类型计算正则
        switch (iAttrs.type) {
            case 'number':
                pat = /\d/;
                break;
            case 'email':
                pat = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
                break;
            case 'phone':
                pat = /^[1][3][0-9]{9}$/;
                break;
            case 'telephone':
                pat = /^[0][1-9]{2,3}-[0-9]{5,10}$/;
                break;
        }
    }

    //如果pat已赋值
    // console.log(pat);
    if (pat) {
        // 验证正则
        if (val.match(pat)==null) {
            // console.warn('正则匹配错误');
            OPTS.title = '输入类型错误'
            return false;
        }else{
            // console.info('正则匹配')
            return true;
        }
    }

    return true;
}

/*
    检测所有元素是否验证成功
    @return {blooean, Arry}
*/
function checkAll(els) {
    var RE = {
        hasError:false,
        errEls:[]//所有的错误元素
    };
    for (var i = 0; i < els.length; i++) {
       if (!ISVALID(els[i])) {
        //    console.log('this el has error !');
        //    console.log(els[i]);
            RE.errEls.push(els[i])
       }
    }
    RE.hasError = !!RE.errEls.length;
    return RE;
}



})(angular)
