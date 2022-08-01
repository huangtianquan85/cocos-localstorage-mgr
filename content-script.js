(function CocosLocalStorageChromeExtensionInit() {

    // 判断是否是 Cocos 游戏
    let isCocos = false;
    let documentScripts = document.getElementsByTagName("script");
    for (const s of documentScripts) {
        if (s.src.indexOf("cocos") !== -1) {
            isCocos = true;
            break;
        }
    }

    if (!isCocos) {
        return;
    }

    // 继续执行
    function GetCurrentData() {
        let data = {};
        for (const k of Object.keys(localStorage)) {
            if (k !== '__snapshot' && k !== '__saved') {
                data[k] = localStorage.getItem(k);
            }
        }
        return data;
    }

    // 生成快照
    localStorage.setItem('__snapshot', JSON.stringify(GetCurrentData()));

    // 生成数据结构
    if (localStorage.getItem('__saved') === null) {
        localStorage.setItem('__saved', '{}');
    }

    // 逐个 key-value 设置用户数据
    function SetItems(data) {
        for (const k of Object.keys(data)) {
            localStorage.setItem(k, data[k])
        }
    }

    // 使用备份恢复用户数据
    function SetLocalStorage(dataKey) {
        let snapshot = localStorage.getItem('__snapshot');
        let saved = localStorage.getItem('__saved');

        localStorage.clear();
        localStorage.setItem('__saved', saved);

        if (dataKey === '__snapshot') {
            SetItems(JSON.parse(snapshot));
        } else if (dataKey !== null) {
            let allData = JSON.parse(saved);
            let data = allData[dataKey];
            if (data) {
                SetItems(data);
            }
        }

        // 刷新页面
        location.reload();
    }

    // 保存当前数据
    function SaveCurrent() {
        let key = prompt("请输入数据名称");
        if (key !== null) {
            if (key === '') {
                alert("名称不能为空");
                return;
            }

            SaveData(key, GetCurrentData());
        }
    }

    function SaveData(key, data){
        let saved = JSON.parse(localStorage.getItem('__saved'));
        if (saved.hasOwnProperty(key)) {
            let overwrite = confirm("已存在同名数据，是否覆盖？");
            if (!overwrite) {
                return;
            }
        }

        saved[key] = data;
        localStorage.setItem('__saved', JSON.stringify(saved));
    }

    // 删除一条数据
    function Delete(dataKey) {
        let saved = JSON.parse(localStorage.getItem('__saved'));
        delete saved[dataKey];
        localStorage.setItem('__saved', JSON.stringify(saved));
    }

    // 导出一条数据
    function Export(dataKey) {
        let saved = JSON.parse(localStorage.getItem('__saved'));
        let data = saved[dataKey];
        let fileBlob = new Blob([JSON.stringify(data)], {
            type: 'text/plain'
        });
        let a = document.createElement("a");
        a.download = `${dataKey}.json`;
        a.href = URL.createObjectURL(fileBlob);
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // 接收插件指令
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            let dataKey = request.dataKey;
            if (request.tag !== 'CocosLocalStorageManager') {
                sendResponse(null);
                return;
            }

            if (request.action === 'set_storage') {
                sendResponse(null);
                SetLocalStorage(dataKey);
            } else if (request.action === 'save') {
                SaveCurrent();
                sendResponse(null);
            } else if (request.action === 'get_all_data') {
                sendResponse(localStorage.getItem('__saved'));
            } else if (request.action === 'delete') {
                Delete(dataKey);
                sendResponse(null);
            } else if (request.action === 'export') {
                sendResponse(null);
                Export(dataKey);
            } else if (request.action === 'import') {
                SaveData(dataKey, request.data);
                sendResponse(null);
            } else {
                sendResponse(null);
            }
        });
})();