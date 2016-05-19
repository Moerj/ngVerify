# ngVerify v1.1.3
a easy angular form vaild plugin.
简洁高效的angular表单验证插件

<br>
## github
https://github.com/Moerj/ngVerify

<br>
## DEMO
http://moerj.com/Github/ngVerify/

<br>
## Getting Started
在使用前，你需要引入angular

	require('angular');

	require('ngVerify');

	var app = angular.module('APP',['ngVerify']);

### type
	设置表单元素type类型，目前支持的type类型：

	email
	number
	phone
	url
	string
	radio
	checkbox
	select

## verify-scope
入口指令，规定组件所控制的表单范围

	//给form设置一个verify-scope指令
	<form verify-scope>
		<input type="text" ng-verify > //给表单元素设置ng-verify
		<button ng-verify >Submit</button> //提交按钮也是
  	</form>

### tipStyle (defualt: 1)
设置整个表单的错误消息样式
	1. 气泡浮动提示，在元素右下角浮出
	2. 气泡固定高度，紧接着元素另起一行

	<form verify-scope="tipStyle: 2" >...</form>

## ng-verify
元素指令，定义验证规则

### defualt
只需要使用ng-verify，会根据type类型校验非空验证和类型

	<input type="text" ng-verify >

### required (defualt: true)
false允许空值通过校验

	<input type="number" ng-verify="required: false" >

### length (min,max)
定制校验字符长度

	<input type="text" ng-verify="{min:3,max:6}" >

### pattern
自定义正则，这样会优先以你的正则进行校验

	<input type="text" ng-verify="pattern:/a-zA-Z/" >

### errmsg
自定义错误消息，会覆盖掉默认的提示。

	<input type="text" ng-verify="{errmsg:'其实这里没有错，我是在逗你玩'}" >


### option (defualt: 0)
select下拉菜单属性，指定的option表示选中会校验不通过

	<select ng-verify="option:0" >
		<option>请选择</option>
    		<option>1</option>
    		<option>2</option>
    		<option>3</option>
	</select>

### least (defualt: 1)
checkbox最少勾选数，指定至少勾选几项才会通过验证

	<div>
		<label >checkbox</label>
		<!-- checkbox多选，请确保所有checkbox被一个div包起 -->
		<!-- 如果要用label修饰checkbox请统一所有都用 -->
		<!-- 确保每组checkbox的name属性相同，ng-verify指令只需要在任意一个checkbox上 -->
		<input type="checkbox" name="checkbox" > Captain America
		<input type="checkbox" name="checkbox" > Iron Man
		<input type="checkbox" name="checkbox"  ng-verify="least:2"> Hulk
	</div>

### control
绑定一个form的按钮, control:'formName'

	<form name="myform" verify>
		...

		<a ng-verify="{control:'myform'}" ></a> <!-- 表单内的按钮 1 -->

		<input type="submit" ng-verify /> <!-- 表单内的按钮 2 -->
	</form>

	<button ng-verify="{control:'myform'}" >提交</button> <!--表单外的按钮-->


### disabled (defualt: true)
设置 disabled:false 提交按钮在表单未校验通过时不会禁用，并且会自动绑定一个click事件，点击时标记所有错误表单。

	<button ng-verify="disabled:false" >按钮</button>

### tipStyle (defualt: form verify-scope)
设置单个表单元素提示样式

## API
依赖注入，在v0.1.6版本以后，公共方法需要依赖注入

	//依赖注入ngVerify后，可以调用一些公共方法
	app.controller('yourCtrl',function(ngVerify){
		...
	})

### ngVerify.check()
检测一个verify表单是否验证通过，返回Boolean和errorArry(未校验通过的元素组)

	ngVerify.check('formName') //返回结果

	ngVerify.check('formName',true) //返回结果，并标记出未验证通过元素

### ngVerify.scope()
获取一个verify表单的$scope作用域

	ngVerify.scope('formName')


## tips
传入的参数字符串可以不写{ }
checkbox、radio组绑定验证最好绑在最后一个
errmsg通常不需要你设置
表单范围内的按钮，只要type="submit"则不需要设置control参数

## Support
IE 9+
angular 1.x
