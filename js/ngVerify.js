/**
 * ngVerify v0.1.0
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
                    for (var i = 0; i < els.length; i++) {
                        if (!ISVALID(els[i])) {
                            els[i].addClass(els[i].OPTS.errorClass);
                        }
                    }
                }

            },
            link: function(scope, iElm) {
                iElm.attr('novalidate', 'novalidate') //禁用HTML5自带验证

                // 给form的DOM对象上绑定scope
                iElm[0]._verifyScope = scope;
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

                    // 根据传递进来的父元素的name属性拿到dom对象
                    var form = document.getElementsByName(obj.formName)
                    // console.log(form);
                    // 获取对应的父指令作用域$scope
                    var $scope = form[0]._verifyScope;
                    if ($scope == undefined) {
                        console.error('外部的按钮找不到作用域，可能你指定的name有多个元素在使用');
                        console.error(iElm);
                        return;
                    }
                    Init($scope, iElm, iAttrs);
                }
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
            control: true //校验为成功时是否锁定提交按钮
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
        if (OPTS.formName || iAttrs.type=='submit') {
            // iElm 是提交按钮
            // $scope.verify_subBtn = iElm;
            $scope.verify_subBtn.push(iElm);

            // 没有校验权限的按钮，默认是禁用的，只有表单输入验证通过才会启用
            if (OPTS.control) {
                iElm.attr('disabled', 'disabled');
            }

            //提交时检测所有表单
            iElm.bind('click', function() {
                var re = checkAll($scope.verify_elems);
                // console.log(re);
                if (re.hasError) {
                    $scope.verify_submit();
                }
            })

        } else {
            // iElm 是需验证的表单元素
            $scope.verify_elems.push(iElm);
            // 元素验证事件
            iElm.bind('blur', function() {
                    if (!ISVALID(iElm)) { //验证不通过
                        $(iElm).qtip({ //提示错误信息
                            content: {
                                text: OPTS.title
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
                        iElm.addClass(OPTS.errorClass);
                        DisableButtons($scope.verify_subBtn, true)
                    }
                })
                .bind('change keyup', function() {
                    if (ISVALID(iElm)) {
                        // 取消标红
                        iElm.removeClass(OPTS.errorClass);
                        // 检测所有
                        var re = checkAll($scope.verify_elems);
                        if (!re.hasError) {
                            DisableButtons($scope.verify_subBtn, false)
                        }
                    }
                })
        }
    }

    // 禁用/启用相关的提交按钮
    function DisableButtons(btns, isDisable) {
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].OPTS.control) {
                btns[i].attr('disabled', isDisable)
            }
        }
    }

    /*
     * 验证元素
     * @参数   iElm验证的元素   OPTS目标元素接收的指令配置
     * @返回值  布尔   代表元素是否通过验证
     */
    function ISVALID(iElm) {
        var val = iElm.val();; //元素的值
        var pat; //正则规则
        var OPTS = iElm.OPTS;
        var iAttrs = iElm.iAttrs;

        // 非表单元素验证
        // var el = iElm[0].nodeName
        if (iElm[0].value == undefined) {
            // 非表单元素
            val = iElm.text();
            // console.warn('检测到非表单元素:');
            // console.log(iElm[0]);
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
            if (val.match(pat) == null) {
                // console.warn('正则匹配错误');
                OPTS.title = '输入类型错误'
                return false;
            } else {
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



})(angular)
