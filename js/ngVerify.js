/**
 * ngVerify v1.1.1
 *
 * License: MIT
 * Designed and built by Moer
 * github   https://github.com/Moerj/ngVerify
 *
 */

!(function(angular) {



    var m = angular.module('ngVerify', []);

    m.provider('ngVerify', function () {
        this.$get = function(){
            var publicMethods = {
                /** 全局暴露的公共方法
                 * @param  String   formName: name
                 * @return Boolean
                 */
                scope: function (formName) {
                    var forms = document.getElementsByName(formName);
                    var obj;//获取一个对象，它是form上的scope作用域

                    for (var i = 0; i < forms.length; i++) {
                        if (forms[i]._verifyScope) {
                            obj = forms[i]._verifyScope;
                            break;
                        }
                    }
                    return obj;
                },
                // 检测一个form表单校验是否通过
                check: function (formName, draw) {
                    var forms = document.getElementsByName(formName);
                    var obj;//绑定在nodelist上的方法，即 @function checkAll()

                    for (var i = 0; i < forms.length; i++) {
                        if (forms[i]._verifyScope) {
                            var els = publicMethods.scope(forms[i].name).verify_elems
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
            scope:{},
            controller: function($scope, $element, $attrs) {
                this.getscope = function() {　　　　　　　　　　
                    return $scope;　　　　　　　　
                };

                // 在作用域上添加空数组，用于存放其组件
                $scope.verify_elems = []; //需验证的表单元素
                $scope.verify_subBtn = [];//提交表单的按钮

                // 给form的nodelist对象上绑定$scope
                $element[0]._verifyScope = $scope;

                // 验证整个表单，错误的将标红
                $scope.verify_submit = function () {
                    var els = $scope.verify_elems;
                    var re = checkAll(els);
                    for (var i = 0; i < re.errEls.length; i++) {
                        makeError(re.errEls[i], true)
                        // tipMsg(re.errEls[i], true) //提示错误信息
                    }
                }

                $scope.verify_tipStyle = formatOpt($attrs.verifyScope, $element).tipStyle;
            },
            link: function($scope, iElm) {
                iElm.attr('novalidate', 'novalidate') //禁用HTML5自带验证
            }
        }
    })

    // 子指令，写在需要校验的表单元素和表单提交按钮上
    m.directive('ngVerify', function(ngVerify) {
        return {
            require: "?^verifyScope",
            scope: true,
            link: function(scope, iElm, iAttrs, pCtrl) {

                var pScope;//父指令的$scope

                // 获取传入的配置参数
                var OPTS = formatOpt(iAttrs.ngVerify, iElm);

                if (pCtrl!=undefined) {
                    pScope = pCtrl.getscope();

                }else{//提交按钮在作用域外（父指令外面）

                    if (!OPTS.control) {
                        console.log('按钮需指向关联的form.name');
                        console.error(iElm);
                        return;
                    }

                    //获取对应的父指令作用域$scope
                    pScope = ngVerify.scope(OPTS.control)

                    if (pScope == undefined) {
                        console.error('$scope获取失败');
                        console.error(iElm);
                        return;
                    }
                }

                // 元素绑定相关参数
                iElm.$scope = pScope;
                iElm.scope = scope;
                iElm.iAttrs = iAttrs;
                iElm.OPTS = OPTS;

                // 初始化元素
                Init(iElm);


            }
        }
    })

    /** 格式化配置参数
     * @param
        str     String    格式化前的配置参数
        iElm    DomObj    标记出现错误的元素

     * @return
        Object          格式化好的配置对象
     */
    function formatOpt(str, iElm) {
        if ( str.charAt(0)!="{" ) {
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
        @param
        $scope  父指令的作用域
        iElm    指令元素
        iAttrs  元素属性
    */
    function Init(iElm) {
        var $scope = iElm.$scope;
        var iAttrs = iElm.iAttrs;
        var OPTS = iElm.OPTS;

        // 默认配置
        var DEFAULT = {
            message: '此项为必填',//默认错误消息
            required: true, //默认都进行非空校验
            option: 0, //下拉菜单校验
            min: iAttrs.minlength,
            max: iAttrs.maxlength,
            errorClass: 'verifyError',
            disabled: true, //校验为成功时是否锁定提交按钮
            least: 1,    //checkbox默认最少勾选数
            tipStyle: $scope.verify_tipStyle ? $scope.verify_tipStyle : 1 //错误提示样式
        }

        // 传入错误参数警告并做容错处理
        if (iAttrs.type == 'radio' && OPTS.least) {
            console.warn('least不是radio元素的有效参数!');
            console.warn(iElm);
            OPTS.least = DEFAULT.least;
        }

        // 合并自定义配置参数
        OPTS = angular.extend({}, DEFAULT, OPTS);

        // 增加属性，控制输入长短
        iElm.attr({
            maxlength: OPTS.max,
            minlength: OPTS.min
        })

        // 元素初始化数据
        iElm.OPTS = OPTS;
        if (OPTS.control || iAttrs.type == 'submit') {
            // iElm 是提交按钮
            $scope.verify_subBtn.push(iElm);

            // 1.没有校验权限的按钮，默认是禁用的，只有表单输入验证通过才会启用
            // 2.加载页面是先验证一次所有表单是否已经符合
            if (OPTS.disabled && checkAll($scope.verify_elems).hasError) {
                // iElm.prop('disabled',true)
                iElm.attr('disabled', true)
            }

            //提交时检测所有表单
            iElm.bind('click', function(e) {
                e.stopPropagation();
                if (!iElm.attr('disabled')) { //防止按钮禁用后也会触发事件
                    $scope.verify_submit();
                }
            })

        } else {// iElm 是需验证的表单元素
            var isbox = (iAttrs.type == 'checkbox') || (iAttrs.type =='radio')
            var vaildEvent = '';

            // 错误提示容器初始化
            // 创建errmsg容器
            var container = iElm.parent();
            if (isbox && container[0].localName == 'label') {
                container = container.parent();
            }
            var errtip = '<div class="verifyTips"><p class="tipStyle-'+OPTS.tipStyle+'"><span></span><i></i></p></div>';
            container.append(errtip);

            // find('#id')
            // angular.element(document.querySelector('#id'))

            //find('.classname'), assumes you already have the starting elem to search from
            // angular.element(elem.querySelector('.classname'))

            // 将错误提示元素绑定在iElm
            iElm.errtip = {

                container: angular.element(container[0].querySelector('.verifyTips > p')),

                message: angular.element(container[0].querySelector('.verifyTips > p > span'))

            }


            // 特殊类型的触发类型和错误渲染不同
            if (isbox) {
                vaildEvent = 'change';
            }else{
                vaildEvent = 'change keyup';
                // 'input propertychange' //input值改变事件
            }

            // 将元素绑定到scope数组上
            $scope.verify_elems.push(iElm);

            // 绑定元素验证事件
            bindVaild(iElm, vaildEvent);

            // checkbox和radio的关联元素，借助有verify指令的主元素来触发验证
            if (isbox) {
                var iElms = document.getElementsByName(iAttrs.name);
                for (var i = 0; i < iElms.length; i++) {
                    if (iElms[i]!=iElm[0]) {
                        angular.element(iElms[i])
                        .bind('focus',function(){
                            iElm.triggerHandler('focus')
                        })
                        .bind('blur',function(){
                            iElm.triggerHandler('blur')
                        })
                        .bind(vaildEvent,function(){
                            iElm.triggerHandler(vaildEvent)
                        })
                    }
                }
            }

        }
    }

    /** 绑定触发验证的事件
        @param
        iElm        obj    dom元素对象
        bindEvent   obj    需要绑定的事件对象集合
        $scope      主指令的scope作用域
    */
    function bindVaild(iElm, vaildEvent) {
        var $scope = iElm.$scope;
        var scope = iElm.scope;
        var iAttrs = iElm.iAttrs;
        if (iAttrs.ngModel) {
            // 如果元素上有ng-module, 监听它的值，写入到value中
            scope.$watch(iAttrs.ngModel,function(newValue){
                if (newValue) {
                    iElm.attr('value',newValue)
                    iElm.triggerHandler('change')
                }
            });
        }
        iElm.bind('focus',function () {
            if (iElm.hasError || iElm.hasClass(iElm.OPTS.errorClass)) { //验证不通过
                // 提示信息
                tipMsg(iElm, true);
            }
        })
        .bind('blur', function() {
            if (!ISVALID(iElm)) { //验证不通过
                // iElm.hasError = true;

                tipMsg(iElm, false);// 提示信息

                makeError(iElm, true);// 将元素标红

                DisableButtons($scope.verify_subBtn, true)// 禁用掉控制按钮
            }
        })
        .bind(vaildEvent, function() {
            if (ISVALID(iElm)) { //验证通过
                // iElm.hasError = false;

                tipMsg(iElm, false);

                makeError(iElm, false);

                // 检测所有
                var re = checkAll($scope.verify_elems);
                if (!re.hasError) {
                    DisableButtons($scope.verify_subBtn, false)
                }
            }else if(iElm.hasError){
                tipMsg(iElm, true);
            }
        })
    }

    /** 提示错误信息
        @param iElm  obj  dom元素对象
    */
    function tipMsg(iElm, isShow) {
        var errtip = iElm.errtip;
        var message = iElm.OPTS.errmsg ? iElm.OPTS.errmsg : iElm.OPTS.message;
        errtip.message.text(message);
        errtip.container.toggleClass('showTip-'+iElm.OPTS.tipStyle,isShow);
    }

    /** 标记未通过验证的元素
        @param
        iElm        DomObj      需要标记的元素
        sing        Boolean     是标记还是取消
    */
    function makeError(iElm, draw){
        var className = iElm.OPTS.errorClass;
        if (iElm[0].type == 'checkbox' || iElm[0].type == 'radio') {
            var parent = iElm.parent();
            if (parent[0].localName == 'label') {
                parent = parent.parent();
            }
            iElm = parent;

            // 复组元素边框为虚线
            iElm.toggleClass(className+'Dash', draw)
        }
        iElm.toggleClass(className, draw)
        iElm.hasError = draw;
    }

    // 禁用/启用相关的提交按钮
    function DisableButtons(btns, isDisable) {
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].OPTS.disabled) {
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
            var checked = 0;
            for (var i = 0; i < els.length; i++) {
                if (els[i].checked) {
                    // return true;
                    checked++;
                }
            }
            if (checked>=OPTS.least) {
                return true;
            }
            OPTS.message = '至少选择'+OPTS.least+'项'
            return false;
        }

        // 非空验证
        if (OPTS.required && val == '') {
            // 注意：type='number' 输入字符e时，val仍然为空值，这时的空校验提示为tip1
            if (iAttrs.type == 'number') {
                OPTS.message = '需输入数字';   //tip1
            }else{
                OPTS.message = '不能为空'     //tip2
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

        // select元素验证
        if (iElm[0].nodeName == 'SELECT') {
            // console.log( OPTS.option);
            // console.log( iElm[0].selectedIndex);
            if (iElm[0].selectedIndex === OPTS.option) {
                OPTS.message = '必须选择一项'
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
                    pat = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
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
                OPTS.message = '输入类型错误';
                return false;
            } else {
                // console.info('正则匹配')
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
