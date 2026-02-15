import {$,attr,css} from './global.js'


const HCP_URL='https://lyu026.github.io/yongye/chcp.json'

function cv(){
	return new Promise((resolve,reject)=>{
		if(!window.chcp){
			alert("1.no")
			reject('热更新插件未安装');
			return;
		}
		window.chcp.getVersionInfo((e,data)=>{
			if(e){
				alert("2."+e.message)
				reject(e)
			}else{
				alert("ok."+data.currentWebVersion)
				resolve(data.currentWebVersion);
			}
		});
	});
}

async function sv(){
	try{
		const o=await fetch(HCP_URL+'?t='+new Date().getTime())
		if(!o.ok)throw new Error('网络请求失败:'+o.status);
		const config=await o.json()
		return config.release
	}catch(e){
		alert('获取服务器版本失败:'+e.message)
		throw e;
	}
}


function cu(){
	return new Promise((resolve,reject)=>{
		window.chcp.isUpdateAvailableForInstallation((e,data)=>{
			if(e){
				alert("cu.false  "+e.message)
				resolve(false);
			}else{
				alert("cu.yed")
				resolve(true)
			}
		});
	});
}

function iu(){
	window.chcp.installUpdate((e)=>{
		if(e){
			alert('iu.安装失败:'+e.message);
		}else{
			alert("iu.ok")
		}
	})
}

function du(){
	const timeoutId=setTimeout(()=>{
		alert('du.下载超时，请重试');
	},30000);
	window.chcp.fetchUpdate((e,data)=>{
		clearTimeout(timeoutId);
		if(e){
			let errorMsg='下载失败';
			if(e.code===-17){
				errorMsg='正在下载中，请稍后';
			}else if(e.code===-2){
				errorMsg='需要更新应用包（原生代码有修改）';
			}else if(e.code===2){
				errorMsg='已是最新版本';
			}else{
				errorMsg=`错误码:${e.code}`;
			}
			alert('iu.下载失败:'+errorMsg);
			return;
		}
		alert('du.✅ 下载完成！');
		if(data&&data.config){
			try{
				const config=JSON.parse(data.config);
				const updateMessage=config.message||'有新版本可用';
				if(confirm('更新包下载完成，是否立即安装并重启应用？')){
					iu();
				}else{
					alert('更新已下载，下次启动应用时自动生效');
				}
			}catch(e){
				if(confirm('更新包下载完成，是否立即安装并重启应用？')){
					iu();
				}
			}
		}else{
			//没有额外信息，直接安装
			if(confirm('更新包下载完成，是否立即安装并重启应用？')){
				iu();
			}
		}
	},{
		//可以在这里添加进度回调（如果插件支持）
		onProgress:(progressData)=>{
			
		}
	});
}


async function mu(){
	try{
		//步骤1：获取当前本地版本
		const currentVersion=await cv();
		alert('本地版本:'+currentVersion);
		//步骤2：获取服务器版本
		const serverConfig=await sv();
		alert('服务器版本:'+serverConfig);
		//步骤3：版本比较
		if(currentVersion===serverConfig){
			alert('✅ 已是最新版本');
			return;
		}
		//步骤4：版本不同，检查是否有已下载的更新等待安装
		const hasAvailable=await cu();
		if(hasAvailable){
			//已有下载好的更新，直接询问安装
			if(confirm('已有下载好的更新包，是否立即安装？')){
				iu();
			}
			return;
		}
	}catch(e){
		alert('检查更新失败:'+e.message);
	}
}


document.addEventListener('deviceready',()=>{
	alert("hhhhh  "+(window.chcp?"111":"000"))
	
	
	
	cv().catch(e=>{
		alert("err:"+e.message)
	});
	mu()
},false);