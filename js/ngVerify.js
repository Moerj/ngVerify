/**
 * ngVerify v1.4.9
 *
 * @license: MIT
 * Designed and built by Moer
 * github   https://github.com/Moerj/ngVerify
 *
 */

if (typeof angular === 'undefined') {
    throw new Error('ngVerify requires angular')
}

(function () {

    var m = angular.module('ngVerify', []);

    m.service('ngVerify', function () {
        return {
            scope: function (formName) {
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
            check: function (formName, call_back, draw) {
                var forms = document.getElementsByName(formName);
                var checkAllData; //绑定在nodelist上的方法，即 @function checkAll()
                var self = this;

                // 延时执行是为了确保: checkAll() 在 $watch ngModel 之后执行
                setTimeout(function () {
                    for (var i = 0; i < forms.length; i++) {
                        if (forms[i]._verifyScope) {
                            var scope = self.scope(forms[i].name);
                            var els = scope.ngVerify.elems;

                            // 获取所有检测结果
                            checkAllData = checkAll(els);

                            // 没有callback时，draw可作为第2参数
                            if (draw === undefined || draw === true || call_back === undefined) {
                                var errEls = checkAllData.errEls;
                                for (var n = 0; n < errEls.length; n++) {
                                    makeError(errEls[n], true);
                                }
                            }

                            // 重置一次表单按钮
                            DisableButtons(scope.ngVerify.subBtn, checkAllData.hasError)

                        }
                    }

                    // check的结果以call_back形式返回
                    if (typeof call_back == 'function') {
                        call_back(checkAllData.errEls);
                    }
                })
            },
            /** 检测一个元素是否验证通过
             * @param
             * some     string/obj    选择器字符或dom元素
             * draw     Boolean       未验证通过时是否标记
             *
             * @return  Boolean       是否验证通过
             */
            checkElement: function (some, draw) {
                var el = getDom(some);
                if (el._verifyCheckElement === undefined) {
                    console.error(el, 'You checked element not a ngVerify\'s element');
                    return false;
                }
                return el._verifyCheckElement(draw);
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
                el._verifyCheckElement(true);
            }
        }
    });

    // 父指令，写在form标签上
    m.directive('verifyScope', function () {
        return {
            scope: {},
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                this.getscope = function () {
                    return $scope;
                };

                // 在作用域上绑定需要的数据
                $scope.ngVerify = {

                    elems: [], //需验证的表单元素

                    subBtn: [], //提交表单的按钮

                    tipStyle: formatOpt($attrs.verifyScope, $element).tipStyle,

                    // 验证整个表单，错误的将标红
                    submit: function () {
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
            link: function (scope, iElm) {
                iElm.attr('novalidate', 'novalidate') //禁用HTML5自带验证
            }
        }
    })

    // 子指令，写在需要校验的表单元素和表单提交按钮上
    m.directive('ngVerify', ['ngVerify', function (ngVerify) {
        return {
            require: "?^verifyScope",
            scope: false,
            link: function (scope, iElm, iAttrs, pCtrl) {
                var pScope; //父指令的$scope

                // 获取传入的配置参数
                var OPTS = formatOpt(iAttrs.ngVerify, iElm);


                // 在作用于内
                if (pCtrl != undefined) {
                    pScope = pCtrl.getscope();

                    // 给当前元素的 dom 绑定方法
                    // 检测当前 dom 是否验证通过
                    iElm[0]._verifyCheckElement = function (draw) {
                        makeError(iElm, draw);
                        return ISVALID(iElm);
                    }
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

        if (typeof some === 'object') { //已经是dom
            el = some;
        }

        if (typeof some === 'string') {

            if (some.indexOf('#') === 0) {
                //id方式获取
                some = some.slice(1, some.length);
                el = document.getElementById(some);

            } else {
                //name方式获取
                angular.forEach(document.getElementsByName(some), function (dom) {
                    if (angular.element(dom).attr('ng-verify') !== undefined) {
                        el = dom;
                        return false;
                    }
                })
            }

        }

        if (el == null) {
            return console.error('param:\'' + some + '\' can not find dom element');
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
            disabled: true, //校验不成功时是否锁定提交按钮
            least: 1, //checkbox默认最少勾选数
            tipStyle: $scope.ngVerify.tipStyle >= 0 ? $scope.ngVerify.tipStyle : 1 //tip提示样式, 0禁用 1 右上浮动  2 左下占位
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

            //提交时检测所有表单
            iElm.on('click', function () {
                $scope.ngVerify.submit();
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
            if (iElm[0].localName == 'textarea' && OPTS.tipStyle == 1) {
                iElm.on('click', function () {
                    iElm.ngVerify.errtip.tip.css('top', iElm[0].offsetHeight * -1 + 'px');
                    return false;
                })
            }

            // 绑定需要2次比对的输入验证，只对元素 input 输入生效
            if (OPTS.recheck) {
                var orderDom = getDom(OPTS.recheck); //进行对比的参照元素，如：第一次输入的密码
                var mainDom;

                angular.forEach($scope.ngVerify.elems, function (el) {
                    if (el[0] === orderDom) {
                        mainDom = el;
                        return false;
                    }
                })

                if (!mainDom.ngVerify.recheck) {
                    mainDom.ngVerify.recheck = {
                        recheckDoms: []
                    }
                }
                mainDom.ngVerify.recheck.recheckDoms.push(iElm);

                iElm.ngVerify.recheck = {
                    mainDom: mainDom,
                    getValue: function () {
                        return mainDom[0].value
                    }
                };
            }

            // 绑定元素验证事件
            bindVaild(iElm);

            // checkbox和radio的关联元素，借助有verify指令的主元素来触发验证
            if (checkboxOrRadio) {
                var iElms = document.getElementsByName(iAttrs.name);
                for (var i = 0; i < iElms.length; i++) {
                    if (iElms[i] != iElm[0]) {
                        angular.element(iElms[i])
                            .on('change', function () {
                                iElm.triggerHandler('change')
                            })
                    }
                }
            }

        }

        // 绑定元素销毁事件
        // timeout解决在某些路由页面导致渲染完页面直接触发DOMNodeRemovedFromDocument
        setTimeout(function() {
            iElm[0].addEventListener('DOMNodeRemovedFromDocument', function () {
                var els
                if (OPTS.control || iAttrs.type == 'submit') {
                    els = $scope.ngVerify.subBtn;
                } else {
                    els = $scope.ngVerify.elems;
                }

                // 将已经不存在的dom从元素组中剔除
                for (var i = 0; i < els.length; i++) {
                    if (els[i] == iElm) {
                        els.splice(i, 1);
                    }
                }

                // 刷新一次表单按钮状态
                var hasError = checkAll($scope.ngVerify.elems).hasError;
                DisableButtons($scope.ngVerify.subBtn, hasError);
            })
        });

        // 每个元素初始化完，重置一次表单按钮的禁用状态
        if (checkAll($scope.ngVerify.elems).hasError) {
            DisableButtons($scope.ngVerify.subBtn, true)
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
        var blurEvent = "",
            changeEvent = ""; //会触发该元素校验视图改变的事件
        var checkboxOrRadio = (iAttrs.type == 'checkbox') || (iAttrs.type == 'radio');

        function blurTrigger() {
            // 失去焦点，校验一次，当前元素不通过
            if (!ISVALID(iElm)) {

                tipMsg(iElm, false);

                makeError(iElm, true);

                // 当前元素验证不通过，禁用表单提交按钮
                DisableButtons($scope.ngVerify.subBtn, true)
            }

        }

        function changeTrigger() {
            // 数据改变，校验一次，如果当前元素通过
            var isValid = ISVALID(iElm)

            if (isValid) {
                // 检测所有一次，设置表单提交按钮的禁用状态
                var re = checkAll($scope.ngVerify.elems);
                DisableButtons($scope.ngVerify.subBtn, re.hasError)

                // 检测二次校验的元素并处理
                if (iElm.ngVerify.recheck) {
                    var recheckDoms = iElm.ngVerify.recheck.recheckDoms;
                    if (recheckDoms) {
                        for (var i = 0; i < recheckDoms.length; i++) {
                            if (recheckDoms[i].val()) {
                                makeError(recheckDoms[i], !ISVALID(recheckDoms[i]));
                            }
                        }
                    }
                }

            } else {
                // 如果当前元素验证不通过，直接禁用掉表单提交按钮
                DisableButtons($scope.ngVerify.subBtn, true)
            }

            // 在已标红时，重新设置 tip/标红
            // 单选和复选在 chang 时直接提醒错误
            // 在未标记错误时忽略，而由 blurTrigger 事件负责
            if (iElm.ngVerify.invalid || checkboxOrRadio) {
                makeError(iElm, !isValid);
                tipMsg(iElm, !isValid);
            }

        }

        // input[number] 禁止输入16进制的e
        if (iAttrs.type == 'number') {
            iElm.on('keypress', function (e) {
                if (e.key === 'e') {
                    e.preventDefault();
                }
            })
        }

        if (iAttrs.ngModel) {
            // 元素上有ng-module, 监听它的值
            scope.$watch(iAttrs.ngModel, function (newValue, oldValue) {
                if (newValue != null || oldValue != null) {
                    // 将ngModel的值写入到modelValue, 供验证使用
                    if (newValue != null && !isEmptyObject(newValue)) {
                        // 把watch的obj对象转为用户输入类型
                        iElm.ngVerify.modelValue = iAttrs.type == 'number' ? Number(newValue) : String(newValue);
                    } else {
                        iElm.ngVerify.modelValue = null;
                    }

                    // 非表单元素，在改变moudel时确保有焦点，以便于触发失焦验证
                    // 例如在ui-select组件上绑定verify验证时，不这么做再删除最后一个select项后不会触发失焦验证
                    if (iElm[0].value === undefined && isEmptyObject(newValue)) {
                        iElm[0].focus()
                    }

                    // ngModel 改变，触发一次 change
                    changeTrigger()
                }
            });
        }


        // 非表单元素
        if (iElm[0].value === undefined) {
            blurEvent = 'blur';
            // 非表单元素不再绑定changeEvent

            // 默认非表单元素是不能触发焦点事件的，这里需要它增加一个属性tabindex
            iElm.attr('tabindex', 0);


            // 处理该类型下，所有可能的辅助input类元素。一些第三方组件可能会在DIV内用input模拟用户输入
            iElm.ngVerify.triggerInput = angular.element(iElm[0].querySelector('input'));
            iElm.ngVerify.triggerInput.on('blur', function () {
                    blurTrigger()
                })
                .on('change', function () {
                    changeTrigger()
                })


        }

        // 单选、多选
        else if (checkboxOrRadio) {
            // blurEvent = 'blur';
            changeEvent = 'change'

        }

        // 常规表单元素
        else {
            blurEvent = 'blur';
            changeEvent = 'change keyup'
        }


        // 绑定触发验证的事件
        iElm.on(blurEvent, function () {
                blurTrigger()
            })
            .on(changeEvent, function () {
                changeTrigger()
            })
            .on('focus', function () {
                // 已经标红时获取焦点，显示tip
                if (iElm.ngVerify.invalid) {
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
        if (OPTS.tipStyle == 0) { //传入了不提示tip的参数
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
        if (OPTS.tipStyle == 1) {
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
                btns[i].prop('disabled', isDisable);

                // disabled不能禁用 a 标签
                if (btns[i][0].localName === 'a') {
                    console.error(btns[i], '<a> tag has no \'disabled\' attrbute, please use <button> or <input>.')
                    btns[i].css({
                        background: '#bd3a41',
                        color: '#fff'
                    });
                }
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
            val = iElm.val() != null ? iElm.val() : iElm.ngVerify.modelValue;

        } else if (iAttrs.ngModel) {
            // 可能是非表单元素的ngModel
            val = iElm.ngVerify.modelValue

        } else {
            // 非表单元素，比如div
            val = iElm.text()
        }

        if (val == null) {
            val = ''
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
                    pat = /^[-+]?\d+(\.\d+)?$/; //纯数字
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
                        // 带时间
                        pat = /^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29) (\d{2}):(\d{2})(:(\d{2}))?$/;
                    } else if (val.length === 7) {
                        // 年月
                        pat = /^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])))$/;
                    } else {
                        // 年月日
                        pat = /^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$/;
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
            if (val !== iElm.ngVerify.recheck.getValue()) {
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


})()