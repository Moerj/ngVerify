# ngVerify v1.0
a easy angular form vaild plugin.
简洁高效的angular表单验证插件

<br>
## github
https://github.com/Moerj/ngVerify

<br>
## DEMO
http://htmlpreview.github.io/?https://github.com/Moerj/ngVerify/blob/master/demo.html

<br>
## Getting Started
在使用前，你需要引入angular

	require('angular');

	require('ngVerify');

	var app = angular.module('APP',['ngVerify']);

	//给form设置一个verify-scope指令
	<form verify-scope>
		<input type="text" ng-verify > //给表单元素设置ng-verify
		<button ng-verify >Submit</button> //提交按钮也是
  	</form>


<br>

### defualt
只需要使用ng-verify，会根据type类型校验非空验证和类型
	<input type="text" ng-verify >

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

## OPTIONS  
### required (defualt: true)
false允许空值通过校验

### length(min,max)
定制校验字符长度

	<input type="text" ng-verify="{min:3,max:6}" >

### pattern
自定义正则，这样会优先以你的正则进行校验

	<input type="text" ng-verify="pattern:/a-zA-Z/" >

### errmsg (defualt: '此项为必填')
自定义错误消息，当自定义正则校验不通过时，提示你传入的错误消息，默认会提示“类型错误”。

	<input type="text" ng-verify="pattern:/a-zA-Z/, errmsg:'只能输入字符串'" >


### option
select下拉菜单属性，指定的option表示选中会校验不通过

	<select ng-verify="{option:0}" >
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
		<input type="checkbox" name="checkbox"  ng-verify="{least:2}"> Hulk
	</div>

### control
绑定一个form范围外的按钮, control:'loginForm'

	<!-- 表单内的按钮会自动控制 -->
	<form name="myform" verify>
		...
	</form>

	<button ng-verify="{control:'myform'}" >表单外的按钮</button>


### disabled (defualt: true)
设置 disabled:false 提交按钮在表单未校验通过时不会禁用，并且会自动绑定一个click事件，点击时标记所有错误表单。

	<button ng-verify="{disabled:false}" >按钮</button>


## API  
依赖注入，在v0.1.6版本以后，公共方法需要依赖注入

	//依赖注入ngVerify后，可以调用一些公共方法
	app.controller('yourCtrl',function(ngVerify){
		...
	})

### ngVerify.check()
检测一个verify表单是否验证通过，返回Boolean和errorArry(未校验通过的元素组)

	ngVerify.check('formName')

### ngVerify.scope()
获取一个verify表单的$scope作用域

	ngVerify.scope('formName')

### lase updated
不再依赖jQeruy和qtip2
