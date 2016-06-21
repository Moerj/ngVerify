/**
 * ngVerify v1.3.4
 *
 * @license: MIT
 * Designed and built by Moer
 * github   https://github.com/Moerj/ngVerify
 *
 */

!(function(angular) {


    var m = angular.module('ngVerify', []);

    m.service('ngVerify', function() {
        return {
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
            /** 检测一个表单校验是否通过
             * @param
             * formName     String      目标表单的name
             * call_back    Function    检测完成后的回调，可接受参数errEls，所有未验证通过的元素
             * darw         blooean     默认为true，是否标红未验证通过的元素
             */
            check: function(formName, call_back, draw) {
                var forms = document.getElementsByName(formName);
                var checkAllData; //绑定在nodelist上的方法，即 @function checkAll()
                var self = this;

                // 延时执行是为了确保: checkAll() 在 $watch ngModel 之后执行
                setTimeout(function () {
                    for (var i = 0; i < forms.length; i++) {
                        if (forms[i]._verifyScope) {
                            var scope = self.scope(forms[i].name);
                            var els = scope.ngVerify.elems;
                            checkAllData = checkAll(els);

                            // 没有callback时，draw可作为第2参数
                            if (draw===undefined || draw===true || call_back===undefined) {
                                var errEls = checkAllData.errEls;
                                for (var n = 0; n < errEls.length; n++) {
                                    makeError(errEls[n], true);
                                }
                            }
                        }
                    }
                    // check的结果以call_back形式返回
                    if (typeof call_back=='function') {
                        call_back(checkAllData.errEls);
                    }
                })
            },
            /** 强制将带有ng-verify的元素标记为未验证通过
             * @param
             * some     String/DomObj    DomObj/id/name
             * errmsg   String           错误消息
             */
            setError: function (some, errmsg) {
                var el = getDom(some);

                // 强制错误消息绑定在原生dom对象上
                el._verifySetError = errmsg;

                // 触发元素标记
                el.focus();
                setTimeout(function () {
                    el.blur()
                })
            }
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
            scope: false,
            link: function(scope, iElm, iAttrs, pCtrl) {
                var pScope; //父指令的$scope

                // 获取传入的配置参数
                var OPTS = formatOpt(iAttrs.ngVerify, iElm);


                // 在作用于内
                if (pCtrl != undefined) {
                    pScope = pCtrl.getscope();

                }

                //在作用域外（按钮）
                else {
                    if (!OPTS.control) {
                        console.error('ngVerify need control option to form.name:');
                        console.error(iElm);
                        return;
                    }

                    //获取对应的父指令作用域$scope
                    pScope = ngVerify.scope(OPTS.control)

                    if (pScope == undefined) {
                        console.error('ngVerify button cant be find parent form:');
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

    /** 获取原生 dom 元素
     * 根据 id 或 name 获取 一个已注册指令的原生dom
     * @param   some    String    id || name
     * @return  DomObj
     */
    var getDom = function (some) {
        var el;

        if (typeof some === 'object') {//已经是dom
            el = some;
        }

        if (typeof some === 'string') {

            if (some.indexOf('#')===0) {
                //id方式获取
                some = some.slice(1,some.length);
                el = document.getElementById(some);

            }else{
                //name方式获取
                angular.forEach(document.getElementsByName(some),function (dom) {
                    if (angular.element(dom).attr('ng-verify')!==undefined) {
                        el = dom;
                        return false;
                    }
                })
            }

        }

        if (el==null) {
            return console.error('param:\''+ some +'\' cant find dom element');
        }

        return el;
    }

    /** 检测是否为空对象
     * @param   obj
     * @return  Boolean
     */
    function isEmptyObject(obj) {
        if (typeof obj !== 'object') {
            return false
        }
        var key;
        for (key in obj)
            return false;
        return true
    }

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
            console.error("ngVerify options has error:");
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
            tipStyle: $scope.ngVerify.tipStyle>=0 ? $scope.ngVerify.tipStyle : 1 //tip提示样式, 0禁用 1 右上浮动  2 左下占位
        }

        // 传入错误参数警告并做容错处理
        if (iAttrs.type == 'radio' && OPTS.least) {
            console.warn("least is not radio's effective parameter:");
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

            setTimeout(function () {
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

        } else {
            // iElm 是需验证的表单元素
            $scope.ngVerify.elems.push(iElm);

            var checkboxOrRadio = (iAttrs.type == 'checkbox') || (iAttrs.type == 'radio');

            // 创建tip容器
            var errtip = angular.element(
                '<div class="verifyTips">' +
                    '<p class="tipStyle-' + OPTS.tipStyle + '">' +
                        '<span class="tipMsg"></span>' +
                        '<i></i>' +
                    '</p>' +
                '</div>'
            );

            // 将tip元素绑定在iElm
            iElm.ngVerify.errtip = {

                tip: errtip.find('p'),

                message: errtip.find('span')

            }

            // tip容器判断放在什么位置
            var container = iElm.parent();
            if (checkboxOrRadio && container[0].localName == 'label') {
                container = container.parent();
                container.append(errtip);
            } else {
                iElm.after(errtip);
            }


            // textarea改变大小时，从新定位tip
            if (iElm[0].localName == 'textarea' && OPTS.tipStyle==1) {
                iElm.on('click', function() {
                    iElm.ngVerify.errtip.tip.css('top', iElm[0].offsetHeight * -1 + 'px');
                    return false;
                })
            }

            // 绑定需要2次比对的输入验证，只对元素 input 输入生效
            iElm.ngVerify.recheck = function () {
                return getDom(OPTS.recheck).value;
            }

            // 绑定元素验证事件
            bindVaild(iElm);

            // checkbox和radio的关联元素，借助有verify指令的主元素来触发验证
            if (checkboxOrRadio) {
                var iElms = document.getElementsByName(iAttrs.name);
                for (var i = 0; i < iElms.length; i++) {
                    if (iElms[i] != iElm[0]) {
                        angular.element(iElms[i])
                            .on('blur', function() {
                                iElm.triggerHandler('blur')
                            })
                            .on('change', function() {
                                iElm.triggerHandler('change')
                            })
                    }
                }
            }

        }
    }

    /** 绑定触发验证的事件
        @param
        iElm            obj    dom元素对象
    */
    function bindVaild(iElm) {
        var $scope = iElm.ngVerify.$scope;
        var scope = iElm.ngVerify.scope;
        var iAttrs = iElm.ngVerify.iAttrs;
        var blurEvent="",changeEvent=""; //会触发该元素校验视图改变的事件

        function blurTrigger() {
            if (!ISVALID(iElm)) { //验证不通过

                tipMsg(iElm, false); // 提示信息

                makeError(iElm, true); // 将元素标红

                DisableButtons($scope.ngVerify.subBtn, true) // 禁用掉控制按钮
            }
        }

        function changeTrigger() {
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
        }

        if (iAttrs.ngModel) {
            // 元素上有ng-module, 监听它的值
            scope.$watch(iAttrs.ngModel, function(newValue, oldValue) {
                if (newValue!=null || oldValue!=null) {
                    // 将ngModel的值写入到modelValue, 供验证使用
                    if (newValue!=null && !isEmptyObject(newValue) ) {
                        // 把watch的obj对象转为用户输入类型
                        iElm.ngVerify.modelValue = iAttrs.type=='number' ? Number(newValue) : String(newValue);
                    }else{
                        iElm.ngVerify.modelValue = null;
                    }

                    if (iElm[0].localName == 'select') {
                        if (newValue) {
                            changeTrigger()
                        } else {
                            blurTrigger()
                        }
                    }
                    // 非表单元素
                    else if (iElm[0].value === undefined) {
                        iElm[0].focus()
                    }
                    // 其他元素的监听，触发change事件
                    else {
                        changeTrigger()
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


        // 非表单元素
        if (iElm[0].value === undefined) {
            blurEvent = 'blur';
            changeEvent = 'click keyup';

            // 默认非表单元素是不能触发焦点事件的，这里需要它增加一个属性tabindex
            iElm.attr('tabindex',0);


            // 处理该类型下，所有可能的辅助input类元素。一些第三方组件可能会在DIV内用input模拟用户输入
            iElm.ngVerify.triggerInput = angular.element(iElm[0].querySelector('input'));
            iElm.ngVerify.triggerInput.on(blurEvent, function() {
                    blurTrigger()
                })
                .on(changeEvent, function() {
                    changeTrigger()
                })


        }

        // 单选、多选
        else if(iAttrs.type=='radio' || iAttrs.type=='checkbox'){
            blurEvent = 'blur';
            changeEvent = 'change'

        }

        // 常规表单元素
        else{
            blurEvent = 'blur';
            changeEvent = 'change keyup'
        }


        // 绑定触发验证的事件
        iElm.on(blurEvent, function() {
                blurTrigger()
            })
            .on(changeEvent, function() {
                changeTrigger()
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

        // 强制被标记错误
        if (iElm[0]._verifySetError) {
            message = iElm[0]._verifySetError;
        }

        errtip.message.text(message);
        errtip.tip.toggleClass('showTip-' + OPTS.tipStyle, isShow);

        // 重置tip的高度
        if (OPTS.tipStyle==1) {
            errtip.tip.css('top', iElm[0].offsetHeight * -1 + 'px');
        }
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

        // 强制被标记错误
        if (iElm[0]._verifySetError) {
            return false;
        }

        var iAttrs = iElm.ngVerify.iAttrs;
        var OPTS = iElm.ngVerify.OPTS;
        var pat; //正则规则
        var val; //进行验证的值

        // checkbox复选框、radio单选
        if (iAttrs.type == 'checkbox' || iAttrs.type == 'radio') {
            // 拿到同name的checkbox,这里没有做其他元素同name判断，待优化
            var els = document.getElementsByName(iElm.attr('name'));
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
                OPTS.message = '请选择'
                return false;
            } else {
                return true;
            }
        }

        // 获取需要验证的值
        if (iElm[0].value !== undefined) {
            // 有value的表单元素
            val = iElm.val()!=null ? iElm.val() : iElm.ngVerify.modelValue;

        }else if(iAttrs.ngModel){
            // 可能是非表单元素的ngModel
            val = iElm.ngVerify.modelValue

        }else{
            // 非表单元素，比如div
            val = iElm.text()
        }

        if (val == null) {
            val=''
        }

        // 除去多余空格
        val = val.trim();

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
            pat.name = '';
        } else {
            // 没有传入正则，按类型计算正则
            switch (iAttrs.type) {
                case 'number':
                    pat = /^[0-9]*$/; //纯数字
                    pat.name = '数字';
                    break;
                case 'email':
                    pat = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
                    pat.name = '邮箱';
                    break;
                case 'phone':
                    pat = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
                    pat.name = '手机号';
                    break;
                case 'url':
                    pat = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
                    pat.name = '链接';
                    break;
                case 'char':
                    pat = /^[A-Za-z_]+$/; // 字母+下划线
                    pat.name = '字符';
                    break;
                case 'dates' || 'date':
                    //日期 YYYY-MM-DD || YYYY/MM/DD
                    //时间 hh:mm || hh:mm:ss   时间非必须
                    if (val.length > 10) {
                        pat = /^((\d{4})-(\d{2})-(\d{2})|(\d{4})\/(\d{2})\/(\d{2})) (\d{2}):(\d{2})(:(\d{2}))?$/;
                    }else {
                        pat = /^(\d{4})-(\d{2})-(\d{2})|(\d{4})\/(\d{2})\/(\d{2})$/;
                    }
                    pat.name = '日期';
                    break;
            }
        }

        //如果pat已赋值
        if (pat) {
            // 验证正则
            if (val.match(pat) == null) {
                OPTS.message = pat.name + '格式错误';
                return false;
            } else {
                return true;
            }
        }

        // recheck验证
        if (OPTS.recheck) {
            if (val !== iElm.ngVerify.recheck()) {
                OPTS.message = '两次输入不一致'
                return false;
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
