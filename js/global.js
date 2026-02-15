

// 参数类型判断
const ctype=(target,type)=>{
	const _=Object.prototype.toString.call(target).split(' ').pop().replace(/]$/,'').toLowerCase()
	if(type=='element')return _.includes(type)&&target.isConnected
	return type?_.includes(type):_
}

// 搜索节点
const $=function(){
	let p,f,m=false
	for(let i=0;i<arguments.length;i++){
		const a=arguments[i];
		if(!p&&ctype(a,'element'))p=a
		else if(!f&&ctype(a,'string'))f=a
		else if(ctype(a,'bool')&&a)m=true
	}
	if(!f)return m?[]:null
	const o=(p||document)[`querySelector${m?'All':''}`](f)
	return m?Array.from(o):o
}

// 填充内容
const html=(target,text=null)=>{
	if(!ctype(target,'element'))return null
	if(!ctype(text,'string'))return target.innerHTML.trim()
	target.innerHTML=text.trim()
}

// 设置样式
const css=function(target,o){
	if(!ctype(target,'element')||!ctype(o,'object'))return
	for(let k in o){
		if(k.startsWith('--'))target.style.setProperty(k,o[k].toString(),'important')
		else target.style[k]=o[k]
	}
}

// 设置节点特定属性
const attr=(target,fn,o)=>{
	if(!ctype(target,'element'))return null
	if(fn=='get')return target.getAttribute(o)
	else if(fn=='set'){
		if(ctype(o,'string'))target.setAttribute(o,'')
		else if(ctype(o,'object'))for(let k in o)target.setAttribute(k,o[k])
		return
	}else if(fn=='has')return ctype(o,'string')?target.hasAttribute(o):false
	else if(fn=='del'&&ctype(o,'string'))target.removeAttribute(o)
}

// HTML代码转DOM
const tree=_=>(new DOMParser()).parseFromString(_,'text/html')

// 容量
const usage=_=>{
	if(_<1024)return `${_}B`
	if(_/1024<1024)return `${parseFloat((_/1024).toFixed(3))}KB`
	if(_/1024/1024<1024)return `${parseFloat((_/1024/1024).toFixed(3))}MB`
	if(_/1024/1024/1024<1024)return `${parseFloat((_/1024/1024/1024).toFixed(3))}GB`
	if(_/1024/1024/1024/1024<1024)return `${parseFloat((_/1024/1024/1024/1024).toFixed(3))}TB`
	return `~`
}

// 时间格式化
const ftime=(x,_='yyyy/mm/dd hh:ii:ss')=>{
	if(!(ctype(x,'number')||ctype(x,'date')))return null
	const dt=ctype(x,'number')?new Date(x):x
	const o={
		'm+':dt.getMonth()+1,'d+':dt.getDate(),'h+':dt.getHours(),'i+':dt.getMinutes(),'s+':dt.getSeconds(),
		'q+':Math.floor((dt.getMonth()+3)/3),'S':dt.getMilliseconds()
	}
	if(/(y+)/.test(_))_=_.replace(RegExp.$1,(this.getFullYear()+'').substr(4-RegExp.$1.length))
	for(let k in o)if(new RegExp('('+k+')').test(_))_=_.replace(RegExp.$1,(RegExp.$1.length==1)?(o[k]):(('00'+o[k]).substr((''+o[k]).length)))
	return _
}

export {ctype,$,html,css,attr,tree,usage,ftime}