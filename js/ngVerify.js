/**
 * ngVerify v1.2.3
 *
 * @license: MIT
 * Designed and built by Moer
 * github   https://github.com/Moerj/ngVerify
 *
 */

!(function(angular) {


    var m = angular.module('ngVerify', []);

    m.provider('ngVerify', function() {
        this.$get = function() {
            var publicMethods = {
                /** 全局暴露的公共方法
                 * @param  String   formName: name
                 * @return Boolean
                 */
                scope: function(formName) {
                    var forms = document.getElementsByName(formName);
                    var obj; //获取一个对象，它是form上的scope作用域

                    for (var i = 0; i < forms.length; i++) {
                        if (forms[i]._verifyScope) {
                            obj = forms[i]._verifyScope;
                            break;
                        }
                    }
                    return obj;
                },
                // 检测一个form表单校验是否通过，draw=true时将错误的标记出来
                check: function(formName, draw) {
                    var forms = document.getElementsByName(formName);
                    var obj; //绑定在nodelist上的方法，即 @function checkAll()

                    for (var i = 0; i < forms.length; i++) {
                        if (forms[i]._verifyScope) {
                            var els = publicMethods.scope(forms[i].name).ngVerify.elems
                            obj = checkAll(els);
                            if (draw) {
                                var errEls = obj.errEls;
                                for (var n = 0; n < errEls.length; n++) {
                                    makeError(errEls[n], true);
                                }
                            }
                        }
                    }
                    return obj;
                }
            }

            return publicMethods;
        }
    });

    // 父指令，写在form标签上
    m.directive('verifyScope', function() {
        return {
            scope: {},
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                this.getscope = function() {　　　　　　　　　　
                    return $scope;　　　　　　　　
                };

                // 在作用域上绑定需要的数据
                $scope.ngVerify = {

                    elems: [], //需验证的表单元素

                    subBtn: [], //提交表单的按钮

                    tipStyle: formatOpt($attrs.verifyScope, $element).tipStyle,

                    // 验证整个表单，错误的将标红
                    submit: function() {
                        var els = $scope.ngVerify.elems;
                        var re = checkAll(els);
                        for (var i = 0; i < re.errEls.length; i++) {
                            makeError(re.errEls[i], true)
                                // tipMsg(re.errEls[i], true) //提示错误信息
                        }
                    }
                }

                // 给form的nodelist对象上绑定$scope
                $element[0]._verifyScope = $scope;

            }],
            link: function(scope, iElm) {
                iElm.attr('novalidate', 'novalidate') //禁用HTML5自带验证
            }
        }
    })

    // 子指令，写在需要校验的表单元素和表单提交按钮上
    m.directive('ngVerify',['ngVerify', function(ngVerify) {
        return {
            require: "?^verifyScope",
            scope: true,
            link: function(scope, iElm, iAttrs, pCtrl) {

                var pScope; //父指令的$scope

                // 获取传入的配置参数
                var OPTS = formatOpt(iAttrs.ngVerify, iElm);

                if (pCtrl != undefined) {
                    pScope = pCtrl.getscope();

                } else { //提交按钮在作用域外（父指令外面）

                    if (!OPTS.control) {
                        console.log('ngVerify按钮需指向关联的form.name');
                        console.error(iElm);
                        return;
                    }

                    //获取对应的父指令作用域$scope
                    pScope = ngVerify.scope(OPTS.control)

                    if (pScope == undefined) {
                        console.error('ngVerify按钮找不到关联的表单');
                        console.error(iElm);
                        return;
                    }
                }

                // 元素绑定相关参数
                iElm.ngVerify = {
                    $scope: pScope,
                    scope: scope,
                    iAttrs: iAttrs,
                    OPTS: OPTS
                }

                // 初始化元素
                Init(iElm);

            }
        }
    }])

    /** 格式化配置参数
     * @param
        str     String    格式化前的配置参数
        iElm    DomObj    标记出现错误的元素
     * @return
        Object          格式化好的配置对象
     */
    function formatOpt(str, iElm) {
        if (str.charAt(0) != "{") {
            str = '{' + str + '}';
        }

        try {
            return eval("(" + str + ")");
        } catch (e) {
            console.error('ngVerify opts has error:');
            console.error(iElm);
        }
    }

    /** 初始化验证配置
        @param  iElm    指令元素
    */
    function Init(iElm) {
        var $scope = iElm.ngVerify.$scope;
        var iAttrs = iElm.ngVerify.iAttrs;
        var OPTS = iElm.ngVerify.OPTS;

        // 默认配置
        var DEFAULT = {
            message: '此项为必填', //默认错误消息
            required: true, //默认都进行非空校验
            option: 0, //下拉菜单校验
            min: iAttrs.minlength,
            max: iAttrs.maxlength,
            errorClass: 'verifyError',
            disabled: true, //校验为成功时是否锁定提交按钮
            least: 1, //checkbox默认最少勾选数
            tipStyle: $scope.ngVerify.tipStyle!=undefined ? $scope.ngVerify.tipStyle : 1 //tip提示样式, 0禁用 1 右上浮动  2 左下占位
        }

        // 传入错误参数警告并做容错处理
        if (iAttrs.type == 'radio' && OPTS.least) {
            console.warn('least不是radio元素的有效参数!');
            console.warn(iElm);
            OPTS.least = DEFAULT.least;
        }

        // 合并自定义配置参数
        OPTS = angular.extend({}, DEFAULT, OPTS);

        // 给元素绑定合并后的参数
        iElm.ngVerify.OPTS = OPTS;

        // 增加属性，控制输入长短
        iElm.attr({
            maxlength: OPTS.max,
            minlength: OPTS.min
        })

        // 元素初始化数据
        if (OPTS.control || iAttrs.type == 'submit') {
            // iElm 是提交按钮
            $scope.ngVerify.subBtn.push(iElm);

            angular.element(document).ready(function() {
                // 1. 按钮的禁用初始化需在其他表单元素初始化之后
                // 2. 按钮默认是禁用的，只有表单验证通过才会启用
                // 3. 加载页面先验证一次所有表单是否已经符合验证，然后决定是否禁用按钮
                if (OPTS.disabled && checkAll($scope.ngVerify.elems).hasError) {
                    iElm.attr('disabled', true)
                }

                //提交时检测所有表单
                iElm.on('click', function(e) {
                    e.stopPropagation();
                    if (!iElm.attr('disabled')) { //防止按钮禁用后也会触发事件
                        $scope.ngVerify.submit();
                    }
                })
            })

        } else { // iElm 是需验证的表单元素
            var isbox = (iAttrs.type == 'checkbox') || (iAttrs.type == 'radio')
            var vaildEvent = '';

            // 创建tip容器
            var errtip = '<div class="verifyTips"><p class="tipStyle-' + OPTS.tipStyle + '"><span class="tipMsg"></span><i></i></p></div>';
            var tipHeight;
            var container = iElm.parent(); //tip容器判断放在什么位置
            if (isbox && container[0].localName == 'label') { //select radio
                container = container.parent();
                container.append(errtip);
                tipHeight = container[0].offsetHeight * -1;
            } else {
                iElm.after(errtip);
                tipHeight = iElm[0].offsetHeight * -1;
            }

            // find('#id')
            // angular.element(document.querySelector('#id'))

            // find('.classname'), assumes you already have the starting elem to search from
            // angular.element(elem.querySelector('.classname'))

            // 将tip元素绑定在iElm
            iElm.ngVerify.errtip = {

                tip: angular.element(container[0].querySelector('.verifyTips > p')),

                message: angular.element(container[0].querySelector('.verifyTips .tipMsg'))

            }


            if (OPTS.tipStyle==1) {
                // 根据元素的高度，调整tip的定位高度
                var tip = iElm.ngVerify.errtip.tip;
                tip.css('top', tipHeight + 'px');

                // textarea改变大小时，从新定位tip
                if (iElm[0].localName == 'textarea') {
                    iElm.on('click', function() {
                        tip.css('top', iElm[0].offsetHeight * -1 + 'px');
                        return false;
                    })
                }

                // 指令加载后，根据元素的宽高，调整tip的定位
                /* if (!isbox) {
                    // angular.element(document).ready(function() { // 如元素在弹出层中可能会导致document ready无效
                    setTimeout(function () {
                        // 不延迟执行，在弹出层中拿不到iElm[0]的尺寸
                        tip.css('top', iElm[0].offsetHeight * -1 + 'px');
                        tip.parent().css('width', iElm[0].offsetWidth + 'px')
                    }, 500);
                    // })
                } */
            }

            // 特殊类型的触发类型和错误渲染不同
            if (isbox) {
                vaildEvent = 'change';
            } else {
                vaildEvent = 'change keyup';
                // 'input propertychange' //input值改变事件
            }

            // 将元素绑定到scope数组上
            $scope.ngVerify.elems.push(iElm);

            // 绑定元素验证事件
            bindVaild(iElm, vaildEvent);

            // checkbox和radio的关联元素，借助有verify指令的主元素来触发验证
            if (isbox) {
                var iElms = document.getElementsByName(iAttrs.name);
                for (var i = 0; i < iElms.length; i++) {
                    if (iElms[i] != iElm[0]) {
                        angular.element(iElms[i])
                            .on('blur', function() {
                                iElm.triggerHandler('blur')
                            })
                            .on(vaildEvent, function() {
                                iElm.triggerHandler(vaildEvent)
                            })
                    }
                }
            }

        }
    }

    /** 绑定触发验证的事件
        @param
        iElm            obj    dom元素对象
        vaildEvent   String    通过验证的事件
    */
    function bindVaild(iElm, vaildEvent) {
        var $scope = iElm.ngVerify.$scope;
        var scope = iElm.ngVerify.scope;
        var iAttrs = iElm.ngVerify.iAttrs;
        if (iAttrs.ngModel) {
            // 元素上有ng-module, 监听它的值
            scope.$watch(iAttrs.ngModel, function(newValue, oldValue) {
                if (newValue || oldValue) {
                    // 这里有个未知问题：
                    // select元素在手动操作后，ngModel的监听会从代码触发移交给手动触发
                    if (iElm[0].localName == 'select') {
                        if (newValue) {
                            iElm.triggerHandler('keyup')
                        } else {
                            iElm.triggerHandler('blur')
                        }
                    }
                    // 其他元素的监听，触发change事件
                    else {
                        // iElm.attr('value',newValue)
                        iElm.triggerHandler('change')
                    }
                }
            });
        }

        // 验证不通过 获取焦点时 tip提示
        if (iAttrs.type!='radio' && iAttrs.type!='checkbox') {
            iElm.on('focus', function() {
                if (iElm.ngVerify.invalid) { //验证不通过
                    tipMsg(iElm, true);
                }
            })
        }

        iElm.on('blur', function() {
                if (!ISVALID(iElm)) { //验证不通过

                    tipMsg(iElm, false); // 提示信息

                    makeError(iElm, true); // 将元素标红

                    DisableButtons($scope.ngVerify.subBtn, true) // 禁用掉控制按钮
                }
            })
            .on(vaildEvent, function() {
                if (ISVALID(iElm)) { //验证通过

                    tipMsg(iElm, false);

                    makeError(iElm, false);

                    // 检测所有
                    var re = checkAll($scope.ngVerify.elems);
                    if (!re.hasError) {
                        DisableButtons($scope.ngVerify.subBtn, false)
                    }
                } else if (iElm.ngVerify.invalid) {
                    tipMsg(iElm, true);
                }
            })
    }

    /** 提示错误信息
        @param
        iElm    DomObj      dom元素对象
        isShow  Boolean     显示隐藏提示
    */
    function tipMsg(iElm, isShow) {
        var OPTS = iElm.ngVerify.OPTS;
        if (OPTS.tipStyle==0) { //传入了不提示tip的参数
            return;
        }
        var errtip = iElm.ngVerify.errtip;
        var message = OPTS.errmsg ? OPTS.errmsg : OPTS.message;
        errtip.message.text(message);
        errtip.tip.toggleClass('showTip-' + OPTS.tipStyle, isShow);
    }

    /** 标记未通过验证的元素
        @param
        iElm        DomObj      需要标记的元素
        draw        Boolean     是标记还是取消
    */
    function makeError(iElm, draw) {
        var className = iElm.ngVerify.OPTS.errorClass; //用于标记的类名
        var parent = iElm.parent(); //可能需要标红的父容器

        iElm.ngVerify.invalid = draw;

        if (iElm[0].type == 'checkbox' || iElm[0].type == 'radio') {
            if (parent[0].localName == 'label') {
                parent = parent.parent();
            }
            iElm = parent;

            // 复组元素边框为虚线
            iElm.toggleClass(className + '-dash', draw)
        }

        iElm.toggleClass(className, draw)
    }

    // 禁用/启用相关的提交按钮
    function DisableButtons(btns, isDisable) {
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].ngVerify.OPTS.disabled) {
                btns[i].attr('disabled', isDisable)
            }
        }
    }

    /** 验证一个元素
     * @param   iElm验证的元素   OPTS目标元素接收的指令配置
     * @return  Boolean   代表元素是否通过验证
     */
    function ISVALID(iElm) {

        //隐藏元素直接校验通过
        if (iElm[0].style.display == 'none') {
            return true;
        }

        var iAttrs = iElm.ngVerify.iAttrs;
        var OPTS = iElm.ngVerify.OPTS;
        var pat; //正则规则
        var val; //进行验证的值

        // 如果元素有ng-modle 则优先验证，否则验证原生value
        if (iAttrs.ngModel) {
            var valModel = iElm.ngVerify.scope[iAttrs.ngModel];//由ngModel产生的数据
            val = valModel ? String(valModel) : undefined
        }else{
            val = iElm.val();
        }

        // 非表单元素验证
        if (val == undefined) {
            // 非表单元素
            val = iElm.text();
            // console.warn('非表单元素绑定了验证:');
            // console.log(iElm);
        }

        // 除去多余空格
        val = val.trim();

        // checkbox复选框、radio单选
        if (iAttrs.type == 'checkbox' || iAttrs.type == 'radio') {
            var elName = iElm.attr('name');
            // 拿到同name的checkbox,这里没有做其他元素同name判断，待优化
            var els = document.getElementsByName(elName);
            var checked = 0;
            for (var i = 0; i < els.length; i++) {
                if (els[i].checked) {
                    checked++;
                }
            }
            if (checked >= OPTS.least) {
                return true;
            }
            OPTS.message = '至少选择' + OPTS.least + '项'
            return false;
        }

        // select元素验证
        if (iElm[0].localName == 'select') {
            if (iElm[0].selectedIndex === OPTS.option) {
                OPTS.message = '必须选择一项'
                return false;
            } else {
                return true;
            }
        }

        // 非空验证
        if (OPTS.required && val == '') {
            // 注意：type='number' 输入字符e时，val仍然为空值，这时的空校验提示为tip1
            if (iAttrs.type == 'number') {
                OPTS.message = '需输入数字'; //tip1
            } else {
                OPTS.message = '不能为空' //tip2
            }
            return false;
        } else if (!OPTS.required && val == '') {
            return true;
        }

        // 长度验证
        if (val.length < OPTS.min) {
            OPTS.message = '最少' + OPTS.min + '个字符'
            return false;
        }
        if (val.length > OPTS.max) {
            OPTS.message = '最多' + OPTS.max + '个字符'
            return false;
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
                    pat = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
                    break;
                case 'url':
                    pat = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
                    break;
                case 'char':
                    pat = /^[A-Za-z_]+$/; // 字母+下划线
                    break;
            }
        }

        //如果pat已赋值
        if (pat) {
            // 验证正则
            if (val.match(pat) == null) {
                OPTS.message = '输入类型错误';
                return false;
            } else {
                return true;
            }
        }

        return true;
    }

    /** 检测所有元素是否验证成功
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
                RE.errEls.push(els[i])
            }
        }
        RE.hasError = !!RE.errEls.length;
        return RE;
    }



})(angular)
