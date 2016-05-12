# ngVerify
a easy angular form vaild plugin.
简洁高效的angular表单验证插件


<br>
## DEMO


<br>
## Getting Started
在使用前，你需要引入angular、jQuery、qtip2
qtip提示方式在正式版中就会去除

	require('angular');
	
	require('ngVerify');
	
	var app = angular.module('APP',['ngVerify']);
	
	//给form设置一个verify指令
	<form verify>
		<input type="text" ng-verify> //给表单元素设置ng-verify
		<button ng-verify>Submit</button> //提交按钮也是
  	</form>


<br> 
## API

### defualt
只需要使用ng-verify，会更具type类型校验非空验证和类型
	<input type="text" ng-verify>

### type
设置表单元素type类型，目前支持的type类型：
email
number
phone
url
string


### length(min,max)
定制校验字符长度
	<input type="text" ng-verify="min:3,max:6">

### pattern
自定义正则，这样会优先以你的正则进行校验
	<input type="text" ng-verify="pattern:/a-zA-Z/">

### errmsg
自定义错误消息，当自定义正则校验不通过时，提示你传入的错误消息，默认会提示“类型错误”。


### option
select下拉菜单属性，指定的option表示选中会校验不通过
	<select ng-verify="{option:0}">
    	<option>请选择</option>
    	<option>1</option>
    	<option>2</option>
    	<option>3</option>
    </select>

### control
绑定一个form范围外的按钮, control:'loginForm'

	<!-- 表单内的按钮会自动控制 -->
	<form name="myform" verify>
		...
	</form>
	
	<button ng-verify="{control:'myform'}">表单外的按钮</button>


### disabled
设置 disabled:false 可以使他可以不会因为校验失败而禁用，点击它可以会标记出错误的表单。

	<button ng-verify="{disabled:false}">按钮</button>


### verify.check()
检测一个verify表单是否验证通过，返回Boolean和errorArry

	verify.check('formName')

### verify.scope()
获取一个verify表单的$scope作用域

	verify.scope('formName')
