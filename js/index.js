const SERVER_CHCP_URL = 'https://raw.githubusercontent.com/您的用户名/您的仓库/main/www/chcp.json';
// 显示消息的函数
function showMessage(text, type = 'info') {
	const msgDiv = document.getElementById('message');
	msgDiv.className = 'message ' + type;
	msgDiv.innerHTML = text;
	msgDiv.style.display = 'block';
}
// 显示进度条
function showProgress(percent) {
	const progressDiv = document.getElementById('progress');
	const progressBar = document.getElementById('progressBar');
	progressDiv.style.display = 'block';
	percent = Math.min(100, Math.max(0, percent));
	progressBar.style.width = percent + '%';
	progressBar.innerHTML = Math.round(percent) + '%';
}
// 隐藏进度条
function hideProgress() {
	document.getElementById('progress').style.display = 'none';
}
// 获取当前本地版本号
function getCurrentVersion() {
	return new Promise((resolve, reject) => {
		if (!window.chcp) {
			reject('热更新插件未安装');
			return;
		}
		window.chcp.getVersionInfo((error, data) => {
			if (error) {
				reject(error);
			} else {
				document.getElementById('currentVersion').innerHTML = data.currentWebVersion || '未知';
				resolve(data.currentWebVersion);
			}
		});
	});
}
// 获取服务器上的版本号（从GitHub请求chcp.json）
async function getServerVersion() {
	try {
		const response = await fetch(SERVER_CHCP_URL + '?t=' + new Date().getTime()); // 加时间戳避免缓存
		if (!response.ok) {
			throw new Error('网络请求失败: ' + response.status);
		}
		const config = await response.json();
		return config.release; // chcp.json中的版本号字段
	} catch (error) {
		console.error('获取服务器版本失败:', error);
		throw error;
	}
}
// 检查是否有可安装的更新
function checkAvailableUpdate() {
	return new Promise((resolve, reject) => {
		window.chcp.isUpdateAvailableForInstallation((error, data) => {
			if (error) {
				// 没有可安装的更新
				resolve(false);
			} else {
				// 有已下载的更新等待安装
				resolve(true);
			}
		});
	});
}
// 安装更新
function installUpdate() {
	showMessage('正在安装更新...', 'info');
	window.chcp.installUpdate((error) => {
		if (error) {
			console.error('安装失败:', error);
			showMessage('安装失败: ' + (error.code || '未知错误'), 'error');
		} else {
			showMessage('✅ 更新安装成功！应用将立即刷新', 'success');
			// 安装成功后页面会自动刷新
		}
	});
}
// 弹窗询问用户是否更新
function promptUpdate(serverVersion, message) {
	// 自定义弹窗内容，这里用confirm模拟，实际项目可以用更美观的弹窗
	const updateMsg = message ? `更新内容：\n${message}\n\n是否立即更新？` : '发现新版本，是否立即更新？';
	if (confirm(updateMsg)) {
		// 用户确认更新，开始下载
		startDownload();
	} else {
		showMessage('已取消更新', 'info');
	}
}
// 开始下载更新
function startDownload() {
	showMessage('开始下载更新...', 'info');
	showProgress(0);
	// 设置超时，避免长时间无响应
	const timeoutId = setTimeout(() => {
		showMessage('下载超时，请重试', 'error');
		hideProgress();
	}, 30000); // 30秒超时
	window.chcp.fetchUpdate((error, data) => {
		clearTimeout(timeoutId);
		if (error) {
			console.error('下载失败:', error);
			hideProgress();
			// 处理各种错误码 [citation:1]
			let errorMsg = '下载失败';
			if (error.code === -17) {
				errorMsg = '正在下载中，请稍后';
			} else if (error.code === -2) {
				errorMsg = '需要更新应用包（原生代码有修改）';
			} else if (error.code === 2) {
				errorMsg = '已是最新版本';
			} else {
				errorMsg = `错误码: ${error.code}`;
			}
			showMessage(errorMsg, 'error');
			return;
		}
		// 下载成功
		showProgress(100);
		showMessage('✅ 下载完成！', 'success');
		// 解析服务器返回的config信息，可能包含自定义的更新内容 [citation:1]
		if (data && data.config) {
			try {
				const config = JSON.parse(data.config);
				const updateMessage = config.message || '有新版本可用';
				// 再次弹窗询问是否立即安装
				if (confirm('更新包下载完成，是否立即安装并重启应用？')) {
					installUpdate();
				} else {
					showMessage('更新已下载，下次启动应用时自动生效', 'info');
				}
			} catch (e) {
				// config解析失败，直接安装
				if (confirm('更新包下载完成，是否立即安装并重启应用？')) {
					installUpdate();
				}
			}
		} else {
			// 没有额外信息，直接安装
			if (confirm('更新包下载完成，是否立即安装并重启应用？')) {
				installUpdate();
			}
		}
	}, {
		// 可以在这里添加进度回调（如果插件支持）
		onProgress: (progressData) => {
			// progressData可能包含totalNum, currentNum, progress等字段 [citation:4]
			if (progressData && progressData.progress) {
				showProgress(progressData.progress * 100);
			}
		}
	});
}
// 手动检查更新（按钮点击触发）
async function manualCheckUpdate() {
	showMessage('正在检查更新...', 'info');
	try {
		// 步骤1：获取当前本地版本
		const currentVersion = await getCurrentVersion();
		console.log('本地版本:', currentVersion);
		// 步骤2：获取服务器版本
		const serverConfig = await getServerVersion();
		console.log('服务器版本:', serverConfig);
		// 步骤3：版本比较
		if (currentVersion === serverConfig) {
			showMessage('✅ 已是最新版本', 'success');
			return;
		}
		// 步骤4：版本不同，检查是否有已下载的更新等待安装
		const hasAvailable = await checkAvailableUpdate();
		if (hasAvailable) {
			// 已有下载好的更新，直接询问安装
			if (confirm('已有下载好的更新包，是否立即安装？')) {
				installUpdate();
			}
			return;
		}
		// 步骤5：没有已下载的更新，需要从服务器获取更新内容信息
		// 可以再次请求chcp.json获取更新内容（如果有message字段）
		try {
			const response = await fetch(SERVER_CHCP_URL + '?t=' + new Date().getTime());
			const fullConfig = await response.json();
			const updateMessage = fullConfig.message || `新版本 ${serverConfig}`;
			// 弹窗询问用户
			promptUpdate(serverConfig, updateMessage);
		} catch (e) {
			// 获取更新内容失败，直接弹窗
			promptUpdate(serverConfig, null);
		}
	} catch (error) {
		console.error('检查更新失败:', error);
		showMessage('检查更新失败: ' + error.message, 'error');
	}
}
// 页面加载时获取当前版本
document.addEventListener('deviceready', function() {
	getCurrentVersion().catch(e => {
		document.getElementById('currentVersion').innerHTML = '获取失败';
	});
}, false);