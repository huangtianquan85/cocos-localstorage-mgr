let SendMessage = async (action, dataKey, callBack, data = null) => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.tabs.sendMessage(tab.id, {
        tag: 'CocosLocalStorageManager',
        action: action,
        dataKey: dataKey,
        data: data
    }, function (response) {
        if (callBack) {
            callBack(response);
        }
    })
}

function BindButtonForMessage(btn, action, dataKey, callBack) {
    if (typeof btn === 'string') {
        btn = document.getElementById(btn);
    }

    btn.addEventListener("click", async () => {
        await SendMessage(action, dataKey, callBack);
    });
}

function RefreshButtons() {
    SendMessage('get_all_data', null, function (response) {
        let container = document.getElementById('buttons');
        container.innerHTML = '';

        function createBtn(content, className, action, dataKey, callBack = null) {
            let btn = document.createElement('button');
            btn.innerHTML = content;
            btn.className = className;
            container.appendChild(btn);

            BindButtonForMessage(btn, action, dataKey, callBack);
        }

        let saved = JSON.parse(response);
        for (const k of Object.keys(saved)) {
            createBtn(k, 'user_data_btn', 'set_storage', k);
            createBtn('<img src="images/delete.svg" alt="">', 'delete_btn', 'delete', k, RefreshButtons);
            createBtn('<img src="images/export.svg" alt="">', 'export_btn', 'export', k);
        }
    }).then();
}

BindButtonForMessage('clear', 'set_storage', null, null);
BindButtonForMessage('replay', 'set_storage', '__snapshot', null);
BindButtonForMessage('save', 'save', null, RefreshButtons);

function Init() {
    let file = document.getElementById("fileInput");
    file.addEventListener("change", function () {
        let read = new FileReader();
        read.readAsText(file.files[0]);
        read.onload = function () {
            // noinspection JSCheckFunctionSignatures
            let data = JSON.parse(read.result);
            SendMessage('import', file.files[0].name.split('.')[0], RefreshButtons, data).then();
            console.log(data);
        }
        read.onerror = function (e) {
            console.log('Error: ' + e);
        }
    });
    document.getElementById("import_data").addEventListener("click", () => {
        file.click();
    });

    RefreshButtons();
}

Init();

