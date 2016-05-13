/**
 * ngVerify v0.1.1
 *
 * License: MIT
 * Designed and built by Moer
 * github   https://github.com/Moerj/ngVerify
 *
 */

!(function(angular) {



    var verifyModle = angular.module('ngVerify', []);

    // 父指令，写在form标签上
    verifyModle.directive('verify', function() {
        return {
            // scope: true,
            scope:{},
            controller: function($scope, $element, $attrs) {
                this.getscope = function() {　　　　　　　　　　
                    return $scope;　　　　　　　　
                };

                // 在作用域上添加空数组，用于存放其组件
                $scope.verify_elems = []; //需验证的表单元素
                $scope.verify_subBtn = [];//提交表单的按钮

                // 验证整个表单，错误的将标红
                $scope.verify_submit = function () {
                    // console.log('验证所有表单');
                    var els = $scope.verify_elems;
                    var re = checkAll(els);
                    if (re.hasError) {
                        for (var i = 0; i < re.errEls.length; i++) {
                            // re.errEls[i].addClass(els[i].OPTS.errorClass);
                            sign(re.errEls[i], els[i].OPTS.errorClass, true)
                        }
                    }
                }
            },
            link: function($scope, iElm) {
                iElm.attr('novalidate', 'novalidate') //禁用HTML5自带验证

                // 给form的nodelist对象上绑定$scope
                iElm[0]._verifyScope = $scope;
                // 绑定校验，返回布尔值
                iElm[0]._verifyCheck = checkAll($scope.verify_elems);
                // console.log(iElm[0]);
            }
        }
    })

    // 子指令，写在需要校验的表单元素和表单提交按钮上
    verifyModle.directive('ngVerify', function() {
        return {
            require: "?^verify",
            scope: true,
            link: function(scope, iElm, iAttrs, pCtrl) {
                if (pCtrl!=undefined) {//提交按钮在作用域内
                    var $scope = pCtrl.getscope(); //拿到父指令的scope
                    Init($scope, iElm, iAttrs);

                }else{//提交按钮在作用域外（父指令外面）
                    var obj = iAttrs.ngVerify;
                    try {
                        obj = eval("(" + iAttrs.ngVerify + ")");
                    } catch (e) {
                        console.log('以下按钮需指向关联的form.name');
                        console.error(iElm);
                    }

                    //获取对应的父指令作用域$scope
                    var $scope = verify.scope(obj.control)

                    if ($scope == undefined) {
                        console.error('$scope获取失败');
                        console.error(iElm);
                        return;
                    }
                    Init($scope, iElm, iAttrs);
                }
            }
        }
    })

    /**
        验证配置

        @param
        $scope  父指令的作用域
        iElm    指令元素
        iAttrs  元素属性

        @return null
    */
    function Init($scope, iElm, iAttrs) {
        // console.log($scope);
        var OPTS = iAttrs.ngVerify; //自定义验证参数
        if (OPTS == '') {
            OPTS = {};
        } else {
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
            required: true, //默认都进行非空校验
            option: 0, //下拉菜单校验
            min: iAttrs.minlength,
            max: iAttrs.maxlength,
            errorClass: 'verifyError',
            disabled: true //校验为成功时是否锁定提交按钮
        }

        // 合并默认和自定义配置参数
        OPTS = angular.extend({}, DEFAULT, OPTS);

        // 写入属性
        iElm.attr({
            /* 增加angular属性 */
            required: OPTS.required, //是否必填
            maxlength: OPTS.max,
            minlength: OPTS.min,
            'ng-pattern': OPTS.pattern //正则
        })

        // 元素初始化数据
        iElm.OPTS = OPTS;
        iElm.iAttrs = iAttrs;
        if (OPTS.control) {
            // iElm 是提交按钮
            // $scope.verify_subBtn = iElm;
            $scope.verify_subBtn.push(iElm);

            // 没有校验权限的按钮，默认是禁用的，只有表单输入验证通过才会启用
            if (OPTS.disabled) {
                iElm.attr('disabled', 'disabled');
            }

            //提交时检测所有表单
            iElm.bind('click', function() {
                $scope.verify_submit();
            })

        } else {// iElm 是需验证的表单元素
            var isbox = (iAttrs.type == 'checkbox') || (iAttrs.type =='radio')
            var inEvent,outEvent = '';

            // 特殊类型的触发类型和错误渲染不同
            if (isbox) {
                inEvent = 'blur';
                outEvent = 'change';
            }else{
                inEvent = 'blur';
                outEvent = 'change keyup';
            }

            // 将元素绑定到scope数组上
            $scope.verify_elems.push(iElm);

            // 元素验证事件
            // iElm.bind(inEvent, function() {
            //     if (!ISVALID(iElm)) { //验证不通过
            //         $(iElm).qtip({ //提示错误信息
            //             content: {
            //                 text: OPTS.title
            //             },
            //             show: {
            //                 ready: true, // 加载完就显示提示
            //                 event: false // 无触发事件
            //             },
            //             hide: {
            //                 event: 'keyup change'
            //             }
            //         });
            //         // 将元素标红
            //         sign(iElm, OPTS.errorClass, true);
            //
            //         // 禁用掉控制按钮
            //         DisableButtons($scope.verify_subBtn, true)
            //     }
            // })
            // .bind(outEvent, function() {
            //     if (ISVALID(iElm)) {
            //         // 取消标红
            //         sign(iElm, OPTS.errorClass, false);
            //
            //         // 检测所有
            //         var re = checkAll($scope.verify_elems);
            //         if (!re.hasError) {
            //             DisableButtons($scope.verify_subBtn, false)
            //         }
            //     }
            // })

            // 绑定元素验证事件
            // 直接获取element绑定的方法调用就可以了
            bindVaild(iElm, {inEvent,outEvent}, $scope);

            // checkbox和radio的关联元素，借助有verify指令的主元素来触发验证
            if (isbox) {
                var iElms = document.getElementsByName(iAttrs.name);
                for (var i = 0; i < iElms.length; i++) {
                    iElms[i].addEventListener(inEvent,function(){
                        iElm.trigger(inEvent)
                    })
                    iElms[i].addEventListener(outEvent,function(){
                        iElm.trigger(outEvent)
                    })
                }
            }
        }
    }

    // 绑定触发验证的事件
    function bindVaild(iElm, bindEvent, $scope) {
        // console.log(typeof iElm[0]);
        // var dom = iElm[0];
        // if (dom == undefined) {
        //     dom = iElm;
        // }
        iElm.bind(bindEvent.inEvent, function() {
        // addEvent(dom, bindEvent.inEvent,function(){
            if (!ISVALID(iElm)) { //验证不通过
                $(iElm).qtip({ //提示错误信息
                    content: {
                        text: iElm.OPTS.title
                    },
                    show: {
                        ready: true, // 加载完就显示提示
                        event: false // 无触发事件
                    },
                    hide: {
                        event: 'keyup change'
                    }
                });
                // 将元素标红
                sign(iElm, iElm.OPTS.errorClass, true);

                // 禁用掉控制按钮
                DisableButtons($scope.verify_subBtn, true)
            }
        })
        .bind(bindEvent.outEvent, function() {
        // addEvent(dom, bindEvent.outEvent,function(){
            if (ISVALID(iElm)) {
                // 取消标红
                sign(iElm, iElm.OPTS.errorClass, false);

                // 检测所有
                var re = checkAll($scope.verify_elems);
                if (!re.hasError) {
                    DisableButtons($scope.verify_subBtn, false)
                }
            }
        })
    }

    /** 标记未通过验证的元素
        @param
        iElm        DomObj      需要标记的元素
        className   String      标记的类名
        sing        Boolean     是标记还是取消
    */
    function sign(iElm, className, sign){
        if (iElm[0].type == 'checkbox' || iElm[0].type == 'radio') {
            var parent = iElm.parent();
            if (parent[0].localName == 'label') {
                parent = parent.parent();
            }
            iElm = parent;
        }
        // console.log(iElm);
        if (sign) {
            iElm.addClass(className)
        }else{
            iElm.removeClass(className)
        }
    }

    // 禁用/启用相关的提交按钮
    function DisableButtons(btns, isDisable) {
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].OPTS.disabled) {
                btns[i].attr('disabled', isDisable)
            }
        }
    }

    /**
     * 验证一个元素
     * @param   iElm验证的元素   OPTS目标元素接收的指令配置
     * @return  Boolean   代表元素是否通过验证
     */
    function ISVALID(iElm) {
        //隐藏元素直接校验通过
        if(iElm[0].style.display == 'none'){
            return true;
        }

        var val = iElm[0].value; //元素的值
        var pat; //正则规则
        var OPTS = iElm.OPTS;
        var iAttrs = iElm.iAttrs;

        // 非表单元素验证
        if (iElm[0].value == undefined) {
            // 非表单元素
            val = iElm.text();
            // console.warn('检测到非表单元素:');
            // console.log(iElm[0]);
        }

        // checkbox复选框、radio单选
        if (iAttrs.type == 'checkbox' || iAttrs.type == 'radio') {
            var elName = iElm.attr('name');
            // 拿到同name的checkbox,这里没有做其他元素同name判断，待优化
            var els = document.getElementsByName(elName);
            for (var i = 0; i < els.length; i++) {
                if (els[i].checked) {
                    return true;
                }
            }
            OPTS.title = '至少选择一项'
            return false;
        }

        // 非空验证
        if (OPTS.required && val == '') {
            OPTS.title = '不能为空'
            return false;
        } else if (!OPTS.required && val == '') {
            return true;
        }

        // 长度验证
        if (val.length < OPTS.min) {
            OPTS.title = '最少' + OPTS.min + '个字符'
            return false;
        }

        // select元素验证
        if (iElm[0].nodeName == 'SELECT') {
            // console.log( OPTS.option);
            // console.log( iElm[0].selectedIndex);
            if (iElm[0].selectedIndex === OPTS.option) {
                OPTS.title = '必须选择一项'
                return false;
            } else {
                return true;
            }
        }


        // 正则获取
        if (OPTS.pattern) {
            pat = OPTS.pattern; //如果传入了正则，直接使用；
        } else {
            // 没有传入正则，按类型计算正则
            switch (iAttrs.type) {
                case 'number':
                    pat = /\d/;
                    break;
                case 'email':
                    pat = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
                    break;
                case 'phone':
                    pat = /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/;
                    break;
                case 'url':
                    pat = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
                    break;
                case 'string':
                    pat = /a-zA-Z/;
                    break;
            }
        }

        //如果pat已赋值
        // console.log(pat);
        if (pat) {
            // 验证正则
            if (val.match(pat) == null) {
                // console.warn('正则匹配错误');
                OPTS.title = OPTS.errmsg ? OPTS.errmsg : '输入类型错误'
                return false;
            } else {
                // console.info('正则匹配')
                return true;
            }
        }

        return true;
    }

    /**
     * 检测所有元素是否验证成功
     * @param els 传入需要验证的元素组
     * @return {blooean, Arry}
     */
    function checkAll(els) {
        var RE = {
            hasError: false,
            errEls: [] //所有的错误元素
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

    /**
     * [全局验证方法]
     * 用于验证指定表单是否通过
     * @param  String   formName: name
     * @return Boolean
     */
    window.verify = ({
        scope: function (formName) {
            var forms = document.getElementsByName(formName);
            var obj;//获取一个对象，它是form上的scope作用域

            for (var i = 0; i < forms.length; i++) {
                if (forms[i]._verifyScope) {
                    // console.log(forms[i]);
                    obj = forms[i]._verifyScope;
                    break;
                }
            }
            return obj;
        },
        check: function (formName) {
            var forms = document.getElementsByName(formName);
            var obj;//绑定在nodelist上的方法，即 @function checkAll()

            for (var i = 0; i < forms.length; i++) {
                if (forms[i]._verifyCheck) {
                    // console.log(forms[i]);
                    obj = forms[i]._verifyCheck;
                    break;
                }
            }
            return obj;
        }
    })

})(angular)
