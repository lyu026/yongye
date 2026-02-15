import {$,attr,css} from './global.js'

const upgrade=()=>new Promise((res,rej)=>{
	window.chcp.getVersionInfo(async(e,o)=>{
		if(e)return rej()
		const cv=o.currentWebVersion
		o=await fetch('https://lyu026.github.io/yongye/chcp.json?t='+new Date().getTime())
		if(!o.ok)return rej()
		o=await o.json()
		if(o.release==cv)return res()
		window.chcp.isUpdateAvailableForInstallation((e,o)=>{
			const install=(res,rej)=>window.chcp.installUpdate(e=>{
				if(e)return rej()
				alert('安装成功！')
				res()
			})
			if(!e)return confirm('新版本更新已下载，是否立即安装并重启应用？')?install(res,rej):rej()
			window.chcp.fetchUpdate((e,o)=>{
				if(e){
					let msg='下载失败'
					if(e.code===-17)msg='正在下载中，请稍后'
					else if(e.code===-2)msg='需要更新应用包（原生代码有修改）'
					else if(e.code===2)msg='已是最新版本'
					else msg=`错误码 ${e.code}`
					alert('新版本更新下载失败: '+msg)
					return res()
				}
				if(!o||!o.config)return rej()
				const config=JSON.parse(o.config)
				if(!confirm('新版本更新内容:\n\n'+config.message+'\n\n是否立即安装并重启应用？'))return res()
				install(res,rej)
			})
		})
	})
})

document.addEventListener('deviceready',()=>{
	upgrade()
	
},false);